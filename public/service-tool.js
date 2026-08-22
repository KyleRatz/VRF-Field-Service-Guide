(function(){
  const root=document.querySelector('#serviceTool');
  if(!root) return;
  const form=root.querySelector('form');
  const out=root.querySelector('#diagResults');
  const score=(arr,cond,label,reason,weight=1,next=[])=>{if(cond)arr.push({label,reason,weight,next});};
  const n=id=>{const el=root.querySelector('#'+id); const v=parseFloat(el&&el.value);return Number.isFinite(v)?v:null};
  const cleanCode=s=>(s||'').toUpperCase().replace(/\s+/g,'').trim();
  function findCode(brand,code){
    const db=window.VRF_ERROR_DB&&window.VRF_ERROR_DB[brand];
    if(!db||!code) return null;
    if(db[code]) return db[code];
    const base=code.split('-')[0];
    return db[base]||null;
  }
  function esc(s){return String(s||'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));}
  function diagnose(ev){
    ev.preventDefault();
    const brand=root.querySelector('#dBrand').value;
    const mode=root.querySelector('#dMode').value;
    const model=(root.querySelector('#dModel').value||'').trim();
    const code=cleanCode(root.querySelector('#dCode').value);
    const codeInfo=findCode(brand,code);
    const hp=n('hp'),lp=n('lp'),eev=n('eev'),fan=n('fan'),hz=n('hz'),sh=n('sh'),sc=n('sc'),dt=n('discharge'),oat=n('oat'),pin=n('pipeIn'),pout=n('pipeOut');
    const f=[];
    const enough=[hp,lp,eev,fan,hz,sh,sc,dt,oat,pin,pout].filter(v=>v!==null).length;
    if(enough<3 && !code){out.innerHTML='<div class="diag-warn">Enter an error code or at least 3 operating values for a useful pattern check.</div>';return;}

    if(codeInfo){
      f.push({label:code+' — '+codeInfo.title,reason:codeInfo.summary,weight:6,next:codeInfo.tests||[]});
    } else if(code){
      f.push({label:code+' — code not yet in local quick database',reason:'Use the exact '+brand+' service flow for the selected model. The live readings below can still be analyzed for supporting patterns.',weight:1,next:['Confirm exact model and full subcode.','Search this guide for the code.','Capture the manufacturer-app diagnostic page if you want it added to the local database.']});
    }

    if(brand==='LG'){
      if(mode==='cool'){
        score(f,sh!==null&&sh>12&&sc!==null&&sc<5,'Possible undercharge / starvation','High indoor superheat with low subcooling matches LG undercharge/starvation patterns.',3,['Leak-check before adjusting charge.','Compare EEV and pipe temperatures across multiple IDUs.','Verify calculated additional charge and refrigerant distribution.']);
        score(f,eev!==null&&eev>900&&sh!==null&&sh>10,'EEV driven open / starved indoor circuit','High EEV command plus high SH can occur when the controller is trying to feed a starved circuit.',2,['Compare commanded EEV pulses to pipe-in/pipe-out response.','Check for a liquid-line restriction or clogged EEV.']);
        score(f,dt!==null&&dt>205&&sh!==null&&sh>10,'High discharge temperature concern','High discharge temperature plus elevated SH can accompany low refrigerant flow or EEV/restriction problems.',2,['Verify discharge sensor with an independent thermometer.','Check charge, EEV operation and liquid injection where applicable.']);
        score(f,lp!==null&&sh!==null&&lp>145&&sh<2,'Possible overcharge / floodback pattern','LG training examples show elevated low-side pressure with very low/negative SH in overcharge conditions.',2,['Check total charge against piping calculation.','Rule out EEV leakage and airflow problems before removing refrigerant.']);
        score(f,sc!==null&&sc>20&&sh!==null&&sh>10,'Possible non-condensables / abnormal condensing pattern','LG training notes high ODU subcooling with high IDU SH can occur with non-condensables.',2,['Check pressure behavior and discharge temperature trend.','If non-condensables are confirmed, recover, evacuate properly and recharge by weight.']);
        score(f,pin!==null&&pout!==null&&Math.abs(pin-pout)<3&&eev!==null&&eev>500,'Possible EEV not feeding / restriction','Small pipe temperature change despite a substantial EEV command suggests refrigerant may not be moving as commanded.',3,['Inspect the EEV coil/harness.','Compare actual pipe temperature response to LGMV pulse command.','Check for upstream restriction.']);
        score(f,pin!==null&&pout!==null&&Math.max(pin,pout)<60&&eev!==null&&eev<=100,'Possible EEV leaking/stuck open','Cold pipe temperatures with a nearly closed EEV can indicate internal EEV leakage.',3,['Place suspect IDU in fan mode and watch pipe temperatures.','Verify valve is physically closing and not just reporting closed.']);
      } else if(mode==='heat'){
        score(f,sh!==null&&sh>15&&hz!==null&&hz>90,'Possible undercharge / starvation','LG heating training notes high compressor speed with elevated suction SH can occur with insufficient refrigerant.',2,['Compare high pressure to target and check ODU main/sub EEV positions.','Leak-check and verify charge by piping calculation.']);
        score(f,sc!==null&&sc<5&&eev!==null&&eev<250,'Low IDU subcooling / possible starvation','LG training notes IDU EEV pulses and subcooling may be lower than normal during heating undercharge.',2,['Compare several IDUs to separate system charge from a branch problem.','Verify airflow and ESP on ducted indoor units.']);
        score(f,dt!==null&&dt>205,'High discharge temperature concern','Check charge, EEV operation, liquid injection and discharge sensor accuracy.',2,['Compare sensor reading to actual pipe temperature.','Check EEV and refrigerant-flow behavior before condemning the compressor.']);
      }
      score(f,hz!==null&&hz>145,'High compressor loading','Multi V 5 compressor speed is near the upper end of the published mode-value range; verify load and protection logic.',1,['Confirm connected load and ambient conditions.','Check current, discharge temperature and protection status.']);
      score(f,fan!==null&&fan<300&&hp!==null&&hp>400,'Outdoor fan response may be low','High pressure with very low fan speed can point to fan command/drive, sensor, or control issues.',1,['Verify fan command and actual RPM.','Check fan motor, connector, driver/IPM and pressure-sensor accuracy.']);
    } else {
      if(mode==='cool'){
        score(f,sh!==null&&sh>17,'High indoor superheat','Daikin training gives a typical indoor-unit cooling SH range of about 5–17°F; above that suggests starvation, EEV, airflow, or charge issues.',2,['Compare actual Te/Tes and EEV pulse in Service Checker.','Verify airflow and EEV response before changing charge.']);
        score(f,sh!==null&&sh<3,'Very low superheat / floodback risk','Very low SH can indicate excess refrigerant flow, EEV leakage, or airflow problems.',2,['Check suspect IDU EEV for leak-through.','Verify indoor airflow and pipe-temperature sensors.']);
        score(f,pin!==null&&pout!==null&&Math.abs(pin-pout)<3&&eev!==null&&eev>300,'Possible EEV / refrigerant-flow problem','A commanded-open EEV with little pipe-temperature response deserves EEV and flow verification.',2,['Check EEV coil and valve movement.','Compare liquid/gas pipe temperatures in Service Checker.']);
      } else if(mode==='heat'){
        score(f,sc!==null&&sc<3,'Low heating subcooling','Daikin VRV heating control uses indoor-unit subcooling as a control variable; very low SC can indicate inadequate refrigerant feed or load/flow issues.',2,['Compare Tc/Tcs target versus actual.','Check IDU EEV control and refrigerant distribution.']);
      }
      score(f,dt!==null&&dt>220,'High discharge temperature concern','Check refrigerant flow, EEV control, sensors, compressor loading and charge before condemning components.',2,['Verify sensor accuracy.','Review compressor load/current and EEV positions in Service Checker.']);
    }

    score(f,fan!==null&&fan===0&&hz!==null&&hz>0,'Fan not running while compressor is active','Verify fan command, motor, connector, driver/IPM and board output.',3,['Confirm fan command versus feedback.','Power down and test motor/connectors per manufacturer procedure.']);
    score(f,eev!==null&&eev===0&&sh!==null&&sh>15,'EEV closed with high superheat','Verify commanded position, coil resistance, valve movement and whether the displayed position matches actual refrigerant flow.',2,['Check coil resistance and harness.','Confirm actual valve movement with pipe temperatures.']);

    f.sort((a,b)=>b.weight-a.weight);
    let html='<div class="diag-summary"><b>'+esc(brand)+' '+(mode==='cool'?'Cooling':'Heating')+' pattern analysis</b><span>'+enough+' values entered'+(code?' • '+esc(code):'')+'</span></div>';
    if(model) html+='<div class="diag-model">Model: <b>'+esc(model)+'</b></div>';
    if(codeInfo){
      html+='<div class="code-box"><b>'+esc(code)+' — '+esc(codeInfo.title)+'</b><p>'+esc(codeInfo.summary)+'</p>';
      if(codeInfo.causes&&codeInfo.causes.length) html+='<h4>Likely causes / areas to check</h4><ul>'+codeInfo.causes.map(x=>'<li>'+esc(x)+'</li>').join('')+'</ul>';
      html+='</div>';
    }
    if(!f.length){html+='<div class="diag-ok"><b>No strong fault pattern found from the entered values.</b><br>That does not prove the system is normal. Compare target vs actual values, error history, sensor accuracy, airflow, and refrigerant distribution.</div>';}
    else {
      html+='<div class="diag-list">'+f.slice(0,6).map((x,i)=>'<div class="diag-item"><div class="diag-rank">'+(i+1)+'</div><div><b>'+esc(x.label)+'</b><p>'+esc(x.reason)+'</p></div></div>').join('')+'</div>';
      const next=[]; f.slice(0,3).forEach(x=>(x.next||[]).forEach(t=>{if(!next.includes(t))next.push(t)}));
      if(next.length) html+='<div class="next-tests"><h3>Next tests</h3><ol>'+next.slice(0,6).map(x=>'<li>'+esc(x)+'</li>').join('')+'</ol></div>';
    }
    html+='<div class="diag-note">Use this as a triage assistant, not a replacement for the exact LG/Daikin service manual. Error subcodes, field settings and normal values can be model/generation specific.</div>';
    out.innerHTML=html;
  }
  form.addEventListener('submit',diagnose);
  root.querySelector('#diagClear').addEventListener('click',()=>{form.reset();out.innerHTML='<div class="diag-placeholder">Enter an error code and/or live system values, then tap <b>Analyze System</b>.</div>';});
})();
