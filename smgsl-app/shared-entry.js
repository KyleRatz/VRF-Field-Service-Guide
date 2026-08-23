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
function imageFromDataUrl(p){if(!p)return {mime:null,data:null};const m=String(p).match(/^data:(image\/(?:jpeg|png|webp));base64,(.+)$/);if(!m)throw new Error('Photo must be JPEG, PNG, or WebP');const data=Buffer.from(m[2],'base64');if(data.length>2_500_000){const e=new Error('Photo is too large after compression');e.status=413;throw e;}return {mime:m[1],data};}
async function ensureTables(){if(!pool)throw new Error('Shared database is not configured');if(!readyPromise)readyPromise=(async()=>{
 await pool.query(`CREATE TABLE IF NOT EXISTS si_adjustments (
 id BIGSERIAL PRIMARY KEY, team TEXT NOT NULL, event_date DATE NOT NULL, field TEXT, adjustment_type TEXT NOT NULL,
 hours NUMERIC(8,2) NOT NULL, note TEXT, observed_at TIMESTAMPTZ, created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
 photo_mime TEXT, photo_data BYTEA)`);
 await pool.query(`CREATE TABLE IF NOT EXISTS parking_violations (
 id BIGSERIAL PRIMARY KEY,
 observed_at TIMESTAMPTZ NOT NULL,
 location TEXT NOT NULL,
 violation_type TEXT NOT NULL,
 license_plate TEXT NOT NULL,
 plate_state TEXT,
 vehicle_make TEXT,
 vehicle_model TEXT,
 vehicle_color TEXT,
 notes TEXT,
 documented_by TEXT,
 disposition TEXT NOT NULL DEFAULT 'Documented',
 created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
 updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
 photo_mime TEXT,
 photo_data BYTEA
 )`);
})();await readyPromise;}
function siRowOut(r){return {id:String(r.id),team:r.team,date:String(r.event_date).slice(0,10),field:r.field||'',type:r.adjustment_type,hours:Number(r.hours),note:r.note||'',observedAt:r.observed_at||null,created:r.created_at,hasPhoto:!!r.has_photo,photoUrl:r.has_photo?`/api/si-adjustments/${r.id}/photo`:''};}
function parkingRowOut(r){return {id:String(r.id),observedAt:r.observed_at,location:r.location||'',violationType:r.violation_type||'',licensePlate:r.license_plate||'',plateState:r.plate_state||'',vehicleMake:r.vehicle_make||'',vehicleModel:r.vehicle_model||'',vehicleColor:r.vehicle_color||'',notes:r.notes||'',documentedBy:r.documented_by||'',disposition:r.disposition||'Documented',created:r.created_at,updated:r.updated_at,hasPhoto:!!r.has_photo,photoUrl:r.has_photo?`/api/parking-violations/${r.id}/photo`:''};}

const originalCreateServer=http.createServer;
http.createServer=function(listener){return originalCreateServer.call(http,async function(req,res){let u;try{u=new URL(req.url,'http://localhost');}catch{return listener(req,res);}const isSI=u.pathname.startsWith('/api/si-adjustments'),isParking=u.pathname.startsWith('/api/parking-violations');if(!isSI&&!isParking){if(u.pathname==='/'||/\.(?:html|js|css|webmanifest)$/i.test(u.pathname)){res.setHeader('Cache-Control','no-store, no-cache, must-revalidate, max-age=0');res.setHeader('Pragma','no-cache');res.setHeader('Expires','0');}return listener(req,res);}if(!authed(req)){res.writeHead(302,{'Location':'/login'});return res.end('');}
 try{
  await ensureTables();
  if(isSI){
   if(req.method==='GET'&&u.pathname==='/api/si-adjustments'){
    const q=await pool.query(`SELECT id,team,event_date,field,adjustment_type,hours,note,observed_at,created_at,(photo_data IS NOT NULL) AS has_photo FROM si_adjustments ORDER BY event_date DESC, created_at DESC`);
    return json(res,200,{adjustments:q.rows.map(siRowOut)});
   }
   const photoMatch=u.pathname.match(/^\/api\/si-adjustments\/(\d+)\/photo$/);
   if(req.method==='GET'&&photoMatch){const q=await pool.query('SELECT photo_mime,photo_data FROM si_adjustments WHERE id=$1',[photoMatch[1]]);if(!q.rows.length||!q.rows[0].photo_data)return json(res,404,{error:'Photo not found'});res.writeHead(200,{'Content-Type':q.rows[0].photo_mime||'image/jpeg','Cache-Control':'private, max-age=300','Content-Length':q.rows[0].photo_data.length});return res.end(q.rows[0].photo_data);}
   if(req.method==='POST'&&u.pathname==='/api/si-adjustments'){
    const body=JSON.parse(await readBody(req)||'{}');const allowed=new Set(['Started Early','Stayed Late','Left Early','Cancelled Practice','Extra Practice','Other Adjustment']);const team=String(body.team||'').trim(),date=String(body.date||''),field=String(body.field||'').trim(),type=String(body.type||''),note=String(body.note||'').trim();const hours=Number(body.hours);if(!team||!/^\d{4}-\d{2}-\d{2}$/.test(date)||!allowed.has(type)||!Number.isFinite(hours))return json(res,400,{error:'Invalid adjustment data'});const photo=imageFromDataUrl(body.photoDataUrl||'');const q=await pool.query(`INSERT INTO si_adjustments(team,event_date,field,adjustment_type,hours,note,observed_at,photo_mime,photo_data) VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9) RETURNING id,team,event_date,field,adjustment_type,hours,note,observed_at,created_at,(photo_data IS NOT NULL) AS has_photo`,[team,date,field,type,hours,note,body.observedAt||null,photo.mime,photo.data]);return json(res,201,{adjustment:siRowOut(q.rows[0])});
   }
   const del=u.pathname.match(/^\/api\/si-adjustments\/(\d+)$/);if(req.method==='DELETE'&&del){await pool.query('DELETE FROM si_adjustments WHERE id=$1',[del[1]]);return json(res,200,{ok:true});}
   return json(res,405,{error:'Method not allowed'});
  }

  if(req.method==='GET'&&u.pathname==='/api/parking-violations'){
   const q=await pool.query(`SELECT id,observed_at,location,violation_type,license_plate,plate_state,vehicle_make,vehicle_model,vehicle_color,notes,documented_by,disposition,created_at,updated_at,(photo_data IS NOT NULL) AS has_photo FROM parking_violations ORDER BY observed_at DESC, created_at DESC`);
   return json(res,200,{violations:q.rows.map(parkingRowOut)});
  }
  const pPhoto=u.pathname.match(/^\/api\/parking-violations\/(\d+)\/photo$/);
  if(req.method==='GET'&&pPhoto){const q=await pool.query('SELECT photo_mime,photo_data FROM parking_violations WHERE id=$1',[pPhoto[1]]);if(!q.rows.length||!q.rows[0].photo_data)return json(res,404,{error:'Photo not found'});res.writeHead(200,{'Content-Type':q.rows[0].photo_mime||'image/jpeg','Cache-Control':'private, max-age=300','Content-Length':q.rows[0].photo_data.length});return res.end(q.rows[0].photo_data);}
  if(req.method==='POST'&&u.pathname==='/api/parking-violations'){
   const body=JSON.parse(await readBody(req)||'{}');const allowedTypes=new Set(['Restricted Area','Handicap Space','Reserved Space','Fire Lane','Blocking Access','Other']);const allowedDisposition=new Set(['Documented','Warning Issued','Towing Requested','Towed','Resolved']);const observedAt=body.observedAt?new Date(body.observedAt):null;const location=String(body.location||'').trim(),violationType=String(body.violationType||''),licensePlate=String(body.licensePlate||'').trim().toUpperCase(),plateState=String(body.plateState||'').trim().toUpperCase(),vehicleMake=String(body.vehicleMake||'').trim(),vehicleModel=String(body.vehicleModel||'').trim(),vehicleColor=String(body.vehicleColor||'').trim(),notes=String(body.notes||'').trim(),documentedBy=String(body.documentedBy||'').trim(),disposition=allowedDisposition.has(body.disposition)?body.disposition:'Documented';if(!observedAt||Number.isNaN(observedAt.getTime())||!location||!allowedTypes.has(violationType)||!licensePlate)return json(res,400,{error:'Observed time, location, violation type, and license plate are required'});const photo=imageFromDataUrl(body.photoDataUrl||'');const q=await pool.query(`INSERT INTO parking_violations(observed_at,location,violation_type,license_plate,plate_state,vehicle_make,vehicle_model,vehicle_color,notes,documented_by,disposition,photo_mime,photo_data) VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13) RETURNING id,observed_at,location,violation_type,license_plate,plate_state,vehicle_make,vehicle_model,vehicle_color,notes,documented_by,disposition,created_at,updated_at,(photo_data IS NOT NULL) AS has_photo`,[observedAt.toISOString(),location,violationType,licensePlate,plateState,vehicleMake,vehicleModel,vehicleColor,notes,documentedBy,disposition,photo.mime,photo.data]);return json(res,201,{violation:parkingRowOut(q.rows[0])});
  }
  const pItem=u.pathname.match(/^\/api\/parking-violations\/(\d+)$/);
  if(req.method==='PATCH'&&pItem){const body=JSON.parse(await readBody(req,200_000)||'{}');const allowedDisposition=new Set(['Documented','Warning Issued','Towing Requested','Towed','Resolved']);if(!allowedDisposition.has(body.disposition))return json(res,400,{error:'Invalid disposition'});const q=await pool.query(`UPDATE parking_violations SET disposition=$1,updated_at=NOW() WHERE id=$2 RETURNING id,observed_at,location,violation_type,license_plate,plate_state,vehicle_make,vehicle_model,vehicle_color,notes,documented_by,disposition,created_at,updated_at,(photo_data IS NOT NULL) AS has_photo`,[body.disposition,pItem[1]]);if(!q.rows.length)return json(res,404,{error:'Record not found'});return json(res,200,{violation:parkingRowOut(q.rows[0])});}
  if(req.method==='DELETE'&&pItem){await pool.query('DELETE FROM parking_violations WHERE id=$1',[pItem[1]]);return json(res,200,{ok:true});}
  return json(res,405,{error:'Method not allowed'});
 }catch(e){console.error('Shared storage error:',e.message);return json(res,e.status||500,{error:e.message});}
});};

require('./server-entry');
