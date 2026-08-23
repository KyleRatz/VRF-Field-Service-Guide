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
function centralDate(y,m,d,h=0,min=0){const wall=Date.UTC(y,m-1,d,h,min);let g=new Date(wall);let o=offsetMs(g);let out=new Date(wall-o);let o2=offsetMs(out);if(o2!==o)out=new Date(wall-o2);return out;}
function parseCalDate(s){if(!s)return null;const m=s.match(/(\d{4})(\d{2})(\d{2})T?(\d{2})?(\d{2})?/);if(!m)return null;const y=+m[1],mo=+m[2],d=+m[3],h=+(m[4]||0),mi=+(m[5]||0);return /Z$/.test(s)?new Date(Date.UTC(y,mo-1,d,h,mi)):centralDate(y,mo,d,h,mi);}
function unescapeICS(s=''){return s.replace(/\\n/gi,' ').replace(/\\,/g,',').replace(/\\;/g,';').replace(/\\\\/g,'\\').trim();}
function parseICS(text,source){const unfolded=text.replace(/\r?\n[ \t]/g,'');const blocks=unfolded.split('BEGIN:VEVENT').slice(1).map(x=>x.split('END:VEVENT')[0]);const out=[];for(const b of blocks){const get=k=>{const m=b.match(new RegExp('(?:^|\\n)'+k+'(?:;[^:]*)?:([^\\n\\r]+)','i'));return m?m[1].trim():''};const start=parseCalDate(get('DTSTART')),end=parseCalDate(get('DTEND'));if(!start||!end)continue;out.push({source,start,end,summary:unescapeICS(get('SUMMARY')),location:unescapeICS(get('LOCATION')),description:unescapeICS(get('DESCRIPTION')),categories:unescapeICS(get('CATEGORIES'))});}return out;}
function text(e){return `${e.summary||''} ${e.location||''} ${e.description||''} ${e.categories||''}`;}
function fieldNumbers(e){const t=text(e);const nums=[];for(const re of [/(?:field|fld)\s*(?:#|no\.?|number)?\s*[-:]?\s*([1-8])\b/ig,/\bSMGSL\s*[-–—:]?\s*(?:field\s*)?([1-8])\b/ig,/\b(?:F|Fld)\s*#?\s*([1-8])\b/ig]){let m;while((m=re.exec(t)))nums.push(+m[1]);}return [...new Set(nums)].sort((a,b)=>a-b);}
function isSI(e){return /(^|\W)SI(\W|$)|sports\s*inc|sudden\s*impact|schneider|oglesby|fontenot|joiner|ray\s+practice|williams\s+practice|forman\s+practice/i.test(text(e));}
function isSMGSL(e){const t=text(e);return !isSI(e)&&(TEAM_RE.test(t)||/\bSMGSL\b/i.test(t));}
function owner(e){return isSI(e)?'SI':(isSMGSL(e)?'SMGSL':'Calendar');}
function endTime(e){const min=isSI(e)?new Date(e.start.getTime()+180*60000):e.end;return e.end>min?e.end:min;}
function dayKey(d){const p=parts(d);return `${p.y}-${String(p.m).padStart(2,'0')}-${String(p.d).padStart(2,'0')}`;}
function sameDay(a,b){return dayKey(a)===dayKey(b);}
function weekday(d){const p=parts(d);return new Date(Date.UTC(p.y,p.m-1,p.d)).getUTCDay();}
async function allEvents(){const all=[];for(const c of CALENDARS){const r=await fetch(c.url,{headers:{'User-Agent':'SMGSL-Board-Hub/1.0','Accept':'text/calendar,text/plain,*/*'}});const txt=await r.text();if(r.ok&&/BEGIN:VCALENDAR/i.test(txt))all.push(...parseICS(txt,c.name));}if(!all.length)throw new Error('No SMGSL calendar events could be loaded');return all;}
function lookup(events,date,time,field){const dm=date.match(/^(\d{4})-(\d{2})-(\d{2})$/),tm=time.match(/^(\d{2}):(\d{2})$/);if(!dm||!tm||field<1||field>8)throw new Error('Invalid date, time or field');const target=centralDate(+dm[1],+dm[2],+dm[3],+tm[1],+tm[2]);const exact=[];for(const e of events){if(!fieldNumbers(e).includes(field))continue;const end=endTime(e);if(e.start<=target&&end>target)exact.push({...e,end,owner:owner(e),fieldNumber:field,projected:false});}
if(exact.length)return exact.sort((a,b)=>a.start-b.start);
const dow=weekday(target);const candidates=[];for(const e of events){if(!fieldNumbers(e).includes(field))continue;if(weekday(e.start)!==dow)continue;const p=parts(e.start),q=parts(target);if(p.h!==q.h&&!(e.start<=target&&endTime(e)>target))continue;const delta=Math.abs(e.start-target)/86400000;if(delta>21)continue;const dur=endTime(e)-e.start;const start=centralDate(q.y,q.m,q.d,p.h,p.min),end=new Date(start.getTime()+dur);if(start<=target&&end>target)candidates.push({...e,start,end,owner:owner(e),fieldNumber:field,projected:true,delta});}
const seen=new Set();return candidates.sort((a,b)=>a.delta-b.delta).filter(x=>{const k=`${x.owner}|${x.summary}|${x.start.toISOString()}`;if(seen.has(k))return false;seen.add(k);return true;}).slice(0,3);}
const originalCreateServer=http.createServer;
http.createServer=function(listener){return originalCreateServer.call(http,async function(req,res){let u;try{u=new URL(req.url,'http://localhost');}catch{return listener(req,res);}if(u.pathname!=='/api/field-lookup')return listener(req,res);if(!authed(req)){res.writeHead(302,{'Location':'/login'});return res.end('');}try{const date=u.searchParams.get('date')||'',time=u.searchParams.get('time')||'',field=Number(u.searchParams.get('field'));const matches=lookup(await allEvents(),date,time,field);res.writeHead(200,{'Content-Type':'application/json; charset=utf-8','Cache-Control':'no-store'});return res.end(JSON.stringify({date,time,field,displayTime:time,matches}));}catch(e){res.writeHead(400,{'Content-Type':'application/json; charset=utf-8'});return res.end(JSON.stringify({error:e.message}));}});};
require('./server');
