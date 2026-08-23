const http=require('http');
const crypto=require('crypto');
const {Pool}=require('pg');

const PUBLIC_MODE=String(process.env.PUBLIC_MODE||'false').toLowerCase()==='true';
const BOARD_PASSWORD=process.env.BOARD_PASSWORD||'';
const SECRET=process.env.SESSION_SECRET||crypto.createHash('sha256').update(BOARD_PASSWORD||'smgsl-dev').digest('hex');
const DATABASE_URL=process.env.DATABASE_URL||'';
const pool=DATABASE_URL?new Pool({connectionString:DATABASE_URL,ssl:DATABASE_URL.includes('render.com')?{rejectUnauthorized:false}:undefined}):null;
let readyPromise=null;

function cookies(req){return Object.fromEntries((req.headers.cookie||'').split(';').map(s=>s.trim().split('=')).filter(x=>x.length===2));}
function authed(req){if(PUBLIC_MODE)return true;const t=cookies(req).smgsl_session;if(!t)return false;const [raw,sig]=t.split('.');if(!raw||!sig||Number(raw)<Date.now())return false;const want=crypto.createHmac('sha256',SECRET).update(raw).digest('hex');try{return crypto.timingSafeEqual(Buffer.from(sig),Buffer.from(want));}catch{return false;}}
function json(res,status,obj){res.writeHead(status,{'Content-Type':'application/json; charset=utf-8','Cache-Control':'no-store'});res.end(JSON.stringify(obj));}
function readBody(req,max=3_500_000){return new Promise((resolve,reject)=>{let s='';req.on('data',c=>{s+=c;if(Buffer.byteLength(s)>max){reject(new Error('Upload too large'));req.destroy();}});req.on('end',()=>resolve(s));req.on('error',reject);});}
async function ensureTable(){if(!pool)throw new Error('Shared database is not configured');if(!readyPromise)readyPromise=pool.query(`CREATE TABLE IF NOT EXISTS si_adjustments (
 id BIGSERIAL PRIMARY KEY,
 team TEXT NOT NULL,
 event_date DATE NOT NULL,
 field TEXT,
 adjustment_type TEXT NOT NULL,
 hours NUMERIC(8,2) NOT NULL,
 note TEXT,
 observed_at TIMESTAMPTZ,
 created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
 photo_mime TEXT,
 photo_data BYTEA
)`);await readyPromise;}
function rowOut(r){return {id:String(r.id),team:r.team,date:String(r.event_date).slice(0,10),field:r.field||'',type:r.adjustment_type,hours:Number(r.hours),note:r.note||'',observedAt:r.observed_at||null,created:r.created_at,hasPhoto:!!r.has_photo,photoUrl:r.has_photo?`/api/si-adjustments/${r.id}/photo`:''};}

const originalCreateServer=http.createServer;
http.createServer=function(listener){return originalCreateServer.call(http,async function(req,res){let u;try{u=new URL(req.url,'http://localhost');}catch{return listener(req,res);}if(!u.pathname.startsWith('/api/si-adjustments'))return listener(req,res);if(!authed(req)){res.writeHead(302,{'Location':'/login'});return res.end('');}
 try{
  await ensureTable();
  if(req.method==='GET'&&u.pathname==='/api/si-adjustments'){
   const q=await pool.query(`SELECT id,team,event_date,field,adjustment_type,hours,note,observed_at,created_at,(photo_data IS NOT NULL) AS has_photo FROM si_adjustments ORDER BY event_date DESC, created_at DESC`);
   return json(res,200,{adjustments:q.rows.map(rowOut)});
  }
  const photoMatch=u.pathname.match(/^\/api\/si-adjustments\/(\d+)\/photo$/);
  if(req.method==='GET'&&photoMatch){
   const q=await pool.query('SELECT photo_mime,photo_data FROM si_adjustments WHERE id=$1',[photoMatch[1]]);if(!q.rows.length||!q.rows[0].photo_data)return json(res,404,{error:'Photo not found'});
   res.writeHead(200,{'Content-Type':q.rows[0].photo_mime||'image/jpeg','Cache-Control':'private, max-age=300','Content-Length':q.rows[0].photo_data.length});return res.end(q.rows[0].photo_data);
  }
  if(req.method==='POST'&&u.pathname==='/api/si-adjustments'){
   const body=JSON.parse(await readBody(req)||'{}');
   const allowed=new Set(['Started Early','Stayed Late','Left Early','Cancelled Practice','Extra Practice','Other Adjustment']);
   const team=String(body.team||'').trim(),date=String(body.date||''),field=String(body.field||'').trim(),type=String(body.type||''),note=String(body.note||'').trim();const hours=Number(body.hours);
   if(!team||!/^\d{4}-\d{2}-\d{2}$/.test(date)||!allowed.has(type)||!Number.isFinite(hours))return json(res,400,{error:'Invalid adjustment data'});
   let photoMime=null,photoData=null;const p=String(body.photoDataUrl||'');if(p){const m=p.match(/^data:(image\/(?:jpeg|png|webp));base64,(.+)$/);if(!m)return json(res,400,{error:'Photo must be JPEG, PNG, or WebP'});photoMime=m[1];photoData=Buffer.from(m[2],'base64');if(photoData.length>2_500_000)return json(res,413,{error:'Photo is too large after compression'});}
   const q=await pool.query(`INSERT INTO si_adjustments(team,event_date,field,adjustment_type,hours,note,observed_at,photo_mime,photo_data) VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9) RETURNING id,team,event_date,field,adjustment_type,hours,note,observed_at,created_at,(photo_data IS NOT NULL) AS has_photo`,[team,date,field,type,hours,note,body.observedAt||null,photoMime,photoData]);
   return json(res,201,{adjustment:rowOut(q.rows[0])});
  }
  const del=u.pathname.match(/^\/api\/si-adjustments\/(\d+)$/);
  if(req.method==='DELETE'&&del){await pool.query('DELETE FROM si_adjustments WHERE id=$1',[del[1]]);return json(res,200,{ok:true});}
  return json(res,405,{error:'Method not allowed'});
 }catch(e){console.error('SI shared storage error:',e.message);return json(res,500,{error:e.message});}
});};

require('./server-entry');
