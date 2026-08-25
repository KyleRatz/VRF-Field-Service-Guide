// Retry temporary Render 429 responses so the field dashboard does not fail on a brief rate limit.
(function(){
  if(typeof requestFieldCalendar!=='function')return;
  const sleep=ms=>new Promise(r=>setTimeout(r,ms));
  requestFieldCalendar=async function(){
    let lastStatus=0,lastText='';
    for(let attempt=0;attempt<3;attempt++){
      if(attempt)await sleep(attempt===1?900:1800);
      try{
        const response=await fetch('/api/fields',{cache:'no-store',credentials:'same-origin',headers:{Accept:'application/json'}});
        lastStatus=response.status;lastText=await response.text();
        if(response.status===401||/SMGSL Board Login/i.test(lastText)){window.location.href='/login';throw new Error('Session expired. Sign in again.');}
        if(response.status===429)continue;
        let data;try{data=JSON.parse(lastText);}catch{throw new Error(`Schedule service returned an unreadable response (${response.status})`);}
        if(!response.ok)throw new Error(data&&data.error?data.error:`Schedule error (${response.status})`);
        return data;
      }catch(e){if(/Session expired/.test(e&&e.message||''))throw e;if(attempt===2&&lastStatus!==429)throw e;}
    }
    throw new Error(lastStatus===429?'Schedule service is temporarily busy. Please tap Refresh Schedule again in a few seconds.':`Schedule error (${lastStatus||'network'})`);
  };
})();
