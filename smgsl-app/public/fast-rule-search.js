// Fast, phone-first rule lookup for in-game umpire calls.
(function(){
  const SMGSL='SMGSL Rules';
  const USATX='USA Softball of Texas/New Mexico';
  const divLabel={blast:'Blast Ball','6u':'6U','8u':'8U','10u':'10U','12u':'12U',mx:'MX',all:'All Divisions'};
  const STOP=new Set(['a','an','and','are','as','at','be','by','can','do','does','for','from','how','if','in','is','it','may','of','on','or','the','to','what','when','where','who','with']);
  const ALIASES={
    'interference':['interfere','runner interference','batter interference','batter runner interference','contact by runner'],
    'obstruction':['blocking','blocked base','block plate','blocking plate','fielder in way','catcher blocking'],
    'look back':['lookback','look-back','pitcher circle runner','runner stops','circle rule'],
    'dropped third strike':['dropped 3rd','third strike','uncaught third strike','uncaught 3rd strike'],
    'infield fly':['infieldfly','fly rule'],
    'illegal pitch':['illegal pitching','pitch violation'],
    'leaving early':['left early','leave early','lead off','leadoff','runner left base'],
    'stealing':['steal','stolen base'],
    'hit by pitch':['hbp','hit batter','batter hit'],
    'foul tip':['foul-tip','tip caught'],
    'appeal':['appeal play','missed base','left early appeal'],
    'bunt':['bunting','shows bunt'],
    'slap':['slapping','slap hit'],
    'courtesy runner':['substitute runner','runner for catcher','runner for pitcher'],
    'substitution':['substitute','reentry','re-entry'],
    'pitcher innings':['pitching limit','innings limit','pitcher limit'],
    'run limit':['runs per inning','five runs','5 runs'],
    'game time':['time limit','no new inning','game length'],
    'walks':['walk','four balls','4 balls'],
    'overthrow':['overthrows','thrown out of play'],
    'dead ball':['ball dead','dead-ball'],
    'force play':['force out','forced runner'],
    'tag':['tag out','tagged runner'],
    'batting order':['bat out of order','batting out of order','wrong batter'],
    'pickup players':['pick up player','pickup player'],
    'field dimensions':['base distance','pitching distance','rubber distance']
  };
  function esc(s){return String(s??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));}
  function norm(s){return String(s||'').toLowerCase().replace(/10\s*&?\s*under|10u/g,'10u').replace(/12\s*&?\s*under|12u/g,'12u').replace(/8\s*&?\s*under|8u/g,'8u').replace(/6\s*&?\s*under|6u/g,'6u').replace(/mixed division|mixed/g,'mx').replace(/3rd/g,'third').replace(/innings?/g,'inning').replace(/pitchers?/g,'pitcher').replace(/pitching/g,'pitch').replace(/stealing/g,'steal').replace(/walks/g,'walk').replace(/[^a-z0-9#]+/g,' ').trim();}
  function expandQuery(q){let s=norm(q);for(const [canon,aliases] of Object.entries(ALIASES)){const all=[canon,...aliases].map(norm);if(all.some(a=>s===a||s.includes(a)))s+=' '+norm(canon)+' '+all.join(' ');}return s.replace(/\s+/g,' ').trim();}
  function collect(){const out=[];
    if(typeof divisionRules!=='undefined')Object.entries(divisionRules).forEach(([div,arr])=>(arr||[]).forEach((r,i)=>out.push({div,topic:r.topic||'Rule',q:r.q||'',text:r.text||'',keys:r.keys||'',href:r.href||'',source:r.source||SMGSL,index:i})));
    if(typeof usaTxBase!=='undefined'&&Array.isArray(usaTxBase.rules))usaTxBase.rules.forEach((r,i)=>out.push({div:'all',topic:r.topic||'Rule',q:r.q||'',text:r.text||'',keys:r.keys||'',href:r.href||'',source:USATX,index:i}));
    if(typeof usaTxByDivision!=='undefined')Object.entries(usaTxByDivision).forEach(([div,arr])=>(arr||[]).forEach((r,i)=>out.push({div,topic:r.topic||'Rule',q:r.q||'',text:r.text||'',keys:r.keys||'',href:r.href||'',source:r.source||USATX,index:i})));
    const seen=new Set();return out.filter(r=>{const k=[r.div,r.source,norm(r.topic),norm(r.q),norm(r.text)].join('|');if(seen.has(k))return false;seen.add(k);return true;});
  }
  function sourceLink(r){if(r.href)return r.href;if(r.source===USATX)return typeof USA_RULEBOOK!=='undefined'?USA_RULEBOOK:(typeof USATX_JO!=='undefined'?USATX_JO:'#');return typeof RULEBOOK!=='undefined'?RULEBOOK:'#';}
  function score(r,query){const q=expandQuery(query);if(!q)return 0;const raw=norm(query);const topic=norm(r.topic),question=norm(r.q),keys=norm(r.keys),answer=norm(r.text);const hay=`${topic} ${question} ${keys} ${answer} ${norm(r.div)} ${norm(r.source)}`;let score=0;
    if(topic===raw)score+=160;if(question===raw)score+=140;if(topic.includes(raw))score+=95;if(question.includes(raw))score+=80;if(keys.includes(raw))score+=65;if(hay.includes(raw))score+=45;
    const toks=[...new Set(q.split(' ').filter(t=>t.length>1&&!STOP.has(t)))];
    toks.forEach(t=>{if(topic.split(' ').includes(t))score+=18;else if(question.split(' ').includes(t))score+=15;else if(keys.split(' ').includes(t))score+=12;else if(hay.split(' ').includes(t))score+=8;else if(hay.includes(t))score+=3;});
    const direct=[...Object.entries(ALIASES)].find(([canon,aliases])=>[canon,...aliases].map(norm).some(a=>raw===a));if(direct&&hay.includes(norm(direct[0])))score+=100;
    return score;
  }
  function card(r){const label=divLabel[r.div]||String(r.div||'').toUpperCase();return `<article class="rule-card official-result"><div class="rule-topic">${esc(label)} • ${esc(r.topic)}</div><div class="rule-question">${esc(r.q)}</div><div class="rule-answer">${esc(r.text)}</div><div class="source-row"><span class="pill">${esc(r.source)}</span><a class="source-link" href="${sourceLink(r)}" target="_blank" rel="noopener">Open official source</a></div></article>`;}
  function searchRules(q,division='all',source='all'){let rules=collect();if(division!=='all')rules=rules.filter(r=>r.div===division||r.div==='all');if(source==='smgsl')rules=rules.filter(r=>r.source===SMGSL);if(source==='usatx')rules=rules.filter(r=>r.source===USATX);return rules.map(r=>({r,s:score(r,q)})).filter(x=>x.s>0).sort((a,b)=>b.s-a.s||String(a.r.topic).localeCompare(String(b.r.topic))).slice(0,12).map(x=>x.r);}
  const calls=['Interference','Obstruction','Look Back','Dropped 3rd','Infield Fly','Illegal Pitch','Leaving Early','Stealing','Bunt','Hit by Pitch','Appeal','Courtesy Runner'];
  function install(){
    if(typeof views==='undefined'||typeof bind!=='function')return;
    views.rulelookup={title:'Fast Rule Lookup',html:`<div class="notice"><b>Built for live games:</b> type the umpire's call or 1–3 keywords. Results search every loaded SMGSL and USA Softball TX/NM rule word, question, answer and keyword immediately on this phone.</div><div class="official-search-box"><input id="officialRuleQuery" class="rule-search" inputmode="search" enterkeyhint="search" placeholder="Call or keyword: interference, look back, HBP…" autocomplete="off" autocorrect="off" spellcheck="false"><div class="rule-filters"><select id="officialRuleDivision"><option value="all">All divisions</option><option value="blast">Blast Ball</option><option value="6u">6U</option><option value="8u">8U</option><option value="10u">10U</option><option value="12u">12U</option><option value="mx">MX</option></select><select id="officialRuleSource"><option value="all">Both approved sources</option><option value="smgsl">SMGSL Rules</option><option value="usatx">USA Softball TX/NM</option></select></div><div class="quick-rule-examples">${calls.map(x=>`<button type="button" data-fast-rule="${esc(x)}">${esc(x)}</button>`).join('')}</div><div id="officialRuleResults" class="rule-search-results"><div class="empty">Type the call or tap a common call above.</div></div></div>`};
    const oldBind=bind;bind=function(){oldBind();if(current!=='rulelookup')return;const q=document.querySelector('#officialRuleQuery'),d=document.querySelector('#officialRuleDivision'),s=document.querySelector('#officialRuleSource'),out=document.querySelector('#officialRuleResults');if(!q||!d||!s||!out)return;const run=()=>{const val=q.value.trim();if(!val){out.innerHTML='<div class="empty">Type the call or tap a common call above.</div>';return;}const rows=searchRules(val,d.value,s.value);out.innerHTML=rows.length?rows.map(card).join(''):`<div class="empty">No indexed match for “${esc(val)}”. Try a shorter call word or change the division/source filter.</div>`;};q.addEventListener('input',run,{passive:true});d.addEventListener('change',run);s.addEventListener('change',run);document.querySelectorAll('[data-fast-rule]').forEach(b=>b.addEventListener('click',()=>{q.value=b.dataset.fastRule;run();q.focus();}));setTimeout(()=>q.focus(),50);};
    const btn=document.querySelector('[data-view="rules"]');if(btn){btn.textContent='Fast Rule Lookup';btn.onclick=()=>render('rulelookup');}
  }
  setTimeout(install,0);
})();
