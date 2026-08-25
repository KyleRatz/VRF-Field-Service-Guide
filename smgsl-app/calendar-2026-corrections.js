const http=require('http');

// Authoritative 2026 reporting values from the reconciled SMGSL master calendar.
// Saturdays do not create general available/unused capacity. Website-listed
// tournament use is counted as Other, including Saturday tournament hours.
const ANNUAL={
  siFieldHours:2790.50,
  smgslFieldHours:2434.50,
  otherFieldHours:672.00,
  unusedFieldHours:3261.00,
  totalFieldHours:9158.00,
  scheduledTotalFieldHours:5897.00,
  unusedByField:[
    {field:'Field 1',fieldNumber:1,unusedFieldHours:264.25},
    {field:'Field 2',fieldNumber:2,unusedFieldHours:456.25},
    {field:'Field 3',fieldNumber:3,unusedFieldHours:440.75},
    {field:'Field 4',fieldNumber:4,unusedFieldHours:303.25},
    {field:'Field 5',fieldNumber:5,unusedFieldHours:682.00},
    {field:'Field 6',fieldNumber:6,unusedFieldHours:532.00},
    {field:'Field 7',fieldNumber:7,unusedFieldHours:180.25},
    {field:'Field 8',fieldNumber:8,unusedFieldHours:402.25}
  ]
};

// Reconciled planned-use snapshot through Aug. 25, 2026. Manual SI time
// violations are intentionally kept separate and are added by the UI only to
// actual Used-to-Date totals, not to the full-year scheduled totals.
const USED_TO_DATE_SNAPSHOTS={
  '2026-08-25':{siFieldHours:1827.50,smgslFieldHours:1490.25,otherFieldHours:168.00,currentTotalFieldHours:3485.75}
};

function applyAnnual(data){
  if(!data||!data.usage)return;
  const scheduled=data.usage.scheduled||{};
  Object.assign(scheduled,ANNUAL);
  scheduled.occupiedFieldHours=ANNUAL.scheduledTotalFieldHours;
  data.usage.scheduled=scheduled;
}

function applyUsedToDate(data){
  if(!data||!data.usage)return;
  const through=String(data.usage.usageThrough||'');
  const snapshot=USED_TO_DATE_SNAPSHOTS[through];
  if(!snapshot)return;
  const used={...(data.usage.usedToDate||{}),...snapshot};
  data.usage.usedToDate=used;
  // Keep the legacy top-level usage fields aligned with the Used-to-Date card.
  data.usage.siFieldHours=used.siFieldHours;
  data.usage.smgslFieldHours=used.smgslFieldHours;
  data.usage.otherFieldHours=used.otherFieldHours;
  data.usage.currentTotalFieldHours=used.currentTotalFieldHours;
}

const originalCreateServer=http.createServer;
http.createServer=function(listener){return originalCreateServer.call(http,function(req,res){
  let pathname='';try{pathname=new URL(req.url,'http://localhost').pathname;}catch{}
  if(pathname!=='/api/fields')return listener(req,res);
  const chunks=[];const write=res.write.bind(res),end=res.end.bind(res),writeHead=res.writeHead.bind(res);
  let statusCode=200,headers={};
  res.writeHead=function(status,h){statusCode=status;headers=h||{};return res;};
  res.write=function(chunk,enc,cb){if(chunk)chunks.push(Buffer.isBuffer(chunk)?chunk:Buffer.from(chunk,enc));if(cb)cb();return true;};
  res.end=function(chunk,enc,cb){
    if(chunk)chunks.push(Buffer.isBuffer(chunk)?chunk:Buffer.from(chunk,enc));
    const raw=Buffer.concat(chunks).toString('utf8');
    if(statusCode===200){
      try{
        const data=JSON.parse(raw);
        applyAnnual(data);
        applyUsedToDate(data);
        data.diagnostics={
          ...(data.diagnostics||{}),
          reportingAuthority:'SMGSL reconciled 2026 master calendar / website when discrepancies arise',
          saturdayCapacityRule:'Saturdays excluded from unused capacity; website-listed tournament hours count as Other',
          annualAvailableFieldHours:ANNUAL.totalFieldHours,
          annualScheduledFieldHours:ANNUAL.scheduledTotalFieldHours,
          annualOtherFieldHours:ANNUAL.otherFieldHours
        };
        const body=Buffer.from(JSON.stringify(data));
        headers={...headers,'Content-Type':'application/json; charset=utf-8','Content-Length':String(body.length),'Cache-Control':'no-store'};
        writeHead(statusCode,headers);write(body);return end(null,null,cb);
      }catch(e){console.error('2026 calendar correction error:',e.message);}
    }
    writeHead(statusCode,headers);if(raw)write(raw);return end(null,null,cb);
  };
  return listener(req,res);
});};
