(function(){
  const priorLoadFields=window.loadFields;
  if(typeof priorLoadFields!=='function')return;

  const TZ='America/Chicago';
  function d(v){const x=new Date(v);return Number.isNaN(x.getTime())?null:x;}
  function dayKey(v){const x=d(v);if(!x)return '';return new Intl.DateTimeFormat('en-CA',{timeZone:TZ,year:'numeric',month:'2-digit',day:'2-digit'}).format(x);}
  function dayLabel(v){const x=d(v);if(!x)return '';return x.toLocaleDateString('en-US',{timeZone:TZ,weekday:'long',month:'short',day:'numeric'});}
  function timeLabel(v){const x=d(v);if(!x)return '';return x.toLocaleTimeString('en-US',{timeZone:TZ,hour:'numeric',minute:'2-digit'});}
  function localParts(v){const x=d(v);if(!x)return null;const parts=Object.fromEntries(new Intl.DateTimeFormat('en-US',{timeZone:TZ,weekday:'short',hour:'2-digit',minute:'2-digit',hourCycle:'h23'}).formatToParts(x).filter(p=>p.type!=='literal').map(p=>[p.type,p.value]));return {weekday:parts.weekday,h:+parts.hour,min:+parts.minute};}

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
        else{if(end-start>=180*60000)blocks.push({start,end,field});start=next[0];end=next[1];field=next[2];}
      }
      if(end-start>=180*60000)blocks.push({start,end,field});
    });
    return blocks.sort((a,b)=>a.start-b.start||a.field-b.field);
  }

  function renderThreeHour(slots){
    const blocks=threeHourBlocks(slots);
    if(!blocks.length)return '<div class="rule-card" style="margin-top:16px"><div class="rule-topic">3+ HOUR AVAILABILITY</div><div class="small" style="margin-top:8px">No fields have a continuous 3-hour opening in the current availability window.</div></div>';
    const byDay=new Map();
    blocks.forEach(b=>{const key=dayKey(b.start);if(!byDay.has(key))byDay.set(key,[]);byDay.get(key).push(b);});
    return '<div class="rule-card" style="margin-top:16px"><div class="rule-topic">3+ HOUR AVAILABILITY</div><div class="small" style="margin:6px 0 10px">Each field is shown once for its full continuous opening.</div>'+[...byDay.values()].map(arr=>`<div class="field-date">${dayLabel(arr[0].start)}</div>`+arr.map(b=>`<div class="slot"><b>Field ${b.field}</b><span>${timeLabel(b.start)} – ${timeLabel(b.end)} <span class="small">(${((b.end-b.start)/3600000).toFixed(1)} hrs)</span></span></div>`).join('')).join('')+'</div>';
  }

  function isStandardSlot(s){
    const p=localParts(s&&s.start);if(!p)return false;
    const mins=p.h*60+p.min;
    const anchor=p.weekday==='Sun'?9*60:18*60;
    return mins>=anchor&&((mins-anchor)%90===0);
  }

  function renderStandardSlots(slots){
    const rows=(Array.isArray(slots)?slots:[]).filter(isStandardSlot),groups=new Map();
    rows.forEach(x=>{const k=dayKey(x.start);if(!groups.has(k))groups.set(k,[]);groups.get(k).push(x);});
    if(!rows.length)return '<div class="rule-card" style="margin-top:16px"><div class="rule-topic">REGULAR 1.5-HOUR OPENINGS</div><div class="small" style="margin-top:8px">No regular 1.5-hour practice slots are open.</div></div>';
    return '<div class="rule-card" style="margin-top:16px"><div class="rule-topic">REGULAR 1.5-HOUR OPENINGS</div><div class="small" style="margin:6px 0 10px">Standard non-overlapping practice blocks only.</div>'+[...groups.values()].map(arr=>{
      arr.sort((a,b)=>d(a.start)-d(b.start)||(a.fieldNumber||99)-(b.fieldNumber||99));
      const byTime=new Map();arr.forEach(x=>{const k=String(d(x.start).getTime());if(!byTime.has(k))byTime.set(k,[]);byTime.get(k).push(x);});
      return `<div class="field-date">${dayLabel(arr[0].start)}</div>`+[...byTime.values()].map(list=>{list.sort((a,b)=>(a.fieldNumber||99)-(b.fieldNumber||99));const nums=list.map(x=>x.fieldNumber).filter(Boolean).join(', ');return `<div class="slot"><b>${timeLabel(list[0].start)} – ${timeLabel(list[0].end)}</b><span>Available: <b>Fields ${nums}</b></span></div>`;}).join('');
    }).join('')+'</div>';
  }

  window.loadFields=async function(target,siOnly=false){
    if(siOnly)return priorLoadFields(target,true);
    const el=document.querySelector(target);if(!el)return;
    el.innerHTML='<div class="empty">Refreshing schedule…</div>';
    try{
      const data=await requestFieldCalendar();
      const totals=typeof usageSummary==='function'?usageSummary(data,false):'';
      el.innerHTML=totals+renderThreeHour(data&&data.slots)+renderStandardSlots(data&&data.slots);
    }catch(e){
      el.innerHTML=`<div class="warn">Could not read the schedule: ${e&&e.message?e.message:'Unknown schedule error'}</div>`;
    }
  };
})();
