// v22: exact-page links into the official SMGSL PDF for fast in-game verification.
(function(){
  const DIVS=[['6u','6U'],['8u','8U'],['10u','10U'],['12u','12U'],['mx','MX']];
  const IDS=DIVS.map(([d])=>d), LABELS=Object.fromEntries(DIVS);
  const SMGSL='SMGSL Rules';
  const USATX=typeof USATX_SOURCE!=='undefined'?USATX_SOURCE:'USA Softball of Texas/New Mexico';
  const PDF=typeof RULEBOOK!=='undefined'?RULEBOOK:'https://dt5602vnjxv0c.cloudfront.net/portals/3766/docs/south%20montgomery%20girls%20softball%20league%20rules%20updated%20fall%202025.pdf';

  // pdfPage is the physical PDF page used by #page=. printedPage is the page number printed in the rulebook.
  const GENERAL={
    'Team Activity Limit — Spring / General Rule':{pdfPage:17,printedPage:11,ref:'Article V, Section 3.B'},
    'Team Activity Limit — Fall':{pdfPage:32,printedPage:26,ref:'Article XIV — adaptation of Article V, Section 3.B'},
    'Minimum Playing Time':{pdfPage:12,printedPage:6,ref:'Article II, Section 9'},
    'Minimum Playing Time — Corrective Requirement':{pdfPage:12,printedPage:6,ref:'Article II, Section 9'},
    'Free Substitution / Batting':{pdfPage:13,printedPage:7,ref:'Article II, Section 10'},
    'Bench Time':{pdfPage:20,printedPage:14,ref:'Article VI, Section 13'}
  };
  const PAGES={
    '6u':{
      'Field':[21,15,'Article VII, Section 1'],'Pitching':[21,15,'Article VII, Section 2'],'Pitcher / 1B limit':[21,15,'Article VII, Section 2'],
      'Hitting':[22,16,'Article VII, Section 3'],'Ball':[22,16,'Article VII, Section 3'],'Base running':[22,16,'Article VII, Section 4'],
      'Defense':[23,17,'Article VII, Sections 5–6'],'Runs':[23,17,'Article VII, Section 7'],'Time':[23,17,'Article VII, Section 9'],
      'Infield fly':[23,17,'Article VII, Section 6'],'Overthrows':[24,18,'Article VII, Section 11']
    },
    '8u':{
      'Field':[24,18,'Article IX, Section 1'],'Pitching':[24,18,'Article IX, Section 2'],'Pitching limit':[24,18,'Article IX, Section 2'],
      'Walks / coach pitch':[24,18,'Article IX, Section 2'],'Dropped third strike':[26,20,'Article IX, Section 3'],'Bunting':[26,20,'Article IX, Section 3'],
      'Stealing':[26,20,'Article IX, Section 4'],'Defense':[26,20,'Article IX, Section 5'],'Runs':[26,20,'Article IX, Section 6'],
      'Time':[27,21,'Article IX, Section 8'],'Overthrows':[27,21,'Article IX, Section 10'],'Pickup players':[27,21,'Article IX, Section 11'],
      'Substitute runner':[27,21,'Article IX, Section 12']
    },
    '10u':{
      'Field':[27,21,'Article X, Section 1'],'Pitching limit':[27,21,'Article X, Section 2'],'Walks / coach pitch':[27,21,'Article X, Section 2'],
      'Dropped third strike':[28,22,'Article X, Section 3'],'Bunting':[28,22,'Article X, Section 3'],'Stealing':[29,23,'Article X, Section 4'],
      'Defense':[29,23,'Article X, Section 5'],'Runs':[29,23,'Article X, Section 6'],'Time':[29,23,'Article X, Section 8'],
      'Pickup players':[29,23,'Article X, Section 9'],'Substitute runner':[29,23,'Article X, Section 10']
    },
    '12u':{
      'Field':[30,24,'Article XI, Section 1'],'Pitching limit':[30,24,'Article XI, Section 2'],'Runs':[30,24,'Article XI, Section 3'],
      'Time':[30,24,'Article XI, Section 4'],'Defense':[30,24,'Article XI, Section 5'],'Pickup players':[30,24,'Article XI, Section 6'],
      'Substitute runner':[30,24,'Article XI, Section 7'],'Stealing / infield fly / dropped third':[30,24,'Article XI']
    },
    'mx':{
      'Field':[30,24,'Article XII, Section 1'],'Pitching limit':[30,24,'Article XII, Section 2'],'Players':[31,25,'Article XII, Section 3'],
      'Pickup players':[31,25,'Article XII, Section 4'],'Runs':[31,25,'Article XII, Section 4'],'Time':[31,25,'Article XII, Section 5'],
      'Substitute runner':[31,25,'Article XII, Section 6'],'Stealing / infield fly / dropped third':[31,25,'Article XII']
    }
  };
  function esc(v){return String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));}
  function meta(r){
    if(r.source!==SMGSL)return null;
    if(r.div==='all'&&GENERAL[r.topic])return GENERAL[r.topic];
    const x=PAGES[r.div]?.[r.topic];
    return x?{pdfPage:x[0],printedPage:x[1],ref:x[2]}:null;
  }
  function href(r){
    const m=meta(r);
    if(m)return `${PDF}#page=${m.pdfPage}`;
    if(r.href)return r.href;
    if(r.source===USATX)return typeof USA_RULEBOOK!=='undefined'?USA_RULEBOOK:(typeof USATX_JO!=='undefined'?USATX_JO:'#');
    return PDF;
  }
  function card(r,div){
    const label=r.div==='all'?`${LABELS[div]} • Applies to all SMGSL divisions`:(LABELS[r.div]||String(r.div||'').toUpperCase());
    const m=meta(r);
    const page=m?`<div class="small" style="margin-top:.5rem"><b>${esc(m.ref)}</b> • Rulebook page ${m.printedPage}</div>`:'';
    const linkText=m?`Open exact rule — page ${m.printedPage}`:'Open official source';
    return `<article class="rule-card official-result"><div class="rule-topic">${esc(label)} • ${esc(r.topic)}</div><div class="rule-question">${esc(r.q)}</div><div class="rule-answer">${esc(r.text)}</div>${page}<div class="source-row"><span class="pill">${esc(r.source)}</span><a class="source-link" href="${esc(href(r))}" target="_blank" rel="noopener">${esc(linkText)}</a></div></article>`;
  }
  function renderDiv(div){
    if(typeof views==='undefined'||!window.SMGSLRuleSearchV21)return;
    const label=LABELS[div];
    views[div]={title:`${label} Division Rules`,html:`<div class="notice"><b>${label} is locked as the division filter.</b> Search includes ${label}-specific rules plus league-wide SMGSL rules and applicable USA Softball rules. <b>SMGSL links now jump directly to the page where the rule is written.</b></div><div class="rule-search-wrap"><input id="v22-${div}" class="rule-search" inputmode="search" enterkeyhint="search" placeholder="Search ${label}: playtime, bench time, pitching, stealing…" autocomplete="off" autocorrect="off" spellcheck="false"><div id="v22-out-${div}" class="rule-search-results"></div></div><div class="small v20-search-note">Tap “Open exact rule” to show the official rulebook at the cited page.</div>`};
  }
  DIVS.forEach(([d])=>renderDiv(d));
  function bindDiv(div){
    const q=document.querySelector(`#v22-${div}`),out=document.querySelector(`#v22-out-${div}`);
    if(!q||!out||!window.SMGSLRuleSearchV21)return;
    const run=()=>{
      const val=q.value.trim(),found=window.SMGSLRuleSearchV21.search(val,div);
      out.innerHTML=found.length?found.slice(0,60).map(r=>card(r,div)).join(''):`<div class="empty"><b>No matching ${LABELS[div]} rule found for “${esc(val)}”.</b><br>No unrelated division rules are substituted.</div>`;
    };
    q.addEventListener('input',run,{passive:true});run();
  }
  if(typeof bind==='function'){
    const previous=bind;
    bind=function(){previous();if(typeof current!=='undefined'&&IDS.includes(current))bindDiv(current);};
  }
  window.SMGSLRulePageLinksV22={meta,href};
})();
