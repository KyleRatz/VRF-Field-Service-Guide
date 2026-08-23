const SI_ADJ_KEY='smgsl_si_usage_adjustments_v1';
const SI_USAGE_START='2026-08-01';
function siAdjustments(){try{return JSON.parse(localStorage.getItem(SI_ADJ_KEY)||'[]')}catch{return []}}
function saveSIAdjustments(v){localStorage.setItem(SI_ADJ_KEY,JSON.stringify(v))}
function escSI(v){return String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]))}
function siAdjustmentHours(a){const n=Number(a.hours);return Number.isFinite(n)?n:0}
function currentSIAdjustments(){const today=new Date().toISOString().slice(0,10);return siAdjustments().filter(a=>String(a.date||'')>=SI_USAGE_START&&String(a.date||'')<=today)}
function siAdjustmentCardHtml(adjustments){
  const all=siAdjustments();
  const rows=adjustments.slice().sort((a,b)=>String(b.date||'').localeCompare(String(a.date||''))||String(b.created||'').localeCompare(String(a.created||'')));
  const added=rows.reduce((s,a)=>s+Math.max(0,siAdjustmentHours(a)),0);
  const removed=rows.reduce((s,a)=>s+Math.min(0,siAdjustmentHours(a)),0);
  const violationTypes=new Set(['Started Early','Stayed Late','Extra Practice']);
  const violations=rows.filter(a=>violationTypes.has(a.type)&&siAdjustmentHours(a)>0).length;
  const body=rows.length?rows.map(a=>{
    const originalIndex=all.findIndex(x=>x===a||((x.created||'')&&(x.created||'')===(a.created||'')));
    const h=siAdjustmentHours(a);
    const flag=violationTypes.has(a.type)&&h>0?' • VIOLATION/EXTRA TIME':'';
    return `<div class="si-adjustment-row${flag?' si-adjustment-violation':''}"><div><b>${escSI(a.team||'Unassigned SI')} • ${escSI(a.type||'Adjustment')}</b><div class="small">${escSI(a.date||'')}${a.field?` • ${escSI(a.field)}`:''} • ${h>=0?'+':''}${h.toFixed(1)} hr${Math.abs(h)===1?'':'s'}${flag}${a.note?`<br>${escSI(a.note)}`:''}</div></div>${originalIndex>=0?`<button class="si-delete" data-adj-index="${originalIndex}" aria-label="Delete adjustment">Delete</button>`:''}</div>`;
  }).join(''):'<div class="empty">No SI time adjustments have been recorded on this device yet.</div>';
  return `<div class="rule-card si-adjustments-card"><div class="rule-topic">SI TIME ADJUSTMENTS &amp; VIOLATIONS</div><div class="si-adjustment-stats"><span><b>${rows.length}</b><small>adjustments</small></span><span><b>+${added.toFixed(1)}</b><small>hours added</small></span><span><b>${removed.toFixed(1)}</b><small>hours removed</small></span><span><b>${violations}</b><small>violations / extra time</small></span></div><div class="small si-card-note">Shows Started Early, Stayed Late, Extra Practice, Left Early, Cancelled Practice and Other Adjustments. These entries are included in each team’s adjusted field-hour total.</div><div class="si-adjustment-list">${body}</div></div>`;
}
function siTeamUsageAdjusted(rows){
  const teams=new Map();
  rows.forEach(x=>{const team=siTeamName(x&&x.summary);const current=teams.get(team)||{team,hours:0,blocks:0};current.hours+=siEventHours(x);current.blocks+=1;teams.set(team,current)});
  const adjustments=currentSIAdjustments();
  adjustments.forEach(a=>{const team=String(a.team||'Unassigned SI');const current=teams.get(team)||{team,hours:0,blocks:0};current.adjustmentHours=(current.adjustmentHours||0)+siAdjustmentHours(a);teams.set(team,current)});
  const sorted=[...teams.values()].sort((a,b)=>((b.hours+(b.adjustmentHours||0))-(a.hours+(a.adjustmentHours||0)))||a.team.localeCompare(b.team));
  const total=sorted.reduce((sum,x)=>sum+x.hours+(x.adjustmentHours||0),0);
  const cards=sorted.map(x=>{const adj=x.adjustmentHours||0;const actual=x.hours+adj;return `<div class="rule-card si-team-card"><div class="rule-topic">${escSI(x.team)}</div><div class="rule-question">${actual.toFixed(1)} field-hours</div><div class="small">Calendar usage: ${x.hours.toFixed(1)} hrs • Adjustments: ${adj>=0?'+':''}${adj.toFixed(1)} hrs • ${x.blocks} field-use record${x.blocks===1?'':'s'}</div><button class="btn secondary si-adjust-btn" data-team="${escSI(x.team)}">Adjust Usage</button></div>`}).join('');
  return `${siAdjustmentCardHtml(adjustments)}<div class="field-date">SI Individual Team Usage — Since Aug 1, 2026</div><div class="usage-summary">${cards}<div class="rule-card"><div class="rule-topic">SI INDIVIDUAL TEAM TOTAL</div><div class="rule-question">${total.toFixed(1)} field-hours</div><div class="small">Sum of all SI individual-team usage plus manual adjustments since Aug 1</div></div></div>`;
}
function openSIAdjustment(team){
  document.querySelector('#siAdjustModal')?.remove();
  const today=new Date().toISOString().slice(0,10);
  document.body.insertAdjacentHTML('beforeend',`<div class="si-modal-backdrop" id="siAdjustModal"><form class="si-modal" id="siAdjustForm"><h3>Adjust SI Usage</h3><label>Team<input id="siaTeam" value="${escSI(team)}" required></label><label>Date<input id="siaDate" type="date" min="2026-08-01" max="${today}" value="${today}" required></label><label>Field<input id="siaField" placeholder="Field 1"></label><label>Adjustment Type<select id="siaType"><option>Started Early</option><option>Stayed Late</option><option>Left Early</option><option>Cancelled Practice</option><option>Extra Practice</option><option>Other Adjustment</option></select></label><label>Hours<input id="siaHours" type="number" step="0.25" value="1" required></label><div class="small">Use positive hours to add time and negative hours to subtract time.</div><label>Note<textarea id="siaNote" placeholder="Example: Scheduled 6:00 PM, started 5:00 PM"></textarea></label><div class="actions"><button class="btn primary" type="submit">Save Adjustment</button><button class="btn secondary" type="button" id="siaCancel">Cancel</button></div></form></div>`);
  document.querySelector('#siaType').addEventListener('change',e=>{if(['Left Early','Cancelled Practice'].includes(e.target.value)&&Number(siaHours.value)>0)siaHours.value=-Math.abs(Number(siaHours.value)||1);else if(!['Left Early','Cancelled Practice'].includes(e.target.value)&&Number(siaHours.value)<0)siaHours.value=Math.abs(Number(siaHours.value)||1)});
  document.querySelector('#siaCancel').addEventListener('click',()=>document.querySelector('#siAdjustModal')?.remove());
  document.querySelector('#siAdjustForm').addEventListener('submit',e=>{e.preventDefault();const item={team:siaTeam.value.trim(),date:siaDate.value,field:siaField.value.trim(),type:siaType.value,hours:Number(siaHours.value),note:siaNote.value.trim(),created:new Date().toISOString()};const all=siAdjustments();all.push(item);saveSIAdjustments(all);document.querySelector('#siAdjustModal')?.remove();loadFields('#siResults',true)});
}
const previousSITeamUsage=typeof siTeamUsage==='function'?siTeamUsage:null;
siTeamUsage=siTeamUsageAdjusted;
const previousLoadFields=loadFields;
loadFields=async function(target,siOnly=false){await previousLoadFields(target,siOnly);if(siOnly){document.querySelectorAll('.si-adjust-btn').forEach(b=>b.addEventListener('click',()=>openSIAdjustment(b.dataset.team)));document.querySelectorAll('.si-delete').forEach(b=>b.addEventListener('click',()=>{const all=siAdjustments();all.splice(Number(b.dataset.adjIndex),1);saveSIAdjustments(all);loadFields('#siResults',true)}))}};
