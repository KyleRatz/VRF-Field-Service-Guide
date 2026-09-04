// Board-approved SI schedule corrections effective after Sept. 3, 2026.
// SOURCE POLICY:
//   1) SMGSL.net is authoritative for league games, league practices, and Other/tournaments.
//   2) Only SI-owned rows may be changed by this file.
//   3) Board-approved SI corrections below override conflicting SI rows from SMGSL.net.
// This module mutates the cached official fall calendar before server-entry builds its
// event index, so removed SI practices are released back into field availability,
// 3+ hour availability, field lookup, and annual scheduled totals.
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
 // HARD GUARD: owner 0 (SMGSL) and owner 2 (Other/tournament) are always preserved.
 // This prevents SI corrections from changing the authoritative SMGSL.net league calendar.
 if(!Array.isArray(row)||row[3]!==1)return true;
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
 const smgslBefore=officialFall.events.filter(r=>Array.isArray(r)&&r[3]===0).length;
 const otherBefore=officialFall.events.filter(r=>Array.isArray(r)&&r[3]===2).length;
 officialFall.events=officialFall.events.filter(keep);
 const smgslAfter=officialFall.events.filter(r=>Array.isArray(r)&&r[3]===0).length;
 const otherAfter=officialFall.events.filter(r=>Array.isArray(r)&&r[3]===2).length;
 if(smgslBefore!==smgslAfter||otherBefore!==otherAfter)throw new Error('SI override attempted to modify authoritative SMGSL/Other calendar rows');
 officialFall.siForwardScheduleCorrections={
  effective:EFFECTIVE,
  removed:before-officialFall.events.length,
  sourcePolicy:'SMGSL.net authoritative for SMGSL and Other; board-approved overrides apply to SI only',
  rules:['Whiddon: Wednesday only','Schneider: Thursday only','Ray: no Sunday practice']
 };
}
