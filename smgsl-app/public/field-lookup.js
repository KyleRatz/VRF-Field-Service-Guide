/* SMGSL compact navigation + Field Lookup */
(function(){
  const TZ='America/Chicago';
  function localYMD(d){return new Intl.DateTimeFormat('en-CA',{timeZone:TZ,year:'numeric',month:'2-digit',day:'2-digit'}).format(d);}
  function localHM(d){const parts=Object.fromEntries(new Intl.DateTimeFormat('en-US',{timeZone:TZ,hour:'2-digit',minute:'2-digit',hourCycle:'h23'}).formatToParts(d).filter(x=>x.type!=='literal').map(x=>[x.type,x.value]));return `${parts.hour}:${parts.minute}`;}
  function displayTime(v){return new Date(v).toLocaleTimeString('en-US',{timeZone:TZ,hour:'numeric',minute:'2-digit'});}
  function esc(v){return String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot',"'":'&#39;'}[c]));}
  if(typeof views!=='undefined'){
    views.fieldlookup={title:'Field Lookup',html:`<p class="muted">Find who was scheduled on a field at a specific date and time. Calendar times display in Central Time.</p><div class="incident-grid"><label>Date<input id="flDate" type="date"></label><label>Time<input id="flTime" type="time" step="900"></label><label>Field<select id="flField">${Array.from({length:8},(_,i)=>`<option value="${i+1}">Field ${i+1}</option>`).join('')}</select></label></div><button class="btn primary" id="runFieldLookup" type="button">Look Up Field</button><div id="fieldLookupResult" style="margin-top:16px"><div class="empty">Choose a date, time and field.</div></div>`};
  }
  const quick=document.querySelector('.quick');
  if(quick){
    quick.innerHTML=`<button data-view="fieldlookup">Field Lookup</button><button data-view="rules">Fast Rule Lookup</button><button data-view="fields">Fields & Availability</button><button data-view="contacts">Contacts</button><details class="more-tools"><summary>More Board Tools</summary><div class="quick more-grid"><button data-view="blast">Blast Ball</button><button data-view="usatx">USA Softball TX/NM</button><button data-view="bylaws">Bylaws</button><button data-view="documents">Board Documents</button><button data-view="si">Field Usage</button><button data-view="parking">Parking Violations</button><button data-view="incidents">Incident Reports</button></div></details>`;
    quick.querySelectorAll('[data-view]').forEach(b=>b.addEventListener('click',()=>{if(typeof render==='function')render(b.dataset.view);}));
  }
  const style=document.createElement('style');
  style.textContent=`.more-tools{grid-column:1/-1;border:1px solid #315a7e;border-radius:16px;padding:0;overflow:hidden}.more-tools summary{cursor:pointer;padding:15px 18px;font-weight:800;list-style:none;text-align:center}.more-tools summary::-webkit-details-marker{display:none}.more-grid{padding:0 12px 12px}.lookup-result{border:1px solid #315a7e;border-radius:16px;padding:18px;background:#0b2035}.lookup-result h3{margin:0 0 8px}.lookup-tag{display:inline-block;border-radius:999px;padding:4px 9px;font-size:12px;font-weight:800;background:#163b5d;margin-bottom:8px}@media(max-width:600px){.hero .quick{gap:9px}.hero .quick>button{min-height:50px}.more-grid{display:grid!important;grid-template-columns:1fr 1fr!important}}`;
  document.head.appendChild(style);
  async function runLookup(){
    const out=document.querySelector('#fieldLookupResult'); if(!out)return;
    const date=document.querySelector('#flDate')?.value;
    const time=document.querySelector('#flTime')?.value;
    const field=document.querySelector('#flField')?.value;
    if(!date||!time||!field){out.innerHTML='<div class="warn">Choose a date, time and field.</div>';return;}
    out.innerHTML='<div class="empty">Checking field calendar…</div>';
    try{const r=await fetch(`/api/field-lookup?date=${encodeURIComponent(date)}&time=${encodeURIComponent(time)}&field=${encodeURIComponent(field)}`);const d=await r.json();if(!r.ok)throw new Error(d.error||'Lookup failed');if(!d.matches?.length){out.innerHTML=`<div class="lookup-result"><h3>Field ${esc(field)} — ${esc(d.displayTime||time)}</h3><div class="lookup-tag">No scheduled use found</div><p class="muted">No calendar event was found covering that exact time.</p></div>`;return;}out.innerHTML=`<div class="lookup-result"><h3>Field ${esc(field)} — ${esc(d.displayTime||time)}</h3>${d.matches.map(m=>`<article class="rule-card"><div class="rule-topic">${esc(m.owner||'Scheduled')}</div><div class="rule-question">${esc(m.summary||'Scheduled use')}</div><div class="rule-answer">${esc(displayTime(m.start))}–${esc(displayTime(m.end))}${m.location?` • ${esc(m.location)}`:''}</div>${m.projected?'<div class="small">Projected from recurring weekly schedule</div>':''}</article>`).join('')}</div>`;}catch(e){out.innerHTML=`<div class="warn">${esc(e.message)}</div>`;}
  }
  const oldBind=typeof bind==='function'?bind:null;
  if(oldBind){bind=function(){oldBind();if(current==='fieldlookup'){const d=document.querySelector('#flDate'),t=document.querySelector('#flTime');if(d&&!d.value)d.value=localYMD(new Date());if(t&&!t.value)t.value=localHM(new Date());document.querySelector('#runFieldLookup')?.addEventListener('click',runLookup);}};}
})();
