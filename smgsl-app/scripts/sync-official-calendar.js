#!/usr/bin/env node
'use strict';

const fs=require('fs');
const path=require('path');

const SOURCE_URL='https://calendar.bluesombrero.com/api/v1/Calendar?instancekey=clubs&portalId=3766&id=47158228&key=UVQYBLIQ';
const RANGE_START='2026-09-01';
const RANGE_END_EXCLUSIVE='2027-01-01';
const OUTPUT=path.join(__dirname,'..','official-calendar-2026-fall-data.js');
const TZ='America/Chicago';

function property(block,name){
  const match=block.match(new RegExp(`(?:^|\\n)${name}(?:;[^:]*)?:([^\\n\\r]+)`,'i'));
  return match?match[1].trim():'';
}

function unescapeICS(value=''){
  return value.replace(/\\n/gi,'\n').replace(/\\,/g,',').replace(/\\;/g,';').replace(/\\\\/g,'\\').trim();
}

function localDateKey(date){
  return new Intl.DateTimeFormat('en-CA',{timeZone:TZ,year:'numeric',month:'2-digit',day:'2-digit'}).format(date);
}

function centralDate(dateKey,hour,minute=0){
  const [year,month,day]=dateKey.split('-').map(Number);
  const wall=Date.UTC(year,month-1,day,hour,minute);
  let guess=new Date(wall);
  const parts=d=>Object.fromEntries(new Intl.DateTimeFormat('en-US',{timeZone:TZ,year:'numeric',month:'2-digit',day:'2-digit',hour:'2-digit',minute:'2-digit',second:'2-digit',hourCycle:'h23'}).formatToParts(d).filter(x=>x.type!=='literal').map(x=>[x.type,x.value]));
  const offset=d=>{const p=parts(d);return Date.UTC(+p.year,+p.month-1,+p.day,+p.hour,+p.minute,+p.second)-d.getTime();};
  let currentOffset=offset(guess),result=new Date(wall-currentOffset),adjustedOffset=offset(result);
  if(adjustedOffset!==currentOffset)result=new Date(wall-adjustedOffset);
  return result;
}

function ownerCode(summary){
  if(/^SI\b/i.test(summary))return 1;
  if(/tournament|gold cup/i.test(summary))return 2;
  return 0;
}

function parseCalendar(text){
  const unfolded=text.replace(/\r?\n[ \t]/g,'');
  const parsed=[];
  for(const section of unfolded.split('BEGIN:VEVENT').slice(1)){
    const block=section.split('END:VEVENT')[0];
    const startRaw=property(block,'DTSTART'),endRaw=property(block,'DTEND');
    const start=new Date(startRaw.replace(/^(\d{4})(\d{2})(\d{2})T(\d{2})(\d{2})(\d{2})Z$/,'$1-$2-$3T$4:$5:$6Z'));
    const end=new Date(endRaw.replace(/^(\d{4})(\d{2})(\d{2})T(\d{2})(\d{2})(\d{2})Z$/,'$1-$2-$3T$4:$5:$6Z'));
    if(Number.isNaN(start.getTime())||Number.isNaN(end.getTime()))continue;
    const dateKey=localDateKey(start);
    if(dateKey<RANGE_START||dateKey>=RANGE_END_EXCLUSIVE)continue;
    const summary=unescapeICS(property(block,'SUMMARY'));
    const description=unescapeICS(property(block,'DESCRIPTION'));
    const fieldMatch=description.match(/field\s*([1-8])\b/i);
    const fields=fieldMatch?[Number(fieldMatch[1])]:/tournament|gold cup|all fields?/i.test(`${summary} ${description}`)?[1,2,3,4,5,6,7,8]:[];
    if(!fields.length)continue;
    const allFields=fields.length===8;
    const normalizedStart=allFields?centralDate(dateKey,9):start;
    const normalizedEnd=allFields?centralDate(dateKey,21):end;
    for(const fieldNumber of fields)parsed.push({start:normalizedStart,end:normalizedEnd,fieldNumber,owner:ownerCode(summary),summary});
  }
  return parsed.sort((a,b)=>a.start-b.start||a.fieldNumber-b.fieldNumber||a.summary.localeCompare(b.summary));
}

async function main(){
  const response=await fetch(SOURCE_URL,{headers:{Accept:'text/calendar,text/plain,*/*','User-Agent':'SMGSL-Board-Hub-Calendar-Sync/1.0'}});
  const text=await response.text();
  if(!response.ok||!/BEGIN:VCALENDAR/i.test(text))throw new Error(`Official calendar request failed (${response.status})`);
  const events=parseCalendar(text);
  if(events.length<1000)throw new Error(`Official calendar returned only ${events.length} field records; refusing to replace the verified snapshot`);
  const summaries=[...new Set(events.map(e=>e.summary))].sort((a,b)=>a.localeCompare(b));
  const summaryIndex=new Map(summaries.map((value,index)=>[value,index]));
  const rows=events.map(e=>[e.start.toISOString(),e.end.toISOString(),e.fieldNumber,e.owner,summaryIndex.get(e.summary)]);
  const counts={smgsl:0,si:0,other:0};
  for(const e of events)counts[e.owner===1?'si':e.owner===2?'other':'smgsl']++;
  const output=`// Generated from the public SMGSL.net calendar. Run scripts/sync-official-calendar.js to refresh.\nmodule.exports=${JSON.stringify({sourceUrl:SOURCE_URL,rangeStart:RANGE_START,rangeEndExclusive:RANGE_END_EXCLUSIVE,fetchedAt:new Date().toISOString(),counts,summaries,events:rows})};\n`;
  fs.writeFileSync(OUTPUT,output);
  console.log(`Saved ${events.length} official field records (${counts.smgsl} SMGSL, ${counts.si} SI, ${counts.other} Other).`);
}

main().catch(error=>{console.error(error.message);process.exitCode=1;});
