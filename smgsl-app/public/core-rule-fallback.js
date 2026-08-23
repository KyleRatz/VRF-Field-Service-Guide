/* Ensure critical live-game calls are always present in the fast rule index. */
(function(){
  if(typeof usaTxBase==='undefined'||!Array.isArray(usaTxBase.rules))return;
  const href='https://www.usasoftball.com/wp-content/uploads/sites/120/2026/01/1-12-2026-Rule-Book.pdf';
  const core=[
    {topic:'Interference',q:'What is interference?',text:'Interference is an offensive act that impedes, hinders, or confuses a defensive player attempting to make a play. The ball is generally dead and the applicable out is declared under the specific rule.',keys:'interference interfere offensive runner batter fielder dead ball hinder impede confuse',href},
    {topic:'Runner interference',q:'When is a runner out after being hit by a batted ball?',text:'A runner may be out for interference when struck by a fair batted ball before it passes an infielder, excluding the pitcher, when another infielder has an opportunity to make an out, subject to the specific exceptions in Rule 8. The ball is dead when interference is ruled.',keys:'runner hit by ball batted ball fair ball interference struck by ball out runner rule 8',href},
    {topic:'Obstruction',q:'What is obstruction?',text:'Obstruction is a defensive act in which a fielder who does not have the ball and is not in the act of fielding a batted ball impedes the progress of a runner.',keys:'obstruction block blocking plate fielder runner base path impede',href},
    {topic:'Look Back Rule',q:'When does the look-back rule apply?',text:'For divisions using the USA Softball look-back rule, once the pitcher has possession of the ball in the circle and the batter-runner has reached first base, runners must immediately return to a base or advance, subject to the rule exceptions. SMGSL division-specific local rules control where adopted.',keys:'look back lookback look-back pitcher circle runner stops 10u 12u mx',href},
    {topic:'Dropped third strike',q:'When may a batter run on a dropped third strike?',text:'The dropped or uncaught third strike rule applies only in divisions and situations permitted by the applicable USA Softball and SMGSL rules. Check the division-specific rule before ruling the batter-runner out or allowing advancement.',keys:'dropped third strike dropped 3rd uncaught third strike batter runner',href}
  ];
  core.forEach(r=>{if(!usaTxBase.rules.some(x=>String(x.topic||'').toLowerCase()===r.topic.toLowerCase()&&String(x.q||'').toLowerCase()===r.q.toLowerCase()))usaTxBase.rules.push(r);});
})();
