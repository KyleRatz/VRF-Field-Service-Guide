// 2026 Fall SMGSL coach contacts and Outlook Web compose links.
(function(){
  const OUTLOOK_COMPOSE='https://outlook.office.com/mail/deeplink/compose';
  const coaches=[
    {division:'BB',team:'BB-1',first:'Brette',last:'Reagan',email:'brette.reagan4@gmail.com',phone:'713-502-2492'},
    {division:'BB',team:'BB-2',first:'Bryan',last:'Sneed',email:'sneed20@hotmail.com',phone:'909-455-4764'},
    {division:'BB',team:'BB-3',first:'Bianca',last:'DiGulio',email:'brv0923@gmail.com',phone:'254-482-0595'},
    {division:'BB',team:'BB-4',first:'Mindy',last:'Moriarty',email:'mmoriarty2022@gmail.com',phone:'832-498-5870'},
    {division:'6U',team:'06U-1',first:'Sarah',last:'Bremer',email:'sarah.b.d.bremer@gmail.com',phone:'432-213-3098'},
    {division:'6U',team:'06U-2',first:'Trey',last:'Olano',email:'treyolano3@yahoo.com',phone:'346-818-7725'},
    {division:'6U',team:'06U-3',first:'Natalie Brooke',last:'McVarish',email:'nbhauser@gmail.com',phone:'512-293-7342'},
    {division:'6U',team:'06U-4',first:'Chris',last:'Warren',email:'christopherlynnwarren18@gmail.com',phone:'904-710-9290'},
    {division:'6U',team:'06U-5',first:'Derek',last:'Leon',email:'deeleeown@yahoo.com',phone:'505-620-4609'},
    {division:'8U',team:'08U-1',first:'Paul',last:'Goodwin',email:'pgood84@yahoo.com',phone:'832-233-1884'},
    {division:'8U',team:'08U-2',first:'Bobby',last:'Swanson',email:'bobswanson929@gmail.com',phone:'832-516-2222'},
    {division:'8U',team:'08U-3',first:'Paul',last:'Metcalf',email:'paul.metcalfb@gmail.com',phone:'832-627-8130'},
    {division:'8U',team:'08U-4',first:'Brett',last:'Timberlake',email:'brett.timberlake@gmail.com',phone:'832-515-1705'},
    {division:'8U',team:'08U-5',first:'Peyton',last:'Hutchens',email:'peytonhutchens@gmail.com',phone:'713-444-2431'},
    {division:'8U',team:'08U-6',first:'Erica',last:'Felchak',email:'erifel55@yahoo.com',phone:'281-620-0620'},
    {division:'8U',team:'08U-7',first:'Jason',last:'Hulbert',email:'jrhulbert@gmail.com',phone:'281-253-7722'},
    {division:'8U',team:'08U-8',first:'Marcus',last:'Schneider',email:'marcus.schneider8107@gmail.com',phone:'626-321-7591'},
    {division:'10U',team:'10U-1',first:'Chad',last:'Brooks',email:'cbrooks1121@gmail.com',phone:'713-819-9820'},
    {division:'10U',team:'10U-2',first:'Matthew',last:'Tucker',email:'mtucker@freedomplumbingdrain.com',phone:'281-630-3599'},
    {division:'10U',team:'10U-3',first:'Julie',last:'Morton',email:'juliemichellemorton@gmail.com',phone:'832-401-2908'},
    {division:'10U',team:'10U-4',first:'Kyle',last:'Waddell',email:'kwadde08@gmail.com',phone:'281-628-4914'},
    {division:'10U',team:'10U-5',first:'Kyle',last:'Ratz',email:'kyleratz7@gmail.com',phone:'281-217-3451'},
    {division:'10U',team:'10U-6',first:'Andrew',last:'Kabli',email:'campbell.salex@gmail.com',phone:'832-291-8105'},
    {division:'10U',team:'10U-7',first:'Rose',last:'Cabral',email:'mrsjosecabral@yahoo.com',phone:'832-875-7355'},
    {division:'10U',team:'10U-8',first:'Charles',last:'Lane',email:'lane.charles.m@gmail.com',phone:'832-326-5192'},
    {division:'12U',team:'12U-1',first:'Joseph',last:'Nowak',email:'jrnowak1963@gmail.com',phone:'571-276-7225'},
    {division:'12U',team:'12U-2',first:'Ericca',last:'Hedrick',email:'ericca_hedrick@hotmail.com',phone:'832-458-8198'},
    {division:'12U',team:'12U-3',first:'Sean',last:'Howard',email:'sean.howard85@yahoo.com',phone:'801-362-2087'},
    {division:'12U',team:'12U-4',first:'Peter',last:'Shepherd',email:'pdshep44@gmail.com',phone:'409-466-6175'},
    {division:'12U',team:'12U-5',first:'Jose',last:'Calvillo',email:'jose.luis.calvillo42@gmail.com',phone:'806-535-9797'},
    {division:'12U',team:'12U-6',first:'Alyssa',last:'Matchett',email:'amatchett2000@outlook.com',phone:'936-242-9589'},
    {division:'12U',team:'12U-7',first:'Justin',last:'Hendrickson',email:'bluebleeder88@gmail.com',phone:'818-438-4432'},
    {division:'12U',team:'12U-8',first:'Alec',last:'Ornelas',email:'ornelasab6@gmail.com',phone:'346-386-2786'},
    {division:'MX',team:'MX-1',first:'Raymond',last:'Chapa',email:'chanclas2878@yahoo.com',phone:'832-859-8519'},
    {division:'MX',team:'MX-2',first:'Stephen',last:'Garrett',email:'lafamiliagarrett@gmail.com',phone:'713-202-9587'},
    {division:'MX',team:'MX-3',first:'Tedrick',last:'Holmes',email:'tedrickdh@gmail.com',phone:'253-579-9476'},
    {division:'MX',team:'MX-4',first:'Angelina',last:'Arevalo',email:'angelinaarevalo75@gmail.com',phone:'936-766-8102'},
    {division:'MX',team:'MX-5',first:'Johnathon',last:'Talbot',email:'jtalbot@chalks.com',phone:'713-504-6642'},
    {division:'MX',team:'MX-6',first:'Caley',last:'Stadelman',email:'caleystad@gmail.com',phone:'832-515-1438'}
  ];
  const order=['BB','6U','8U','10U','12U','MX'];
  const labels={BB:'Blast Ball','6U':'6U','8U':'8U','10U':'10U','12U':'12U',MX:'MX'};
  function esc(s){return String(s??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));}
  function outlookUrl(emails,subject='',bcc=true){const list=[...new Set(emails.filter(Boolean))].join(';');const p=new URLSearchParams();p.set(bcc?'bcc':'to',list);if(subject)p.set('subject',subject);return `${OUTLOOK_COMPOSE}?${p.toString()}`;}
  function card(c,i){return `<article class="coach-card"><label class="coach-select"><input type="checkbox" class="coach-check" value="${i}"><span><b>${esc(c.first)} ${esc(c.last)}</b><small>${esc(c.team)} • ${esc(labels[c.division])}</small></span></label><div class="coach-links"><a href="tel:${c.phone.replace(/\D/g,'')}">${esc(c.phone)}</a><a href="mailto:${esc(c.email)}">${esc(c.email)}</a></div><div class="coach-actions"><a class="btn secondary" target="_blank" rel="noopener" href="${outlookUrl([c.email],`SMGSL ${c.team}`,false)}">Email in Outlook</a></div></article>`;}
  function divisionSection(div){const rows=coaches.map((c,i)=>({c,i})).filter(x=>x.c.division===div);const emails=rows.map(x=>x.c.email);return `<section class="contact-division" data-division="${div}"><div class="contact-division-head"><div><h3>${esc(labels[div])}</h3><span class="small">${rows.length} head coach${rows.length===1?'':'es'}</span></div><a class="btn primary" target="_blank" rel="noopener" href="${outlookUrl(emails,`SMGSL ${labels[div]} Coaches`)}">Message ${esc(labels[div])}</a></div><div class="coach-grid">${rows.map(x=>card(x.c,x.i)).join('')}</div></section>`;}
  views.contacts={title:'Contacts',html:`<div class="notice"><b>2026 Fall head coaches</b> grouped by division. Group messages open Outlook Web with recipients in <b>BCC</b>. To send from <b>sports@smgsl.net</b>, be signed into that Microsoft 365 mailbox in Outlook Web.</div><div class="contact-toolbar"><a class="btn primary" id="messageAllCoaches" target="_blank" rel="noopener" href="${outlookUrl(coaches.map(c=>c.email),'SMGSL 2026 Fall Coaches')}">Message All Coaches</a><button class="btn secondary" id="messageSelectedCoaches" type="button">Message Selected</button><button class="btn secondary" id="clearCoachSelection" type="button">Clear Selection</button><span class="small" id="selectedCoachCount">0 selected</span></div>${order.map(divisionSection).join('')}`};
  const style=document.createElement('style');style.textContent=`.contact-toolbar{display:flex;gap:10px;align-items:center;flex-wrap:wrap;margin:14px 0 22px}.contact-division{margin:24px 0}.contact-division-head{display:flex;justify-content:space-between;gap:12px;align-items:center;margin-bottom:10px}.contact-division-head h3{margin:0}.coach-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(260px,1fr));gap:10px}.coach-card{background:#0b1d31;border:1px solid #29496c;border-radius:14px;padding:14px}.coach-select{display:flex;gap:10px;align-items:flex-start}.coach-select input{margin-top:5px}.coach-select span{display:flex;flex-direction:column;gap:3px}.coach-select small,.coach-card .small{color:#93a9c0}.coach-links{display:flex;flex-direction:column;gap:6px;margin:12px 0}.coach-links a{overflow-wrap:anywhere}.coach-actions{display:flex;gap:8px;flex-wrap:wrap}@media(max-width:620px){.contact-division-head{align-items:flex-start;flex-direction:column}.contact-division-head .btn{width:100%;text-align:center}}`;document.head.appendChild(style);
  const oldBind=bind;bind=function(){oldBind();if(current!=='contacts')return;const checks=[...document.querySelectorAll('.coach-check')],count=document.querySelector('#selectedCoachCount'),selectedBtn=document.querySelector('#messageSelectedCoaches');const update=()=>{const n=checks.filter(x=>x.checked).length;count.textContent=`${n} selected`;};checks.forEach(x=>x.addEventListener('change',update));selectedBtn.addEventListener('click',()=>{const picked=checks.filter(x=>x.checked).map(x=>coaches[+x.value]);if(!picked.length){count.textContent='Select at least one coach';return;}window.open(outlookUrl(picked.map(c=>c.email),'SMGSL Coaches'),'_blank','noopener');});document.querySelector('#clearCoachSelection').addEventListener('click',()=>{checks.forEach(x=>x.checked=false);update();});};
})();