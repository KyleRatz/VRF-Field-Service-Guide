views.fields.html=`<p class="muted">Live availability is calculated from the SMGSL calendar across <b>all 8 fields</b>. Normal practices are <b>1.5 hours</b>. Weekday start times are searched from <b>5:00 PM through 7:30 PM</b>; Sunday start times are searched from <b>9:00 AM through 7:30 PM</b>. The app looks ahead 21 days.</p><button class="btn primary" id="refreshFields">Refresh Calendar</button><div id="fieldResults"><div class="empty">Loading field calendar…</div></div>`;

views.si.html=`<div class="warn">SI is tracked separately and is <b>not part of the SMGSL organization</b>. SI practices are treated as <b>3-hour blocks</b>. This view shows the exact numbered field(s) SI is using whenever the live calendar identifies the field.</div><button class="btn primary" id="refreshSI">Refresh Calendar</button><div id="siResults"><div class="empty">Loading SI usage…</div></div>`;

loadFields=async function(target,siOnly=false){
  const el=document.querySelector(target);if(!el)return;
  el.innerHTML='<div class="empty">Refreshing calendar…</div>';
  try{
    const r=await fetch('/api/fields');const d=await r.json();
    if(!r.ok)throw new Error(d.error||'Calendar error');

    if(siOnly){
      if(!d.si.length){el.innerHTML='<div class="empty">No SI-labeled events found in the current 21-day window.</div>';return;}
      const groups={};
      d.si.forEach(x=>{const day=new Date(x.start).toLocaleDateString([], {weekday:'long',month:'short',day:'numeric'});(groups[day]??=[]).push(x)});
      el.innerHTML=Object.entries(groups).map(([day,arr])=>{
        arr.sort((a,b)=>(a.fieldNumber||99)-(b.fieldNumber||99)||new Date(a.start)-new Date(b.start));
        const rows=arr.map(x=>`<div class="usage"><b>${x.field}</b><span>${new Date(x.start).toLocaleTimeString([], {hour:'numeric',minute:'2-digit'})} – ${new Date(x.end).toLocaleTimeString([], {hour:'numeric',minute:'2-digit'})}<br><span class="small">3-hour SI block${x.summary?` • ${x.summary}`:''}${x.location?` • ${x.location}`:''}</span></span></div>`).join('');
        return `<div class="field-date">${day}</div>${rows}`;
      }).join('');
      return;
    }

    const groups={};
    d.slots.forEach(x=>{const day=new Date(x.start).toLocaleDateString([], {weekday:'long',month:'short',day:'numeric'});(groups[day]??=[]).push(x)});
    el.innerHTML=Object.entries(groups).map(([day,arr])=>{
      arr.sort((a,b)=>new Date(a.start)-new Date(b.start)||(a.fieldNumber||99)-(b.fieldNumber||99));
      const byTime={};
      arr.forEach(x=>{const key=new Date(x.start).toLocaleTimeString([], {hour:'numeric',minute:'2-digit'});(byTime[key]??=[]).push(x)});
      const timeRows=Object.entries(byTime).map(([time,slots])=>{
        slots.sort((a,b)=>a.fieldNumber-b.fieldNumber);
        const nums=slots.map(x=>x.fieldNumber).join(', ');
        const end=new Date(slots[0].end).toLocaleTimeString([], {hour:'numeric',minute:'2-digit'});
        return `<div class="slot"><b>${time} – ${end}</b><span>Available: <b>Fields ${nums}</b></span></div>`;
      }).join('');
      return `<div class="field-date">${day}</div>${timeRows}`;
    }).join('')||'<div class="empty">No 1.5-hour practice slots are open in the selected windows.</div>';
  }catch(e){
    el.innerHTML=`<div class="warn">Could not read the calendar: ${e.message}</div>`;
  }
};
