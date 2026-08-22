// Keep Board Documents and USA Softball visible after division-rules.js rebuilds the quick nav.
(function(){
  function addNavButton(view,label,beforeView){
    const q=document.querySelector('.quick');
    if(!q||q.querySelector(`[data-view="${view}"]`))return;
    const b=document.createElement('button');
    b.type='button';
    b.dataset.view=view;
    b.textContent=label;
    b.addEventListener('click',()=>render(view));
    const before=beforeView?q.querySelector(`[data-view="${beforeView}"]`):null;
    if(before)q.insertBefore(b,before); else q.appendChild(b);
  }
  function repair(){
    addNavButton('documents','Board Documents','fields');
    addNavButton('usatx','USA Softball TX','bylaws');
    const d=document.querySelector('[data-view="documents"]');
    if(d)d.onclick=()=>render('documents');
    const u=document.querySelector('[data-view="usatx"]');
    if(u)u.onclick=()=>render('usatx');
  }
  repair();
  // A later script may alter the nav once more; repair again after the page finishes loading.
  window.addEventListener('load',repair);
})();
