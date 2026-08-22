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
  const patterns=[
    /(?:field|fld)\s*#?\s*(\d{1,2})/ig,
    /(?:^|[\s,;\-])#(\d{1,2})(?=$|[\s,;\-])/g
  ];
  for(const re of patterns){let m;while((m=re.exec(text)))nums.push(Number(m[1]));}
  return [...new Set(nums.filter(n=>n>=1&&n<=20))].sort((a,b)=>a-b);
}
function primaryField(e){const n=fieldNumbers(e)[0];return n?`Field ${n}`:'Unspecified Field';}
function isSI(e){return /(^|\W)SI(\W|$)|sports\s*inc/i.test(`${e.summary||''} ${e.location||''}`);}
function sameDay(a,b){return a.getFullYear()===b.getFullYear()&&a.getMonth()===b.getMonth()&&a.getDate()===b.getDate();}

function availability(events,days=21){
  const now=new Date();now.setHours(0,0,0,0);
  // SMGSL fields are tracked as numbered fields. Keep 1-6 present even on days with no events,
  // and include any additional numbered fields found in the live calendar.
  const fieldNums=new Set([1,2,3,4,5,6]);
  events.forEach(e=>fieldNumbers(e).forEach(n=>fieldNums.add(n)));
  const fields=[...fieldNums].sort((a,b)=>a-b).map(n=>`Field ${n}`);
  const slots=[];
  const si=[];

  for(const e of events){
    if(!isSI(e))continue;
    const nums=fieldNumbers(e);
    if(nums.length){
      nums.forEach(n=>si.push({field:`Field ${n}`,fieldNumber:n,start:e.start,end:e.end,summary:e.summary,location:e.location}));
    }else{
      si.push({field:'Field not identified',fieldNumber:null,start:e.start,end:e.end,summary:e.summary,location:e.location});
    }
  }

  for(let d=0;d<days;d++){
    const day=new Date(now);day.setDate(now.getDate()+d);
    const dow=day.getDay();
    let sh,eh;
    if(dow>=1&&dow<=5){sh=17;eh=21;}
    else if(dow===0){sh=9;eh=21;}
    else continue;

    for(const f of fields){
      const num=Number(f.replace(/\D/g,''));
      const busy=events.filter(e=>fieldNumbers(e).includes(num)&&sameDay(e.start,day)).sort((a,b)=>a.start-b.start);
      let cur=new Date(day);cur.setHours(sh,0,0,0);
      const end=new Date(day);end.setHours(eh,0,0,0);

      for(const b of busy){
        if(b.end<=cur||b.start>=end)continue;
        const bs=b.start<cur?cur:b.start;
        if(bs>cur)slots.push({field:f,fieldNumber:num,start:new Date(cur),end:new Date(Math.min(bs,end))});
        if(b.end>cur)cur=new Date(Math.max(cur,b.end));
        if(cur>=end)break;
      }
      if(cur<end)slots.push({field:f,fieldNumber:num,start:cur,end});
    }
  }

  si.sort((a,b)=>a.start-b.start||((a.fieldNumber||99)-(b.fieldNumber||99)));
  return {fields,slots:slots.filter(s=>(s.end-s.start)>=30*60000),si};
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
