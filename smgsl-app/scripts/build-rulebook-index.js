#!/usr/bin/env node
const fs=require('fs');
const {execFileSync}=require('child_process');

const [usaPdf,smgslPdf,outPrefix]=process.argv.slice(2);
if(!usaPdf||!smgslPdf||!outPrefix){
  console.error('Usage: node build-rulebook-index.js USA.pdf SMGSL.pdf output-prefix');
  process.exit(2);
}

function clean(text){
  return text
    .replace(/\f/g,' ')
    .replace(/[\u0000-\u0008\u000b\u000c\u000e-\u001f]/g,' ')
    .replace(/\s+/g,' ')
    .trim();
}

function pageCount(pdf){
  const info=execFileSync('pdfinfo',[pdf],{encoding:'utf8'});
  const match=info.match(/^Pages:\s+(\d+)/m);
  if(!match)throw new Error(`Could not read page count for ${pdf}`);
  return Number(match[1]);
}

function pages(pdf,source,url,divisionForPage){
  const count=pageCount(pdf),rows=[];
  for(let page=1;page<=count;page++){
    const text=clean(execFileSync('pdftotext',['-f',String(page),'-l',String(page),'-raw',pdf,'-'],{encoding:'utf8',maxBuffer:8*1024*1024}));
    if(text.length<20)continue;
    rows.push({source,page,divisions:divisionForPage(page),url:`${url}#page=${page}`,text});
  }
  return rows;
}

function smgslDivisions(page){
  if(page<=20||page>=32)return ['6u','8u','10u','12u','mx'];
  const out=[];
  if(page>=21&&page<=24)out.push('6u');
  if(page>=24&&page<=27)out.push('8u');
  if(page>=27&&page<=29)out.push('10u');
  if(page===30)out.push('12u');
  if(page>=30&&page<=31)out.push('mx');
  return out;
}

const USA_URL='https://www.usasoftball.com/wp-content/uploads/sites/120/2026/01/1-12-2026-Rule-Book.pdf';
const SMGSL_URL='https://dt5602vnjxv0c.cloudfront.net/portals/3766/docs/south%20montgomery%20girls%20softball%20league%20rules%20updated%20fall%202025.pdf';
const records=[
  ...pages(smgslPdf,'SMGSL Rules',SMGSL_URL,smgslDivisions),
  ...pages(usaPdf,'USA Softball 2026',USA_URL,()=>['6u','8u','10u','12u','mx'])
];
const header='// Generated from the official SMGSL Fall 2025 and USA Softball 2026 PDF rulebooks.\n';
const chunkSize=Math.ceil(records.length/3);
for(let i=0;i<3;i++){
  const file=`${outPrefix}-${i+1}.js`,chunk=records.slice(i*chunkSize,(i+1)*chunkSize);
  fs.writeFileSync(file,`${header}window.SMGSLFullRulebookIndex=(window.SMGSLFullRulebookIndex||[]).concat(${JSON.stringify(chunk)});\n`);
  console.log(`Wrote ${chunk.length} indexed rulebook pages to ${file}`);
}
