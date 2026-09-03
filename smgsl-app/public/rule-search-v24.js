// v24: complete, division-aware keyword search across both official PDF rulebooks.
(function(){
  const DIVS=[['6u','6U'],['8u','8U'],['10u','10U'],['12u','12U'],['mx','MX']];
  const IDS=DIVS.map(([id])=>id),LABELS=Object.fromEntries(DIVS);
  const rows=Array.isArray(window.SMGSLFullRulebookIndex)?window.SMGSLFullRulebookIndex:[];
  const STOP=new Set(['a','an','and','are','as','at','be','by','can','do','does','for','from','how','if','in','is','it','may','of','on','or','the','to','what','when','where','who','with']);
  const ALIASES={
    hbp:'hit by pitch','hit batter':'hit by pitch','batter hit':'hit by pitch','batter struck':'hit by pitch',
    lookback:'look back','look-back':'look back','circle rule':'look back',
    'dropped 3rd':'dropped third strike','uncaught third':'dropped third strike','uncaught 3rd':'dropped third strike',
    'blocking plate':'obstruction','blocked plate':'obstruction','blocking base':'obstruction','fielder in way':'obstruction',
    'pitching limit':'pitcher innings','pitcher limit':'pitcher innings','innings limit':'pitcher innings',
    'time limit':'game time','game length':'game time','no new inning':'game time',
    'runs per inning':'run limit','five runs':'run limit','5 runs':'run limit',
    'courtesy runner':'substitute runner','runner for catcher':'substitute runner','runner for pitcher':'substitute runner',
    'lead off':'leaving early',leadoff:'leaving early','left early':'leaving early',
    'weekly activities':'team activities per week','weekly activity':'team activity per week',
    'activities per week':'team activities per week','activity per week':'team activity per week',
    'weekly events':'team activities per week','events per week':'team activities per week'
  };
  function esc(value){return String(value??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));}
  function norm(value){return String(value||'').toLowerCase().replace(/10\s*&?\s*under|10u/g,'10u').replace(/12\s*&?\s*under|12u/g,'12u').replace(/8\s*&?\s*under|8u/g,'8u').replace(/6\s*&?\s*under|6u/g,'6u').replace(/mixed division|mixed/g,'mx').replace(/3rd/g,'third').replace(/innings?/g,'inning').replace(/pitchers?/g,'pitcher').replace(/activities?/g,'activity').replace(/events?/g,'event').replace(/weekly/g,'week').replace(/practices?/g,'practice').replace(/games?/g,'game').replace(/pitched|pitching/g,'pitch').replace(/stealing/g,'steal').replace(/walks/g,'walk').replace(/runs/g,'run').replace(/[^a-z0-9]+/g,' ').trim();}
  function expanded(query){
    let raw=String(query||'').toLowerCase().trim();
    for(const [alias,canonical] of Object.entries(ALIASES)){
      if(raw===alias)return norm(canonical);
      if(raw.includes(alias))raw=raw.replace(alias,canonical);
    }
    return norm(raw);
  }
  function tokens(query){return [...new Set(expanded(query).split(/\s+/).filter(t=>(t.length>1||/^\d+$/.test(t))&&!STOP.has(t)))];}
  const indexed=rows.map(r=>({...r,hay:norm(r.text)}));
  const PREFERRED_USA_PAGES={'hit by pitch':91,'look back':104,obstruction:96,'dropped third strike':89,'leaving early':104,'illegal pitch':63,interference:102};
  function preferredPage(query){const canonical=expanded(query);for(const [term,page] of Object.entries(PREFERRED_USA_PAGES))if(canonical.includes(norm(term)))return page;return 0;}
  function preferredSMGSLPage(query){const canonical=expanded(query),toks=tokens(query);if(toks.includes('activity')||toks.includes('event'))return toks.includes('fall')||toks.includes('3')?32:17;return 0;}
  function scorePage(row,query,division,source){
    if(!row.divisions.includes(division)||source!=='all'&&row.source!==source)return 0;
    const raw=expanded(query),toks=tokens(query);if(!raw||!toks.length)return 0;
    const words=new Set(row.hay.split(/\s+/)),preferred=row.source==='USA Softball 2026'&&row.page===preferredPage(query)||row.source==='SMGSL Rules'&&row.page===preferredSMGSLPage(query);
    if(!preferred&&!toks.every(t=>words.has(t)))return 0;
    const matched=toks.filter(t=>words.has(t)).length;
    let score=matched*35;if(row.hay.includes(raw))score+=180;if(row.source==='SMGSL Rules')score+=25;if(/\brule\s+\d+/.test(row.hay))score+=8;
    if(preferred)score+=500;
    return score;
  }
  function excerpt(row,query){
    const plain=String(row.text||''),lower=plain.toLowerCase(),raw=String(query||'').toLowerCase().trim();let at=raw?lower.indexOf(raw):-1;
    if(at<0&&tokens(query).includes('activity')){for(const phrase of ['team activities per week','limitation on softball activities','weekly event limit','activities per week']){at=lower.indexOf(phrase);if(at>=0)break;}}
    if(at<0){for(const token of tokens(query)){at=lower.indexOf(token);if(at>=0)break;}}if(at<0)at=0;
    const start=Math.max(0,at-170),end=Math.min(plain.length,at+360);return `${start?'…':''}${plain.slice(start,end).trim()}${end<plain.length?'…':''}`;
  }
  function sourceKey(value){return value==='smgsl'?'SMGSL Rules':value==='usa'?'USA Softball 2026':'all';}
  function pageMatches(query,division,source='all'){
    const selected=sourceKey(source);
    return indexed.map(r=>({r,score:scorePage(r,query,division,selected)})).filter(x=>x.score>0).sort((a,b)=>b.score-a.score||a.r.page-b.r.page).slice(0,18).map(x=>x.r);
  }
  function quickMatches(query,division,source='all'){
    if(!window.SMGSLRuleSearchV21||typeof window.SMGSLRuleSearchV21.search!=='function')return [];
    const wanted=sourceKey(source);
    return window.SMGSLRuleSearchV21.search(query,division).filter(r=>wanted==='all'||(wanted==='SMGSL Rules'?r.source==='SMGSL Rules':r.source!=='SMGSL Rules')).slice(0,6);
  }
  function quickCard(r){
    const href=r.href||(r.source==='SMGSL Rules'?(typeof RULEBOOK!=='undefined'?RULEBOOK:'#'):(typeof USA_RULEBOOK!=='undefined'?USA_RULEBOOK:'#'));
    return `<article class="rule-card official-result v24-best"><div class="rule-topic">Best rule match • ${esc(r.topic)}</div><div class="rule-question">${esc(r.q)}</div><div class="rule-answer">${esc(r.text)}</div><div class="source-row"><span class="pill">${esc(r.source)}</span></div><a class="show-official-rule" href="${esc(href)}" target="_blank" rel="noopener">SHOW OFFICIAL RULE</a></article>`;
  }
  function pageCard(r,query){
    let label=r.source==='SMGSL Rules'?'SMGSL official rulebook':'USA Softball 2026 official rulebook';
    if(r.source==='SMGSL Rules'&&r.page===17)label='SMGSL Article V, Section 3.B • printed page 11';
    if(r.source==='SMGSL Rules'&&r.page===32)label='SMGSL Article XIV • printed page 26';
    return `<article class="rule-card official-result v24-page"><div class="rule-topic">${esc(label)} • PDF page ${r.page}</div><div class="rule-answer">${esc(excerpt(r,query))}</div><a class="show-official-rule" href="${esc(r.url)}" target="_blank" rel="noopener">OPEN EXACT PAGE</a></article>`;
  }
  function renderResults(out,query,division,source){
    const value=String(query||'').trim();if(!value){out.innerHTML='<div class="empty">Type a rule, call, phrase, or keyword. Search checks every page of both official rulebooks.</div>';return;}
    const quick=quickMatches(value,division,source),pages=pageMatches(value,division,source);
    if(!quick.length&&!pages.length){out.innerHTML=`<div class="empty"><b>No relevant ${esc(LABELS[division])} rule found for “${esc(value)}”.</b><br>Try fewer words or a related term. The search accepts phrases, keywords, abbreviations, and common softball wording.</div>`;return;}
    out.innerHTML=`${quick.map(quickCard).join('')}${pages.length?`<div class="v24-result-heading">Official rulebook page matches</div>${pages.map(r=>pageCard(r,value)).join('')}`:''}`;
  }
  function install(division,label){
    if(typeof views==='undefined')return;
    views[division]={title:`${label} Division Rules`,html:`<div class="notice"><b>${label} is locked as the division filter.</b> Search checks every page and keyword in the SMGSL and USA Softball official rulebooks, while excluding SMGSL division pages that do not apply to ${label}.</div><div class="rule-search-wrap v24-search"><div class="rule-filters"><select id="v24-source-${division}" aria-label="Rule source"><option value="all">Both official rulebooks</option><option value="smgsl">SMGSL Rules</option><option value="usa">USA Softball 2026</option></select></div><input id="v24-query-${division}" class="rule-search" inputmode="search" enterkeyhint="search" placeholder="Search ${label}: HBP, obstruction, look back, pitching…" autocomplete="off" autocorrect="off" spellcheck="false"><div class="quick-rule-examples"><button type="button" data-v24-q="Hit by pitch">Hit by pitch</button><button type="button" data-v24-q="Obstruction">Obstruction</button><button type="button" data-v24-q="Look back">Look back</button><button type="button" data-v24-q="Interference">Interference</button><button type="button" data-v24-q="Pitcher innings">Pitcher innings</button><button type="button" data-v24-q="Stealing">Stealing</button></div><div id="v24-results-${division}" class="rule-search-results"><div class="empty">Type a rule, call, phrase, or keyword. Search checks every page of both official rulebooks.</div></div></div>`};
  }
  DIVS.forEach(([id,label])=>install(id,label));
  function bindDivision(division){
    const input=document.querySelector(`#v24-query-${division}`),source=document.querySelector(`#v24-source-${division}`),out=document.querySelector(`#v24-results-${division}`);if(!input||!source||!out)return;
    const run=()=>renderResults(out,input.value,division,source.value);input.addEventListener('input',run,{passive:true});source.addEventListener('change',run);
    document.querySelectorAll('[data-v24-q]').forEach(button=>button.addEventListener('click',()=>{input.value=button.dataset.v24Q;run();input.focus();}));
  }
  if(typeof bind==='function'){const previous=bind;bind=function(){previous();if(typeof current!=='undefined'&&IDS.includes(current))bindDivision(current);};}
  const style=document.createElement('style');style.textContent='.v24-result-heading{margin:1.1rem 0 .55rem;font-size:.9rem;font-weight:900;letter-spacing:.05em;text-transform:uppercase;color:#9fb6ce}.v24-best{border-color:#69b7ff}.v24-page .rule-answer{white-space:normal}.v24-search .rule-filters{margin-bottom:.65rem}';document.head.appendChild(style);
  window.SMGSLRuleSearchV24={pageMatches,tokens,norm};
})();
