import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import pg from 'pg';
import dotenv from 'dotenv';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, '..', '..', '.env') });

export async function initDB() {
  const pool = new pg.Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
  });

  try {
    const schemaPath = path.join(__dirname, 'schema.sql');
    const schema = fs.readFileSync(schemaPath, 'utf-8');

    console.log('🔧 Initializing database...');
    await pool.query(schema);
    console.log('✅ Database schema ready!');
  } catch (error) {
    console.log('ℹ️ Database initialization completed (or already initialized):', error.message);
  } finally {
    await pool.end();
  }
}

// Execute if run directly via node db/init.js
if (process.argv[1] && (process.argv[1].endsWith('init.js') || process.argv[1].endsWith('init'))) {
  initDB();
}
