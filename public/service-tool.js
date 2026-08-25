(function(){
  const root=document.querySelector('#serviceTool'); if(!root)return;
  const form=root.querySelector('form'),out=root.querySelector('#diagResults');
  const n=id=>{const e=root.querySelector('#'+id),v=parseFloat(e&&e.value);return Number.isFinite(v)?v:null};
  const esc=s=>String(s||'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const cleanCode=s=>(s||'').toUpperCase().replace(/\s+/g,'').trim();
  function findCode(brand,code){const db=window.VRF_ERROR_DB&&window.VRF_ERROR_DB[brand];if(!db||!code)return null;return db[code]||db[code.split('-')[0]]||null}
  // Compact PT interpolation tables in °F/psig. Values are service-calculator approximations; verify against manufacturer data for final charge decisions.
  const PT={
    R410A:[[-20,43.1],[-10,58.5],[0,76.0],[10,95.4],[20,116.9],[30,140.5],[40,166.5],[50,194.9],[60,225.9],[70,259.8],[80,296.7],[90,336.8],[100,380.2],[110,427.2],[120,478.0],[130,532.8],[140,591.7]],
    R32:[[-20,55.0],[-10,72.0],[0,91.5],[10,113.5],[20,138.0],[30,165.5],[40,196.0],[50,230.0],[60,267.5],[70,309.0],[80,354.5],[90,404.5],[100,459.0],[110,518.5],[120,583.0]]
  };
  function satTemp(ref,p){const a=PT[ref];if(!a||p==null)return null;if(p<a[0][1]||p>a[a.length-1][1])return null;for(let i=1;i<a.length;i++){if(p<=a[i][1]){const [t1,p1]=a[i-1],[t2,p2]=a[i];return t1+(p-p1)*(t2-t1)/(p2-p1)}}return null}
  const f1=v=>v==null?'—':v.toFixed(1)+'°F';
  function diagnose(ev){
    ev.preventDefault();
    const brand=root.querySelector('#dBrand').value,mode=root.querySelector('#dMode').value,ref=root.querySelector('#refrigerant').value;
    const model=(root.querySelector('#dModel').value||'').trim(),code=cleanCode(root.querySelector('#dCode').value),ci=findCode(brand,code);
    const hp=n('hp'),lp=n('lp'),iduEev=n('eev'),oduEev=n('oduEev'),fan=n('fan'),hz=n('hz'),st=n('suctionTemp'),lt=n('liquidTemp'),dt=n('discharge'),oat=n('oat'),pin=n('pipeIn'),pout=n('pipeOut');
    const lowSat=satTemp(ref,lp),highSat=satTemp(ref,hp);
    const sh=(st!=null&&lowSat!=null)?st-lowSat:null;
    const sc=(lt!=null&&highSat!=null)?highSat-lt:null;
    const dsh=(dt!=null&&highSat!=null)?dt-highSat:null;
    const entered=[hp,lp,iduEev,oduEev,fan,hz,st,lt,dt,oat,pin,pout].filter(v=>v!=null).length;
    if(entered<3&&!code){out.innerHTML='<div class="diag-warn">Enter an error code or at least 3 operating values.</div>';return}
    let html='<div class="diag-summary"><b>'+esc(brand)+' '+(mode==='cool'?'Cooling':'Heating')+' analysis</b><span>'+esc(ref)+' • '+entered+' values entered</span></div>';
    if(model)html+='<div class="diag-model">Model: <b>'+esc(model)+'</b></div>';
    html+='<div class="code-box"><b>Calculated outdoor-unit refrigerant values</b><p>Low-side saturation: <b>'+f1(lowSat)+'</b> &nbsp; High-side saturation: <b>'+f1(highSat)+'</b></p><p>ODU suction superheat: <b>'+f1(sh)+'</b> &nbsp; ODU subcooling: <b>'+f1(sc)+'</b> &nbsp; Compressor discharge superheat: <b>'+f1(dsh)+'</b></p><p>SSH = ODU suction pipe temp − low-side saturation. SC = high-side saturation − ODU liquid pipe temp. DSH = compressor discharge pipe temp − high-side saturation.</p></div>';
    if(ci)html+='<div class="code-box"><b>'+esc(code)+' — '+esc(ci.title)+'</b><p>'+esc(ci.summary)+'</p></div>';
    const f=[]; const add=(cond,label,reason)=>{if(cond)f.push({label,reason})};
    if(brand==='LG'){
      add(mode==='cool'&&sh!=null&&sh>12&&sc!=null&&sc<5,'Possible starvation / low refrigerant-flow pattern','Outdoor suction SH is elevated while outdoor subcooling is low. Confirm against LGMV targets, IDU behavior, charge calculation and restrictions.');
      add(iduEev!=null&&iduEev>900&&pin!=null&&pout!=null&&Math.abs(pin-pout)<3,'Indoor EEV commanded open with little pipe response','Verify actual refrigerant flow, EEV coil/valve and upstream restriction.');
      add(dt!=null&&dt>205,'High compressor discharge temperature','Verify sensor accuracy and refrigerant flow before condemning components.');
    }else{
      add(mode==='cool'&&sh!=null&&sh>17,'High outdoor suction superheat','Compare Service Checker Te/Tes, indoor EEVs and refrigerant distribution.');
      add(mode==='heat'&&sc!=null&&sc<3,'Low outdoor subcooling','Compare Tc/Tcs and model-specific VRV control data before adjusting charge.');
      add(dt!=null&&dt>220,'High compressor discharge temperature','Verify sensor, load, EEV control and refrigerant flow.');
    }
    add(fan===0&&hz!=null&&hz>0,'Outdoor fan not running with compressor active','Verify command/feedback, motor, connector and driver/IPM.');
    if(f.length)html+='<div class="diag-list">'+f.map((x,i)=>'<div class="diag-item"><div class="diag-rank">'+(i+1)+'</div><div><b>'+esc(x.label)+'</b><p>'+esc(x.reason)+'</p></div></div>').join('')+'</div>';
    else html+='<div class="diag-ok"><b>No strong pattern identified from the entered values.</b><br>Compare target vs actual values and exact model/generation service data.</div>';
    if(oduEev!=null)html+='<div class="diag-note">Outdoor/Main EEV entered: <b>'+oduEev+' pulses</b>. Keep this separate from the indoor EEV because they control different parts of the circuit.</div>';
    html+='<div class="diag-note">Calculated PT values are field approximations. For final refrigerant charging or model-specific control decisions, verify saturation values and measurement points against the applicable LG/Daikin service data.</div>';
    out.innerHTML=html;
  }
  form.addEventListener('submit',diagnose);
  root.querySelector('#diagClear').addEventListener('click',()=>{form.reset();out.innerHTML='<div class="diag-placeholder">Enter the readings you have. The analyzer calculates outdoor-unit suction superheat, subcooling and discharge superheat from pressure and pipe temperatures when supported.</div>'});
})();