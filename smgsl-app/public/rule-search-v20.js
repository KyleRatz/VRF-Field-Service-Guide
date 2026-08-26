// Strict, division-aware quick rule search for the SMGSL Board Hub.
// Loaded after legacy rule-search layers so it can safely replace their UI bindings.
(function(){
  const DIVS=[['6u','6U'],['8u','8U'],['10u','10U'],['12u','12U'],['mx','MX']];
  const DIV_IDS=DIVS.map(([id])=>id);
  const LABELS=Object.fromEntries(DIVS);
  const SMGSL='SMGSL Rules';
  const USATX=typeof USATX_SOURCE!=='undefined'?USATX_SOURCE:'USA Softball of Texas/New Mexico';
  const STOP=new Set(['a','an','and','are','as','at','be','by','can','do','does','for','from','how','if','in','is','it','may','of','on','or','the','to','what','when','where','who','with']);
  const ALIAS_GROUPS=[
    ['playing time',['playtime','playing time','minimum play','minimum playing time','sit out','sitting out','bench time','bench','defensive innings','participation']],
    ['interference',['interfere','runner interference','batter interference','batter runner interference']],
    ['obstruction',['blocked base','blocking base','block base','blocked plate','blocking plate','block plate','catcher blocking','fielder in way','fielder in the way']],
    ['look back',['lookback','look-back','look back','circle rule','pitcher circle runner']],
    ['dropped third strike',['dropped 3rd','dropped third','uncaught 3rd strike','uncaught third strike']],
    ['infield fly',['infieldfly','fly rule']],
    ['illegal pitch',['illegal pitching','pitch violation']],
    ['leaving early',['left early','leave early','leaving early','lead off','leadoff','runner left base']],
    ['steal',['stealing','stolen base']],
    ['hit by pitch',['hbp','hit batter','batter hit']],
    ['foul tip',['foul-tip','tip caught']],
    ['appeal',['appeal play','missed base']],
    ['bunt',['bunting','shows bunt']],
    ['slap',['slapping','slap hit']],
    ['substitute runner',['courtesy runner','runner for catcher','runner for pitcher']],
    ['substitute',['substitution','reentry','re-entry']],
    ['pitcher inning',['pitcher innings','pitching limit','innings limit','inning limit','pitcher limit']],
    ['run limit',['runs per inning','run per inning','five runs','5 runs']],
    ['game time',['time limit','no new inning','game length']],
    ['walk',['walks','four balls','4 balls']],
    ['overthrow',['overthrows','thrown out of play']],
    ['dead ball',['ball dead','dead-ball']],
    ['force play',['force out','forced runner']],
    ['batting order',['bat out of order','batting out of order','wrong batter']],
    ['pickup player',['pickup players','pick up player','pick up players']],
    ['field dimensions',['base distance','base distances','pitching distance','rubber distance','pitching rubber']]
  ];

  function esc(v){return String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));}
  function norm(v){
    return String(v||'').toLowerCase()
      .replace(/10\s*&?\s*under|10u/g,'10u')
      .replace(/12\s*&?\s*under|12u/g,'12u')
      .replace(/8\s*&?\s*under|8u/g,'8u')
      .replace(/6\s*&?\s*under|6u/g,'6u')
      .replace(/mixed division|mixed/g,'mx')
      .replace(/3rd/g,'third')
      .replace(/innings?/g,'inning')
      .replace(/pitchers?/g,'pitcher')
      .replace(/pitching/g,'pitch')
      .replace(/stealing/g,'steal')
      .replace(/walks/g,'walk')
      .replace(/runs/g,'run')
      .replace(/players/g,'player')
      .replace(/[^a-z0-9#]+/g,' ')
      .trim();
  }
  function canonicalQuery(q){
    const raw=norm(q);
    if(!raw)return '';
    let expanded=raw;
    for(const [canon,terms] of ALIAS_GROUPS){
      const all=[canon,...terms].map(norm);
      if(all.some(term=>term&&(` ${raw} `).includes(` ${term} `))) expanded+=` ${norm(canon)}`;
    }
    return [...new Set(expanded.split(/\s+/).filter(Boolean))].join(' ');
  }
  function queryTokens(q){return canonicalQuery(q).split(/\s+/).filter(t=>t.length>1&&!STOP.has(t));}

  function collect(){
    const out=[];
    if(typeof divisionRules!=='undefined'){
      Object.entries(divisionRules).forEach(([div,arr])=>(arr||[]).forEach((r,i)=>out.push({
        div,topic:r.topic||'Rule',q:r.q||'',text:r.text||'',keys:r.keys||'',href:r.href||'',source:r.source||SMGSL,index:i
      })));
    }
    if(typeof usaTxBase!=='undefined'&&Array.isArray(usaTxBase.rules)){
      usaTxBase.rules.forEach((r,i)=>out.push({div:'all',topic:r.topic||'Rule',q:r.q||'',text:r.text||'',keys:r.keys||'',href:r.href||'',source:USATX,index:i}));
    }
    if(typeof usaTxByDivision!=='undefined'){
      Object.entries(usaTxByDivision).forEach(([div,arr])=>(arr||[]).forEach((r,i)=>out.push({div,topic:r.topic||'Rule',q:r.q||'',text:r.text||'',keys:r.keys||'',href:r.href||'',source:r.source||USATX,index:i})));
    }
    const seen=new Set();
    return out.filter(r=>{
      const key=[r.div,r.source,norm(r.topic),norm(r.q),norm(r.text)].join('|');
      if(seen.has(key))return false;
      seen.add(key);return true;
    });
  }

  function applicable(division='all',source='all'){
    let rows=collect();
    if(division!=='all') rows=rows.filter(r=>r.div===division||r.div==='all');
    if(source==='smgsl') rows=rows.filter(r=>r.source===SMGSL);
    if(source==='usatx') rows=rows.filter(r=>r.source===USATX);
    return rows;
  }
  function score(r,q){
    const raw=norm(q), toks=queryTokens(q);
    if(!raw||!toks.length)return 1;
    const topic=norm(r.topic), question=norm(r.q), keys=norm(r.keys), text=norm(r.text);
    const hay=[topic,question,keys,text].join(' ');
    const hayTokens=new Set(hay.split(/\s+/).filter(Boolean));
    // Strict relevance gate: every meaningful search token must occur as a full token.
    // This prevents a single generic word or partial substring from surfacing unrelated rules.
    if(!toks.every(t=>hayTokens.has(t)))return 0;
    let s=0;
    if(topic===raw)s+=220;
    if(question===raw)s+=190;
    if(topic.includes(raw))s+=110;
    if(question.includes(raw))s+=90;
    if(keys.includes(raw))s+=70;
    toks.forEach(t=>{
      if(topic.split(' ').includes(t))s+=34;
      if(question.split(' ').includes(t))s+=26;
      if(keys.split(' ').includes(t))s+=20;
      if(text.split(' ').includes(t))s+=8;
    });
    if(r.source===SMGSL)s+=8;
    return s||1;
  }
  function searchRules(q,division='all',source='all'){
    const rows=applicable(division,source);
    if(!String(q||'').trim()){
      return rows.sort((a,b)=>(a.source===SMGSL?0:1)-(b.source===SMGSL?0:1)||String(a.topic).localeCompare(String(b.topic)));
    }
    return rows.map(r=>({r,s:score(r,q)})).filter(x=>x.s>0)
      .sort((a,b)=>b.s-a.s||(a.r.source===SMGSL?-1:1)||String(a.r.topic).localeCompare(String(b.r.topic)))
      .map(x=>x.r);
  }
  function sourceLink(r){
    if(r.href)return r.href;
    if(r.source===USATX){
      if(typeof USA_RULEBOOK!=='undefined')return USA_RULEBOOK;
      if(typeof USATX_JO!=='undefined')return USATX_JO;
      return '#';
    }
    return typeof RULEBOOK!=='undefined'?RULEBOOK:'#';
  }
  function card(r,selectedDiv='all'){
    const label=r.div==='all'?(selectedDiv!=='all'?`${LABELS[selectedDiv]||selectedDiv.toUpperCase()} • Applies generally`:'All Divisions'):(LABELS[r.div]||String(r.div).toUpperCase());
    return `<article class="rule-card official-result"><div class="rule-topic">${esc(label)} • ${esc(r.topic)}</div><div class="rule-question">${esc(r.q)}</div><div class="rule-answer">${esc(r.text)}</div><div class="source-row"><span class="pill">${esc(r.source)}</span><a class="source-link" href="${esc(sourceLink(r))}" target="_blank" rel="noopener">Open official source</a></div></article>`;
  }
  function noMatch(q,div){
    const label=div==='all'?'selected divisions':(LABELS[div]||div.toUpperCase());
    return `<div class="empty"><b>No matching ${esc(label)} rule found for “${esc(q)}”.</b><br>No unrelated rules are shown. Try a shorter rule term or open the official rulebook.</div>`;
  }
  function renderRows(out,q,div,source,limit=40){
    const rows=searchRules(q,div,source);
    out.innerHTML=rows.length?rows.slice(0,limit).map(r=>card(r,div)).join(''):noMatch(q,div);
  }

  function quickView(){
    if(typeof views==='undefined')return;
    views.rulelookup={title:'Fast Rule Lookup',html:`
      <div class="notice"><b>Division-aware search:</b> choose a division and only rules that apply to that division are shown. SMGSL local rules control where adopted; USA Softball TX/NM rules apply where SMGSL is silent.</div>
      <div class="official-search-box">
        <div class="rule-filters"><select id="v20RuleDivision"><option value="all">Choose division / All divisions</option>${DIVS.map(([d,l])=>`<option value="${d}">${l}</option>`).join('')}</select><select id="v20RuleSource"><option value="all">Both approved sources</option><option value="smgsl">SMGSL Rules</option><option value="usatx">USA Softball TX/NM</option></select></div>
        <input id="v20RuleQuery" class="rule-search" inputmode="search" enterkeyhint="search" placeholder="Rule or call: playtime, obstruction, look back…" autocomplete="off" autocorrect="off" spellcheck="false">
        <div class="quick-rule-examples"><button type="button" data-v20-rule="Playing time">Playing time</button><button type="button" data-v20-rule="Interference">Interference</button><button type="button" data-v20-rule="Obstruction">Obstruction</button><button type="button" data-v20-rule="Look Back">Look Back</button><button type="button" data-v20-rule="Dropped 3rd">Dropped 3rd</button><button type="button" data-v20-rule="Pitcher innings">Pitcher innings</button><button type="button" data-v20-rule="Stealing">Stealing</button><button type="button" data-v20-rule="Game time">Game time</button></div>
        <div id="v20RuleResults" class="rule-search-results"><div class="empty">Choose a division to immediately load its applicable rules, or type a rule/call to search all divisions.</div></div>
      </div>`};
  }
  function divisionView(div,label){
    if(typeof views==='undefined')return;
    views[div]={title:`${label} Division Rules`,html:`
      <div class="notice"><b>${label} is locked as the division filter.</b> Quick search will only return ${label} rules plus USA Softball rules that apply generally. Unrelated division rules are excluded.</div>
      <div class="rule-search-wrap v20-division-search">
        <input id="v20DivQuery-${div}" class="rule-search" data-v20-div="${div}" inputmode="search" enterkeyhint="search" placeholder="Search ${label}: playtime, pitching, stealing, obstruction…" autocomplete="off" autocorrect="off" spellcheck="false">
        <div id="v20DivResults-${div}" class="rule-search-results"></div>
      </div>
      <div class="small v20-search-note">Showing applicable ${label} rules. Start typing to narrow the list; no unrelated results are substituted.</div>`};
  }
  quickView();
  DIVS.forEach(([div,label])=>divisionView(div,label));

  function bindQuick(){
    const q=document.querySelector('#v20RuleQuery'),d=document.querySelector('#v20RuleDivision'),s=document.querySelector('#v20RuleSource'),out=document.querySelector('#v20RuleResults');
    if(!q||!d||!s||!out)return;
    const run=()=>{
      const val=q.value.trim();
      if(!val&&d.value==='all'){
        out.innerHTML='<div class="empty">Choose a division to immediately load its applicable rules, or type a rule/call to search all divisions.</div>';
        return;
      }
      renderRows(out,val,d.value,s.value,50);
    };
    q.addEventListener('input',run,{passive:true});d.addEventListener('change',run);s.addEventListener('change',run);
    document.querySelectorAll('[data-v20-rule]').forEach(b=>b.addEventListener('click',()=>{q.value=b.dataset.v20Rule;run();q.focus();}));
    run();
  }
  function bindDivision(div){
    const q=document.querySelector(`#v20DivQuery-${div}`),out=document.querySelector(`#v20DivResults-${div}`);
    if(!q||!out)return;
    const run=()=>renderRows(out,q.value.trim(),div,'all',50);
    q.addEventListener('input',run,{passive:true});
    run();
  }

  if(typeof bind==='function'){
    const previousBind=bind;
    bind=function(){
      previousBind();
      if(typeof current==='undefined')return;
      if(current==='rulelookup')bindQuick();
      else if(DIV_IDS.includes(current))bindDivision(current);
    };
  }
  const rulesBtn=document.querySelector('[data-view="rules"]');
  if(rulesBtn){rulesBtn.textContent='Fast Rule Lookup';rulesBtn.onclick=()=>render('rulelookup');}
  window.SMGSLRuleSearchV20={collect,search:searchRules,norm};
})();
