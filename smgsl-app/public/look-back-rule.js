// Adds the USA Softball fast-pitch Look Back Rule to the official search for 10U and older SMGSL divisions.
(function(){
  if(typeof usaTxByDivision==='undefined') return;
  const href=(typeof USA_RULEBOOK!=='undefined'&&USA_RULEBOOK)||'https://www.usasoftball.com/official-rulebook/';
  const rule={
    topic:'Look Back Rule',
    q:'What is the look back rule?',
    text:'For 10U and older fast-pitch play, the Look Back Rule applies when the ball is live, the batter-runner has reached first base or has been declared out, and the pitcher has possession and control of the ball within the pitcher’s circle. A runner who is legitimately off base may stop once, then must immediately return to the previous base or attempt to advance to the next base. Once a runner stops at a base, she is out if she leaves that base while the rule remains in effect. The rule is suspended when the pitcher makes a play, leaves the circle, or loses control of the ball.',
    keys:'look back lookback look-back circle rule pitcher circle runner stops runner stopped stop once hesitate hesitation return advance next base previous base leave base leaving base possession control ball 10u 12u mx mixed fast pitch rule 8 section 7 t',
    href
  };
  ['10u','12u','mx'].forEach(div=>{
    if(!Array.isArray(usaTxByDivision[div])) usaTxByDivision[div]=[];
    if(!usaTxByDivision[div].some(r=>String(r.topic||'').toLowerCase()==='look back rule')) usaTxByDivision[div].push({...rule});
  });
})();
