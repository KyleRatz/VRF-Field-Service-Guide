/* SMGSL compact navigation + Field Lookup */
(function(){
  const TZ='America/Chicago';
  function localYMD(d){return new Intl.DateTimeFormat('en-CA',{timeZone:TZ,year:'numeric',month:'2-digit',day:'2-digit'}).format(d);}
  function displayTime(v){return new Date(v).toLocaleTimeString('en-US',{timeZone:TZ,hour:'numeric',minute:'2-digit'});}
  function displayDate(v){return new Date(`${v}T12:00:00`).toLocaleDateString('en-US',{weekday:'long',month:'long',day:'numeric',year:'numeric'});}
  function esc(v){return String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));}
  if(typeof views!=='undefined'){
    views.fieldlookup={title:'Field Schedule Search',html:`<p class="muted">Search the calendar by <b>day</b>, by an optional <b>time</b>, and optionally by a specific field. Leave Time blank to see the whole day's schedule. Leave Field on All Fields to see Fields 1–8 together. Times display in Central Time.</p><div class="incident-grid"><label>Date<input id="flDate" type="date"></label><label>Time — optional<input id="flTime" type="time" step="900"></label><label>Field — optional<select id="flField"><option value="">All Fields</option>${Array.from({length:8},(_,i)=>`<option value="${i+1}">Field ${i+1}</option>`).join('')}</select></label></div><div class="actions"><button class="btn primary" id="runFieldLookup" type="button">Search Field Schedule</button><button class="btn secondary" id="clearFieldTime" type="button">Whole Day</button></div><div id="fieldLookupResult" style="margin-top:16px"><div class="empty">Choose a date, then search the whole day or add a time/field.</div></div>`};
  }
  const quick=document.querySelector('.quick');
  if(quick){
    quick.innerHTML=`<button data-view="fieldlookup">Field Schedule Search</button><button data-view="rules">Fast Rule Lookup</button><button data-view="fields">Fields & Availability</button><button data-view="contacts">Contacts</button><details class="more-tools"><summary>More Board Tools</summary><div class="quick more-grid"><button data-view="blast">Blast Ball</button><button data-view="usatx">USA Softball TX/NM</button><button data-view="bylaws">Bylaws</button><button data-view="documents">Board Documents</button><button data-view="si">Field Usage</button><button data-view="parking">Parking Violations</button><button data-view="incidents">Incident Reports</button></div></details>`;
    quick.querySelectorAll('[data-view]').forEach(b=>b.addEventListener('click',()=>{if(typeof render==='function')render(b.dataset.view);}));
  }
  const style=document.createElement('style');
  style.textContent=`.more-tools{grid-column:1/-1;border:1px solid #315a7e;border-radius:16px;padding:0;overflow:hidden}.more-tools summary{cursor:pointer;padding:15px 18px;font-weight:800;list-style:none;text-align:center}.more-tools summary::-webkit-details-marker{display:none}.more-grid{padding:0 12px 12px}.lookup-result{border:1px solid #315a7e;border-radius:16px;padding:18px;background:#0b2035}.lookup-result h3{margin:0 0 8px}.lookup-tag{display:inline-block;border-radius:999px;padding:4px 9px;font-size:12px;font-weight:800;background:#163b5d;margin-bottom:8px}.lookup-field{margin:18px 0 8px;font-weight:900;font-size:19px}.lookup-row{display:grid;grid-template-columns:minmax(90px,120px) 1fr;gap:12px;align-items:start;padding:12px 0;border-top:1px solid #254561}.lookup-row:first-of-type{border-top:0}.lookup-time{font-weight:800}.lookup-owner{display:inline-block;font-size:11px;font-weight:900;letter-spacing:.04em;text-transform:uppercase;opacity:.8;margin-bottom:3px}@media(max-width:600px){.hero .quick{gap:9px}.hero .quick>button{min-height:50px}.more-grid{display:grid!important;grid-template-columns:1fr 1fr!important}.lookup-row{grid-template-columns:1fr;gap:4px}}`;
  document.head.appendChild(style);

  function renderMatches(out,d,date,time,field){
    const rows=Array.isArray(d.matches)?d.matches:[];
    const scope=time?`at ${esc(d.displayTime||time)}`:'for the whole day';
    const fieldLabel=field?`Field ${esc(field)}`:'All Fields';
    if(!rows.length){out.innerHTML=`<div class="lookup-result"><h3>${esc(displayDate(date))}</h3><div class="lookup-tag">No scheduled use found</div><p class="muted">No calendar event was found ${scope} on ${fieldLabel}.</p></div>`;return;}
    const grouped=new Map();
    rows.forEach(m=>{const f=m.fieldNumber||'?';if(!grouped.has(f))grouped.set(f,[]);grouped.get(f).push(m);});
    const sections=[...grouped.entries()].sort((a,b)=>Number(a[0])-Number(b[0])).map(([f,items])=>`<div class="lookup-field">Field ${esc(f)}</div>${items.map(m=>`<div class="lookup-row"><div class="lookup-time">${esc(displayTime(m.start))}–${esc(displayTime(m.end))}</div><div><div class="lookup-owner">${esc(m.owner||'Scheduled')}</div><div><b>${esc(m.summary||'Scheduled use')}</b></div>${m.location?`<div class="small">${esc(m.location)}</div>`:''}${m.projected?'<div class="small">Projected from recurring weekly schedule</div>':''}</div></div>`).join('')}`).join('');
    out.innerHTML=`<div class="lookup-result"><h3>${esc(displayDate(date))}</h3><div class="small">${esc(fieldLabel)} • ${time?`Schedule at ${esc(d.displayTime||time)}`:'Full-day schedule'}</div>${sections}</div>`;
  }

  async function runLookup(){
    const out=document.querySelector('#fieldLookupResult'); if(!out)return;
    const date=document.querySelector('#flDate')?.value||'';
    const time=document.querySelector('#flTime')?.value||'';
    const field=document.querySelector('#flField')?.value||'';
    if(!date){out.innerHTML='<div class="warn">Choose a date first.</div>';return;}
    out.innerHTML='<div class="empty">Checking field calendar…</div>';
    const params=new URLSearchParams({date});if(time)params.set('time',time);if(field)params.set('field',field);
    try{
      const r=await fetch(`/api/field-lookup?${params.toString()}`,{cache:'no-store',credentials:'same-origin'});
      const text=await r.text();let d;try{d=JSON.parse(text);}catch{if(/SMGSL Board Login/i.test(text)){window.location.href='/login';return;}throw new Error('Field schedule service returned an unreadable response');}
      if(r.status===401){window.location.href='/login';return;}
      if(!r.ok)throw new Error(d.error||'Lookup failed');
      renderMatches(out,d,date,time,field);
    }catch(e){out.innerHTML=`<div class="warn">${esc(e.message)}</div>`;}
  }
  const oldBind=typeof bind==='function'?bind:null;
  if(oldBind){bind=function(){oldBind();if(current==='fieldlookup'){const d=document.querySelector('#flDate');if(d&&!d.value)d.value=localYMD(new Date());document.querySelector('#runFieldLookup')?.addEventListener('click',runLookup);document.querySelector('#clearFieldTime')?.addEventListener('click',()=>{const t=document.querySelector('#flTime');if(t)t.value='';runLookup();});}};}
})();
