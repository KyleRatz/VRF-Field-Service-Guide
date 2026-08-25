const http=require('http');

// Final 2026 reporting corrections. This layer leaves the authenticated
// schedule API in server-entry.js intact and adjusts only its JSON response.
// Normal capacity is Tue-Fri 6-9 PM + Sun 9 AM-9 PM. Saturdays are NOT
// counted as unused/available capacity. Website-listed Saturday tournaments
// add only their actual all-day tournament occupancy to capacity/Other.
const FIELDS=8;
const TOURNAMENTS=[
  {name:'Ronald McDonald Charity Tournament',dates:['2026-10-16','2026-10-17','2026-10-18'],fields:[1,2,3,4,5,6,7,8]},
  {name:'Bombers Exposure Weekend Tournament',dates:['2026-11-07','2026-11-08'],fields:[1,2,3,4,5,6,7,8]},
  {name:'Gold Cup',dates:['2026-11-13','2026-11-14'],fields:[1]}
];

function dayOfWeek(s){const [y,m,d]=s.split('-').map(Number);return new Date(Date.UTC(y,m-1,d)).getUTCDay();}
function hoursForWebsiteAllDay(date){const dow=dayOfWeek(date);if(dow===6)return 12; if(dow===0)return 12; if(dow>=2&&dow<=5)return 3; if(dow===5)return 3; return 0;}
function round(n){return Math.round((Number(n)||0)*100)/100;}
function tournamentEvents(){const out=[];for(const t of TOURNAMENTS)for(const date of t.dates)for(const fieldNumber of t.fields){const h=hoursForWebsiteAllDay(date);if(h)out.push({name:t.name,date,fieldNumber,hours:h,saturday:dayOfWeek(date)===6});}return out;}
const OTHER_EVENTS=tournamentEvents();

function correctedAnnualCapacity(base){
  // Existing backend already excludes Saturdays. Add only Saturday tournament
  // hours to annual capacity; weekday/Sunday tournaments consume existing capacity.
  const satHours=OTHER_EVENTS.filter(e=>e.saturday).reduce((s,e)=>s+e.hours,0);
  return round((Number(base)||0)+satHours);
}
function unusedByField(scheduleEvents,totalAnnualCapacity){
  const perFieldCapacity=totalAnnualCapacity/FIELDS;
  const used=Array(FIELDS).fill(0);
  for(const e of scheduleEvents||[]){if(e.fieldNumber>=1&&e.fieldNumber<=FIELDS)used[e.fieldNumber-1]+=Math.max(0,(new Date(e.end)-new Date(e.start))/3600000);}
  for(const e of OTHER_EVENTS)used[e.fieldNumber-1]+=e.hours;
  return used.map((h,i)=>({field:`Field ${i+1}`,fieldNumber:i+1,unusedFieldHours:round(Math.max(0,perFieldCapacity-h))}));
}

const originalCreateServer=http.createServer;
http.createServer=function(listener){return originalCreateServer.call(http,function(req,res){
  let pathname='';try{pathname=new URL(req.url,'http://localhost').pathname;}catch{}
  if(pathname!=='/api/fields')return listener(req,res);
  const chunks=[];const write=res.write.bind(res),end=res.end.bind(res),writeHead=res.writeHead.bind(res);
  let statusCode=200,headers={};
  res.writeHead=function(status,h){statusCode=status;headers=h||{};return res;};
  res.write=function(chunk,enc,cb){if(chunk)chunks.push(Buffer.isBuffer(chunk)?chunk:Buffer.from(chunk,enc));if(cb)cb();return true;};
  res.end=function(chunk,enc,cb){if(chunk)chunks.push(Buffer.isBuffer(chunk)?chunk:Buffer.from(chunk,enc));const raw=Buffer.concat(chunks).toString('utf8');
    if(statusCode===200){try{const data=JSON.parse(raw),s=data&&data.usage&&data.usage.scheduled;if(s){
      const baseCapacity=Number(s.totalFieldHours)||0;
      const annualCapacity=correctedAnnualCapacity(baseCapacity);
      const other=round(OTHER_EVENTS.reduce((sum,e)=>sum+e.hours,0));
      s.otherFieldHours=other;
      s.totalFieldHours=annualCapacity;
      s.scheduledTotalFieldHours=round((Number(s.siFieldHours)||0)+(Number(s.smgslFieldHours)||0)+other);
      s.unusedFieldHours=round(Math.max(0,annualCapacity-s.scheduledTotalFieldHours));
      s.unusedByField=unusedByField([],annualCapacity);
      data.usage.scheduled=s;
      data.diagnostics={...(data.diagnostics||{}),reportingAuthority:'SMGSL website calendar when discrepancies arise',saturdayCapacityRule:'Saturdays excluded from unused capacity; actual website-listed tournament hours count as Other',websiteTournamentHours:other};
      const body=Buffer.from(JSON.stringify(data));headers={...headers,'Content-Type':'application/json; charset=utf-8','Content-Length':String(body.length),'Cache-Control':'no-store'};writeHead(statusCode,headers);write(body);return end(null,null,cb);
    }}catch(e){console.error('2026 calendar correction error:',e.message);}}
    writeHead(statusCode,headers);if(raw)write(raw);return end(null,null,cb);
  };
  return listener(req,res);
});};
