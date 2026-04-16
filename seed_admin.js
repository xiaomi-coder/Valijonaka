require('dotenv').config({ path: '/var/www/valijon-erp/.env' });
const bcrypt = require('bcrypt');
const { query } = require('./db/pg_database');

async function seed() {
  try {
    const hash = await bcrypt.hash('1234', 10);
    const res = await query("SELECT id FROM foydalanuvchilar WHERE login='admin'");
    if (res.rowCount === 0) {
      await query("INSERT INTO foydalanuvchilar (ism, login, parol, rol) VALUES ('Administrator', 'admin', $1, 'admin')", [hash]);
      console.log('✅ Asosiy Admin muvaffaqiyatli yaratildi!');
    } else {
      console.log('ℹ️ Admin allaqachon mavjud.');
    }
    process.exit(0);
  } catch (err) {
    console.error('Xatolik:', err);
    process.exit(1);
  }
}

seed();
