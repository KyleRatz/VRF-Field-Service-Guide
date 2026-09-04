(function(){
  const priorLoadFields=window.loadFields;
  if(typeof priorLoadFields!=='function')return;

  function d(v){const x=new Date(v);return Number.isNaN(x.getTime())?null:x;}
  function dayKey(v){const x=d(v);if(!x)return '';return new Intl.DateTimeFormat('en-CA',{timeZone:'America/Chicago',year:'numeric',month:'2-digit',day:'2-digit'}).format(x);}
  function dayLabel(v){const x=d(v);if(!x)return '';return x.toLocaleDateString('en-US',{timeZone:'America/Chicago',weekday:'long',month:'short',day:'numeric'});}
  function timeLabel(v){const x=d(v);if(!x)return '';return x.toLocaleTimeString('en-US',{timeZone:'America/Chicago',hour:'numeric',minute:'2-digit'});}

  function threeHourBlocks(slots){
    const grouped=new Map();
    (Array.isArray(slots)?slots:[]).forEach(s=>{
      const start=d(s&&s.start),end=d(s&&s.end),field=Number(s&&s.fieldNumber);
      if(!start||!end||!field||end<=start)return;
      const key=`${dayKey(start)}|${field}`;
      if(!grouped.has(key))grouped.set(key,[]);
      grouped.get(key).push([start,end,field]);
    });

    const blocks=[];
    grouped.forEach(intervals=>{
      intervals.sort((a,b)=>a[0]-b[0]);
      let start=intervals[0][0],end=intervals[0][1],field=intervals[0][2];
      for(let i=1;i<intervals.length;i++){
        const next=intervals[i];
        if(next[0]<=end){if(next[1]>end)end=next[1];}
        else{
          if((end-start)>=180*60000)blocks.push({start,end,field});
          start=next[0];end=next[1];field=next[2];
        }
      }
      if((end-start)>=180*60000)blocks.push({start,end,field});
    });
    return blocks.sort((a,b)=>a.start-b.start||a.field-b.field);
  }

  function renderThreeHour(slots){
    const blocks=threeHourBlocks(slots);
    if(!blocks.length)return '<div class="rule-card" style="margin-top:16px"><div class="rule-topic">3+ HOUR AVAILABILITY</div><div class="small" style="margin-top:8px">No fields have a continuous 3-hour opening in the current availability window.</div></div>';

    const byDay=new Map();
    blocks.forEach(b=>{const key=dayKey(b.start);if(!byDay.has(key))byDay.set(key,[]);byDay.get(key).push(b);});
    return '<div class="rule-card" style="margin-top:16px"><div class="rule-topic">3+ HOUR AVAILABILITY</div><div class="small" style="margin:6px 0 10px">Continuous openings of at least 3 hours on the same field.</div>'+[...byDay.values()].map(arr=>{
      const label=dayLabel(arr[0].start);
      return `<div class="field-date">${label}</div>`+arr.map(b=>{
        const hrs=(b.end-b.start)/3600000;
        return `<div class="slot"><b>Field ${b.field}</b><span>${timeLabel(b.start)} – ${timeLabel(b.end)} <span class="small">(${hrs.toFixed(1)} hrs)</span></span></div>`;
      }).join('');
    }).join('')+'</div>';
  }

  window.loadFields=async function(target,siOnly=false){
    await priorLoadFields(target,siOnly);
    if(siOnly)return;
    const el=document.querySelector(target);if(!el)return;
    try{
      const data=await requestFieldCalendar();
      const summary=renderThreeHour(data&&data.slots);
      const marker=el.querySelector('.usage-summary');
      if(marker)marker.insertAdjacentHTML('afterend',summary);else el.insertAdjacentHTML('afterbegin',summary);
    }catch(e){
      el.insertAdjacentHTML('afterbegin','<div class="warn">Could not calculate 3+ hour availability.</div>');
    }
  };
})();
