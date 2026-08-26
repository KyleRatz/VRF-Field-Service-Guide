const $=id=>document.getElementById(id);
const n=id=>{const v=parseFloat($(id).value);return Number.isFinite(v)?v:null};

const paths={
 not_cooling:[
  ['Confirm load and command','Verify the chiller is enabled, cooling is requested, setpoint is reasonable, and compressor capacity is being commanded.'],
  ['Verify chilled-water flow','Confirm pump operation, valve position, flow proof, strainers, and entering/leaving water temperatures before touching refrigerant charge.'],
  ['Check heat transfer','Use chilled-water ΔT and evaporator approach to separate a building/flow problem from an evaporator/refrigerant-side problem.'],
  ['Check heat rejection','For air-cooled units inspect condenser coils and fans. For water-cooled units verify tower and condenser-water temperatures/flow.'],
  ['Evaluate compressor loading','Compare commanded capacity, actual load %, amps, pressures, and temperature response. A fully loaded machine that cannot pull water temperature down needs a different path than an unloaded machine.']
 ],
 low_suction:[
  ['Protect the evaporator','Verify water flow and freeze protection. Do not keep forcing operation with questionable flow.'],
  ['Confirm sensor accuracy','Compare displayed leaving-water and suction/evaporating values to independent instruments where practical.'],
  ['Check water side','Inspect pump, strainers, valves, bypasses, low load, low setpoint, and evaporator fouling.'],
  ['Check refrigerant feed','If water flow is proven, evaluate expansion device command/position, superheat, liquid condition, restriction, charge, and refrigerant distribution.']
 ],
 high_head:[
  ['Verify heat rejection first','High condensing temperature is usually solved by proving airflow or condenser-water performance before adjusting charge.'],
  ['Inspect condenser condition','Air-cooled: coils, fans, recirculation, ambient. Water-cooled: tower, pumps, strainers, tube fouling and CW temperatures.'],
  ['Compare approach','A rising condenser approach can indicate degraded heat transfer. Compare with the manufacturer’s expected value for this machine and load.'],
  ['Then investigate refrigerant causes','Only after heat rejection is proven should you pursue overcharge, non-condensables, restrictions, or control issues.']
 ],
 flow:[
  ['Confirm pump command and rotation','Check the correct pump is enabled, rotation is correct, and VFD speed is appropriate.'],
  ['Verify valve and strainer position','Confirm isolation valves are open, control valves are responding, and strainers are not plugged.'],
  ['Verify the proving device','Check differential pressure/flow switch/transducer tubing, wiring, calibration and actual signal.'],
  ['Compare temperatures and DP','Use actual water ΔT and differential pressure/flow data to determine whether the fault is real or a sensing issue.']
 ],
 oil:[
  ['Do not repeatedly reset','Oil and compressor safeties protect expensive equipment. Record the alarm and operating conditions before resetting.'],
  ['Verify oil level/pressure by design','Use the manufacturer procedure. Screw and centrifugal machines can have very different oil systems and acceptable differentials.'],
  ['Check operating conditions','Low load, refrigerant migration, foaming, failed heaters, oil return problems, filters, pumps, valves, sensors and transducers may all be involved.'],
  ['Follow model-specific service data','Use the exact compressor/chiller manual before adjusting oil charge, differential settings or safety limits.']
 ],
 electrical:[
  ['Read the exact alarm first','Record active and historical alarms before cycling power.'],
  ['Verify incoming power','Check phase-to-phase voltage, imbalance, fuses/breakers and transformer/control power as applicable.'],
  ['Verify command vs feedback','Determine whether the controller is commanding the device and whether the expected proof/feedback returns.'],
  ['Test safely','Use the wiring diagram and manufacturer test procedure for contactors, VFDs, sensors, transducers, relays and safeties.']
 ]
};

function setTypeFields(){ $('cwFields').style.display=$('type').value==='water'?'block':'none'; }
$('type').addEventListener('change',setTypeFields);setTypeFields();

$('startBtn').addEventListener('click',()=>{
 const list=paths[$('complaint').value]||paths.not_cooling;
 $('path').innerHTML=list.map((s,i)=>`<div class="step"><div class="step-num">${i+1}</div><div><strong>${s[0]}</strong><p>${s[1]}</p></div></div>`).join('');
 $('pathCard').classList.remove('hidden');
 $('pathCard').scrollIntoView({behavior:'smooth',block:'start'});
});

function metric(name,value,unit='°F'){
 return `<div class="metric"><div class="value">${value.toFixed(1)}${unit}</div><div class="name">${name}</div></div>`;
}
function finding(kind,title,text){return `<div class="finding ${kind}"><strong>${title}</strong><p>${text}</p></div>`}

$('analyzeBtn').addEventListener('click',()=>{
 const type=$('type').value, chwIn=n('chwIn'), chwOut=n('chwOut'), evapSat=n('evapSat'), suction=n('suctionTemp'), cwIn=n('cwIn'), cwOut=n('cwOut'), condSat=n('condSat'), liquid=n('liquidTemp'), ambient=n('ambient'), load=n('load');
 const metrics=[],findings=[];

 if(chwIn!==null&&chwOut!==null){
  const dt=chwIn-chwOut;metrics.push(metric('Chilled-water ΔT',dt));
  if(dt<2) findings.push(finding('warn','Very low chilled-water ΔT','This often points toward low load, excessive/bypass flow, sensor error, or poor load transfer. Verify actual flow and building conditions before blaming the refrigeration circuit.'));
  else if(dt>12) findings.push(finding('warn','Large chilled-water ΔT','A large ΔT can occur with low water flow or high load. Verify design flow, pump/VFD operation, valves and strainers.'));
  else findings.push(finding('good','Chilled-water ΔT is plausible','The temperature drop is within a common operating range, but compare it with this system’s design flow and load rather than using ΔT alone.'));
 }
 if(chwOut!==null&&evapSat!==null){
  const a=chwOut-evapSat;metrics.push(metric('Evaporator approach',a));
  if(a<0) findings.push(finding('danger','Evaporator approach is negative','Recheck sensors, units and saturation temperature. This combination is not physically plausible for normal cooling operation.'));
  else if(a>10) findings.push(finding('warn','Evaporator approach is elevated','This can indicate reduced evaporator heat transfer, refrigerant feed problems, oil logging or flow issues. Compare against the manufacturer’s expected approach at the present load.'));
  else findings.push(finding('good','Evaporator approach is not obviously high','Continue using trend, load and manufacturer data. Approach targets vary by chiller design and operating point.'));
 }
 if(suction!==null&&evapSat!==null){const sh=suction-evapSat;metrics.push(metric('Calculated suction superheat',sh));if(sh<0) findings.push(finding('danger','Negative calculated superheat','Recheck the temperature location, pressure/saturation value and refrigerant. Do not use this result for charge decisions until the inputs are confirmed.'));}
 if(condSat!==null&&liquid!==null){const sc=condSat-liquid;metrics.push(metric('Calculated subcooling',sc));if(sc<0) findings.push(finding('warn','Negative calculated subcooling','Verify pressure-temperature conversion and liquid temperature location. Flash gas or a bad input may be present.'));}
 if(type==='water'&&cwIn!==null&&cwOut!==null){
  const dt=cwOut-cwIn;metrics.push(metric('Condenser-water ΔT',dt));
  if(dt<2) findings.push(finding('warn','Low condenser-water ΔT','Check actual chiller load, condenser-water flow and sensor accuracy. A lightly loaded machine can legitimately have a small ΔT.'));
  if(dt>15) findings.push(finding('warn','High condenser-water ΔT','Verify condenser-water flow, tower operation and design conditions. Restricted or low flow may be present.'));
 }
 if(type==='water'&&condSat!==null&&cwOut!==null){
  const a=condSat-cwOut;metrics.push(metric('Condenser approach',a));
  if(a<0) findings.push(finding('danger','Condenser approach is negative','Recheck condensing saturation and leaving condenser-water temperature.'));
  else if(a>12) findings.push(finding('warn','Condenser approach is elevated','Poor condenser heat transfer is possible. Check tube fouling/scale and flow, then compare to model-specific design data.'));
 }
 if(type==='air'&&condSat!==null&&ambient!==null){const split=condSat-ambient;metrics.push(metric('Condensing temp above ambient',split));if(split>35)findings.push(finding('warn','Condensing temperature is high above ambient','Inspect condenser cleanliness, fan operation, airflow recirculation and fan controls before making refrigerant changes.'));}
 if(load!==null&&load>90&&chwIn!==null&&chwOut!==null&&(chwIn-chwOut)<2) findings.push(finding('warn','High compressor load with little water temperature drop','Verify actual water flow and sensor accuracy. If those are correct, investigate whether the machine is producing capacity and whether heat transfer is occurring normally.'));

 if(!metrics.length){findings.push(finding('warn','Enter more operating data','At minimum, enter the temperatures you have from the controller or your instruments. The app will only calculate from confirmed readings.'));}
 findings.push(finding('','Use model-specific limits before final diagnosis','These are screening rules for a field technician, not factory trip limits. Chiller design, refrigerant, load and control strategy change the expected values.'));
 $('metrics').innerHTML=metrics.join('');$('findings').innerHTML=findings.join('');$('resultsCard').classList.remove('hidden');$('resultsCard').scrollIntoView({behavior:'smooth',block:'start'});
});
