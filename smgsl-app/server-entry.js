const http=require('http');
const crypto=require('crypto');
const TZ='America/Chicago';
const CALENDARS=[
  {name:'SMGSL League',url:'https://calendar.bluesombrero.com/api/v1/Calendar?instancekey=clubs&portalId=3766&id=47104525&key=YSGZTJHS'},
  {name:'SMGSL/SI Field Calendar',url:'https://calendar.bluesombrero.com/api/v1/Calendar?instancekey=clubs&portalId=3766&id=47104846&key=YDO7E8SV'}
];
const TEAM_RE=/\b(longhorns?|aggies?|bruins?|gators?|sooners?|jayhawks?|lady\s+vols?|ducks?|bearcats?|tigers?|red\s+raiders?|cougars?|cowgirls?|nittany\s+lions?)\b/i;
const PUBLIC_MODE=String(process.env.PUBLIC_MODE||'false').toLowerCase()==='true';
const BOARD_PASSWORD=process.env.BOARD_PASSWORD||'';
const SECRET=process.env.SESSION_SECRET||crypto.createHash('sha256').update(BOARD_PASSWORD||'smgsl-dev').digest('hex');

function cookies(req){return Object.fromEntries((req.headers.cookie||'').split(';').map(s=>s.trim().split('=')).filter(x=>x.length===2));}
function authed(req){if(PUBLIC_MODE)return true;const t=cookies(req).smgsl_session;if(!t)return false;const [raw,sig]=t.split('.');if(!raw||!sig||Number(raw)<Date.now())return false;const want=crypto.createHmac('sha256',SECRET).update(raw).digest('hex');try{return crypto.timingSafeEqual(Buffer.from(sig),Buffer.from(want));}catch{return false;}}
function parts(date){const o=Object.fromEntries(new Intl.DateTimeFormat('en-US',{timeZone:TZ,year:'numeric',month:'2-digit',day:'2-digit',hour:'2-digit',minute:'2-digit',second:'2-digit',hourCycle:'h23'}).formatToParts(date).filter(x=>x.type!=='literal').map(x=>[x.type,x.value]));return {y:+o.year,m:+o.month,d:+o.day,h:+o.hour,min:+o.minute,s:+o.second};}
function offsetMs(date){const p=parts(date);return Date.UTC(p.y,p.m-1,p.d,p.h,p.min,p.s)-date.getTime();}
function centralDate(y,m,d,h=0,min=0){const wall=Date.UTC(y,m-1,d,h,min);let g=new Date(wall),o=offsetMs(g),out=new Date(wall-o),o2=offsetMs(out);if(o2!==o)out=new Date(wall-o2);return out;}
function addDays(d,n){const p=parts(d),noon=centralDate(p.y,p.m,p.d,12),tmp=new Date(noon.getTime()+n*86400000),q=parts(tmp);return centralDate(q.y,q.m,q.d,12);}
function parseCalDate(s){if(!s)return null;const raw=String(s).trim();const m=raw.match(/(\d{4})(\d{2})(\d{2})T?(\d{2})?(\d{2})?/);if(m){const y=+m[1],mo=+m[2],d=+m[3],h=+(m[4]||0),mi=+(m[5]||0);return /Z$/.test(raw)?new Date(Date.UTC(y,mo-1,d,h,mi)):centralDate(y,mo,d,h,mi);}const d=new Date(raw);return Number.isNaN(d.getTime())?null:d;}
function unescapeICS(s=''){return s.replace(/\\n/gi,' ').replace(/\\,/g,',').replace(/\\;/g,';').replace(/\\\\/g,'\\').trim();}
function parseICS(text,source){const unfolded=text.replace(/\r?\n[ \t]/g,'');const blocks=unfolded.split('BEGIN:VEVENT').slice(1).map(x=>x.split('END:VEVENT')[0]);const out=[];for(const b of blocks){const get=k=>{const m=b.match(new RegExp('(?:^|\\n)'+k+'(?:;[^:]*)?:([^\\n\\r]+)','i'));return m?m[1].trim():''};const start=parseCalDate(get('DTSTART')),end=parseCalDate(get('DTEND'));if(!start||!end)continue;out.push({source,start,end,summary:unescapeICS(get('SUMMARY')),location:unescapeICS(get('LOCATION')),description:unescapeICS(get('DESCRIPTION')),categories:unescapeICS(get('CATEGORIES'))});}return out;}
function findICS(value,depth=0){if(depth>8||value==null)return '';if(typeof value==='string')return /BEGIN:VCALENDAR/i.test(value)?value:'';if(Array.isArray(value)){for(const v of value){const x=findICS(v,depth+1);if(x)return x;}return '';}if(typeof value==='object'){for(const v of Object.values(value)){const x=findICS(v,depth+1);if(x)return x;}}return '';}

// TeamSnap/BlueSombrero occasionally wraps an iCalendar payload in JSON. Normalize
// it before server.js reads the feed so /api/fields always receives calendar text.
const nativeFetch=global.fetch;
if(typeof nativeFetch==='function'){
  global.fetch=async function(input,init){
    const response=await nativeFetch(input,init);
    const url=typeof input==='string'?input:(input&&input.url)||'';
    if(!/calendar\.bluesombrero\.com\/api\/v1\/Calendar/i.test(url))return response;
    const text=await response.text();
    if(/BEGIN:VCALENDAR/i.test(text))return new Response(text,{status:response.status,statusText:response.statusText,headers:response.headers});
    let normalized='';
    try{normalized=findICS(JSON.parse(text));}catch{}
    if(normalized)return new Response(normalized,{status:response.status,statusText:response.statusText,headers:{'Content-Type':'text/calendar; charset=utf-8'}});
    console.error('Calendar feed unreadable:',response.status,response.headers.get('content-type')||'unknown',text.slice(0,120).replace(/\s+/g,' '));
    return new Response(text,{status:response.status,statusText:response.statusText,headers:response.headers});
  };
}

function text(e){return `${e.summary||''} ${e.location||''} ${e.description||''} ${e.categories||''}`;}
function fieldNumbers(e){const t=text(e),nums=[];for(const re of [/(?:field|fld)\s*(?:#|no\.?|number)?\s*[-:]?\s*([1-8])\b/ig,/\bSMGSL\s*[-–—:]?\s*(?:field\s*)?([1-8])\b/ig,/\b(?:F|Fld)\s*#?\s*([1-8])\b/ig]){let m;while((m=re.exec(t)))nums.push(+m[1]);}return [...new Set(nums)].sort((a,b)=>a-b);}
function isSI(e){return /(^|\W)SI(\W|$)|sports\s*inc|sudden\s*impact|schneider|oglesby|fontenot|joiner|ray\s+practice|williams\s+practice|forman\s+practice/i.test(text(e));}
function isSMGSL(e){const t=text(e);return !isSI(e)&&(TEAM_RE.test(t)||/\bSMGSL\b/i.test(t));}
function owner(e){return isSI(e)?'SI':(isSMGSL(e)?'SMGSL':'Calendar');}
function endTime(e){const min=isSI(e)?new Date(e.start.getTime()+180*60000):e.end;return e.end>min?e.end:min;}
function weekday(d){const p=parts(d);return new Date(Date.UTC(p.y,p.m-1,p.d)).getUTCDay();}
async function allEvents(){const all=[],errors=[];for(const c of CALENDARS){try{const r=await fetch(c.url,{headers:{'User-Agent':'SMGSL-Board-Hub/1.1','Accept':'text/calendar,application/json,text/plain,*/*'},cache:'no-store'});const txt=await r.text();if(!r.ok||!/BEGIN:VCALENDAR/i.test(txt)){errors.push(`${c.name}: HTTP ${r.status}`);continue;}all.push(...parseICS(txt,c.name));}catch(e){errors.push(`${c.name}: ${e.message}`);}}if(!all.length)throw new Error(errors.length?`Calendar feeds unavailable (${errors.join('; ')})`:'No SMGSL calendar events could be loaded');return all;}
function eventOut(e){return {fieldNumber:e.fieldNumber,start:e.start,end:e.end,summary:e.summary,location:e.location,owner:e.owner||owner(e),source:e.source,projected:!!e.projected};}
function lookup(events,date,time,field){
  const dm=String(date||'').match(/^(\d{4})-(\d{2})-(\d{2})$/);
  const tm=time?String(time).match(/^(\d{2}):(\d{2})$/):null;
  const fieldNum=field?Number(field):0;
  if(!dm|| (time&&!tm) || (fieldNum&&(fieldNum<1||fieldNum>8)))throw new Error('Choose a valid date. Time and field are optional.');
  const y=+dm[1],m=+dm[2],d=+dm[3],dayStart=centralDate(y,m,d),dayEnd=addDays(dayStart,1);
  const actual=[];
  for(const e of events){const end=endTime(e);if(e.start>=dayEnd||end<=dayStart)continue;for(const f of fieldNumbers(e)){if(fieldNum&&f!==fieldNum)continue;actual.push({...e,end,owner:owner(e),fieldNumber:f,projected:false});}}
  let matches=actual;
  let target=null;
  if(tm){target=centralDate(y,m,d,+tm[1],+tm[2]);matches=actual.filter(e=>e.start<=target&&e.end>target);}
  // If an exact date/time has no explicit event, use the nearest recurring weekly
  // record as a clearly marked projection so board members can still check the schedule.
  if(tm&&!matches.length){const dow=weekday(target),projected=[];for(const e of events){for(const f of fieldNumbers(e)){if(fieldNum&&f!==fieldNum)continue;if(weekday(e.start)!==dow)continue;const p=parts(e.start),q=parts(target),dur=endTime(e)-e.start,start=centralDate(q.y,q.m,q.d,p.h,p.min),end=new Date(start.getTime()+dur);if(!(start<=target&&end>target))continue;const delta=Math.abs(e.start-target)/86400000;if(delta>21)continue;projected.push({...e,start,end,owner:owner(e),fieldNumber:f,projected:true,delta});}}const seen=new Set();matches=projected.sort((a,b)=>a.delta-b.delta||a.fieldNumber-b.fieldNumber).filter(x=>{const k=`${x.fieldNumber}|${x.owner}|${x.summary}|${x.start.toISOString()}`;if(seen.has(k))return false;seen.add(k);return true;}).slice(0,16);}
  matches.sort((a,b)=>a.fieldNumber-b.fieldNumber||a.start-b.start||Number(a.projected)-Number(b.projected));
  const displayTime=target?new Intl.DateTimeFormat('en-US',{timeZone:TZ,hour:'numeric',minute:'2-digit'}).format(target):'';
  return {date,time:time||'',displayTime,field:fieldNum||null,scope:tm?'time':'day',matches:matches.map(eventOut)};
}

const originalCreateServer=http.createServer;
http.createServer=function(listener){return originalCreateServer.call(http,async function(req,res){let u;try{u=new URL(req.url,'http://localhost');}catch{return listener(req,res);}if(u.pathname!=='/api/field-lookup')return listener(req,res);if(!authed(req)){res.writeHead(401,{'Content-Type':'application/json; charset=utf-8','Cache-Control':'no-store'});return res.end(JSON.stringify({error:'Session expired. Please sign in again.'}));}try{const date=u.searchParams.get('date')||'',time=u.searchParams.get('time')||'',field=u.searchParams.get('field')||'';const result=lookup(await allEvents(),date,time,field);res.writeHead(200,{'Content-Type':'application/json; charset=utf-8','Cache-Control':'no-store'});return res.end(JSON.stringify(result));}catch(e){res.writeHead(400,{'Content-Type':'application/json; charset=utf-8','Cache-Control':'no-store'});return res.end(JSON.stringify({error:e.message}));}});};
require('./server');
