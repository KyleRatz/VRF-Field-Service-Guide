(function(){
  const root=document.querySelector('#serviceTool');
  if(!root) return;
  const form=root.querySelector('form');
  const out=root.querySelector('#diagResults');
  const n=id=>{const el=root.querySelector('#'+id);const v=parseFloat(el&&el.value);return Number.isFinite(v)?v:null};
  const esc=s=>String(s==null?'':s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const state=(v,low,high)=>v==null?'missing':v<low?'low':v>high?'high':'normal';
  const label=s=>s==='high'?'HIGH':s==='low'?'LOW':s==='normal'?'IN RANGE':'NOT ENTERED';

  function pattern(ssh,sc,dsh,eev,hz){
    const S=state(ssh,5,15), C=state(sc,5,20), D=state(dsh,20,45);
    let result={name:'No dominant triangle pattern',confidence:'Low',reason:'The entered SSH, SC and DSH values do not match one of the strongest screening patterns.',checks:['Compare each value to the exact manufacturer target for the current mode and load.','Look at trends over time, not a single snapshot.','Compare EEV command, compressor speed, pipe temperatures and pressures before changing charge.']};

    if(S==='high'&&D==='high'&&C==='low') result={name:'Starvation / possible undercharge',confidence:'High',reason:'High suction superheat + high discharge superheat + low subcooling is a strong starvation pattern.',checks:['Leak-check before adding refrigerant.','Verify total calculated charge and any recent refrigerant work.','Compare indoor EEV command to actual pipe-temperature response.','Check for a liquid-line, branch, strainer or EEV restriction.']};
    else if(S==='low'&&D==='low'&&C==='high') result={name:'Overfeed / possible overcharge or floodback',confidence:'High',reason:'Low suction superheat + low discharge superheat + high subcooling is a strong overfeed/floodback pattern.',checks:['Verify total system charge against the piping calculation.','Check indoor EEVs for leak-through or valves not physically closing.','Verify indoor airflow and coil conditions.','Do not remove refrigerant until EEV and airflow faults are ruled out.']};
    else if(S==='high'&&D==='high'&&C==='high') result={name:'Restriction / stacked liquid / abnormal condensing condition',confidence:'Medium',reason:'High superheat with high subcooling suggests refrigerant is being held on the high side while the evaporator side is starved.',checks:['Check for a liquid-side restriction, partially closed service valve, plugged strainer or EEV feeding problem.','Verify pressure and pipe sensors before condemning components.','Check outdoor coil airflow and heat-rejection conditions.','Consider non-condensables only after sensor, airflow and restriction checks.']};
    else if(S==='high'&&D==='high'&&C==='normal') result={name:'Evaporator-side starvation / distribution problem',confidence:'Medium',reason:'The low side appears starved while system subcooling is not obviously depleted.',checks:['Compare EEV positions and pipe temperatures across all indoor units.','Look for one branch or indoor unit not feeding correctly.','Verify indoor airflow and thermistor accuracy.','Check branch selector/heat-recovery components where applicable.']};
    else if(S==='low'&&D==='low'&&C==='normal') result={name:'Overfeeding / floodback tendency',confidence:'Medium',reason:'Both suction and discharge superheat are low without strongly elevated subcooling.',checks:['Check indoor EEV leak-through and commanded position.','Verify indoor airflow and load.','Confirm suction/discharge thermistors are accurate.','Watch compressor current and oil-return behavior.']};
    else if(S==='normal'&&C==='normal'&&D==='normal') result={name:'Triangle values broadly balanced',confidence:'Medium',reason:'SSH, SC and DSH fall inside the app’s broad screening bands.',checks:['Compare against model-specific targets because VRF values move with load and mode.','If a fault remains, prioritize error history, sensors, EEV response, compressor data and refrigerant distribution.']};

    if(eev!=null&&ssh!=null){
      if(eev>800&&ssh>15) result.checks.unshift('Indoor EEV is driven far open while SSH remains high — verify that refrigerant is actually feeding through the valve.');
      if(eev<150&&ssh<5) result.checks.unshift('Indoor EEV is commanded nearly closed while SSH is low — check for valve leak-through or incorrect position feedback.');
    }
    if(hz!=null&&dsh!=null&&hz>100&&dsh>45) result.checks.unshift('High compressor speed plus high DSH increases discharge-temperature stress — verify refrigerant flow and compressor protection status.');
    return {S,C,D,result};
  }

  function render(){
    const ssh=n('sh'),sc=n('sc'),dsh=n('dsh'),eev=n('eev'),hz=n('hz');
    const old=out.querySelector('.triangle-card'); if(old) old.remove();
    if(ssh==null&&sc==null&&dsh==null) return;
    const {S,C,D,result}=pattern(ssh,sc,dsh,eev,hz);
    const card=document.createElement('section'); card.className='triangle-card';
    const val=v=>v==null?'—':esc(v.toFixed(1))+'°F';
    card.innerHTML='<div class="triangle-head"><div><div class="eyebrow">TROUBLESHOOTING TRIANGLE</div><h3>'+esc(result.name)+'</h3></div><span class="triangle-confidence">'+esc(result.confidence)+' confidence</span></div>'+
      '<div class="triangle-layout"><div class="triangle-visual"><svg viewBox="0 0 300 250" role="img" aria-label="VRF troubleshooting triangle"><polygon points="150,20 30,220 270,220" fill="none" stroke="currentColor" stroke-width="4"/><circle cx="150" cy="20" r="8"/><circle cx="30" cy="220" r="8"/><circle cx="270" cy="220" r="8"/><text x="150" y="55" text-anchor="middle">SSH</text><text x="60" y="205" text-anchor="middle">SC</text><text x="240" y="205" text-anchor="middle">DSH</text><text x="150" y="80" text-anchor="middle" class="tri-value">'+val(ssh)+'</text><text x="66" y="232" text-anchor="middle" class="tri-value">'+val(sc)+'</text><text x="234" y="232" text-anchor="middle" class="tri-value">'+val(dsh)+'</text></svg></div>'+
      '<div class="triangle-states"><div><b>SSH</b><span>'+val(ssh)+'</span><em class="tri-'+S+'">'+label(S)+'</em></div><div><b>SC</b><span>'+val(sc)+'</span><em class="tri-'+C+'">'+label(C)+'</em></div><div><b>DSH</b><span>'+val(dsh)+'</span><em class="tri-'+D+'">'+label(D)+'</em></div></div></div>'+
      '<p class="triangle-reason">'+esc(result.reason)+'</p><div class="triangle-next"><h4>What to check next</h4><ol>'+result.checks.slice(0,6).map(x=>'<li>'+esc(x)+'</li>').join('')+'</ol></div>'+
      '<div class="triangle-foot">Screening bands used by this app are intentionally broad: SSH 5–15°F, SC 5–20°F, DSH 20–45°F. VRF/VRV targets vary with manufacturer, generation, operating mode and load. Verify exact service data before adjusting charge or controls.</div>';
    out.appendChild(card);
  }

  form.addEventListener('submit',()=>setTimeout(render,0));
  root.querySelector('#diagClear').addEventListener('click',()=>{const old=out.querySelector('.triangle-card');if(old)old.remove();});
})();
