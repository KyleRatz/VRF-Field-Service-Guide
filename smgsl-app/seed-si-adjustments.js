const {Pool}=require('pg');
const DATABASE_URL=process.env.DATABASE_URL||'';
if(!DATABASE_URL){console.error('DATABASE_URL not configured; skipping SI seed');process.exit(0);}
const pool=new Pool({connectionString:DATABASE_URL,ssl:DATABASE_URL.includes('render.com')?{rejectUnauthorized:false}:undefined});
(async()=>{
  try{
    await pool.query(`CREATE TABLE IF NOT EXISTS si_adjustments (
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
    )`);
    const rows=[
      ['SI Schneider','2026-08-20','Field 1','Started Early',1,'Restored board record: team started practice 1 hour before scheduled time.'],
      ['SI Ray','2026-08-20','Field 8','Started Early',1,'Restored board record: team started practice 1 hour before scheduled time.']
    ];
    for(const r of rows){
      await pool.query(`INSERT INTO si_adjustments(team,event_date,field,adjustment_type,hours,note)
        SELECT $1,$2,$3,$4,$5,$6
        WHERE NOT EXISTS (
          SELECT 1 FROM si_adjustments
          WHERE lower(team)=lower($1) AND event_date=$2::date AND lower(coalesce(field,''))=lower($3)
            AND adjustment_type=$4 AND hours=$5
        )`,r);
    }
    console.log('Verified/restored 2026-08-20 Schneider and Ray SI early-start records.');
  }catch(e){console.error('SI seed failed:',e.message);process.exitCode=1;}
  finally{await pool.end();}
})();
