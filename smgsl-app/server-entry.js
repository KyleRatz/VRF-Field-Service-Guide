const http=require('http');
const crypto=require('crypto');
const schedule=require('./schedule-2026-data');

const TZ='America/Chicago';
const PUBLIC_MODE=String(process.env.PUBLIC_MODE||'false').toLowerCase()==='true';
const BOARD_PASSWORD=process.env.BOARD_PASSWORD||'';
const SECRET=process.env.SESSION_SECRET||crypto.createHash('sha256').update(BOARD_PASSWORD||'smgsl-dev').digest('hex');
const USAGE_START='2026-01-01';
const WINDOW_DAYS=21;

function cookies(req){return Object.fromEntries((req.headers.cookie||'').split(';').map(s=>s.trim().split('=')).filter(x=>x.length===2));}
function authed(req){if(PUBLIC_MODE)return true;const t=cookies(req).smgsl_session;if(!t)return false;const [raw,sig]=t.split('.');if(!raw||!sig||Number(raw)<Date.now())return false;const want=crypto.createHmac('sha256',SECRET).update(raw).digest('hex');try{return crypto.timingSafeEqual(Buffer.from(sig),Buffer.from(want));}catch{return false;}}
function parts(date){const o=Object.fromEntries(new Intl.DateTimeFormat('en-US',{timeZone:TZ,year:'numeric',month:'2-digit',day:'2-digit',hour:'2-digit',minute:'2-digit',second:'2-digit',hourCycle:'h23'}).formatToParts(date).filter(x=>x.type!=='literal').map(x=>[x.type,x.value]));return {y:+o.year,m:+o.month,d:+o.day,h:+o.hour,min:+o.minute,s:+o.second};}
function offsetMs(date){const p=parts(date);return Date.UTC(p.y,p.m-1,p.d,p.h,p.min,p.s)-date.getTime();}
function centralDate(y,m,d,h=0,min=0){const wall=Date.UTC(y,m-1,d,h,min);let g=new Date(wall),o=offsetMs(g),out=new Date(wall-o),o2=offsetMs(out);if(o2!==o)out=new Date(wall-o2);return out;}
function parseYMD(v){const m=String(v||'').match(/^(\d{4})-(\d{2})-(\d{2})$/);return m?{y:+m[1],m:+m[2],d:+m[3]}:null;}
function parseHM(v){const m=String(v||'').match(/^(\d{2}):(\d{2})$/);return m?{h:+m[1],min:+m[2]}:null;}
function addDays(d,n){const p=parts(d),noon=centralDate(p.y,p.m,p.d,12),tmp=new Date(noon.getTime()+n*86400000),q=parts(tmp);return centralDate(q.y,q.m,q.d,12);}
function addMinutes(d,n){return new Date(d.getTime()+n*60000);}
function ymd(d){const p=parts(d);return `${p.y}-${String(p.m).padStart(2,'0')}-${String(p.d).padStart(2,'0')}`;}
function overlaps(a1,a2,b1,b2){return a1<b2&&a2>b1;}
function sameDay(a,b){return ymd(a)===ymd(b);}

function expandSchedule(){
 const out=[];
 for(const g of schedule.groups||[]){
  const st=parseHM(g.start),et=parseHM(g.end);if(!st||!et)continue;
  for(const date of g.dates||[]){const p=parseYMD(date);if(!p)continue;const start=centralDate(p.y,p.m,p.d,st.h,st.min);let end=centralDate(p.y,p.m,p.d,et.h,et.min);if(end<=start)end=addDays(end,1);out.push({fieldNumber:Number(g.field),start,end,summary:g.team||'',location:g.location||'SMGSL',owner:g.owner==='SI'?'SI':'SMGSL',season:g.season||'',source:`${g.season||'2026'} schedule spreadsheet`});}
 }
 return out.sort((a,b)=>a.start-b.start||a.fieldNumber-b.fieldNumber||a.summary.localeCompare(b.summary));
}
const EVENTS=expandSchedule();

function openWindow(day){const p=parts(day),dow=new Date(Date.UTC(p.y,p.m-1,p.d)).getUTCDay();if(dow>=2&&dow<=5)return [centralDate(p.y,p.m,p.d,18),centralDate(p.y,p.m,p.d,21)];if(dow===0)return [centralDate(p.y,p.m,p.d,9),centralDate(p.y,p.m,p.d,21)];return null;}
function candidateStarts(day){const w=openWindow(day);if(!w)return [];const out=[];for(let t=new Date(w[0]);addMinutes(t,90)<=w[1];t=addMinutes(t,30))out.push(new Date(t));return out;}
function unionBusyMinutes(events,start,end){const ints=events.map(e=>[e.start>start?e.start:start,e.end<end?e.end:end]).filter(x=>x[1]>x[0]).sort((a,b)=>a[0]-b[0]);if(!ints.length)return 0;let total=0,s=ints[0][0],e=ints[0][1];for(let i=1;i<ints.length;i++){if(ints[i][0]<=e){if(ints[i][1]>e)e=ints[i][1];}else{total+=(e-s)/60000;s=ints[i][0];e=ints[i][1];}}return total+(e-s)/60000;}
function capacitySummary(events,from,to){let total=0,busy=0;for(let day=new Date(from);day<to;day=addDays(day,1)){const w=openWindow(day);if(!w)continue;const mins=(w[1]-w[0])/60000;total+=mins*8;for(let f=1;f<=8;f++)busy+=unionBusyMinutes(events.filter(e=>e.fieldNumber===f&&sameDay(e.start,day)),w[0],w[1]);}return {totalFieldHours:+(total/60).toFixed(1),occupiedFieldHours:+(busy/60).toFixed(1),availableFieldHours:+((total-busy)/60).toFixed(1)};}
function summarizeUsage(events){let si=0,sm=0;for(const e of events){const h=Math.max(0,(e.end-e.start)/3600000);if(e.owner==='SI')si+=h;else sm+=h;}return {siFieldHours:+si.toFixed(2),smgslFieldHours:+sm.toFixed(2),currentTotalFieldHours:+(si+sm).toFixed(2)};}
function eventOut(e){return {field:`Field ${e.fieldNumber}`,fieldNumber:e.fieldNumber,start:e.start,end:e.end,summary:e.summary,location:e.location,owner:e.owner,source:e.source,projected:false,durationMinutes:(e.end-e.start)/60000};}

function fieldData(){
 const instantNow=new Date(),np=parts(instantNow),today=centralDate(np.y,np.m,np.d),horizon=addDays(today,WINDOW_DAYS),usageStart=centralDate(2026,1,1);
 const future=EVENTS.filter(e=>e.end>today&&e.start<horizon),used=EVENTS.filter(e=>e.end>usageStart&&e.start<=instantNow).map(e=>({...e,end:e.end>instantNow?instantNow:e.end})).filter(e=>e.end>e.start);
 const slots=[];
 for(let d=0;d<WINDOW_DAYS;d++){const day=addDays(today,d);for(let f=1;f<=8;f++){const busy=future.filter(e=>e.fieldNumber===f&&sameDay(e.start,day));for(const start of candidateStarts(day)){const end=addMinutes(start,90);if(!busy.some(e=>overlaps(start,end,e.start,e.end)))slots.push({field:`Field ${f}`,fieldNumber:f,start,end,durationMinutes:90});}}}
 const si=used.filter(e=>e.owner==='SI').map(eventOut),usage=summarizeUsage(used),capacity=capacitySummary(future,today,horizon);
 return {fields:Array.from({length:8},(_,i)=>`Field ${i+1}`),slots,si,usage:{...usage,...capacity,windowDays:WINDOW_DAYS,usageYear:2026,usageStart:USAGE_START,usageThrough:ymd(instantNow)},diagnostics:{source:'Spring 2026 schedule.xlsx + Fall 2026 schedule.xlsx',uniqueScheduleRecords:EVENTS.length,timeZone:TZ},rules:{timeZone:TZ,displayZone:'Central Time (CST/CDT)',normalPracticeMinutes:90,fieldCount:8,mondayAvailable:false,saturdayAvailable:false,tuesdayFridayOpen:'18:00',dailyClose:'21:00',sundayOpen:'09:00'}};
}

function lookup(date,time,field){
 const dm=parseYMD(date),tm=time?parseHM(time):null,fieldNum=field?Number(field):0;if(!dm||(time&&!tm)||(fieldNum&&(fieldNum<1||fieldNum>8)))throw new Error('Choose a valid date. Time and field are optional.');
 const dayStart=centralDate(dm.y,dm.m,dm.d),dayEnd=addDays(dayStart,1),target=tm?centralDate(dm.y,dm.m,dm.d,tm.h,tm.min):null;
 let matches=EVENTS.filter(e=>e.start<dayEnd&&e.end>dayStart&&(!fieldNum||e.fieldNumber===fieldNum));if(target)matches=matches.filter(e=>e.start<=target&&e.end>target);matches.sort((a,b)=>a.fieldNumber-b.fieldNumber||a.start-b.start||a.summary.localeCompare(b.summary));
 const displayTime=target?new Intl.DateTimeFormat('en-US',{timeZone:TZ,hour:'numeric',minute:'2-digit'}).format(target):'';return {date,time:time||'',displayTime,field:fieldNum||null,scope:tm?'time':'day',matches:matches.map(eventOut),source:'2026 spreadsheet schedule',timeZone:TZ};
}

const originalCreateServer=http.createServer;
http.createServer=function(listener){return originalCreateServer.call(http,async function(req,res){let u;try{u=new URL(req.url,'http://localhost');}catch{return listener(req,res);}if(u.pathname!=='/api/fields'&&u.pathname!=='/api/field-lookup')return listener(req,res);if(!authed(req)){res.writeHead(401,{'Content-Type':'application/json; charset=utf-8','Cache-Control':'no-store'});return res.end(JSON.stringify({error:'Session expired. Please sign in again.'}));}try{const result=u.pathname==='/api/fields'?fieldData():lookup(u.searchParams.get('date')||'',u.searchParams.get('time')||'',u.searchParams.get('field')||'');res.writeHead(200,{'Content-Type':'application/json; charset=utf-8','Cache-Control':'no-store'});return res.end(JSON.stringify(result));}catch(e){res.writeHead(400,{'Content-Type':'application/json; charset=utf-8','Cache-Control':'no-store'});return res.end(JSON.stringify({error:e.message}));}});};

require('./server');
