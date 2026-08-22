views.fields.html=`<p class="muted">Live availability is calculated from the SMGSL calendar for <b>Monday–Friday 5:00 PM–9:00 PM</b> and <b>Sunday 9:00 AM–9:00 PM</b>. Each result shows the specific field number that is open. The app looks ahead 21 days.</p><button class="btn primary" id="refreshFields">Refresh Calendar</button><div id="fieldResults"><div class="empty">Loading field calendar…</div></div>`;

views.si.html=`<div class="warn">SI is tracked separately and is <b>not part of the SMGSL organization</b>. This view shows the exact numbered field(s) SI is using whenever that field number appears in the live calendar event.</div><button class="btn primary" id="refreshSI">Refresh Calendar</button><div id="siResults"><div class="empty">Loading SI usage…</div></div>`;

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
        const rows=arr.map(x=>`<div class="usage"><b>${x.field}</b><span>${new Date(x.start).toLocaleTimeString([], {hour:'numeric',minute:'2-digit'})} – ${new Date(x.end).toLocaleTimeString([], {hour:'numeric',minute:'2-digit'})}<br><span class="small">${x.summary||''}${x.location?` • ${x.location}`:''}</span></span></div>`).join('');
        return `<div class="field-date">${day}</div>${rows}`;
      }).join('');
      return;
    }

    const groups={};
    d.slots.forEach(x=>{const day=new Date(x.start).toLocaleDateString([], {weekday:'long',month:'short',day:'numeric'});(groups[day]??=[]).push(x)});
    el.innerHTML=Object.entries(groups).map(([day,arr])=>{
      arr.sort((a,b)=>(a.fieldNumber||99)-(b.fieldNumber||99)||new Date(a.start)-new Date(b.start));
      return `<div class="field-date">${day}</div>${arr.map(x=>`<div class="slot"><b>${x.field}</b><span>${new Date(x.start).toLocaleTimeString([], {hour:'numeric',minute:'2-digit'})} – ${new Date(x.end).toLocaleTimeString([], {hour:'numeric',minute:'2-digit'})}</span></div>`).join('')}`;
    }).join('')||'<div class="empty">No open field windows found.</div>';
  }catch(e){
    el.innerHTML=`<div class="warn">Could not read the calendar: ${e.message}</div>`;
  }
};
