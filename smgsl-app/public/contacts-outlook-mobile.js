// Use the Outlook iOS app directly for coach compose actions so recipient fields are preserved.
(function(){
  function emailFromCard(card){
    const a=card?.querySelector('.coach-links a[href^="mailto:"]');
    return a?a.getAttribute('href').replace(/^mailto:/i,'').trim():'';
  }
  function uniq(values){return [...new Set(values.filter(Boolean))];}
  function outlookAppUrl(emails,subject='',bcc=false){
    const p=[];
    const key=bcc?'bcc':'to';
    p.push(`${key}=${encodeURIComponent(uniq(emails).join(','))}`);
    if(subject)p.push(`subject=${encodeURIComponent(subject)}`);
    return `ms-outlook://compose?${p.join('&')}`;
  }
  function openOutlook(emails,subject,bcc=false){
    window.location.href=outlookAppUrl(emails,subject,bcc);
  }
  document.addEventListener('click',function(e){
    if(typeof current!=='undefined'&&current!=='contacts')return;
    const all=e.target.closest('#messageAllCoaches');
    if(all){
      e.preventDefault();e.stopImmediatePropagation();
      const emails=[...document.querySelectorAll('.coach-card .coach-links a[href^="mailto:"]')].map(a=>a.getAttribute('href').replace(/^mailto:/i,'').trim());
      openOutlook(emails,'SMGSL 2026 Fall Coaches',false);return;
    }
    const selectedDivisions=e.target.closest('#messageSelectedDivisions');
    if(selectedDivisions){
      e.preventDefault();e.stopImmediatePropagation();
      const divisions=[...document.querySelectorAll('[data-division-email][aria-pressed="true"]')].map(btn=>btn.dataset.divisionEmail);
      const cards=[...document.querySelectorAll('.coach-card')].filter(card=>divisions.includes(card.dataset.division));
      const emails=cards.map(emailFromCard);
      if(!emails.length)return;
      openOutlook(emails,`SMGSL ${divisions.join(', ')} Coaches`,false);return;
    }
    const selected=e.target.closest('#messageSelectedCoaches');
    if(selected){
      e.preventDefault();e.stopImmediatePropagation();
      const cards=[...document.querySelectorAll('.coach-card')].filter(card=>card.querySelector('.coach-check')?.checked);
      const emails=cards.map(emailFromCard);
      const count=document.querySelector('#selectedCoachCount');
      if(!emails.length){if(count)count.textContent='Select at least one coach';return;}
      openOutlook(emails,'SMGSL Coaches',false);return;
    }
    const division=e.target.closest('.contact-division-head .btn.primary');
    if(division){
      e.preventDefault();e.stopImmediatePropagation();
      const section=division.closest('.contact-division');
      const emails=[...section.querySelectorAll('.coach-links a[href^="mailto:"]')].map(a=>a.getAttribute('href').replace(/^mailto:/i,'').trim());
      const label=section.querySelector('h3')?.textContent?.trim()||'Division';
      openOutlook(emails,`SMGSL ${label} Coaches`,false);return;
    }
    const individual=e.target.closest('.coach-actions a[target="_blank"]');
    if(individual){
      e.preventDefault();e.stopImmediatePropagation();
      const card=individual.closest('.coach-card');
      const email=emailFromCard(card);
      const team=card?.querySelector('.coach-select small')?.textContent?.split('•')[0]?.trim()||'Coach';
      openOutlook([email],`SMGSL ${team}`,false);
    }
  },true);
})();
