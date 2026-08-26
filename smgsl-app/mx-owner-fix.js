// MX teams are SMGSL league teams, not Sudden Impact (SI).
// The compiled schedule currently flags MX rows with the SI owner bit; correct them at startup.
const schedule=require('./schedule-2026-data');
if(schedule&&Array.isArray(schedule.rules)&&Array.isArray(schedule.teams)){
  for(const rule of schedule.rules){
    const teamIdx=Number(rule&&rule[1]);
    const team=String(schedule.teams[teamIdx]||'');
    if(/^MX\b/i.test(team)) rule[5]=0;
  }
}
