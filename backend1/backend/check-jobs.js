import pg from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const pool = new pg.Pool({
  user: process.env.PGUSER || 'postgres',
  password: process.env.PGPASSWORD || '250208',
  host: process.env.PGHOST || 'localhost',
  port: parseInt(process.env.PGPORT || '5432'),
  database: process.env.PGDATABASE || 'erakshak',
});

async function run() {
  try {
    const client = await pool.connect();
    console.log('Connected to DB.');
    
    const res = await client.query('SELECT id, camera_id, video_name, status, error, created_at, completed_at FROM ingest_jobs ORDER BY created_at DESC');
    console.log(`Found ${res.rows.length} jobs:`);
    for (const r of res.rows) {
      console.log(`- Job ID: ${r.id}`);
      console.log(`  Camera ID: ${r.camera_id}`);
      console.log(`  Video Name: ${r.video_name}`);
      console.log(`  Status: ${r.status}`);
      console.log(`  Error: ${r.error}`);
      console.log(`  Created: ${r.created_at}`);
      console.log(`  Completed: ${r.completed_at}`);
      
      const logRes = await client.query('SELECT log FROM ingest_jobs WHERE id = $1', [r.id]);
      if (logRes.rows.length > 0 && logRes.rows[0].log) {
        const log = logRes.rows[0].log;
        const lines = log.split('\n').filter(Boolean);
        console.log(`  Last log lines:`);
        lines.slice(-25).forEach(l => console.log(`    ${l}`));
      } else {
        console.log(`  Log: Empty`);
      }
      console.log('-----------------------------------------');
    }
    
    client.release();
  } catch (err) {
    console.error('Error:', err);
  } finally {
    await pool.end();
  }
}

run();
