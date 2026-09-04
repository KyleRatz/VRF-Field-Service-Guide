// Board-approved SI schedule corrections effective after Sept. 3, 2026.
// Mutate the cached official fall calendar before server-entry builds its event index,
// so removed practices are released back into field availability and annual totals.
const officialFall=require('./official-calendar-2026-fall-data');
const TZ='America/Chicago';
const EFFECTIVE='2026-09-04';
const fmt=new Intl.DateTimeFormat('en-US',{timeZone:TZ,year:'numeric',month:'2-digit',day:'2-digit',weekday:'short'});
function localParts(iso){
 const d=new Date(iso);if(Number.isNaN(d.getTime()))return null;
 const p=Object.fromEntries(fmt.formatToParts(d).filter(x=>x.type!=='literal').map(x=>[x.type,x.value]));
 return {date:`${p.year}-${p.month}-${p.day}`,weekday:p.weekday};
}
function teamName(row){return String((officialFall.summaries||[])[row&&row[4]]||'').toUpperCase();}
function keep(row){
 if(!Array.isArray(row)||row[3]!==1)return true; // SI rows only
 const lp=localParts(row[0]);if(!lp||lp.date<EFFECTIVE)return true;
 const name=teamName(row);
 // Whiddon/Widdon practices Wednesdays only moving forward.
 if(/SI\s+WH?IDDON\b/.test(name))return lp.weekday==='Wed';
 // Schneider practices Thursdays only moving forward.
 if(/SI\s+SCHNEIDER\b/.test(name))return lp.weekday==='Thu';
 // Ray no longer practices Sundays moving forward; preserve any other Ray day.
 if(/SI\s+RAY\b/.test(name)&&lp.weekday==='Sun')return false;
 return true;
}
if(Array.isArray(officialFall.events)){
 const before=officialFall.events.length;
 officialFall.events=officialFall.events.filter(keep);
 officialFall.siForwardScheduleCorrections={effective:EFFECTIVE,removed:before-officialFall.events.length,rules:['Whiddon: Wednesday only','Schneider: Thursday only','Ray: no Sunday practice']};
}
