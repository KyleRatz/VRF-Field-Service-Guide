// USA Softball of Texas / JO integration for SMGSL Board Hub.
// Source roadmap: https://usasoftballoftexas.com/pages/cms/jo-rules
const USATX_HOME='https://usasoftballoftexas.com/pages/home';
const USATX_JO='https://usasoftballoftexas.com/pages/cms/jo-rules';
const USA_2025='https://www.usasoftball.com/wp-content/uploads/sites/120/2025/01/USAS-2025-Rulebook_digital67.pdf';

const usaTxBase={
  source:'USA Softball of Texas',
  rules:[
    {topic:'Rule hierarchy',q:'Which rules control?',text:'For SMGSL league play, SMGSL rules supersede USA Softball where SMGSL has adopted a specific local rule. Otherwise, use the applicable USA Softball rule. USA Softball of Texas states that Championship play is governed by the 2025 USA Softball Official Rules of Softball, with Texas-specific exceptions.',keys:'rule hierarchy controlling rules usa softball texas smgsl supersede local rule championship'},
    {topic:'Age groups',q:'What USA Softball of Texas JO age groups are offered?',text:'USA Softball of Texas JO lists 6U, 8U, 10U, 12U, 14U, 16U and 18U age groups.',keys:'age groups jo youth 6u 8u 10u 12u 14u 16u 18u'},
    {topic:'Coaches',q:'What certifications do USA Softball coaches need?',text:'USA Softball of Texas requires adult coaches to clear the USA Softball background check and complete SafeSport before participating. The Texas JO page also states each JO team must have at least one ACE-certified coach within the field of play/dugout.',keys:'coach ace background check safesport certification adult dugout field'},
    {topic:'Texas exceptions',q:'Are there Texas-specific championship rules?',text:'Yes. USA Softball of Texas publishes local Championship-play exceptions in addition to the national rulebook, including separate Pixie rules and updated 10U/12U/14U B & C rules. Use the official Texas JO Rules page for the current exception documents.',keys:'texas exceptions championship pixie 10u 12u 14u b c rules'}
  ]
};

const usaTxByDivision={
  '6u':[
    {topic:'USA TX classification',q:'What USA Texas age group applies to 6U?',text:'6U is an official USA Softball of Texas JO age group. For SMGSL league play, apply the SMGSL 6U local rules first and use USA Softball rules where the SMGSL rulebook is silent.',keys:'6u usa texas jo local rules hierarchy'},
    {topic:'Texas exception note',q:'Does Texas publish special younger-division rules?',text:'USA Softball of Texas publishes a separate Pixie rules document on its JO Rules page. Check that document for Texas Championship play when it applies; SMGSL local 6U rules remain controlling for SMGSL league games where they differ.',keys:'pixie texas rules 6u championship younger division'}
  ],
  '8u':[
    {topic:'USA TX classification',q:'What USA Texas age group applies to 8U?',text:'8U is an official USA Softball of Texas JO age group. For SMGSL league play, apply the SMGSL 8U local rules first and use USA Softball rules where the SMGSL rulebook is silent.',keys:'8u usa texas jo local rules hierarchy'},
    {topic:'Texas exception note',q:'Where do I check Texas-specific 8U rules?',text:'Use the USA Softball of Texas JO Rules page for current Texas Championship-play exceptions and the national USA Softball rulebook for the underlying playing rules.',keys:'8u texas exception championship national rulebook'}
  ],
  '10u':[
    {topic:'USA TX classification',q:'What USA Texas age group applies to 10U?',text:'10U is an official USA Softball of Texas JO age group. For SMGSL league play, apply the SMGSL 10U local rules first and use USA Softball rules where the SMGSL rulebook is silent.',keys:'10u usa texas jo local rules hierarchy'},
    {topic:'Texas exception note',q:'Are there special Texas 10U rules?',text:'Yes. USA Softball of Texas lists an updated 10U/12U/14U B & C rules document on its JO Rules page for local Championship play. Check that current Texas exception document before tournament play.',keys:'10u texas b c updated rules championship exception'}
  ],
  '12u':[
    {topic:'USA TX classification',q:'What USA Texas age group applies to 12U?',text:'12U is an official USA Softball of Texas JO age group. For SMGSL league play, apply the SMGSL 12U local rules first and use USA Softball rules where the SMGSL rulebook is silent.',keys:'12u usa texas jo local rules hierarchy'},
    {topic:'Texas exception note',q:'Are there special Texas 12U rules?',text:'Yes. USA Softball of Texas lists an updated 10U/12U/14U B & C rules document on its JO Rules page for local Championship play. Check that current Texas exception document before tournament play.',keys:'12u texas b c updated rules championship exception'}
  ],
  'mx':[
    {topic:'USA TX classification',q:'How does MX map to USA Softball of Texas?',text:'SMGSL Mixed covers older youth ages while USA Softball of Texas JO separates older players into 14U, 16U and 18U. For an MX player/team entering USA Softball play, use the age-appropriate USA Softball JO division plus any Texas Championship exceptions.',keys:'mx mixed 14u 16u 18u usa texas jo older division'},
    {topic:'Tournament note',q:'Which USA rules apply to MX tournament play?',text:'Use the player/team age classification for 14U, 16U or 18U under USA Softball rules and check USA Softball of Texas for local Championship exceptions. SMGSL Mixed house rules apply to SMGSL league play where adopted.',keys:'mx tournament 14u 16u 18u championship texas rules'}
  ]
};

// Add USA Texas cards to the division data so the existing phone search finds them.
Object.entries(usaTxByDivision).forEach(([div,items])=>{
  if(Array.isArray(divisionRules?.[div])) divisionRules[div].push(...items.map(x=>({...x,source:'USA Softball of Texas'})));
});

views.usatx={title:'USA Softball of Texas / JO Rules',html:`
<div class="notice"><b>Rule hierarchy:</b> SMGSL local rules control SMGSL league play when they specifically differ. USA Softball rules fill in areas the SMGSL rulebook does not address. USA Softball of Texas publishes additional Championship-play exceptions.</div>
<div class="rule-search-wrap"><input id="usaTxSearch" class="rule-search" placeholder="Search USA Texas rules: SafeSport, ACE, 10U, championship…"><div id="usaTxResults" class="rule-search-results"></div></div>
${usaTxBase.rules.map(r=>`<article class="rule-card"><div class="rule-topic">${r.topic}</div><div class="rule-question">${r.q}</div><div class="rule-answer">${r.text}</div><div class="small">Source: USA Softball of Texas</div></article>`).join('')}
<div class="division-grid"><button data-ruleview="6u">6U</button><button data-ruleview="8u">8U</button><button data-ruleview="10u">10U</button><button data-ruleview="12u">12U</button><button data-ruleview="mx">MX</button></div>
<a class="doclink" href="${USATX_JO}" target="_blank" rel="noopener">Open USA Softball of Texas JO Rules</a>
<a class="doclink" href="${USA_2025}" target="_blank" rel="noopener">Open 2025 USA Softball Official Rulebook</a>
<a class="doclink" href="${USATX_HOME}" target="_blank" rel="noopener">Open USA Softball of Texas</a>`};

// Add source labels to cards that came from USA Texas and make the USA Texas page searchable.
const oldCardsFor=cardsFor;
cardsFor=function(div){return divisionRules[div].map((r,i)=>`<article class="rule-card" data-rule="${div}" data-index="${i}"><div class="rule-topic">${r.topic}</div><div class="rule-question">${r.q}</div><div class="rule-answer">${r.text}</div>${r.source?`<div class="small">Source: ${r.source}</div>`:''}</article>`).join('')};
Object.keys(divNames).forEach(div=>{views[div]={title:`${divNames[div]} Division Rules`,html:`<div class="notice">Search both <b>SMGSL local rules</b> and integrated <b>USA Softball of Texas / USA Softball</b> guidance for this division. SMGSL local rules control league play where they specifically differ.</div><div class="rule-search-wrap"><input class="rule-search" data-div="${div}" placeholder="Ask a rule: how many innings can a pitcher pitch?"><div class="rule-search-results"></div></div>${cardsFor(div)}<a class="doclink" href="${RULEBOOK}" target="_blank" rel="noopener">Open SMGSL Rulebook</a><a class="doclink" href="${USATX_JO}" target="_blank" rel="noopener">Open USA Softball of Texas JO Rules</a>`}});

setTimeout(()=>{
  document.querySelectorAll('[data-ruleview]').forEach(b=>b.addEventListener('click',()=>render(b.dataset.ruleview)));
  const box=document.querySelector('#usaTxSearch');
  if(box){const out=document.querySelector('#usaTxResults');box.addEventListener('input',()=>{const q=normalizeRuleQuery(box.value.trim());if(!q){out.innerHTML='';return;}const toks=q.split(/\s+/).filter(Boolean);const all=[...usaTxBase.rules,...Object.entries(usaTxByDivision).flatMap(([div,arr])=>arr.map(r=>({...r,div})))];const scored=all.map(r=>{const hay=normalizeRuleQuery(`${r.q} ${r.text} ${r.keys||''} ${r.div||''}`);let score=0;toks.forEach(t=>{if(hay.includes(t))score++});return {r,score}}).filter(x=>x.score>0).sort((a,b)=>b.score-a.score).slice(0,12);out.innerHTML=scored.length?scored.map(({r})=>`<article class="rule-card"><div class="rule-topic">${r.div?divNames[r.div]+' • ':''}${r.topic}</div><div class="rule-question">${r.q}</div><div class="rule-answer">${r.text}</div></article>`).join(''):'<div class="empty">No match. Try age group, pitching, SafeSport, ACE, or championship.</div>';});}
},0);
