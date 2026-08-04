import pg from 'pg';
import dotenv from 'dotenv';

dotenv.config({ path: '../.env' });

const pool = new pg.Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});

pool.on('error', (err) => {
  console.error('Unexpected error on idle client', err);
  process.exit(-1);
});

// Helper for running queries
export const query = (text, params) => pool.query(text, params);

// Helper for getting a client from pool (for transactions)
export const getClient = () => pool.connect();

export default pool;
