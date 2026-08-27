// Keep Board Documents, Contacts, and sanctioned rule sources visible after division-rules.js rebuilds the quick nav.
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
    addNavButton('contacts','Contacts','fields');
    addNavButton('usatx','USA Softball TX/NM','bylaws');
    const d=document.querySelector('[data-view="documents"]');
    if(d)d.onclick=()=>render('documents');
    const c=document.querySelector('[data-view="contacts"]');
    if(c)c.onclick=()=>render('contacts');
    const u=document.querySelector('[data-view="usatx"]');
    if(u){u.textContent='USA Softball TX/NM';u.onclick=()=>render('usatx');}
    const b=document.querySelector('[data-view="bylaws"]');
    if(b){
      b.onclick=()=>{
        render('bylaws');
        history.replaceState(null,'','#bylaws');
        requestAnimationFrame(()=>document.querySelector('#content')?.scrollIntoView({behavior:'smooth',block:'start'}));
      };
    }
  }
  repair();
  window.addEventListener('load',repair);
  document.addEventListener('click',event=>{
    const button=event.target.closest('[data-view="bylaws"]');
    if(!button)return;
    event.preventDefault();
    event.stopImmediatePropagation();
    render('bylaws');
    history.replaceState(null,'','#bylaws');
    requestAnimationFrame(()=>document.querySelector('#content')?.scrollIntoView({behavior:'smooth',block:'start'}));
  },true);
  if(location.hash==='#bylaws'){
    render('bylaws');
    window.addEventListener('load',()=>document.querySelector('#content')?.scrollIntoView({block:'start'}),{once:true});
  }
})();
