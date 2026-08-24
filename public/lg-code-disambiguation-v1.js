(function(){
  const LG=window.VRF_ERROR_DB&&window.VRF_ERROR_DB.LG;
  if(!LG) return;
  LG['CH242']={
    title:'CH242 — verify context before diagnosis',
    summary:'LG Multi V 5 documentation uses 242 in more than one context: Error No. 242 is a central-controller/network fault, while the CH24 high-pressure-switch family uses 241/242/243 to identify Master/Slave frames. Confirm where the code is being displayed and whether it is a base error or frame-suffixed error before following a flow.',
    causes:['Central-controller/network RS-485 fault (Error No. 242)','CH24 high-pressure-switch trip on Slave 1 when using frame-suffixed display convention'],
    tests:['If the code is from central control/network diagnostics, use the Error No. 242 flow: RS-485 wiring, duplicate IDU addresses, DIP/controller settings.','If the code is a frame-suffixed outdoor error corresponding to CH24 on Slave 1, use the CH24 high-pressure-switch flow.','Confirm the reporting device, outdoor frame and LGMV error history before replacing parts.']
  };
})();
