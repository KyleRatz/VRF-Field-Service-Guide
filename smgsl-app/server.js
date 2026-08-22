const http=require('http');
const fs=require('fs');
const path=require('path');
const crypto=require('crypto');

const PORT=process.env.PORT||8789;
const PUB=path.join(__dirname,'public');
const CAL='https://calendar.bluesombrero.com/api/v1/Calendar?instancekey=clubs&portalId=3766&id=47104846&key=YDO7E8SV';
const TZ='America/Chicago';
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

function partsInTZ(date){const p=Object.fromEntries(new Intl.DateTimeFormat('en-US',{timeZone:TZ,year:'numeric',month:'2-digit',day:'2-digit',hour:'2-digit',minute:'2-digit',second:'2-digit',hourCycle:'h23'}).formatToParts(date).filter(x=>x.type!=='literal').map(x=>[x.type,x.value]));return {y:+p.year,m:+p.month,d:+p.day,h:+p.hour,min:+p.minute,s:+p.second};}
function tzOffsetMs(date){const p=partsInTZ(date);return Date.UTC(p.y,p.m-1,p.d,p.h,p.min,p.s)-date.getTime();}
function centralDate(y,m,d,h=0,min=0){const wall=Date.UTC(y,m-1,d,h,min,0);let guess=new Date(wall);let off=tzOffsetMs(guess);let out=new Date(wall-off);const off2=tzOffsetMs(out);if(off2!==off)out=new Date(wall-off2);return out;}
function centralYMD(date){const p=partsInTZ(date);return `${p.y}-${String(p.m).padStart(2,'0')}-${String(p.d).padStart(2,'0')}`;}
function parseCalDate(s){if(!s)return null;const m=s.match(/(\d{4})(\d{2})(\d{2})T?(\d{2})?(\d{2})?/);if(!m)return null;const y=+m[1],mo=+m[2],d=+m[3],h=+(m[4]||0),mi=+(m[5]||0);if(/Z$/.test(s))return new Date(Date.UTC(y,mo-1,d,h,mi,0));return centralDate(y,mo,d,h,mi);}
function addMinutes(d,m){return new Date(d.getTime()+m*60000);}
function addCentralDays(date,n){const p=partsInTZ(date);const noon=centralDate(p.y,p.m,p.d,12,0);const tmp=new Date(noon.getTime()+n*86400000);const q=partsInTZ(tmp);return centralDate(q.y,q.m,q.d,12,0);}
function unescapeICS(s=''){return s.replace(/\\n/gi,' ').replace(/\\,/g,',').replace(/\\;/g,';').replace(/\\\\/g,'\\').trim();}

function parseICS(text){
  const unfolded=text.replace(/\r?\n[ \t]/g,'');
  const blocks=unfolded.split('BEGIN:VEVENT').slice(1).map(x=>x.split('END:VEVENT')[0]);
  const events=[];
  for(const b of blocks){
    const get=(k)=>{const m=b.match(new RegExp('(?:^|\\n)'+k+'(?:;[^:]*)?:([^\\n\\r]+)','i'));return m?m[1].trim():''};
    const ex=[];const exre=/(?:^|\n)EXDATE(?:;[^:]*)?:([^\n\r]+)/ig;let xm;while((xm=exre.exec(b))){xm[1].split(',').forEach(v=>{const d=parseCalDate(v.trim());if(d)ex.push(d);});}
    events.push({uid:get('UID'),start:parseCalDate(get('DTSTART')),end:parseCalDate(get('DTEND')),summary:unescapeICS(get('SUMMARY')),location:unescapeICS(get('LOCATION')),description:unescapeICS(get('DESCRIPTION')),categories:unescapeICS(get('CATEGORIES')),rrule:get('RRULE'),exdates:ex});
  }
  return events.filter(e=>e.start&&e.end);
}
function parseRRule(s=''){return Object.fromEntries(s.split(';').map(x=>x.split('=')).filter(x=>x.length===2).map(([k,v])=>[k.toUpperCase(),v]));}
const dayCode=['SU','MO','TU','WE','TH','FR','SA'];
function expandRecurring(events,from,to){
  const out=[];
  for(const e of events){
    if(!e.rrule){if(e.end>=from&&e.start<to)out.push(e);continue;}
    const r=parseRRule(e.rrule);const freq=(r.FREQ||'').toUpperCase();const interval=Math.max(1,parseInt(r.INTERVAL||'1',10)||1);const until=r.UNTIL?parseCalDate(r.UNTIL):null;const count=r.COUNT?parseInt(r.COUNT,10):null;const base=partsInTZ(e.start);const duration=e.end-e.start;const bydays=(r.BYDAY?r.BYDAY.split(',').map(x=>x.replace(/^[-+]?\d+/,'').toUpperCase()):[dayCode[new Date(Date.UTC(base.y,base.m-1,base.d)).getUTCDay()]]);
    let emitted=0;let cursor=e.start;let guard=0;
    while(cursor<to&&guard++<4000){
      const cp=partsInTZ(cursor);const dow=dayCode[new Date(Date.UTC(cp.y,cp.m-1,cp.d)).getUTCDay()];const daysFromBase=Math.floor((centralDate(cp.y,cp.m,cp.d,12)-centralDate(base.y,base.m,base.d,12))/86400000);const weeks=Math.floor(daysFromBase/7);let match=false;
      if(freq==='DAILY')match=(daysFromBase>=0&&daysFromBase%interval===0);
      else if(freq==='WEEKLY')match=(daysFromBase>=0&&weeks%interval===0&&bydays.includes(dow));
      else match=(centralYMD(cursor)===centralYMD(e.start));
      if(match){const occStart=centralDate(cp.y,cp.m,cp.d,base.h,base.min);const occEnd=new Date(occStart.getTime()+duration);const excluded=(e.exdates||[]).some(x=>Math.abs(x-occStart)<60000);if(!excluded){emitted++;if((!count||emitted<=count)&&(!until||occStart<=until)&&occEnd>=from&&occStart<to)out.push({...e,start:occStart,end:occEnd,rrule:''});}if(count&&emitted>=count)break;if(until&&occStart>until)break;}
      cursor=addCentralDays(cursor,1);
    }
  }
  const seen=new Set();return out.filter(e=>{const k=`${e.uid}|${e.start.toISOString()}|${e.summary}|${e.location}`;if(seen.has(k))return false;seen.add(k);return true;});
}
function eventText(e){return `${e.summary||''} ${e.location||''} ${e.description||''} ${e.categories||''}`.replace(/\\n/g,' ');}
function fieldNumbers(e){const text=eventText(e);const nums=[];const patterns=[/(?:field|fld)\s*#?\s*(\d{1,2})/ig,/(?:field|fld)\s*(?:no\.?|number)\s*#?\s*(\d{1,2})/ig,/(?:^|[\s,;|\-])f(?:ield)?\s*#?\s*([1-8])(?=$|[\s,;|\-])/ig,/(?:^|[\s,;\-])#([1-8])(?=$|[\s,;\-])/g];for(const re of patterns){let m;while((m=re.exec(text)))nums.push(Number(m[1]));}return [...new Set(nums.filter(n=>n>=1&&n<=8))].sort((a,b)=>a-b);}
function isSI(e){return /(^|\W)SI(\W|$)|sports\s*inc|sudden\s*impact/i.test(eventText(e));}
function sameCentralDay(a,b){return centralYMD(a)===centralYMD(b);}
function overlaps(a1,a2,b1,b2){return a1<b2&&a2>b1;}
function normalizedEnd(e){const minEnd=isSI(e)?addMinutes(e.start,180):e.end;return e.end>minEnd?e.end:minEnd;}
function candidateStarts(day){const p=partsInTZ(day);const dow=new Date(Date.UTC(p.y,p.m-1,p.d)).getUTCDay();let first,last;if(dow>=2&&dow<=5){first=[18,0];last=[19,30];}else if(dow===0){first=[9,0];last=[19,30];}else return [];const start=centralDate(p.y,p.m,p.d,first[0],first[1]);const endStart=centralDate(p.y,p.m,p.d,last[0],last[1]);const close=centralDate(p.y,p.m,p.d,21,0);const out=[];for(let t=start;t<=endStart;t=addMinutes(t,30)){const end=addMinutes(t,90);if(end<=close)out.push(new Date(t));}return out;}

function summarizeUsage(events){let siFieldMinutes=0,smgslFieldMinutes=0,siEventMinutes=0,smgslEventMinutes=0;for(const e of events){const nums=fieldNumbers(e);const end=normalizedEnd(e);const minutes=Math.max(0,(end-e.start)/60000);const multiplier=Math.max(1,nums.length);if(isSI(e)){siEventMinutes+=minutes;siFieldMinutes+=minutes*multiplier;}else{smgslEventMinutes+=minutes;smgslFieldMinutes+=minutes*multiplier;}}return {siFieldHours:+(siFieldMinutes/60).toFixed(1),smgslFieldHours:+(smgslFieldMinutes/60).toFixed(1),siScheduledHours:+(siEventMinutes/60).toFixed(1),smgslScheduledHours:+(smgslEventMinutes/60).toFixed(1)};}

function availability(baseEvents,days=21){
  const nowParts=partsInTZ(new Date());
  const now=centralDate(nowParts.y,nowParts.m,nowParts.d,0,0);
  const horizon=addCentralDays(now,days);
  const yearEnd=centralDate(nowParts.y+1,1,1,0,0);
  const events=expandRecurring(baseEvents,now,horizon);
  const usageEvents=expandRecurring(baseEvents,now,yearEnd);
  const fields=Array.from({length:8},(_,i)=>`Field ${i+1}`);
  const slots=[],si=[];let withFields=0;

  for(const e of usageEvents){
    const nums=fieldNumbers(e);if(nums.length)withFields++;
    if(isSI(e)){
      const end=normalizedEnd(e);const minutes=Math.max(0,(end-e.start)/60000);
      if(nums.length)nums.forEach(n=>si.push({field:`Field ${n}`,fieldNumber:n,start:e.start,end,summary:e.summary,location:e.location,description:e.description,durationMinutes:minutes}));
      else si.push({field:'Field not identified',fieldNumber:null,start:e.start,end,summary:e.summary,location:e.location,description:e.description,durationMinutes:minutes});
    }
  }

  for(let d=0;d<days;d++){
    const day=addCentralDays(now,d);const starts=candidateStarts(day);if(!starts.length)continue;
    for(let num=1;num<=8;num++){
      const busy=events.filter(e=>fieldNumbers(e).includes(num)&&sameCentralDay(e.start,day)).map(e=>({...e,normalizedEnd:normalizedEnd(e)}));
      for(const start of starts){const end=addMinutes(start,90);if(!busy.some(b=>overlaps(start,end,b.start,b.normalizedEnd)))slots.push({field:`Field ${num}`,fieldNumber:num,start,end,durationMinutes:90});}
    }
  }

  const usage=summarizeUsage(usageEvents);
  si.sort((a,b)=>a.start-b.start||((a.fieldNumber||99)-(b.fieldNumber||99)));
  slots.sort((a,b)=>a.start-b.start||a.fieldNumber-b.fieldNumber);
  return {fields,slots,si,usage:{...usage,windowDays:days,usageThrough:`${nowParts.y}-12-31`,usageYear:nowParts.y},diagnostics:{baseEventCount:baseEvents.length,expandedAvailabilityEvents:events.length,expandedUsageEvents:usageEvents.length,eventsWithFieldNumbers:withFields,recurringBaseEvents:baseEvents.filter(e=>e.rrule).length},rules:{timeZone:TZ,normalPracticeMinutes:90,siPracticeMinutes:180,tuesdayFridayOpen:'18:00',dailyClose:'21:00',sundayOpen:'09:00',mondayAvailable:false,saturdayAvailable:false,fieldCount:8,calendarId:'47104846'}};
}

async function calendarData(){const r=await fetch(CAL,{headers:{'User-Agent':'SMGSL-Board-Hub/1.0','Accept':'text/calendar,text/plain,*/*'}});if(!r.ok)throw new Error('Calendar returned '+r.status);const txt=await r.text();if(!/BEGIN:VCALENDAR/i.test(txt))throw new Error('Calendar feed did not return iCalendar data');return availability(parseICS(txt));}

const server=http.createServer(async(req,res)=>{
  const u=new URL(req.url,'http://localhost');
  if(req.method==='GET'&&u.pathname==='/login')return send(res,200,loginPage(),'text/html; charset=utf-8');
  if(req.method==='POST'&&u.pathname==='/login'){
    let body='';req.on('data',c=>body+=c);
    return req.on('end',()=>{const p=parseForm(body).password||'';const ok=BOARD_PASSWORD&&p.length===BOARD_PASSWORD.length&&crypto.timingSafeEqual(Buffer.from(p),Buffer.from(BOARD_PASSWORD));if(ok)return send(res,302,'','text/plain',{'Set-Cookie':`smgsl_session=${token()}; HttpOnly; SameSite=Lax; Max-Age=1209600; Path=/`,'Location':'/'});return send(res,401,loginPage('Incorrect password.'),'text/html; charset=utf-8');});
  }
  if(req.method==='GET'&&u.pathname==='/logout')return send(res,302,'','text/plain',{'Set-Cookie':'smgsl_session=; Max-Age=0; Path=/','Location':'/login'});
  if(!authed(req))return send(res,302,'','text/plain',{'Location':'/login'});
  if(u.pathname==='/api/fields'){try{return send(res,200,JSON.stringify(await calendarData()),'application/json; charset=utf-8')}catch(e){return send(res,502,JSON.stringify({error:e.message}),'application/json; charset=utf-8')}}
  let rel=u.pathname==='/'?'index.html':u.pathname.replace(/^\/+/, '');const fp=path.join(PUB,rel);if(!fp.startsWith(PUB))return send(res,403,'Forbidden');
  fs.readFile(fp,(err,data)=>{if(err)return send(res,404,'Not Found');send(res,200,data,mime[path.extname(fp)]||'application/octet-stream')});
});
server.listen(PORT,'0.0.0.0',()=>console.log('SMGSL Board Hub on '+PORT));
