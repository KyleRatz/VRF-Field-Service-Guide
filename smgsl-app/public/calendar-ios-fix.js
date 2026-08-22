// Safari/WebKit calendar rendering compatibility fix.
// Avoids empty locale arrays in Intl formatting and forces Central Time.
(function(){
  const CAL_TZ='America/Chicago';

  function asDate(value){
    const d=new Date(value);
    return Number.isNaN(d.getTime())?null:d;
  }

  function formatDateTime(value){
    const d=asDate(value);
    if(!d)return 'Invalid date';
    return d.toLocaleString('en-US',{timeZone:CAL_TZ,weekday:'short',month:'short',day:'numeric',hour:'numeric',minute:'2-digit'});
  }

  function formatTime(value){
    const d=asDate(value);
    if(!d)return 'Invalid time';
    return d.toLocaleTimeString('en-US',{timeZone:CAL_TZ,hour:'numeric',minute:'2-digit'});
  }

  function formatDay(value){
    const d=asDate(value);
    if(!d)return 'Unknown day';
    return d.toLocaleDateString('en-US',{timeZone:CAL_TZ,weekday:'long',month:'short',day:'numeric'});
  }

  window.fmt=formatDateTime;
  window.loadFields=async function(target,siOnly=false){
    const el=document.querySelector(target);
    if(!el)return;
    el.innerHTML='<div class="empty">Refreshing calendar…</div>';
    try{
      const r=await fetch('/api/fields',{cache:'no-store'});
      const d=await r.json();
      if(!r.ok)throw new Error(d.error||'Calendar error');

      if(siOnly){
        const rows=Array.isArray(d.si)?d.si:[];
        el.innerHTML=rows.length
          ?rows.map(x=>`<div class="usage"><b>${x.field||'Field'}</b><span>${formatDateTime(x.start)}–${formatTime(x.end)}<br><span class="small">${x.summary||''}</span></span></div>`).join('')
          :'<div class="empty">No SI-labeled events found in the current calendar window.</div>';
        return;
      }

      const slots=Array.isArray(d.slots)?d.slots:[];
      const groups={};
      slots.forEach(x=>{
        const day=formatDay(x.start);
        (groups[day]??=[]).push(x);
      });
      el.innerHTML=Object.entries(groups).map(([day,arr])=>
        `<div class="field-date">${day}</div>${arr.map(x=>`<div class="slot"><b>${x.field||'Field'}</b><span>${formatTime(x.start)} – ${formatTime(x.end)}</span></div>`).join('')}`
      ).join('')||'<div class="empty">No open field windows found.</div>';
    }catch(e){
      el.innerHTML=`<div class="warn">Could not read the calendar: ${e?.message||'Unknown calendar error'}</div>`;
    }
  };
})();
