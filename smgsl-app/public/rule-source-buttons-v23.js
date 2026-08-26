// v23: large in-game source buttons and division-specific USA Softball references.
(function(){
  const DIVS=[['6u','6U'],['8u','8U'],['10u','10U'],['12u','12U'],['mx','MX']];
  const IDS=DIVS.map(([d])=>d), LABELS=Object.fromEntries(DIVS);
  const SMGSL='SMGSL Rules';
  const USATX=typeof USATX_SOURCE!=='undefined'?USATX_SOURCE:'USA Softball of Texas/New Mexico';
  const USA2026='https://www.usasoftball.com/wp-content/uploads/sites/120/2026/01/1-12-2026-Rule-Book.pdf';
  const TXJO=typeof USATX_JO!=='undefined'?USATX_JO:'https://usasoftballoftexas.com/pages/cms/jo-rules';

  // USA Softball national playing rules are generally age-independent unless a JO/local-association exception applies.
  // Texas JO currently publishes division-specific exceptions/documents in addition to the national rulebook.
  const USA_META={
    'Obstruction':{ref:'USA Softball Rule 8, Section 5.B',pdfPage:83,label:'Obstruction by a fielder'},
    'Look Back':{ref:'USA Softball Rule 8, Section 7.T',pdfPage:91,label:'Look Back Rule'},
    'Dropped third strike':{ref:'USA Softball Rule 8, Sections 1.B / 2',pdfPage:76,label:'Dropped third strike'},
    'Leaving early':{ref:'USA Softball Rule 8, Section 7.S',pdfPage:91,label:'Runner leaving base too soon'},
    'Interference':{ref:'USA Softball Rule 8',pdfPage:76,label:'Interference'},
    'Infield fly':{ref:'USA Softball Rule 1 — Infield Fly definition',pdfPage:23,label:'Infield Fly'},
    'Illegal pitch':{ref:'USA Softball Rule 6A',pdfPage:57,label:'Fast Pitch pitching regulations'}
  };
  // Known Texas JO division routing. Exact Texas exception documents are selected by division when published.
  function texasDivisionNote(div){
    if(div==='6u'||div==='8u')return `${LABELS[div]} • Check current Texas JO younger-division/Pixie exceptions`;
    if(div==='10u'||div==='12u')return `${LABELS[div]} • Check current Texas JO 10U/12U exceptions`;
    if(div==='mx')return `${LABELS[div]} • Use the age-appropriate Texas JO 14U/16U/18U classification`;
    return 'Texas JO exceptions';
  }
  function esc(v){return String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));}
  function usaMeta(r){
    if(r.source!==USATX)return null;
    const topic=String(r.topic||'').toLowerCase();
    for(const [name,m] of Object.entries(USA_META)){
      if(topic.includes(name.toLowerCase()))return m;
    }
    const text=String(r.text||'');
    const match=text.match(/USA Softball Rule\s*(\d+)(?:,?\s*Section\s*([0-9A-Z.\-\[\] ]+))?/i);
    return match?{ref:`USA Softball Rule ${match[1]}${match[2]?`, Section ${match[2].trim()}`:''}`,pdfPage:null,label:r.topic||'USA Softball rule'}:null;
  }
  function usaHref(r){const m=usaMeta(r);return m&&m.pdfPage?`${USA2026}#page=${m.pdfPage}`:(r.href||USA2026);}
  function smgslMeta(r){return window.SMGSLRulePageLinksV22&&typeof window.SMGSLRulePageLinksV22.meta==='function'?window.SMGSLRulePageLinksV22.meta(r):null;}
  function card(r,div){
    const label=r.div==='all'?`${LABELS[div]} • Applies generally`:(LABELS[r.div]||String(r.div||'').toUpperCase());
    const sm=smgslMeta(r), um=usaMeta(r);
    let refHtml='', href='#', button='SHOW OFFICIAL RULE';
    if(r.source===SMGSL){
      href=window.SMGSLRulePageLinksV22?.href?.(r)||r.href||'#';
      if(sm)refHtml=`<div class="rule-citation-fast"><b>${esc(sm.ref)}</b> • SMGSL rulebook page ${sm.printedPage}</div>`;
    } else {
      href=usaHref(r);
      if(um)refHtml=`<div class="rule-citation-fast"><b>${esc(um.ref)}</b> • ${esc(texasDivisionNote(div))}</div>`;
      else refHtml=`<div class="rule-citation-fast"><b>${esc(texasDivisionNote(div))}</b></div>`;
      button=um&&um.pdfPage?'SHOW USA OFFICIAL RULE':'SHOW TEXAS JO SOURCE';
    }
    return `<article class="rule-card official-result"><div class="rule-topic">${esc(label)} • ${esc(r.topic)}</div><div class="rule-question">${esc(r.q)}</div><div class="rule-answer">${esc(r.text)}</div>${refHtml}<a class="show-official-rule" href="${esc(href)}" target="_blank" rel="noopener">${button}</a>${r.source===USATX?`<a class="texas-jo-secondary" href="${esc(TXJO)}" target="_blank" rel="noopener">Texas JO ${esc(LABELS[div])} exceptions</a>`:''}</article>`;
  }
  function install(div){
    if(typeof views==='undefined'||!window.SMGSLRuleSearchV21)return;
    const label=LABELS[div];
    views[div]={title:`${label} Division Rules`,html:`<div class="notice"><b>${label} is locked as the division filter.</b> Results show only rules applicable to ${label}. SMGSL local rules control where adopted; otherwise the applicable USA Softball rule and Texas JO division exceptions are shown.</div><div class="rule-search-wrap"><input id="v23-${div}" class="rule-search" inputmode="search" enterkeyhint="search" placeholder="Search ${label}: playtime, obstruction, look back, dropped third…" autocomplete="off" autocorrect="off" spellcheck="false"><div id="v23-out-${div}" class="rule-search-results"></div></div><div class="small v20-search-note">Use the large button to show the official rule quickly during a game.</div>`};
  }
  DIVS.forEach(([d])=>install(d));
  function bindDiv(div){const q=document.querySelector(`#v23-${div}`),out=document.querySelector(`#v23-out-${div}`);if(!q||!out)return;const run=()=>{const val=q.value.trim(),found=window.SMGSLRuleSearchV21.search(val,div);out.innerHTML=found.length?found.slice(0,60).map(r=>card(r,div)).join(''):`<div class="empty"><b>No matching ${LABELS[div]} rule found for “${esc(val)}”.</b><br>No unrelated division rules are substituted.</div>`;};q.addEventListener('input',run,{passive:true});run();}
  if(typeof bind==='function'){const prev=bind;bind=function(){prev();if(typeof current!=='undefined'&&IDS.includes(current))bindDiv(current);};}
  const style=document.createElement('style');style.textContent=`.show-official-rule{display:block;margin-top:14px;padding:15px 14px;border-radius:14px;text-align:center;font-weight:900;letter-spacing:.04em;text-decoration:none;background:#78bbff;color:#07182a;font-size:1rem}.texas-jo-secondary{display:block;margin-top:10px;text-align:center;font-weight:700}.rule-citation-fast{margin-top:10px;font-size:.93rem;line-height:1.35;color:#b9cee3}`;document.head.appendChild(style);
})();
