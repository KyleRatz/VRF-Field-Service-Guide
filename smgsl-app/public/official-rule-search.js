// Unified official rule search for SMGSL Board Hub.
// Searches the app's SMGSL division-rule summaries plus integrated USA Softball of Texas guidance.
(function(){
  const SMGSL_SOURCE='SMGSL Updated Fall 2025 Rulebook';
  const USATX_SOURCE='USA Softball of Texas';
  const divLabel={blast:'Blast Ball','6u':'6U','8u':'8U','10u':'10U','12u':'12U',mx:'MX'};

  function esc(s){return String(s??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));}
  function norm(s){
    return String(s||'').toLowerCase()
      .replace(/10\s*&?\s*under|10u/g,'10u').replace(/12\s*&?\s*under|12u/g,'12u')
      .replace(/8\s*&?\s*under|8u/g,'8u').replace(/6\s*&?\s*under|6u/g,'6u')
      .replace(/mixed division|mixed/g,'mx')
      .replace(/innings?/g,'inning').replace(/pitchers?/g,'pitcher').replace(/pitching/g,'pitch')
      .replace(/stealing/g,'steal').replace(/walks/g,'walk').replace(/runs/g,'run')
      .replace(/[^a-z0-9#]+/g,' ').trim();
  }
  function allRules(){
    const out=[];
    if(window.divisionRules){
      Object.entries(window.divisionRules).forEach(([div,arr])=>arr.forEach((r,i)=>out.push({
        div,topic:r.topic,q:r.q,text:r.text,keys:r.keys||'',source:r.source||SMGSL_SOURCE,index:i
      })));
    }
    if(window.usaTxBase?.rules){
      window.usaTxBase.rules.forEach((r,i)=>out.push({div:'all',topic:r.topic,q:r.q,text:r.text,keys:r.keys||'',source:USATX_SOURCE,index:i}));
    }
    return out;
  }
  function scoreRule(r,q){
    const nq=norm(q); if(!nq)return 0;
    const tokens=nq.split(/\s+/).filter(Boolean);
    const title=norm(`${r.div} ${r.topic} ${r.q}`);
    const body=norm(`${r.text} ${r.keys} ${r.source}`);
    let score=0;
    if(title.includes(nq)) score+=20;
    if(body.includes(nq)) score+=12;
    tokens.forEach(t=>{
      if(title.includes(t)) score+=4;
      else if(body.includes(t)) score+=2;
    });
    if(/pitch/.test(nq)&&/pitch/.test(title+body))score+=3;
    if(/inning/.test(nq)&&/inning/.test(title+body))score+=3;
    return score;
  }
  function sourceLink(source){
    if(source===USATX_SOURCE) return typeof USATX_JO!=='undefined'?USATX_JO:'https://usasoftballoftexas.com/pages/cms/jo-rules';
    return typeof RULEBOOK!=='undefined'?RULEBOOK:'#';
  }
  function resultCard(r){
    const label=r.div==='all'?'All Divisions':(divLabel[r.div]||r.div.toUpperCase());
    return `<article class="rule-card official-result"><div class="rule-topic">${esc(label)} • ${esc(r.topic)}</div><div class="rule-question">${esc(r.q)}</div><div class="rule-answer">${esc(r.text)}</div><div class="source-row"><span class="pill">${esc(r.source)}</span><a class="source-link" href="${sourceLink(r.source)}" target="_blank" rel="noopener">Open official source</a></div></article>`;
  }
  function renderResults(q,division='all',source='all'){
    let rules=allRules();
    if(division!=='all') rules=rules.filter(r=>r.div===division||r.div==='all');
    if(source==='smgsl') rules=rules.filter(r=>r.source!==USATX_SOURCE);
    if(source==='usatx') rules=rules.filter(r=>r.source===USATX_SOURCE);
    const scored=rules.map(r=>({r,score:scoreRule(r,q)})).filter(x=>x.score>0).sort((a,b)=>b.score-a.score).slice(0,25);
    return scored.length?scored.map(x=>resultCard(x.r)).join(''):`<div class="empty">No match found. Try fewer words, a division, or a rule topic such as pitcher, inning, stealing, walks, runs, batting, substitute, or field dimensions.</div>`;
  }

  views.rulelookup={title:'Official Rule Search',html:`
    <div class="notice"><b>Search the official rule summaries by question.</b> Results show the division and source. SMGSL local rules control SMGSL league play where they specifically differ from USA Softball rules.</div>
    <div class="official-search-box">
      <input id="officialRuleQuery" class="rule-search" placeholder="Ask: how many innings can a 10U pitcher pitch?" autocomplete="off">
      <div class="rule-filters">
        <select id="officialRuleDivision"><option value="all">All divisions</option><option value="blast">Blast Ball</option><option value="6u">6U</option><option value="8u">8U</option><option value="10u">10U</option><option value="12u">12U</option><option value="mx">MX</option></select>
        <select id="officialRuleSource"><option value="all">All official sources</option><option value="smgsl">SMGSL</option><option value="usatx">USA Softball of Texas</option></select>
      </div>
      <div class="quick-rule-examples"><button type="button" data-ruleq="pitcher innings">Pitcher innings</button><button type="button" data-ruleq="stealing">Stealing</button><button type="button" data-ruleq="game time">Game time</button><button type="button" data-ruleq="run limit">Run limit</button><button type="button" data-ruleq="dropped third strike">Dropped 3rd strike</button><button type="button" data-ruleq="pickup players">Pickup players</button></div>
      <div id="officialRuleResults" class="rule-search-results"><div class="empty">Type a question above or tap a common rule.</div></div>
    </div>`};

  const oldBind=bind;
  bind=function(){
    oldBind();
    if(current!=='rulelookup')return;
    const q=document.querySelector('#officialRuleQuery'),d=document.querySelector('#officialRuleDivision'),s=document.querySelector('#officialRuleSource'),out=document.querySelector('#officialRuleResults');
    const run=()=>{const val=q.value.trim();out.innerHTML=val?renderResults(val,d.value,s.value):'<div class="empty">Type a question above or tap a common rule.</div>';};
    q.addEventListener('input',run);d.addEventListener('change',run);s.addEventListener('change',run);
    document.querySelectorAll('[data-ruleq]').forEach(b=>b.addEventListener('click',()=>{q.value=b.dataset.ruleq;run();q.focus();}));
  };

  // Make the main Rules button open the search-first view.
  const rulesBtn=document.querySelector('[data-view="rules"]');
  if(rulesBtn){rulesBtn.textContent='Official Rule Search';rulesBtn.onclick=()=>render('rulelookup');}
})();
