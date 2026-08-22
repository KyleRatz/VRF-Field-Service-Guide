// USA Softball of Texas/New Mexico integration for SMGSL Board Hub.
// Official association source supplied by the board: https://usasoftballoftexas.com/pages/home
const USATX_HOME='https://usasoftballoftexas.com/pages/home';
const USATX_JO='https://usasoftballoftexas.com/pages/cms/jo-rules';
const USATX_SOURCE='USA Softball of Texas/New Mexico';

const usaTxBase={
  source:USATX_SOURCE,
  rules:[
    {topic:'Rule hierarchy',q:'Which rules control?',text:'For SMGSL league play, use SMGSL rules first. Where SMGSL does not address an issue, use the applicable USA Softball of Texas/New Mexico rule or published association exception. No other sanctioning-body rule set is used in this Board Hub.',keys:'rule hierarchy controlling rules usa softball texas new mexico smgsl local rule sanction'},
    {topic:'Age groups',q:'What USA Softball of Texas/New Mexico JO age groups are offered?',text:'The association JO structure includes 6U, 8U, 10U, 12U, 14U, 16U and 18U age groups.',keys:'age groups jo youth 6u 8u 10u 12u 14u 16u 18u'},
    {topic:'Coaches',q:'What certifications do coaches need?',text:'Use the current USA Softball of Texas/New Mexico requirements published on the association JO Rules page for background checks, SafeSport and ACE requirements.',keys:'coach ace background check safesport certification adult dugout field'},
    {topic:'Association exceptions',q:'Are there Texas/New Mexico-specific championship rules?',text:'Use the official USA Softball of Texas/New Mexico JO Rules page for current association Championship-play exceptions and division-specific documents.',keys:'texas new mexico exceptions championship pixie 10u 12u 14u rules'}
  ]
};

const usaTxByDivision={
  '6u':[
    {topic:'USA TX/NM classification',q:'What association age group applies to 6U?',text:'6U is an association JO age group. For SMGSL league play, apply the SMGSL 6U local rules first and use USA Softball of Texas/New Mexico rules where the SMGSL rulebook is silent.',keys:'6u usa texas new mexico jo local rules hierarchy'},
    {topic:'Association exception note',q:'Does the association publish special younger-division rules?',text:'Check the official USA Softball of Texas/New Mexico JO Rules page for current younger-division and Championship-play documents. SMGSL local 6U rules remain controlling for SMGSL league games where adopted.',keys:'pixie texas new mexico rules 6u championship younger division'}
  ],
  '8u':[
    {topic:'USA TX/NM classification',q:'What association age group applies to 8U?',text:'8U is an association JO age group. For SMGSL league play, apply the SMGSL 8U local rules first and use USA Softball of Texas/New Mexico rules where the SMGSL rulebook is silent.',keys:'8u usa texas new mexico jo local rules hierarchy'},
    {topic:'Association exception note',q:'Where do I check association-specific 8U rules?',text:'Use the USA Softball of Texas/New Mexico JO Rules page for current association exceptions and Championship-play documents.',keys:'8u texas new mexico exception championship rules'}
  ],
  '10u':[
    {topic:'USA TX/NM classification',q:'What association age group applies to 10U?',text:'10U is an association JO age group. For SMGSL league play, apply the SMGSL 10U local rules first and use USA Softball of Texas/New Mexico rules where the SMGSL rulebook is silent.',keys:'10u usa texas new mexico jo local rules hierarchy'},
    {topic:'Association exception note',q:'Are there special association 10U rules?',text:'Check the USA Softball of Texas/New Mexico JO Rules page for the current 10U association and Championship-play documents.',keys:'10u texas new mexico updated rules championship exception'}
  ],
  '12u':[
    {topic:'USA TX/NM classification',q:'What association age group applies to 12U?',text:'12U is an association JO age group. For SMGSL league play, apply the SMGSL 12U local rules first and use USA Softball of Texas/New Mexico rules where the SMGSL rulebook is silent.',keys:'12u usa texas new mexico jo local rules hierarchy'},
    {topic:'Association exception note',q:'Are there special association 12U rules?',text:'Check the USA Softball of Texas/New Mexico JO Rules page for the current 12U association and Championship-play documents.',keys:'12u texas new mexico updated rules championship exception'}
  ],
  'mx':[
    {topic:'USA TX/NM classification',q:'How does MX map to USA Softball of Texas/New Mexico?',text:'SMGSL Mixed covers older youth ages while association JO play separates older players into age-specific divisions such as 14U, 16U and 18U. Use the applicable USA Softball of Texas/New Mexico division for sanctioned play.',keys:'mx mixed 14u 16u 18u usa texas new mexico jo older division'},
    {topic:'Tournament note',q:'Which association rules apply to MX tournament play?',text:'Use the age-appropriate USA Softball of Texas/New Mexico division and its current published association exceptions. SMGSL Mixed house rules apply to SMGSL league play where adopted.',keys:'mx tournament 14u 16u 18u championship texas new mexico rules'}
  ]
};

Object.entries(usaTxByDivision).forEach(([div,items])=>{
  if(Array.isArray(divisionRules?.[div])) divisionRules[div].push(...items.map(x=>({...x,source:USATX_SOURCE})));
});

views.usatx={title:'USA Softball of Texas/New Mexico Rules',html:`
<div class="notice"><b>Approved rule sources for this Board Hub:</b> SMGSL rules and USA Softball of Texas/New Mexico rules only. SMGSL local rules control SMGSL league play where adopted.</div>
<div class="rule-search-wrap"><input id="usaTxSearch" class="rule-search" placeholder="Search USA Softball TX/NM: SafeSport, ACE, 10U, championship…"><div id="usaTxResults" class="rule-search-results"></div></div>
${usaTxBase.rules.map(r=>`<article class="rule-card"><div class="rule-topic">${r.topic}</div><div class="rule-question">${r.q}</div><div class="rule-answer">${r.text}</div><div class="small">Source: ${USATX_SOURCE}</div></article>`).join('')}
<div class="division-grid"><button data-ruleview="6u">6U</button><button data-ruleview="8u">8U</button><button data-ruleview="10u">10U</button><button data-ruleview="12u">12U</button><button data-ruleview="mx">MX</button></div>
<a class="doclink" href="${USATX_JO}" target="_blank" rel="noopener">Open USA Softball of Texas/New Mexico JO Rules</a>
<a class="doclink" href="${USATX_HOME}" target="_blank" rel="noopener">Open USA Softball of Texas/New Mexico Website</a>`};

const oldCardsFor=cardsFor;
cardsFor=function(div){return divisionRules[div].map((r,i)=>`<article class="rule-card" data-rule="${div}" data-index="${i}"><div class="rule-topic">${r.topic}</div><div class="rule-question">${r.q}</div><div class="rule-answer">${r.text}</div>${r.source?`<div class="small">Source: ${r.source}</div>`:''}</article>`).join('')};
Object.keys(divNames).forEach(div=>{views[div]={title:`${divNames[div]} Division Rules`,html:`<div class="notice">This division search uses only <b>SMGSL rules</b> and <b>USA Softball of Texas/New Mexico</b> rules. SMGSL local rules control league play where adopted.</div><div class="rule-search-wrap"><input class="rule-search" data-div="${div}" placeholder="Ask a rule: how many innings can a pitcher pitch?"><div class="rule-search-results"></div></div>${cardsFor(div)}<a class="doclink" href="${RULEBOOK}" target="_blank" rel="noopener">Open SMGSL Rulebook</a><a class="doclink" href="${USATX_JO}" target="_blank" rel="noopener">Open USA Softball of Texas/New Mexico JO Rules</a>`}});

setTimeout(()=>{
  document.querySelectorAll('[data-ruleview]').forEach(b=>b.addEventListener('click',()=>render(b.dataset.ruleview)));
  const box=document.querySelector('#usaTxSearch');
  if(box){const out=document.querySelector('#usaTxResults');box.addEventListener('input',()=>{const q=normalizeRuleQuery(box.value.trim());if(!q){out.innerHTML='';return;}const toks=q.split(/\s+/).filter(Boolean);const all=[...usaTxBase.rules,...Object.entries(usaTxByDivision).flatMap(([div,arr])=>arr.map(r=>({...r,div})))];const scored=all.map(r=>{const hay=normalizeRuleQuery(`${r.q} ${r.text} ${r.keys||''} ${r.div||''}`);let score=0;toks.forEach(t=>{if(hay.includes(t))score++});return {r,score}}).filter(x=>x.score>0).sort((a,b)=>b.score-a.score).slice(0,12);out.innerHTML=scored.length?scored.map(({r})=>`<article class="rule-card"><div class="rule-topic">${r.div?divNames[r.div]+' • ':''}${r.topic}</div><div class="rule-question">${r.q}</div><div class="rule-answer">${r.text}</div></article>`).join(''):'<div class="empty">No match. Try age group, pitching, SafeSport, ACE, or championship.</div>';});}
},0);
