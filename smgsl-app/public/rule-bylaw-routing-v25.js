// v25: division-first playing-rule lookup and a completely separate bylaws index.
(function(){
  const DIVS=[['6u','6U'],['8u','8U'],['10u','10U'],['12u','12U'],['mx','MX']];
  const BYLAW_URL=typeof BYLAWS!=='undefined'?BYLAWS:'/2025-smgsl-bylaws.html';
  let bylawIndexPromise;
  function esc(v){return String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));}
  function norm(v){return String(v||'').toLowerCase().replace(/by[- ]?laws?/g,'bylaws').replace(/[^a-z0-9]+/g,' ').trim();}
  function divisionLanding(){
    if(typeof views==='undefined')return;
    const cards=DIVS.map(([id,label])=>`<button type="button" class="rule-division-choice" data-rule-division-choice="${id}"><strong>${label}</strong><span>Search ${label} rules only</span></button>`).join('');
    views.rulelookup={title:'Rule Lookup',html:`<div class="notice"><b>Choose a division first.</b> Each search is locked to that division and includes only applicable SMGSL playing rules and USA Softball of Texas/New Mexico rules.</div><div class="rule-division-picker" aria-label="Choose a softball division">${cards}</div><div class="small route-separation-note">Looking for board governance, elections, officers, voting, or meetings? Use the separate Bylaws card.</div>`};
    views.rules=views.rulelookup;
  }
  function parseBylaws(html){
    const doc=new DOMParser().parseFromString(html,'text/html'),entries=[];let article='2025 SMGSL Bylaws',section='';
    [...doc.querySelectorAll('pre')].forEach((pre,i)=>{
      const page=Number(((pre.previousElementSibling?.textContent||'').match(/PAGE:\s*(\d+)/i)||[])[1])||i+1;
      const lines=pre.textContent.split(/\r?\n/).map(x=>x.trim()).filter(Boolean);let start=0;
      const flush=end=>{const text=lines.slice(start,end).join(' ');if(text.length>35)entries.push({article,section,page,text});start=end;};
      lines.forEach((line,idx)=>{if(/^ARTICLE\s+/i.test(line)){flush(idx);article=line;section='';start=idx+1;}else if(/^Section\s+\d+/i.test(line)){flush(idx);section=line;start=idx+1;}});flush(lines.length);
    });return entries;
  }
  async function loadBylaws(){if(!bylawIndexPromise)bylawIndexPromise=fetch(BYLAW_URL,{credentials:'same-origin'}).then(r=>{if(!r.ok)throw new Error('Bylaws could not be loaded');return r.text();}).then(parseBylaws);return bylawIndexPromise;}
  function score(entry,query){const q=norm(query),hay=norm(`${entry.article} ${entry.section} ${entry.text}`);if(!q)return 0;const tokens=q.split(' ').filter(t=>t.length>1),matched=tokens.filter(t=>hay.includes(t)).length;return (hay.includes(q)?100:0)+(matched===tokens.length?40:0)+matched*8;}
  function bylawCard(entry,query){const citation=[entry.article,entry.section].filter(Boolean).join(' — '),href=`${BYLAW_URL}?q=${encodeURIComponent(query)}#bylaws-page-${entry.page}`;return `<article class="rule-card bylaw-result"><div class="rule-topic">2025 SMGSL BYLAWS • PAGE ${entry.page}</div><div class="rule-question">${esc(citation)}</div><div class="rule-answer">${esc(entry.text)}</div><div class="rule-citation-fast"><b>${esc(citation)}</b> • Bylaws page ${entry.page}</div><a class="show-official-rule" href="${esc(href)}" target="_blank" rel="noopener">VIEW EXACT BYLAW SECTION</a></article>`;}
  function bylawsView(){if(typeof views==='undefined')return;views.bylaws={title:'2025 SMGSL Bylaws',html:`<div class="notice"><b>Bylaws-only lookup.</b> This search covers governance and administration in the official 2025 SMGSL Bylaws. It does not search softball playing rules.</div><div class="rule-search-wrap"><input id="bylawQuery" class="rule-search" inputmode="search" enterkeyhint="search" placeholder="Search bylaws: quorum, elections, officers, voting…" autocomplete="off"><div id="bylawResults" class="rule-search-results"><div class="empty">Type a board or governance topic to search the bylaws.</div></div></div><a class="doclink" href="${esc(BYLAW_URL)}" target="_blank" rel="noopener">Open Complete 2025 SMGSL Bylaws</a>`};}
  function bindV25(){
    document.querySelectorAll('[data-rule-division-choice]').forEach(b=>b.addEventListener('click',()=>render(b.dataset.ruleDivisionChoice)));
    const input=document.querySelector('#bylawQuery'),out=document.querySelector('#bylawResults');if(!input||!out)return;let request=0;
    input.addEventListener('input',async()=>{const id=++request,q=input.value.trim();if(!q){out.innerHTML='<div class="empty">Type a board or governance topic to search the bylaws.</div>';return;}out.innerHTML='<div class="empty">Searching bylaws…</div>';try{const rows=(await loadBylaws()).map(e=>({e,s:score(e,q)})).filter(x=>x.s>0).sort((a,b)=>b.s-a.s||a.e.page-b.e.page).slice(0,20);if(id!==request)return;out.innerHTML=rows.length?rows.map(x=>bylawCard(x.e,q)).join(''):`<div class="empty"><b>No bylaw section matched “${esc(q)}”.</b><br>Try fewer words or a governance term such as quorum, vote, election, officer, meeting, contract, records, or amendment.</div>`;}catch(err){if(id===request)out.innerHTML=`<div class="empty">${esc(err.message)}</div>`;}},{passive:true});
  }
  divisionLanding();bylawsView();if(typeof bind==='function'){const prior=bind;bind=function(){prior();bindV25();};}
  document.querySelectorAll('[data-view="rules"]').forEach(b=>{b.textContent='Rule Lookup';b.onclick=()=>render('rulelookup');});
  const style=document.createElement('style');style.textContent=`.rule-division-picker{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:12px;margin:16px 0}.rule-division-choice{min-height:92px;border:1px solid #4779a6;border-radius:15px;background:#102b46;color:#fff;text-align:left;padding:16px}.rule-division-choice strong{display:block;font-size:25px}.rule-division-choice span{display:block;color:#b9cee3;margin-top:5px;font-weight:700}.route-separation-note{padding:12px;border:1px solid #294b6c;border-radius:12px}.bylaw-result .rule-answer{max-height:13em;overflow:auto}@media(max-width:520px){.rule-division-picker{grid-template-columns:1fr 1fr}.rule-division-choice:last-child{grid-column:1/-1}}`;document.head.appendChild(style);
})();
