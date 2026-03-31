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
  // Foydalanuvchi bormi tekshir
  const count = await db.foydalanuvchilar.count({});
  if (count === 0) {
    const hash = await bcrypt.hash('1234', 10);
    await db.foydalanuvchilar.insert([
      { ism: 'Admin',   login: 'admin',   parol: hash, rol: 'admin',   createdAt: new Date() },
      { ism: 'Menejer', login: 'menejer', parol: hash, rol: 'menejer', createdAt: new Date() },
      { ism: 'Kassir',  login: 'kassir',  parol: hash, rol: 'kassir',  createdAt: new Date() },
      { ism: 'Ishchi',  login: 'ishchi',  parol: hash, rol: 'ishchi',  createdAt: new Date() },
    ]);
    console.log('✅ Boshlang\'ich foydalanuvchilar yaratildi');
  }

  const mCount = await db.mahsulotlar.count({});
  if (mCount === 0) {
    await db.mahsulotlar.insert([
      { nomi: 'Qora plastik granula',  qisqa: 'QP-1', tur: 'granula', xom: 'qora',   narx: 40000, ombor: 2840, min: 500, icon: '🖤' },
      { nomi: 'Rangli plastik granula',qisqa: 'RP-1', tur: 'granula', xom: 'rangli', narx: 45000, ombor: 1200, min: 300, icon: '🌈' },
      { nomi: 'Rezina granula',         qisqa: 'RG-1', tur: 'granula', xom: 'rezina', narx: 55000, ombor: 980,  min: 400, icon: '⚫' },
      { nomi: 'Poterya qoldig\'i',      qisqa: 'PQ-1', tur: 'qoldiq', xom: 'qora',   narx: 400,   ombor: 89,   min: 50,  icon: '🔘' },
    ]);
    console.log('✅ Boshlang\'ich mahsulotlar yaratildi');
  }

  const xCount = await db.xodimlar.count({});
  if (xCount === 0) {
    await db.xodimlar.insert([
      { ism:'Jasur', familiya:'Karimov',  lavozim:'Operator',    rol:'operator',  tel:'+998901234567', tarif:1000, sabit:0, oyKg:{1:980,2:1100,3:1240}, bonus:{3:0} },
      { ism:'Obid',  familiya:'Rahimov',  lavozim:'Operator',    rol:'operator',  tel:'+998901234568', tarif:1000, sabit:0, oyKg:{1:870,2:920,3:980},   bonus:{3:0} },
      { ism:'Farrux',familiya:'Hasanov',  lavozim:'Kassir',      rol:'kassir',    tel:'+998901234570', tarif:0, sabit:2500000, oyKg:{},              bonus:{3:0} },
    ]);
    console.log('✅ Boshlang\'ich xodimlar yaratildi');
  }

  const mjCount = await db.mijozlar.count({});
  if (mjCount === 0) {
    await db.mijozlar.insert([
      { nomi:'Toshkent Plastik Zavodi', turi:'zavod',   tel:'+998712345678', masul:'Aliyev B.',  manzil:'Toshkent', narxTur:'vip',      kredit:50000000, maxsusNarxlar:{}, jami:48400000, tolangan:48400000, qarz:0 },
      { nomi:'Andijon MChJ',            turi:'korxona', tel:'+998743456789', masul:'Karimov J.', manzil:'Andijon',  narxTur:'standart', kredit:20000000, maxsusNarxlar:{}, jami:12200000, tolangan:10000000, qarz:2200000 },
      { nomi:'Farg\'ona Savdo',         turi:'korxona', tel:'+998734567890', masul:'Rahimov O.', manzil:'Farg\'ona',narxTur:'standart', kredit:15000000, maxsusNarxlar:{}, jami:8800000,  tolangan:8800000,  qarz:0 },
    ]);
    console.log('✅ Boshlang\'ich mijozlar yaratildi');
  }

  console.log('✅ Database tayyor');
}

module.exports = { db, initDB };
