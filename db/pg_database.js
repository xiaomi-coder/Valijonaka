const { Pool } = require('pg');
require('dotenv').config();

// PostgreSQL uchun ulanish (VPS ga o'tganimizda ishlaydi)
const pool = new Pool({
  user: process.env.PG_USER || 'postgres',
  host: process.env.PG_HOST || 'localhost',
  database: process.env.PG_DATABASE || 'agroplast_erp',
  password: process.env.PG_PASSWORD || '1234',
  port: process.env.PG_PORT || 5432,
});

async function query(text, params) {
  const start = Date.now();
  const res = await pool.query(text, params);
  const duration = Date.now() - start;
  console.log('Bajarildi:', { text, duration, rows: res.rowCount });
  return res;
}

module.exports = {
  pool,
  query
};
