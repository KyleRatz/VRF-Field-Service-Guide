/* Division rule cards: one-tap 6U/8U/10U/12U/MX rule hubs */
(function(){
  const DIVS=[['6u','6U'],['8u','8U'],['10u','10U'],['12u','12U'],['mx','MX']];
  const SMGSL='SMGSL Rules';
  const USATX=typeof USATX_SOURCE!=='undefined'?USATX_SOURCE:'USA Softball of Texas/New Mexico';
  function esc(v){return String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));}
  function ruleCard(r,source){return `<article class="rule-card"><div class="rule-topic">${esc(r.topic||'Rule')}</div><div class="rule-question">${esc(r.q||'')}</div><div class="rule-answer">${esc(r.text||'')}</div><div class="small">Source: ${esc(source)}</div></article>`;}
  function buildDivisionView(div,label){
    if(typeof views==='undefined'||typeof divisionRules==='undefined')return;
    const smgsl=(divisionRules[div]||[]).filter(r=>r.source!==USATX);
    const usaSpecific=(typeof usaTxByDivision!=='undefined'?(usaTxByDivision[div]||[]):[]);
    const usaBase=(typeof usaTxBase!=='undefined'&&Array.isArray(usaTxBase.rules)?usaTxBase.rules:[]);
    views[div]={title:`${label} Division Rules`,html:`
      <div class="notice"><b>${label} quick rule hub.</b> Search only this division. For SMGSL league play, SMGSL local rules control where adopted; USA Softball of Texas/New Mexico rules apply where SMGSL is silent.</div>
      <div class="rule-search-wrap"><input class="rule-search" data-div="${div}" placeholder="Search ${label}: interference, stealing, pitching, obstruction…"><div class="rule-search-results"></div></div>
      <details class="rule-source-group" open><summary>SMGSL ${label} Rules <span>${smgsl.length}</span></summary><div class="rule-source-list">${smgsl.map(r=>ruleCard(r,SMGSL)).join('')}</div></details>
      <details class="rule-source-group" open><summary>USA Softball of Texas/New Mexico <span>${usaSpecific.length+usaBase.length}</span></summary><div class="rule-source-list">${usaSpecific.map(r=>ruleCard(r,USATX)).join('')}${usaBase.map(r=>ruleCard(r,USATX)).join('')}</div></details>
      ${typeof RULEBOOK!=='undefined'?`<a class="doclink" href="${RULEBOOK}" target="_blank" rel="noopener">Open SMGSL Rulebook</a>`:''}
      ${typeof USA_RULEBOOK!=='undefined'?`<a class="doclink" href="${USA_RULEBOOK}" target="_blank" rel="noopener">Open USA Softball Official Rulebook</a>`:''}
      ${typeof USATX_JO!=='undefined'?`<a class="doclink" href="${USATX_JO}" target="_blank" rel="noopener">Open USA Softball TX/NM JO Rules</a>`:''}`};
  }
  DIVS.forEach(([div,label])=>buildDivisionView(div,label));

  const quick=document.querySelector('.hero .quick');
  if(quick&&!document.querySelector('.division-home-wrap')){
    const wrap=document.createElement('div');
    wrap.className='division-home-wrap';
    wrap.innerHTML=`<div class="division-home-title">Rules by Division</div><div class="division-home-grid">${DIVS.map(([div,label])=>`<button type="button" data-ruledivision="${div}"><strong>${label}</strong><span>SMGSL + USA TX/NM</span></button>`).join('')}</div>`;
    const more=quick.querySelector('.more-tools');
    if(more)quick.insertBefore(wrap,more);else quick.appendChild(wrap);
    wrap.querySelectorAll('[data-ruledivision]').forEach(b=>b.addEventListener('click',()=>{if(typeof render==='function')render(b.dataset.ruledivision);}));
  }

  const style=document.createElement('style');
  style.textContent=`.division-home-wrap{grid-column:1/-1;margin-top:2px}.division-home-title{font-weight:900;font-size:14px;letter-spacing:.02em;margin:5px 2px 8px;color:#d8e9f8}.division-home-grid{display:grid;grid-template-columns:repeat(5,minmax(0,1fr));gap:8px}.division-home-grid button{border:1px solid #315a7e;border-radius:14px;background:#102b46;color:#fff;padding:12px 8px;min-height:62px}.division-home-grid strong{display:block;font-size:18px}.division-home-grid span{display:block;font-size:10px;color:#b7cbe0;margin-top:3px}.rule-source-group{border:1px solid #315a7e;border-radius:14px;margin:14px 0;overflow:hidden}.rule-source-group>summary{cursor:pointer;font-weight:900;padding:14px 16px;background:#0d2740;display:flex;justify-content:space-between;gap:10px}.rule-source-group>summary span{font-size:12px;color:#b7cbe0}.rule-source-list{padding:10px}@media(max-width:600px){.division-home-grid{grid-template-columns:repeat(3,1fr)}.division-home-grid button:nth-last-child(-n+2){min-height:58px}}`;
  document.head.appendChild(style);
})();
