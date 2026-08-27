(function(){
  const params=new URLSearchParams(location.search),query=(params.get('q')||'').trim();
  [...document.querySelectorAll('main > h2')].forEach((h,i)=>{const page=Number((h.textContent.match(/PAGE:\s*(\d+)/i)||[])[1])||i+1;h.id=`bylaws-page-${page}`;});
  if(query){const words=query.toLowerCase().split(/[^a-z0-9]+/).filter(x=>x.length>1);document.querySelectorAll('main > pre').forEach(pre=>{const text=pre.textContent,lower=text.toLowerCase();let start=-1,term='';for(const word of words){const at=lower.indexOf(word);if(at>=0&&(start<0||at<start)){start=at;term=text.slice(at,at+word.length);}}if(start<0)return;const mark=document.createElement('mark');mark.textContent=term;pre.replaceChildren(document.createTextNode(text.slice(0,start)),mark,document.createTextNode(text.slice(start+term.length)));});}
  const target=location.hash&&document.querySelector(location.hash);if(target)setTimeout(()=>target.scrollIntoView({block:'start'}),0);
})();
