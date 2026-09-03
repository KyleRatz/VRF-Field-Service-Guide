// v21: include controlling SMGSL general player/game rules in every division search.
(function(){
  const DIVS=[['6u','6U'],['8u','8U'],['10u','10U'],['12u','12U'],['mx','MX']];
  const IDS=DIVS.map(([d])=>d), LABELS=Object.fromEntries(DIVS);
  const SMGSL='SMGSL Rules';
  const USATX=typeof USATX_SOURCE!=='undefined'?USATX_SOURCE:'USA Softball of Texas/New Mexico';
  const GENERAL=[
    {
      div:'all',source:SMGSL,topic:'Team Activity Limit — Spring / General Rule',
      q:'How many team activities are allowed each week?',
      text:'Each team is allowed four (4) team activities per week, Monday through Sunday. An activity includes a practice or game. A manager found guilty of breaking the limit is suspended from team activities for the next week. Tournament teams and make-up games are excepted. For Fall, Article XIV changes the limit to three (3) activities per week, Sunday through Saturday.',
      keys:'4 four weekly activity activities team activity team activities activity limit event events weekly event limit practice practices game games per week monday sunday softball activities maximum max allowed',
      href:typeof RULEBOOK!=='undefined'?`${RULEBOOK}#page=17`:''
    },
    {
      div:'all',source:SMGSL,topic:'Team Activity Limit — Fall',
      q:'How many team activities are allowed each week during Fall?',
      text:'Article XIV adapts Article V, Section 3.B for Fall: each team is allowed three (3) team activities per week, Sunday through Saturday.',
      keys:'3 three fall weekly activity activities team activity team activities activity limit event events practice practices game games per week sunday saturday softball activities maximum max allowed',
      href:typeof RULEBOOK!=='undefined'?`${RULEBOOK}#page=32`:''
    },
    {
      div:'all',source:SMGSL,topic:'Minimum Playing Time',
      q:'What is the minimum playing time for each player?',
      text:'Each girl must play at least two full innings (6 outs) each game, provided she has attended practices and otherwise qualifies under League rules. If a girl does not start one game, she must start the next. A minimum-play violation carries the corrective and game-result consequences stated in Article II, Section 9.',
      keys:'playtime playing time minimum play minimum playing time participation defensive innings two innings 2 innings six outs 6 outs start next game sit bench',
      href:typeof RULEBOOK!=='undefined'?RULEBOOK:''
    },
    {
      div:'all',source:SMGSL,topic:'Minimum Playing Time — Corrective Requirement',
      q:'What happens if a player did not receive her minimum playing time?',
      text:'A player who failed to receive minimum playing time must start and play four defensive innings and/or the entire game immediately following discovery of the minimum-play violation. See Article II, Section 9 for the complete controlling language.',
      keys:'playtime playing time minimum play violation four defensive innings 4 innings next game corrective penalty',
      href:typeof RULEBOOK!=='undefined'?RULEBOOK:''
    },
    {
      div:'all',source:SMGSL,topic:'Bench Time',
      q:'Can one player sit the bench more than another player?',
      text:'In the spirit of league play, no individual girl will sit the bench more than any other girl on the team during a single game, except for disciplinary reasons as stated in Article VI, Section 13.',
      keys:'playtime playing time bench time bench sit sitting out sit out equal playing time participation defensive innings',
      href:typeof RULEBOOK!=='undefined'?RULEBOOK:''
    },
    {
      div:'all',source:SMGSL,topic:'Free Substitution / Batting',
      q:'Does every player bat?',
      text:'All players will bat, except for injuries, illness, or disciplinary action. If the game ends before a player has had an opportunity to bat, the rule provides that she must be given an opportunity to bat without changing the outcome. See Article II, Section 10 for the complete controlling language.',
      keys:'all players bat everyone bats batting lineup free substitution playtime playing time participation at bat',
      href:typeof RULEBOOK!=='undefined'?RULEBOOK:''
    }
  ];
  const ALIASES={
    'playing time':['playtime','playing time','minimum play','minimum playing time','sit out','sitting out','bench time','bench','defensive innings','participation','equal play','equal playing time'],
    'look back':['lookback','look-back','look back','circle rule'],
    'dropped third strike':['dropped 3rd','dropped third','uncaught third strike','uncaught 3rd strike'],
    'obstruction':['blocking plate','blocked plate','blocking base','blocked base','fielder in way','catcher blocking'],
    'hit by pitch':['hbp','hit batter','batter hit','batter struck by pitched ball','pitch hits batter','hit with pitch'],
    'pitcher innings':['pitching limit','pitcher limit','innings limit'],
    'game time':['time limit','game length','no new inning'],
    'run limit':['runs per inning','5 runs','five runs'],
    'courtesy runner':['substitute runner','runner for pitcher','runner for catcher'],
    'team activity limit':['weekly activities','weekly activity','activities per week','activity per week','team activities','team activity','weekly events','events per week','practice and game limit','practice game limit']
  };
  const STOP=new Set(['a','an','and','are','as','at','be','by','can','do','does','for','from','how','if','in','is','it','may','of','on','or','the','to','what','when','where','who','with']);
  function esc(v){return String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot',"'":'&#39;'}[c]));}
  function norm(v){return String(v||'').toLowerCase().replace(/10\s*&?\s*under|10u/g,'10u').replace(/12\s*&?\s*under|12u/g,'12u').replace(/8\s*&?\s*under|8u/g,'8u').replace(/6\s*&?\s*under|6u/g,'6u').replace(/mixed division|mixed/g,'mx').replace(/3rd/g,'third').replace(/innings?/g,'inning').replace(/players?/g,'player').replace(/activities?/g,'activity').replace(/events?/g,'event').replace(/weekly/g,'week').replace(/practices?/g,'practice').replace(/games?/g,'game').replace(/pitching/g,'pitch').replace(/stealing/g,'steal').replace(/walks/g,'walk').replace(/runs/g,'run').replace(/[^a-z0-9]+/g,' ').trim();}
  function concept(q){const raw=norm(q);for(const [canon,terms] of Object.entries(ALIASES)){if([canon,...terms].map(norm).some(t=>raw===t||raw.includes(t)))return norm(canon);}return raw;}
  function rows(){
    const base=(window.SMGSLRuleSearchV20&&typeof window.SMGSLRuleSearchV20.collect==='function')?window.SMGSLRuleSearchV20.collect():[];
    const all=[...GENERAL,...base]; const seen=new Set();
    return all.filter(r=>{const k=[r.div,r.source,norm(r.topic),norm(r.q),norm(r.text)].join('|');if(seen.has(k))return false;seen.add(k);return true;});
  }
  function score(r,q){
    const raw=norm(q), c=concept(q); if(!raw)return 1;
    const topic=norm(r.topic), question=norm(r.q), keys=norm(r.keys), text=norm(r.text), hay=`${topic} ${question} ${keys} ${text}`;
    let s=0;
    if(hay.includes(c))s+=120;
    if(topic.includes(c))s+=90;
    if(question.includes(c))s+=70;
    if(keys.includes(c))s+=60;
    const toks=raw.split(/\s+/).filter(t=>(t.length>1||/^\d+$/.test(t))&&!STOP.has(t));
    const matched=toks.filter(t=>hay.split(/\s+/).includes(t)).length;
    if(toks.length&&matched===toks.length)s+=50+matched*8;
    else if(matched)s+=matched*6;
    if(topic.includes('team activity limit fall'))s+=raw.includes('fall')?80:-10;
    if(topic.includes('team activity limit spring')&&!raw.includes('fall'))s+=25;
    if(r.source===SMGSL)s+=8;
    return s;
  }
  function search(q,div){return rows().filter(r=>r.div===div||r.div==='all').map(r=>({r,s:score(r,q)})).filter(x=>!q||x.s>=30).sort((a,b)=>b.s-a.s||(a.r.source===SMGSL?-1:1)||String(a.r.topic).localeCompare(String(b.r.topic))).map(x=>x.r);}
  function sourceLink(r){if(r.href)return r.href;if(r.source===USATX)return typeof USA_RULEBOOK!=='undefined'?USA_RULEBOOK:(typeof USATX_JO!=='undefined'?USATX_JO:'#');return typeof RULEBOOK!=='undefined'?RULEBOOK:'#';}
  function card(r,div){const label=r.div==='all'?`${LABELS[div]} • Applies to all SMGSL divisions`:(LABELS[r.div]||String(r.div).toUpperCase());return `<article class="rule-card official-result"><div class="rule-topic">${esc(label)} • ${esc(r.topic)}</div><div class="rule-question">${esc(r.q)}</div><div class="rule-answer">${esc(r.text)}</div><div class="source-row"><span class="pill">${esc(r.source)}</span><a class="source-link" href="${esc(sourceLink(r))}" target="_blank" rel="noopener">Open official source</a></div></article>`;}
  function build(div,label){if(typeof views==='undefined')return;views[div]={title:`${label} Division Rules`,html:`<div class="notice"><b>${label} is locked as the division filter.</b> Search includes ${label}-specific rules plus SMGSL general player/game rules and USA Softball rules that apply to ${label}. Rules from other divisions are excluded.</div><div class="rule-search-wrap"><input id="v21-${div}" class="rule-search" inputmode="search" enterkeyhint="search" placeholder="Search ${label}: playtime, bench time, pitching, stealing…" autocomplete="off" autocorrect="off" spellcheck="false"><div id="v21-out-${div}" class="rule-search-results"></div></div><div class="small v20-search-note">Applicable ${label} rules are shown below. Type to narrow the list.</div>`};}
  DIVS.forEach(([d,l])=>build(d,l));
  function bindDiv(div){const q=document.querySelector(`#v21-${div}`),out=document.querySelector(`#v21-out-${div}`);if(!q||!out)return;const run=()=>{const val=q.value.trim(),found=search(val,div);out.innerHTML=found.length?found.slice(0,60).map(r=>card(r,div)).join(''):`<div class="empty"><b>No matching ${LABELS[div]} rule found for “${esc(val)}”.</b><br>No unrelated division rules are substituted.</div>`;};q.addEventListener('input',run,{passive:true});run();}
  if(typeof bind==='function'){const previous=bind;bind=function(){previous();if(typeof current!=='undefined'&&IDS.includes(current))bindDiv(current);};}
  window.SMGSLRuleSearchV21={search,rows,norm};
})();
