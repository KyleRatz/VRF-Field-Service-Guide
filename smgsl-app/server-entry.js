const http=require('http');
const crypto=require('crypto');
const schedule=require('./schedule-2026-data');

const TZ='America/Chicago';
const PUBLIC_MODE=String(process.env.PUBLIC_MODE||'false').toLowerCase()==='true';
const BOARD_PASSWORD=process.env.BOARD_PASSWORD||'';
const SECRET=process.env.SESSION_SECRET||crypto.createHash('sha256').update(BOARD_PASSWORD||'smgsl-dev').digest('hex');
const USAGE_START='2026-01-01';
const WINDOW_DAYS=21;
const PARTS_FORMATTER=new Intl.DateTimeFormat('en-US',{timeZone:TZ,year:'numeric',month:'2-digit',day:'2-digit',hour:'2-digit',minute:'2-digit',second:'2-digit',hourCycle:'h23'});
const LOOKUP_TIME_FORMATTER=new Intl.DateTimeFormat('en-US',{timeZone:TZ,hour:'numeric',minute:'2-digit'});
// These names were incorrectly parsed as SI teams in the uploaded schedules.
// Excluding them here releases every generated practice block back to unused
// field inventory and prevents team cards/lookup results from being created.
const EXCLUDED_SI_TEAM_NAMES=new Set(['SI SCHELSTRATE','SI WILLIAMS']);
let EVENTS_CACHE=null;
let EVENT_INDEX=null;
let SCHEDULED_CACHE=null;

function cookies(req){return Object.fromEntries((req.headers.cookie||'').split(';').map(s=>s.trim().split('=')).filter(x=>x.length===2));}
function authed(req){if(PUBLIC_MODE)return true;const t=cookies(req).smgsl_session;if(!t)return false;const [raw,sig]=t.split('.');if(!raw||!sig||Number(raw)<Date.now())return false;const want=crypto.createHmac('sha256',SECRET).update(raw).digest('hex');try{return crypto.timingSafeEqual(Buffer.from(sig),Buffer.from(want));}catch{return false;}}
function parts(date){const o=Object.fromEntries(PARTS_FORMATTER.formatToParts(date).filter(x=>x.type!=='literal').map(x=>[x.type,x.value]));return {y:+o.year,m:+o.month,d:+o.day,h:+o.hour,min:+o.minute,s:+o.second};}
function offsetMs(date){const p=parts(date);return Date.UTC(p.y,p.m-1,p.d,p.h,p.min,p.s)-date.getTime();}
function centralDate(y,m,d,h=0,min=0){const wall=Date.UTC(y,m-1,d,h,min);let g=new Date(wall),o=offsetMs(g),out=new Date(wall-o),o2=offsetMs(out);if(o2!==o)out=new Date(wall-o2);return out;}
function parseYMD(v){const m=String(v||'').match(/^(\d{4})-(\d{2})-(\d{2})$/);return m?{y:+m[1],m:+m[2],d:+m[3]}:null;}
function parseHM(v){const m=String(v||'').match(/^(\d{2}):(\d{2})$/);return m?{h:+m[1],min:+m[2]}:null;}
function compactDate(n){n=Number(n);return {y:2000+Math.floor(n/10000),m:Math.floor(n/100)%100,d:n%100};}
function compactDateKey(d){return (d.y-2000)*10000+d.m*100+d.d;}
function addDays(d,n){const p=parts(d),noon=centralDate(p.y,p.m,p.d,12),tmp=new Date(noon.getTime()+n*86400000),q=parts(tmp);return centralDate(q.y,q.m,q.d,12);}
function addMinutes(d,n){return new Date(d.getTime()+n*60000);}
function ymdParts(p){return `${p.y}-${String(p.m).padStart(2,'0')}-${String(p.d).padStart(2,'0')}`;}
function ymd(d){return ymdParts(parts(d));}
function overlaps(a1,a2,b1,b2){return a1<b2&&a2>b1;}
function fieldIndexKey(dayKey,fieldNumber){return `${dayKey}|${fieldNumber}`;}

function expandSchedule(){
 const out=[];
 for(const r of schedule.rules||[]){
  const [seasonBit,teamIdx,field,startMin,endMin,ownerBit,fromKey,toKey,excluded=[]]=r,from=compactDate(fromKey),to=compactDate(toKey),ex=new Set(excluded);
  const teamName=String(schedule.teams[teamIdx]||'').trim().toUpperCase();
  if(EXCLUDED_SI_TEAM_NAMES.has(teamName))continue;
  let day=centralDate(from.y,from.m,from.d),last=centralDate(to.y,to.m,to.d,23,59);
  while(day<=last){
   const p=parts(day),key=compactDateKey(p);
   if(!ex.has(key)){
    const start=centralDate(p.y,p.m,p.d,Math.floor(startMin/60),startMin%60);
    let end=centralDate(p.y,p.m,p.d,Math.floor(endMin/60),endMin%60);
    if(end<=start)end=addDays(end,1);
    out.push({fieldNumber:Number(field),start,end,dateKey:ymdParts(p),summary:schedule.teams[teamIdx]||'',location:'SMGSL',owner:ownerBit?'SI':'SMGSL',season:seasonBit?'Fall':'Spring',source:`${seasonBit?'Fall':'Spring'} 2026 schedule spreadsheet`});
   }
   day=addDays(day,7);
  }
 }
 return out.sort((a,b)=>a.start-b.start||a.fieldNumber-b.fieldNumber||a.summary.localeCompare(b.summary));
}
function buildIndex(events){
 const byDateField=new Map();
 for(const e of events){const k=fieldIndexKey(e.dateKey,e.fieldNumber);const list=byDateField.get(k);if(list)list.push(e);else byDateField.set(k,[e]);}
 return {byDateField};
}
function getEvents(){
 if(!EVENTS_CACHE){EVENTS_CACHE=expandSchedule();EVENT_INDEX=buildIndex(EVENTS_CACHE);}
 return EVENTS_CACHE;
}
function getIndexedEvents(dayKey,fieldNumber){getEvents();return EVENT_INDEX.byDateField.get(fieldIndexKey(dayKey,fieldNumber))||[];}

function openWindow(day){const p=parts(day),dow=new Date(Date.UTC(p.y,p.m-1,p.d)).getUTCDay();if(dow>=2&&dow<=5)return [centralDate(p.y,p.m,p.d,18),centralDate(p.y,p.m,p.d,21)];if(dow===0)return [centralDate(p.y,p.m,p.d,9),centralDate(p.y,p.m,p.d,21)];return null;}
function candidateStarts(day){const w=openWindow(day);if(!w)return [];const out=[];for(let t=new Date(w[0]);addMinutes(t,90)<=w[1];t=addMinutes(t,30))out.push(new Date(t));return out;}
function unionBusyMinutes(events,start,end){const ints=events.map(e=>[e.start>start?e.start:start,e.end<end?e.end:end]).filter(x=>x[1]>x[0]).sort((a,b)=>a[0]-b[0]);if(!ints.length)return 0;let total=0,s=ints[0][0],e=ints[0][1];for(let i=1;i<ints.length;i++){if(ints[i][0]<=e){if(ints[i][1]>e)e=ints[i][1];}else{total+=(e-s)/60000;s=ints[i][0];e=ints[i][1];}}return total+(e-s)/60000;}
function capacitySummary(from,to){let total=0,busy=0;for(let day=new Date(from);day<to;day=addDays(day,1)){const w=openWindow(day);if(!w)continue;const mins=(w[1]-w[0])/60000,dayKey=ymd(day);total+=mins*8;for(let f=1;f<=8;f++)busy+=unionBusyMinutes(getIndexedEvents(dayKey,f),w[0],w[1]);}return {totalFieldHours:+(total/60).toFixed(2),occupiedFieldHours:+(busy/60).toFixed(2),availableFieldHours:+((total-busy)/60).toFixed(2)};}
function summarizeUsage(events){let si=0,sm=0,other=0;for(const e of events){const h=Math.max(0,(e.end-e.start)/3600000);if(e.owner==='SI')si+=h;else if(e.owner==='SMGSL')sm+=h;else other+=h;}return {siFieldHours:+si.toFixed(2),smgslFieldHours:+sm.toFixed(2),otherFieldHours:+other.toFixed(2),currentTotalFieldHours:+(si+sm+other).toFixed(2)};}
function eventOut(e){return {field:`Field ${e.fieldNumber}`,fieldNumber:e.fieldNumber,start:e.start,end:e.end,summary:e.summary,location:e.location,owner:e.owner,source:e.source,projected:false,durationMinutes:(e.end-e.start)/60000};}
function getScheduledSummary(){
 if(SCHEDULED_CACHE)return SCHEDULED_CACHE;
 const EVENTS=getEvents(),usageStart=centralDate(2026,1,1),yearEnd=centralDate(2027,1,1),yearEvents=EVENTS.filter(e=>e.end>usageStart&&e.start<yearEnd);
 const scheduled=summarizeUsage(yearEvents),yearCapacity=capacitySummary(usageStart,yearEnd);
 scheduled.totalFieldHours=yearCapacity.totalFieldHours;
 scheduled.occupiedFieldHours=yearCapacity.occupiedFieldHours;
 scheduled.unusedFieldHours=yearCapacity.availableFieldHours;
 scheduled.scheduledTotalFieldHours=+(scheduled.siFieldHours+scheduled.smgslFieldHours+scheduled.otherFieldHours).toFixed(2);
 SCHEDULED_CACHE=Object.freeze({...scheduled});
 return SCHEDULED_CACHE;
}

function fieldData(){
 const EVENTS=getEvents();
 const instantNow=new Date(),np=parts(instantNow),today=centralDate(np.y,np.m,np.d),horizon=addDays(today,WINDOW_DAYS),usageStart=centralDate(2026,1,1);
 const used=EVENTS.filter(e=>e.end>usageStart&&e.start<=instantNow).map(e=>({...e,end:e.end>instantNow?instantNow:e.end})).filter(e=>e.end>e.start);
 const slots=[];
 for(let d=0;d<WINDOW_DAYS;d++){
  const day=addDays(today,d),dayKey=ymd(day);
  for(let f=1;f<=8;f++){
   const busy=getIndexedEvents(dayKey,f);
   for(const start of candidateStarts(day)){const end=addMinutes(start,90);if(!busy.some(e=>overlaps(start,end,e.start,e.end)))slots.push({field:`Field ${f}`,fieldNumber:f,start,end,durationMinutes:90});}
  }
 }
 const si=used.filter(e=>e.owner==='SI').map(eventOut);
 const usedToDate=summarizeUsage(used);
 const scheduled=getScheduledSummary();
 const capacity=capacitySummary(today,horizon);
 return {fields:Array.from({length:8},(_,i)=>`Field ${i+1}`),slots,si,usage:{...usedToDate,...capacity,windowDays:WINDOW_DAYS,usageYear:2026,usageStart:USAGE_START,usageThrough:ymd(instantNow),scheduled,usedToDate},diagnostics:{source:'Spring 2026 schedule.xlsx + Fall 2026 schedule.xlsx',uniqueScheduleRecords:EVENTS.length,timeZone:TZ},rules:{timeZone:TZ,displayZone:'Central Time (CST/CDT)',normalPracticeMinutes:90,fieldCount:8,mondayAvailable:false,saturdayAvailable:false,tuesdayFridayOpen:'18:00',dailyClose:'21:00',sundayOpen:'09:00'}};
}

function lookup(date,time,field){
 const EVENTS=getEvents();
 const dm=parseYMD(date),tm=time?parseHM(time):null,fieldNum=field?Number(field):0;if(!dm||(time&&!tm)||(fieldNum&&(fieldNum<1||fieldNum>8)))throw new Error('Choose a valid date. Time and field are optional.');
 const dayStart=centralDate(dm.y,dm.m,dm.d),dayEnd=addDays(dayStart,1),target=tm?centralDate(dm.y,dm.m,dm.d,tm.h,tm.min):null,dayKey=ymdParts(dm);
 let matches=fieldNum?[...getIndexedEvents(dayKey,fieldNum)]:EVENTS.filter(e=>e.dateKey===dayKey);
 matches=matches.filter(e=>e.start<dayEnd&&e.end>dayStart);if(target)matches=matches.filter(e=>e.start<=target&&e.end>target);matches.sort((a,b)=>a.fieldNumber-b.fieldNumber||a.start-b.start||a.summary.localeCompare(b.summary));
 const displayTime=target?LOOKUP_TIME_FORMATTER.format(target):'';return {date,time:time||'',displayTime,field:fieldNum||null,scope:tm?'time':'day',matches:matches.map(eventOut),source:'2026 spreadsheet schedule',timeZone:TZ};
}

const originalCreateServer=http.createServer;
http.createServer=function(listener){return originalCreateServer.call(http,async function(req,res){let u;try{u=new URL(req.url,'http://localhost');}catch{return listener(req,res);}if(u.pathname!=='/api/fields'&&u.pathname!=='/api/field-lookup')return listener(req,res);if(!authed(req)){res.writeHead(401,{'Content-Type':'application/json; charset=utf-8','Cache-Control':'no-store'});return res.end(JSON.stringify({error:'Session expired. Please sign in again.'}));}const started=Date.now();try{const result=u.pathname==='/api/fields'?fieldData():lookup(u.searchParams.get('date')||'',u.searchParams.get('time')||'',u.searchParams.get('field')||'');const body=JSON.stringify(result);res.writeHead(200,{'Content-Type':'application/json; charset=utf-8','Cache-Control':'no-store','Server-Timing':`schedule;dur=${Date.now()-started}`});return res.end(body);}catch(e){console.error('Schedule API error:',e);res.writeHead(500,{'Content-Type':'application/json; charset=utf-8','Cache-Control':'no-store'});return res.end(JSON.stringify({error:'Schedule data could not be calculated. Please refresh and try again.'}));}});};

require('./server');
