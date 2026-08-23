/* SMGSL compact navigation + Field Lookup */
(function(){
  const TZ='America/Chicago';
  function localYMD(d){return new Intl.DateTimeFormat('en-CA',{timeZone:TZ,year:'numeric',month:'2-digit',day:'2-digit'}).format(d);}
  function localHM(d){const parts=Object.fromEntries(new Intl.DateTimeFormat('en-US',{timeZone:TZ,hour:'2-digit',minute:'2-digit',hourCycle:'h23'}).formatToParts(d).filter(x=>x.type!=='literal').map(x=>[x.type,x.value]));return `${parts.hour}:${parts.minute}`;}
  function displayTime(v){return new Date(v).toLocaleTimeString('en-US',{timeZone:TZ,hour:'numeric',minute:'2-digit'});}
  function esc(v){return String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));}

  // app.js declares `views` as a top-level const, so it is a global lexical
  // binding rather than window.views. Use it directly.
  if(typeof views!=='undefined'){
    views.fieldlookup={title:'Field Lookup',html:`<p class="muted">Find who was scheduled on a field at a specific date and time. Calendar times display in Central Time.</p><div class="incident-grid"><label>Date<input id="flDate" type="date"></label><label>Time<input id="flTime" type="time" step="900"></label><label>Field<select id="flField">${Array.from({length:8},(_,i)=>`<option value="${i+1}">Field ${i+1}</option>`).join('')}</select></label></div><button class="btn primary" id="runFieldLookup" type="button">Look Up Field</button><div id="fieldLookupResult" style="margin-top:16px"><div class="empty">Choose a date, time and field.</div></div>`};
  }

  const quick=document.querySelector('.quick');
  if(quick){
    quick.innerHTML=`<button data-view="fieldlookup">Field Lookup</button><button data-view="rules">Fast Rule Lookup</button><button data-view="fields">Fields & Availability</button><button data-view="contacts">Contacts</button><details class="more-tools"><summary>More Board Tools</summary><div class="quick more-grid"><button data-view="blast">Blast Ball</button><button data-view="usatx">USA Softball TX</button><button data-view="bylaws">Bylaws</button><button data-view="documents">Board Documents</button><button data-view="si">Field Usage</button><button data-view="incidents">Incident Reports</button></div></details>`;
    quick.querySelectorAll('[data-view]').forEach(b=>b.addEventListener('click',()=>{
      if(typeof render==='function')render(b.dataset.view);
    }));
  }

  const style=document.createElement('style');
  style.textContent=`.more-tools{grid-column:1/-1;border:1px solid #315a7e;border-radius:16px;padding:0;overflow:hidden}.more-tools summary{cursor:pointer;padding:15px 18px;font-weight:800;list-style:none;text-align:center}.more-tools summary::-webkit-details-marker{display:none}.more-grid{padding:0 12px 12px}.lookup-result{border:1px solid #315a7e;border-radius:16px;padding:18px;background:#0b2035}.lookup-result h3{margin:0 0 8px}.lookup-tag{display:inline-block;border-radius:999px;padding:4px 9px;font-size:12px;font-weight:800;background:#163b5d;margin-bottom:8px}@media(max-width:600px){.hero .quick{gap:9px}.hero .quick>button{min-height:50px}.more-grid{display:grid!important;grid-template-columns:1fr 1fr!important}}`;
  document.head.appendChild(style);

  async function runLookup(){
    const out=document.querySelector('#fieldLookupResult'); if(!out)return;
    const date=document.querySelector('#flDate')?.value;
    const time=document.querySelector('#flTime')?.value;
    const field=Number(document.querySelector('#flField')?.value);
    if(!date||!time||!field){out.innerHTML='<div class="warn">Select a date, time and field.</div>';return;}
    out.innerHTML='<div class="empty">Checking calendar…</div>';
    try{
      const r=await fetch(`/api/field-lookup?date=${encodeURIComponent(date)}&time=${encodeURIComponent(time)}&field=${field}`,{cache:'no-store',credentials:'same-origin'});
      const contentType=r.headers.get('content-type')||'';
      if(!contentType.includes('application/json'))throw new Error('The field lookup service did not return calendar data.');
      const d=await r.json();
      if(!r.ok)throw new Error(d.error||'Lookup failed');
      if(!d.matches?.length){out.innerHTML=`<div class="lookup-result"><h3>Field ${field}</h3><div class="empty">No scheduled team found at ${esc(d.displayTime||time)} on ${esc(date)}.</div></div>`;return;}
      out.innerHTML=d.matches.map(x=>`<div class="lookup-result"><span class="lookup-tag">${esc(x.owner||'Calendar')}</span><h3>Field ${field} — ${esc(x.summary||'Scheduled use')}</h3><div>${displayTime(x.start)} – ${displayTime(x.end)}</div>${x.location?`<div class="small">${esc(x.location)}</div>`:''}${x.projected?'<div class="small">Recurring schedule reconstruction</div>':'<div class="small">Calendar record</div>'}</div>`).join('');
    }catch(e){out.innerHTML=`<div class="warn">Could not look up the field: ${esc(e.message)}</div>`;}
  }

  const oldBind=(typeof bind==='function')?bind:null;
  bind=function(){
    if(oldBind)oldBind();
    const button=document.querySelector('#runFieldLookup');
    if(!button)return;
    const now=new Date();
    const date=document.querySelector('#flDate');
    const time=document.querySelector('#flTime');
    if(date&&!date.value)date.value=localYMD(now);
    if(time&&!time.value)time.value=localHM(now);
    button.addEventListener('click',runLookup,{once:false});
  };
})();
