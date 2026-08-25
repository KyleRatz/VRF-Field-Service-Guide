(function(){
  const oldUsageSummary=window.usageSummary;
  if(typeof oldUsageSummary!=='function')return;
  window.usageSummary=function(d,siOnly=false){
    let html=oldUsageSummary(d,siOnly);
    if(!siOnly)return html;
    const s=d&&d.usage&&d.usage.scheduled||{};
    const unused=Number(s.unusedFieldHours)||0;
    const byField=Array.isArray(s.unusedByField)?s.unusedByField:[];
    const card=`<div class="rule-card"><div class="rule-topic">UNUSED — 2026</div><div class="rule-question">${unused.toFixed(2)} field-hours</div><div class="small">Saturdays are excluded from unused capacity. Actual Saturday tournament hours are counted as Other.</div></div>`;
    const breakdown=byField.length?`<div class="field-date">2026 Unused Hours by Field</div><div class="usage-summary">${byField.map(x=>`<div class="rule-card"><div class="rule-topic">${x.field}</div><div class="rule-question">${Number(x.unusedFieldHours||0).toFixed(2)} hours unused</div></div>`).join('')}</div>`:'';
    html=html.replace('</div>',card+'</div>');
    return html+breakdown;
  };
  if(window.views&&views.si)views.si.html=`<div class="warn">The 2026 dashboard uses the SMGSL website calendar as the authority when a discrepancy is found. Main totals cover Jan 1–Dec 31, 2026 and include future scheduled dates. Saturdays are not counted as available/unused capacity; actual Saturday tournament hours still count as Tournament/Other usage. SI is shown by individual team below. Times display in Central Time (CST/CDT).</div><button class="btn primary" id="refreshSI">Refresh Schedule</button><div id="siResults"><div class="empty">Loading 2026 field usage…</div></div>`;
})();
