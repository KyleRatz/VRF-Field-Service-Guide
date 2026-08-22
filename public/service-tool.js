(function(){
  const root=document.querySelector('#serviceTool');
  if(!root) return;
  const form=root.querySelector('form');
  const out=root.querySelector('#diagResults');
  const score=(arr,cond,label,reason,weight=1)=>{if(cond)arr.push({label,reason,weight});};
  const n=id=>{const v=parseFloat(root.querySelector('#'+id).value);return Number.isFinite(v)?v:null};
  function diagnose(ev){
    ev.preventDefault();
    const brand=root.querySelector('#dBrand').value;
    const mode=root.querySelector('#dMode').value;
    const hp=n('hp'),lp=n('lp'),eev=n('eev'),fan=n('fan'),hz=n('hz'),sh=n('sh'),sc=n('sc'),dt=n('discharge'),oat=n('oat'),pin=n('pipeIn'),pout=n('pipeOut');
    const f=[];
    const enough=[hp,lp,eev,fan,hz,sh,sc,dt,oat,pin,pout].filter(v=>v!==null).length;
    if(enough<3){out.innerHTML='<div class="diag-warn">Enter at least 3 operating values for a useful pattern check.</div>';return;}

    if(brand==='LG'){
      if(mode==='cool'){
        score(f,sh!==null&&sh>12&&sc!==null&&sc<5,'Possible undercharge / starvation','High indoor superheat with low subcooling matches LG undercharge/starvation patterns.',3);
        score(f,eev!==null&&eev>900&&sh!==null&&sh>10,'EEV driven open / starved indoor circuit','High EEV command plus high SH can occur when the controller is trying to feed a starved circuit.',2);
        score(f,dt!==null&&dt>205&&sh!==null&&sh>10,'High discharge temperature concern','High discharge temperature plus elevated SH can accompany low refrigerant flow or EEV/restriction problems.',2);
        score(f,lp!==null&&sh!==null&&lp>145&&sh<2,'Possible overcharge / floodback pattern','LG training examples show elevated low-side pressure with very low/negative SH in overcharge conditions.',2);
        score(f,sc!==null&&sc>20&&sh!==null&&sh>10,'Possible non-condensables / abnormal condensing pattern','LG training notes high ODU subcooling with high IDU SH can occur with non-condensables.',2);
        score(f,pin!==null&&pout!==null&&Math.abs(pin-pout)<3&&eev!==null&&eev>500,'Possible EEV not feeding / restriction','Small pipe temperature change despite a substantial EEV command suggests refrigerant may not be moving as commanded.',3);
        score(f,pin!==null&&pout!==null&&Math.max(pin,pout)<60&&eev!==null&&eev<=100,'Possible EEV leaking/stuck open','Cold pipe temperatures with a nearly closed EEV can indicate internal EEV leakage.',3);
      } else if(mode==='heat'){
        score(f,sh!==null&&sh>15&&hz!==null&&hz>90,'Possible undercharge / starvation','LG heating training notes high compressor speed with elevated suction SH can occur with insufficient refrigerant.',2);
        score(f,sc!==null&&sc<5&&eev!==null&&eev<250,'Low IDU subcooling / possible starvation','LG training notes IDU EEV pulses and subcooling may be lower than normal during heating undercharge.',2);
        score(f,dt!==null&&dt>205,'High discharge temperature concern','Check charge, EEV operation, liquid injection and discharge sensor accuracy.',2);
      }
      score(f,hz!==null&&hz>145,'High compressor loading','Multi V 5 compressor speed is near the upper end of the published mode-value range; verify load and protection logic.',1);
      score(f,fan!==null&&fan<300&&hp!==null&&hp>400,'Outdoor fan response may be low','High pressure with very low fan speed can point to fan command/drive, sensor, or control issues.',1);
    } else {
      if(mode==='cool'){
        score(f,sh!==null&&sh>17,'High indoor superheat','Daikin training gives a typical indoor-unit cooling SH range of about 5–17°F; above that suggests starvation, EEV, airflow, or charge issues.',2);
        score(f,sh!==null&&sh<3,'Very low superheat / floodback risk','Very low SH can indicate excess refrigerant flow, EEV leakage, or airflow problems.',2);
        score(f,pin!==null&&pout!==null&&Math.abs(pin-pout)<3&&eev!==null&&eev>300,'Possible EEV / refrigerant-flow problem','A commanded-open EEV with little pipe-temperature response deserves EEV and flow verification.',2);
      } else if(mode==='heat'){
        score(f,sc!==null&&sc<3,'Low heating subcooling','Daikin VRV heating control uses indoor-unit subcooling as a control variable; very low SC can indicate inadequate refrigerant feed or load/flow issues.',2);
      }
      score(f,dt!==null&&dt>220,'High discharge temperature concern','Check refrigerant flow, EEV control, sensors, compressor loading and charge before condemning components.',2);
    }

    score(f,fan!==null&&fan===0&&hz!==null&&hz>0,'Fan not running while compressor is active','Verify fan command, motor, connector, driver/IPM and board output.',3);
    score(f,eev!==null&&eev===0&&sh!==null&&sh>15,'EEV closed with high superheat','Verify commanded position, coil resistance, valve movement and whether the displayed position matches actual refrigerant flow.',2);

    f.sort((a,b)=>b.weight-a.weight);
    let html='<div class="diag-summary"><b>'+brand+' '+(mode==='cool'?'Cooling':'Heating')+' pattern analysis</b><span>'+enough+' values entered</span></div>';
    if(!f.length){html+='<div class="diag-ok"><b>No strong fault pattern found from the entered values.</b><br>That does not prove the system is normal. Compare target vs actual values, error history, sensor accuracy, airflow, and refrigerant distribution.</div>';}
    else {
      html+='<div class="diag-list">'+f.slice(0,6).map((x,i)=>'<div class="diag-item"><div class="diag-rank">'+(i+1)+'</div><div><b>'+x.label+'</b><p>'+x.reason+'</p></div></div>').join('')+'</div>';
    }
    html+='<div class="diag-note">Use this as a triage assistant, not a replacement for the exact LG/Daikin service manual. VRF values change with load, ambient, connected capacity, protection logic and heat-recovery state.</div>';
    out.innerHTML=html;
  }
  form.addEventListener('submit',diagnose);
  root.querySelector('#diagClear').addEventListener('click',()=>{form.reset();out.innerHTML='<div class="diag-placeholder">Enter live system values, then tap <b>Analyze System</b>.</div>';});
})();
