const Datastore = require('nedb-promises');
const bcrypt = require('bcryptjs');
const path = require('path');

const DB_DIR = path.join(__dirname, '../db');

const db = {
  foydalanuvchilar: new Datastore({ filename: `${DB_DIR}/foydalanuvchilar.db`, autoload: true }),
  mijozlar:         new Datastore({ filename: `${DB_DIR}/mijozlar.db`,         autoload: true }),
  mahsulotlar:      new Datastore({ filename: `${DB_DIR}/mahsulotlar.db`,      autoload: true }),
  xomAshyo:         new Datastore({ filename: `${DB_DIR}/xomAshyo.db`,         autoload: true }),
  kirimlar:         new Datastore({ filename: `${DB_DIR}/kirimlar.db`,         autoload: true }),
  sotuvlar:         new Datastore({ filename: `${DB_DIR}/sotuvlar.db`,         autoload: true }),
  partiyalar:       new Datastore({ filename: `${DB_DIR}/partiyalar.db`,       autoload: true }),
  xodimlar:         new Datastore({ filename: `${DB_DIR}/xodimlar.db`,         autoload: true }),
  avanslar:         new Datastore({ filename: `${DB_DIR}/avanslar.db`,         autoload: true }),
  harajatlar:       new Datastore({ filename: `${DB_DIR}/harajatlar.db`,       autoload: true }),
  rezKirimlar:      new Datastore({ filename: `${DB_DIR}/rezKirimlar.db`,      autoload: true }),
  rezSotuvlar:      new Datastore({ filename: `${DB_DIR}/rezSotuvlar.db`,      autoload: true }),
  reyslar:          new Datastore({ filename: `${DB_DIR}/reyslar.db`,          autoload: true }),
  yetkazuvchilar:   new Datastore({ filename: `${DB_DIR}/yetkazuvchilar.db`,   autoload: true }),
};

async function initDB() {
  // Faqat eng muhim Admin hisobini qoldiramiz, boshqa barcha demo axlatlar o'chib ketadi
  const count = await db.foydalanuvchilar.count({});
  if (count === 0) {
    const hash = await bcrypt.hash('1234', 10);
    await db.foydalanuvchilar.insert([
      { ism: 'Admin',   login: 'admin',   parol: hash, rol: 'admin',   createdAt: new Date() }
    ]);
    console.log('✅ Boshlang\'ich foydalanuvchi yaratildi');
  }

  console.log('✅ Database tayyor');
}

module.exports = { db, initDB };
