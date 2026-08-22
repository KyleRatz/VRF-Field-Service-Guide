const http=require('http');
const fs=require('fs');
const path=require('path');
const crypto=require('crypto');

const PORT=process.env.PORT||8789;
const PUB=path.join(__dirname,'public');
const CAL='https://calendar.bluesombrero.com/api/v1/Calendar?instancekey=clubs&portalId=3766&id=47104525&key=YSGZTJHS';
const PUBLIC_MODE=String(process.env.PUBLIC_MODE||'false').toLowerCase()==='true';
const BOARD_PASSWORD=process.env.BOARD_PASSWORD||'';
const SECRET=process.env.SESSION_SECRET||crypto.createHash('sha256').update(BOARD_PASSWORD||'smgsl-dev').digest('hex');
const mime={'.html':'text/html; charset=utf-8','.css':'text/css; charset=utf-8','.js':'application/javascript; charset=utf-8','.json':'application/json; charset=utf-8','.svg':'image/svg+xml','.webmanifest':'application/manifest+json; charset=utf-8'};

function cookies(req){return Object.fromEntries((req.headers.cookie||'').split(';').map(s=>s.trim().split('=')).filter(x=>x.length===2));}
function token(){const exp=Date.now()+1000*60*60*24*14;const raw=String(exp);return raw+'.'+crypto.createHmac('sha256',SECRET).update(raw).digest('hex');}
function authed(req){if(PUBLIC_MODE)return true;const t=cookies(req).smgsl_session;if(!t)return false;const [raw,sig]=t.split('.');if(!raw||!sig||Number(raw)<Date.now())return false;const want=crypto.createHmac('sha256',SECRET).update(raw).digest('hex');try{return crypto.timingSafeEqual(Buffer.from(sig),Buffer.from(want));}catch{return false;}}
function send(res,status,body,type='text/plain; charset=utf-8',headers={}){res.writeHead(status,{'Content-Type':type,...headers});res.end(body);}
function loginPage(msg=''){return `<!doctype html><html><head><meta name="viewport" content="width=device-width,initial-scale=1"><title>SMGSL Board Login</title><style>body{font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif;background:#071526;color:#fff;margin:0;display:grid;min-height:100vh;place-items:center}.box{width:min(90vw,420px);background:#10243c;padding:28px;border-radius:18px;border:1px solid #29496c}h1{margin:0 0 8px}p{color:#b6c8dc}input,button{width:100%;font-size:17px;padding:14px;border-radius:12px;box-sizing:border-box}input{background:#091a2d;color:#fff;border:1px solid #37597d;margin:12px 0}button{background:#fff;color:#071526;border:0;font-weight:800}.err{color:#ffb4a9}</style></head><body><form class="box" method="POST" action="/login"><h1>SMGSL Board Hub</h1><p>Board-member access only.</p>${msg?`<p class="err">${msg}</p>`:''}<input name="password" type="password" placeholder="Board password" autofocus required><button>Sign in</button></form></body></html>`}
function parseForm(body){return Object.fromEntries(body.split('&').map(p=>p.split('=').map(v=>decodeURIComponent((v||'').replace(/\+/g,' ')))));}

function parseICS(text){
  const blocks=text.replace(/\r\n /g,'').split('BEGIN:VEVENT').slice(1).map(x=>x.split('END:VEVENT')[0]);
  const events=[];
  for(const b of blocks){
    const get=(k)=>{const m=b.match(new RegExp('(?:^|\\n)'+k+'(?:;[^:]*)?:([^\\n\\r]+)'));return m?m[1].trim():''};
    const dt=get('DTSTART'),de=get('DTEND');
    const summary=get('SUMMARY').replace(/\\,/g,',').replace(/\\n/g,' ');
    const location=get('LOCATION').replace(/\\,/g,',').replace(/\\n/g,' ');
    const parse=s=>{if(!s)return null;const m=s.match(/(\d{4})(\d{2})(\d{2})T?(\d{2})?(\d{2})?/);if(!m)return null;return new Date(`${m[1]}-${m[2]}-${m[3]}T${m[4]||'00'}:${m[5]||'00'}:00`)};
    events.push({start:parse(dt),end:parse(de),summary,location});
  }
  return events.filter(e=>e.start&&e.end);
}

function fieldNumbers(e){
  const text=`${e.summary||''} ${e.location||''}`.replace(/\\n/g,' ');
  const nums=[];
  const patterns=[/(?:field|fld)\s*#?\s*(\d{1,2})/ig,/(?:^|[\s,;\-])#(\d{1,2})(?=$|[\s,;\-])/g];
  for(const re of patterns){let m;while((m=re.exec(text)))nums.push(Number(m[1]));}
  return [...new Set(nums.filter(n=>n>=1&&n<=8))].sort((a,b)=>a-b);
}
function isSI(e){return /(^|\W)SI(\W|$)|sports\s*inc|sudden\s*impact/i.test(`${e.summary||''} ${e.location||''}`);}
function sameDay(a,b){return a.getFullYear()===b.getFullYear()&&a.getMonth()===b.getMonth()&&a.getDate()===b.getDate();}
function addMinutes(d,m){return new Date(d.getTime()+m*60000);}
function overlaps(a1,a2,b1,b2){return a1<b2&&a2>b1;}
function normalizedEnd(e){const minEnd=isSI(e)?addMinutes(e.start,180):e.end;return e.end>minEnd?e.end:minEnd;}

function candidateStarts(day){
  const dow=day.getDay();
  let first,last;
  if(dow>=1&&dow<=5){first=[17,0];last=[19,30];}
  else if(dow===0){first=[9,0];last=[19,30];}
  else return [];
  const start=new Date(day);start.setHours(first[0],first[1],0,0);
  const endStart=new Date(day);endStart.setHours(last[0],last[1],0,0);
  const out=[];
  // Search-friendly half-hour start choices. Each normal practice is 90 minutes.
  for(let t=start;t<=endStart;t=addMinutes(t,30))out.push(new Date(t));
  return out;
}

function availability(events,days=21){
  const now=new Date();now.setHours(0,0,0,0);
  const fields=Array.from({length:8},(_,i)=>`Field ${i+1}`);
  const slots=[];
  const si=[];

  for(const e of events){
    if(!isSI(e))continue;
    const nums=fieldNumbers(e);
    const end=normalizedEnd(e);
    if(nums.length){
      nums.forEach(n=>si.push({field:`Field ${n}`,fieldNumber:n,start:e.start,end,summary:e.summary,location:e.location,durationMinutes:180}));
    }else{
      si.push({field:'Field not identified',fieldNumber:null,start:e.start,end,summary:e.summary,location:e.location,durationMinutes:180});
    }
  }

  for(let d=0;d<days;d++){
    const day=new Date(now);day.setDate(now.getDate()+d);
    const starts=candidateStarts(day);
    if(!starts.length)continue;

    for(let num=1;num<=8;num++){
      const busy=events.filter(e=>fieldNumbers(e).includes(num)&&sameDay(e.start,day)).map(e=>({...e,normalizedEnd:normalizedEnd(e)}));
      for(const start of starts){
        const end=addMinutes(start,90);
        const conflict=busy.some(b=>overlaps(start,end,b.start,b.normalizedEnd));
        if(!conflict)slots.push({field:`Field ${num}`,fieldNumber:num,start,end,durationMinutes:90});
      }
    }
  }

  si.sort((a,b)=>a.start-b.start||((a.fieldNumber||99)-(b.fieldNumber||99)));
  slots.sort((a,b)=>a.start-b.start||a.fieldNumber-b.fieldNumber);
  return {
    fields,
    slots,
    si,
    rules:{normalPracticeMinutes:90,siPracticeMinutes:180,weekdayFirstStart:'17:00',weekdayLastStart:'19:30',sundayFirstStart:'09:00',sundayLastStart:'19:30',fieldCount:8}
  };
}

async function calendarData(){
  const r=await fetch(CAL,{headers:{'User-Agent':'SMGSL-Board-Hub/1.0'}});
  if(!r.ok)throw new Error('Calendar returned '+r.status);
  const txt=await r.text();
  return availability(parseICS(txt));
}

const server=http.createServer(async(req,res)=>{
  const u=new URL(req.url,'http://localhost');
  if(req.method==='GET'&&u.pathname==='/login')return send(res,200,loginPage(),'text/html; charset=utf-8');
  if(req.method==='POST'&&u.pathname==='/login'){
    let body='';req.on('data',c=>body+=c);
    return req.on('end',()=>{
      const p=parseForm(body).password||'';
      const ok=BOARD_PASSWORD&&p.length===BOARD_PASSWORD.length&&crypto.timingSafeEqual(Buffer.from(p),Buffer.from(BOARD_PASSWORD));
      if(ok)return send(res,302,'','text/plain',{'Set-Cookie':`smgsl_session=${token()}; HttpOnly; SameSite=Lax; Max-Age=1209600; Path=/`,'Location':'/'});
      return send(res,401,loginPage('Incorrect password.'),'text/html; charset=utf-8');
    });
  }
  if(req.method==='GET'&&u.pathname==='/logout')return send(res,302,'','text/plain',{'Set-Cookie':'smgsl_session=; Max-Age=0; Path=/','Location':'/login'});
  if(!authed(req))return send(res,302,'','text/plain',{'Location':'/login'});
  if(u.pathname==='/api/fields'){
    try{return send(res,200,JSON.stringify(await calendarData()),'application/json; charset=utf-8')}
    catch(e){return send(res,502,JSON.stringify({error:e.message}),'application/json; charset=utf-8')}
  }
  let rel=u.pathname==='/'?'index.html':u.pathname.replace(/^\/+/, '');
  const fp=path.join(PUB,rel);
  if(!fp.startsWith(PUB))return send(res,403,'Forbidden');
  fs.readFile(fp,(err,data)=>{if(err)return send(res,404,'Not Found');send(res,200,data,mime[path.extname(fp)]||'application/octet-stream')});
});
server.listen(PORT,'0.0.0.0',()=>console.log('SMGSL Board Hub on '+PORT));
