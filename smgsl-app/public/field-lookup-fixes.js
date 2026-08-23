/* Final polish for compact SMGSL board navigation */
(function(){
  function collapseMore(){document.querySelectorAll('.more-tools').forEach(d=>d.removeAttribute('open'));}
  setTimeout(collapseMore,0);
  document.addEventListener('click',e=>{
    const b=e.target.closest('[data-view]');
    if(b)setTimeout(collapseMore,0);
  });
  const search=document.querySelector('#search');
  if(search){
    search.placeholder='Search rules/board info — use Field Lookup for date/time';
    search.addEventListener('keydown',e=>{
      if(e.key!=='Enter')return;
      const q=search.value.trim();
      if(/\bfield\s*[1-8]\b/i.test(q)&&(/\b(?:am|pm)\b/i.test(q)||/\b\d{1,2}:?\d{0,2}\b/.test(q)||/\b(?:sunday|monday|tuesday|wednesday|thursday|friday|saturday|today|yesterday)\b/i.test(q))){
        e.preventDefault();
        if(typeof render==='function')render('fieldlookup');
      }
    });
  }
})();
