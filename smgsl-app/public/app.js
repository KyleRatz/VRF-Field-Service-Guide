const RULEBOOK='https://dt5602vnjxv0c.cloudfront.net/portals/3766/docs/south%20montgomery%20girls%20softball%20league%20rules%20updated%20fall%202025.pdf';
const BYLAWS='/2025-smgsl-bylaws.html';
const views={
rules:{title:'League Rules',html:`<div class="notice">The official SMGSL rulebook is the controlling source. The current linked copy is marked <b>Updated Fall 2025</b>.</div><a class="doclink" href="${RULEBOOK}" target="_blank" rel="noopener">Open Full 34-Page League Rulebook</a><h3>Rulebook index</h3><div class="rules">Facility Use & Park Operations
Registration Procedures
Players
Managers & Coaches
Player Selections / Draft
Season Playing Schedule
General Game Rules
6U Playing Rules
8U Playing Rules
10U Playing Rules
12U Playing Rules
Mixed Division Playing Rules
Field Chalking Directions</div><details><summary>Park-rule quick reference</summary><div class="rules">• SMGSL facility is tobacco-free and alcohol-free.
• Abusive, harassing, or foul language is prohibited.
• Wall ball is not allowed.
• Pets are not allowed on SMGSL grounds.
• No climbing fences.
• Do not hit or throw softballs into chain-link fences.
• Managers/coaches may not practice on a field declared unplayable.</div></details>`},
blast:{title:'Blast Ball Rules — Amended Fall 2026',html:`<div class="rules"><b>Game</b>
• 3 innings or 50 minutes. No new inning after 50 minutes; an inning already started is completed.
• Scores and standings are not kept.

<b>Field</b>
• Bases: 60 ft.
• Pitching rubber: 30 ft from back of home plate.
• Chalk a 17.5-ft arc from first-base foul line to third-base line.

<b>Equipment</b>
• Each team supplies 1 game ball; 11-in tee ball.
• T-ball bats are acceptable.
• Batters/runners wear helmets with attached face masks.
• Pitching facemask required for pitchers.
• Post earrings allowed; no hoops/dangling earrings. Simple chain necklace allowed; no other jewelry or watches. No cell phones on the field.
• Each team must have a first-aid kit at practices and games.
• Double first base highly recommended.
• No metal cleats.

<b>Rosters</b>
• Recommended 7–10 players; minimum 5 unless registration numbers are low.
• No player sits out on defense. At least half of a player's defensive innings in the infield is highly recommended, subject to safety/player preference.

<b>Team Formation</b>
• Players are pre-assigned by Division Director or Registration Coordinator.
• Group by school/home address when possible.

<b>Batting</b>
• Running batting order includes all players.
• Order may start with a different player each time at bat, but order remains the same.
• Late player goes to end of batting order.
• Injured/ill player may re-enter in original batting-order position.
• Half inning ends after all offensive players bat.
• Each batter gets up to 5 tee swings.
• Warn players for throwing the bat.
• Batted ball must pass the 17.5-ft chalk line to be fair.

<b>Pitching</b>
• A player fields the pitcher position but does not pitch to the batter.
• Pitcher begins each play with both feet on the pitching rubber.
• If pitcher fields the ball, she must throw to first to record the out; she may not run the ball to first or tag the batter-runner.
• Tee is used for the entire game.

<b>Base Running</b>
• One base may be achieved on a batted ball.
• No advancement on overthrows; no stealing.
• Runners may leave when ball is put into play.
• No plays at home plate.
• Last batter circles the bases after putting ball in play.
• Double first base highly recommended. Defense normally uses white base; if throw is outside fair territory, fielder may use orange base.

<b>Defense / Fielding</b>
• If rosters allow: 9 defensive players — P, 1B, 2B, SS, 3B and 4 outfielders.
• No catcher is positioned on the field of play.
• Rotate players to different positions.
• No player may play more than 3 innings total at P, 1B and SS combined.
• Outfielders start 3 steps behind baseline until ball is put in play.
• Infielders stay no more than 5 ft in front of baseline until ball is put in play.
• Fielders may not stand in a baseline at start of play when runners are advancing to that base.
• Infield fly rule does not apply.
• Offensive coach acts as catcher to assist batters/load tee.
• Two defensive coaches may be on field behind infielders and may not obstruct outfielders.

<b>Coaches</b>
• Coaches in dugout/on field must have background check and ACE certification; ACE badge worn during games.

<b>Umpires</b>
• No official umpires are used. Keep games fun, positive and enjoyable.</div>`},
bylaws:{title:'2025 SMGSL By-Laws',html:`<div class="notice">Official 2025 bylaws, July 2025. The complete 20-page text is available directly in this app.</div><a class="doclink" href="${BYLAWS}" target="_blank" rel="noopener">Open Complete 2025 SMGSL Bylaws</a><h3>Board quick reference</h3><div class="rules">• SMGSL is a Texas nonprofit in Montgomery County and follows USA Softball except where League rules supersede.
• Purpose: organized/supervised competitive softball emphasizing fair competition, sportsmanship and fun; winning is secondary.
• Board meets monthly. Regular-meeting quorum requires one-half of both Executive Committee and Board of Directors; special-meeting quorum is a majority of the Board.
• Unless otherwise stated, actions require a majority vote of members present when a quorum exists.
• Board terms are one year and expire June 30.
• Executive Committee: President, Secretary, Treasurer, VP Sports, VP Fields/Facilities, Director PR, Director Fundraising, Director Safety.
• Voting coordinators include Scheduling, Team Parent, Registration, Uniforms, Equipment, IT, Special Events/Pictures/Awards, and Year-Round Teams.
• Sports Commission includes Blast Ball, 6U, 8U, 10U, 12U and Mixed commissioners.
• Bylaw amendments require a 2/3 affirmative vote of all board directors in person; proxies are not accepted for amendments.</div><details><summary>Incident / discipline-related bylaw note</summary><div class="rules">The bylaws establish a Disciplinary Committee chaired by the VP of Sports with at least 2 directors/officers and the involved division commissioner when applicable. The committee may solicit statements. Outcome communications require VP Sports approval, or President approval in a conflict-of-interest situation.</div></details>`},
fields:{title:'Available Fields',html:`<p class="muted">Live availability is calculated from the SMGSL calendar for Monday–Friday 5:00–9:30 PM and Sunday 9:00 AM–9:30 PM. It looks ahead 21 days.</p><button class="btn primary" id="refreshFields">Refresh Calendar</button><div id="fieldResults"><div class="empty">Loading field calendar…</div></div>`},
si:{title:'SI Field Usage',html:`<div class="warn">SI is tracked separately and is <b>not part of the SMGSL organization</b>. This view lists calendar events classified as SI when the calendar title/location contains “SI” or “Sports Inc”.</div><button class="btn primary" id="refreshSI">Refresh Calendar</button><div id="siResults"><div class="empty">Loading SI usage…</div></div>`},
incidents:{title:'Incident Reports',html:`<div class="notice">This working version stores reports on the current device only. Use <b>Export</b> to save/share a report until shared board database storage is connected.</div><form id="incidentForm"><div class="incident-grid"><label>Date<input id="irDate" type="date" required></label><label>Time<input id="irTime" type="time"></label><label>Field<input id="irField" placeholder="Field #"></label><label>Division<select id="irDivision"><option>Blast Ball</option><option>6U</option><option>8U</option><option>10U</option><option>12U</option><option>Mixed</option><option>Other</option></select></label><label class="wide">People involved<input id="irPeople" placeholder="Names / roles"></label><label class="wide">Incident description<textarea id="irDesc" required placeholder="What happened?"></textarea></label><label class="wide">Witnesses<textarea id="irWitness" placeholder="Witness names / statements"></textarea></label><label class="wide">Action taken<textarea id="irAction" placeholder="Immediate action, board follow-up, medical care, etc."></textarea></label></div><div class="actions"><button class="btn primary" type="submit">Save Report</button><button class="btn secondary" type="button" id="exportReports">Export All</button></div></form><h3>Saved on this device</h3><div id="reportList"></div>`}
};
const content=document.querySelector('#content');const search=document.querySelector('#search');let current='rules';
function render(key){current=key;const v=views[key];content.innerHTML=`<section class="panel" data-search="${(v.title+' '+v.html).replace(/<[^>]+>/g,' ')}"><h2>${v.title}</h2>${v.html}</section>`;bind();if(search.value)applySearch();}
document.querySelectorAll('[data-view]').forEach(b=>b.addEventListener('click',()=>render(b.dataset.view)));
function applySearch(){const q=search.value.trim().toLowerCase();if(!q)return;const candidates=Object.entries(views).filter(([k,v])=>(v.title+' '+v.html.replace(/<[^>]+>/g,' ')).toLowerCase().includes(q));if(candidates.length&&!candidates.some(([k])=>k===current))render(candidates[0][0]);}
search.addEventListener('input',applySearch);
function fmt(d){return new Date(d).toLocaleString([], {weekday:'short',month:'short',day:'numeric',hour:'numeric',minute:'2-digit'});}async function loadFields(target,siOnly=false){const el=document.querySelector(target);if(!el)return;el.innerHTML='<div class="empty">Refreshing calendar…</div>';try{const r=await fetch('/api/fields');const d=await r.json();if(!r.ok)throw new Error(d.error||'Calendar error');if(siOnly){el.innerHTML=d.si.length?d.si.map(x=>`<div class="usage"><b>${x.field}</b><span>${fmt(x.start)}–${new Date(x.end).toLocaleTimeString([], {hour:'numeric',minute:'2-digit'})}<br><span class="small">${x.summary||''}</span></span></div>`).join(''):'<div class="empty">No SI-labeled events found in the current 21-day window.</div>';return;}const groups={};d.slots.forEach(x=>{const day=new Date(x.start).toLocaleDateString([], {weekday:'long',month:'short',day:'numeric'});(groups[day]??=[]).push(x)});el.innerHTML=Object.entries(groups).map(([day,arr])=>`<div class="field-date">${day}</div>${arr.map(x=>`<div class="slot"><b>${x.field}</b><span>${new Date(x.start).toLocaleTimeString([], {hour:'numeric',minute:'2-digit'})} – ${new Date(x.end).toLocaleTimeString([], {hour:'numeric',minute:'2-digit'})}</span></div>`).join('')}`).join('')||'<div class="empty">No open field windows found.</div>';}catch(e){el.innerHTML=`<div class="warn">Could not read the calendar: ${e.message}</div>`;}}
function reports(){try{return JSON.parse(localStorage.getItem('smgsl_incidents')||'[]')}catch{return []}}function saveReports(v){localStorage.setItem('smgsl_incidents',JSON.stringify(v))}function renderReports(){const el=document.querySelector('#reportList');if(!el)return;const r=reports();el.innerHTML=r.length?r.slice().reverse().map((x,i)=>`<div class="report"><div><b>${x.date||'No date'} — ${x.division||''}</b><div class="small">${x.field||''} ${x.people?'• '+x.people:''}</div><div>${x.desc}</div></div><span class="pill">Saved</span></div>`).join(''):'<div class="empty">No incident reports saved on this device.</div>'}
function bind(){document.querySelector('#refreshFields')?.addEventListener('click',()=>loadFields('#fieldResults'));document.querySelector('#refreshSI')?.addEventListener('click',()=>loadFields('#siResults',true));if(current==='fields')loadFields('#fieldResults');if(current==='si')loadFields('#siResults',true);const f=document.querySelector('#incidentForm');if(f){document.querySelector('#irDate').value=new Date().toISOString().slice(0,10);f.addEventListener('submit',e=>{e.preventDefault();const item={date:irDate.value,time:irTime.value,field:irField.value,division:irDivision.value,people:irPeople.value,desc:irDesc.value,witness:irWitness.value,action:irAction.value,created:new Date().toISOString()};const r=reports();r.push(item);saveReports(r);f.reset();irDate.value=new Date().toISOString().slice(0,10);renderReports()});document.querySelector('#exportReports').addEventListener('click',()=>{const blob=new Blob([JSON.stringify(reports(),null,2)],{type:'application/json'});const a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download='SMGSL-Incident-Reports.json';a.click();setTimeout(()=>URL.revokeObjectURL(a.href),1000)});renderReports();}}
render('rules');
window.addEventListener('load',()=>{
  const script=document.createElement('script');
  script.src='/rule-bylaw-routing-v25.js?v=25';
  script.onload=()=>{if(current==='rules'||current==='rulelookup')render('rulelookup');else if(current==='bylaws')render('bylaws');};
  document.body.appendChild(script);
},{once:true});
