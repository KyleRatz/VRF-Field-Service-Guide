// Adds field, practice day, time, and duration to each SI individual-team usage card.
(function(){
  function siWeekday(v){
    const d=typeof safeFieldDate==='function'?safeFieldDate(v):new Date(v);
    if(!d||Number.isNaN(d.getTime()))return 'Unknown day';
    try{return d.toLocaleDateString('en-US',{timeZone:typeof FIELD_TZ!=='undefined'?FIELD_TZ:'America/Chicago',weekday:'long'});}catch{return d.toLocaleDateString('en-US',{weekday:'long'});}
  }
  function pluralDay(day){
    if(!day||day==='Unknown day')return day;
    return day.endsWith('s')?day:day+'s';
  }
  function practicePattern(x){
    const field=(x&&x.field)||((x&&x.fieldNumber)?`Field ${x.fieldNumber}`:'Field not listed');
    const day=siWeekday(x&&x.start);
    const hrs=typeof siEventHours==='function'?siEventHours(x):0;
    const start=typeof fieldTime==='function'?fieldTime(x&&x.start):'';
    const end=typeof fieldTime==='function'?fieldTime(x&&x.end):'';
    return {field,day,hrs,start,end,key:[field,day,start,end,hrs.toFixed(2)].join('|')};
  }
  function scheduleHtml(patterns){
    if(!patterns.length)return '<div class="small" style="margin-top:10px"><b>Practice schedule:</b> No calendar schedule details found.</div>';
    const order={Sunday:0,Monday:1,Tuesday:2,Wednesday:3,Thursday:4,Friday:5,Saturday:6};
    patterns.sort((a,b)=>(order[a.day]??9)-(order[b.day]??9)||String(a.field).localeCompare(String(b.field))||String(a.start).localeCompare(String(b.start)));
    return `<div class="small" style="margin-top:10px;line-height:1.65"><b>Practice schedule</b><br>${patterns.map(p=>`${escSI(p.field)} • ${escSI(pluralDay(p.day))} • ${escSI(p.start)}–${escSI(p.end)} • ${p.hrs.toFixed(1)} hr${Math.abs(p.hrs-1)<0.001?'':'s'}/practice`).join('<br>')}</div>`;
  }
  function siTeamUsageWithSchedule(rows){
    const teams=new Map();
    rows.forEach(x=>{
      const team=siTeamName(x&&x.summary);
      const current=teams.get(team)||{team,hours:0,blocks:0,patterns:new Map()};
      current.hours+=siEventHours(x);current.blocks+=1;
      const p=practicePattern(x);if(!current.patterns.has(p.key))current.patterns.set(p.key,p);
      teams.set(team,current);
    });
    const adjustments=currentSIAdjustments();
    adjustments.forEach(a=>{
      const team=normalizedSITeam(a.team)||'Unassigned SI';
      const current=teams.get(team)||{team,hours:0,blocks:0,patterns:new Map()};
      current.adjustmentHours=(current.adjustmentHours||0)+siAdjustmentHours(a);teams.set(team,current);
    });
    const sorted=[...teams.values()].sort((a,b)=>((b.hours+(b.adjustmentHours||0))-(a.hours+(a.adjustmentHours||0)))||a.team.localeCompare(b.team));
    const total=sorted.reduce((sum,x)=>sum+x.hours+(x.adjustmentHours||0),0);
    const cards=sorted.map(x=>{
      const adj=x.adjustmentHours||0,actual=x.hours+adj;
      return `<div class="rule-card si-team-card"><div class="rule-topic">${escSI(x.team)}</div><div class="rule-question">${actual.toFixed(1)} field-hours</div><div class="small">Calendar usage: ${x.hours.toFixed(1)} hrs • Adjustments: ${adj>=0?'+':''}${adj.toFixed(1)} hrs • ${x.blocks} field-use record${x.blocks===1?'':'s'}</div>${scheduleHtml([...x.patterns.values()])}<button class="btn secondary si-adjust-btn" data-team="${escSI(x.team)}">Document / Adjust Usage</button></div>`;
    }).join('');
    return `${siAdjustmentCardHtml(adjustments)}<div class="field-date">SI Individual Team Usage — Since Aug 1, 2026</div><div class="usage-summary">${cards}<div class="rule-card"><div class="rule-topic">SI INDIVIDUAL TEAM TOTAL</div><div class="rule-question">${total.toFixed(1)} field-hours</div><div class="small">Sum of all SI individual-team usage plus shared manual adjustments since Aug 1</div></div></div>`;
  }
  siTeamUsage=siTeamUsageWithSchedule;
})();
