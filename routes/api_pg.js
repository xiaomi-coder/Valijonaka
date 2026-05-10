const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { query } = require('../db/pg_database');
const { authMiddleware, roleCheck, SECRET } = require('./auth.middleware');

const router = express.Router();

// ============================================================
// FOYDALANUVCHILAR
// ============================================================

// --- AUTO MIGRATE OMBOR TABLES ---
(async () => {
  try {
    await query(`CREATE TABLE IF NOT EXISTS ombor_mijozlar ( id SERIAL PRIMARY KEY, nomi VARCHAR(255) NOT NULL, tel VARCHAR(50), qarz NUMERIC DEFAULT 0, created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP );`);
    await query(`CREATE TABLE IF NOT EXISTS ombor_kirimlar ( id SERIAL PRIMARY KEY, sana VARCHAR(20), oy INTEGER, mijoz VARCHAR(255), tur VARCHAR(255), kg NUMERIC, narx NUMERIC, jami NUMERIC, tolov VARCHAR(50), "naqdSumma" NUMERIC DEFAULT 0, qoshgan VARCHAR(255), created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP );`);
    await query(`CREATE TABLE IF NOT EXISTS ombor_tolovlar ( id SERIAL PRIMARY KEY, sana VARCHAR(20) DEFAULT to_char(CURRENT_DATE, 'YYYY-MM-DD'), mijoz VARCHAR(255), summa NUMERIC, izoh TEXT, qoshgan VARCHAR(255), created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP );`);
  } catch(e) { console.error('Ombor tables auto-migration error:', e.message); }
})();

router.post('/auth/login', async (req, res) => {
  try {
    const { login, parol } = req.body;
    
    // Foydalanuvchini izlash
    let resUser = await query('SELECT * FROM foydalanuvchilar WHERE login = $1', [login]);
    
    if (resUser.rowCount === 0) {
      let resMijoz = await query('SELECT * FROM mijozlar WHERE login = $1', [login]);
      if (resMijoz.rowCount > 0) {
        const mijoz = resMijoz.rows[0];
        if (mijoz.parol === parol) {
          const token = jwt.sign({ id: mijoz.id, ism: mijoz.nomi, login: mijoz.login, rol: 'mijoz' }, SECRET, { expiresIn: '8h' });
          return res.json({ token, user: { id: mijoz.id, ism: mijoz.nomi, login: mijoz.login, rol: 'mijoz' } });
        }
      }
      return res.status(401).json({ error: 'Login yoki parol noto\'g\'ri' });
    }

    const user = resUser.rows[0];
    const ok = await bcrypt.compare(parol, user.parol);
    
    if (!ok) return res.status(401).json({ error: 'Login yoki parol noto\'g\'ri' });
    
    const token = jwt.sign({ id: user.id, ism: user.ism, login: user.login, rol: user.rol }, SECRET, { expiresIn: '8h' });
    res.json({ token, user: { id: user.id, ism: user.ism, login: user.login, rol: user.rol } });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.get('/auth/me', authMiddleware, (req, res) => res.json(req.user));

// ============================================================
// FOYDALANUVCHILAR
// ============================================================
router.get('/foydalanuvchilar', authMiddleware, roleCheck('admin'), async (req, res) => {
  try {
    const data = await query('SELECT id, ism, login, rol, created_at FROM foydalanuvchilar ORDER BY created_at DESC');
    res.json(data.rows);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// ============================================================
// OMBOR (Yangi modul)
// ============================================================
router.get('/ombor_kirimlar', authMiddleware, async (req, res) => {
  try {
    const data = await query('SELECT * FROM ombor_kirimlar ORDER BY sana DESC');
    res.json(data.rows);
  } catch (e) { res.status(500).json({ error: e.message }); }
});
router.post('/ombor_kirimlar', authMiddleware, async (req, res) => {
  try {
    const { sana, oy, mijoz, tur, kg, narx, jami, tolov, naqdSumma } = req.body;
    const doc = await query(
      'INSERT INTO ombor_kirimlar (sana, oy, mijoz, tur, kg, narx, jami, tolov, "naqdSumma", qoshgan) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10) RETURNING *',
      [sana, oy, mijoz, tur, kg, narx, jami, tolov, naqdSumma || 0, req.user.ism]
    );
    res.json(doc.rows[0]);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.get('/ombor_tolovlar', authMiddleware, async (req, res) => {
  try {
    const data = await query('SELECT * FROM ombor_tolovlar ORDER BY created_at DESC');
    res.json(data.rows);
  } catch (e) { res.status(500).json({ error: e.message }); }
});
router.post('/ombor_tolovlar', authMiddleware, async (req, res) => {
  try {
    const { mijoz, summa, izoh } = req.body;
    const doc = await query(
      'INSERT INTO ombor_tolovlar (mijoz, summa, izoh, qoshgan) VALUES ($1,$2,$3,$4) RETURNING *',
      [mijoz, summa, izoh, req.user.ism]
    );
    res.json(doc.rows[0]);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.get('/ombor_mijozlar', authMiddleware, async (req, res) => {
  try {
    const data = await query('SELECT * FROM ombor_mijozlar ORDER BY nomi ASC');
    res.json(data.rows);
  } catch (e) { res.status(500).json({ error: e.message }); }
});
router.post('/ombor_mijozlar', authMiddleware, async (req, res) => {
  try {
    const { nomi, tel } = req.body;
    const doc = await query('INSERT INTO ombor_mijozlar (nomi, tel) VALUES ($1,$2) RETURNING *', [nomi, tel]);
    res.json(doc.rows[0]);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.post('/foydalanuvchilar', authMiddleware, roleCheck('admin'), async (req, res) => {
  try {
    const { ism, login, parol, rol } = req.body;
    
    const exists = await query('SELECT id FROM foydalanuvchilar WHERE login = $1', [login]);
    if (exists.rowCount > 0) return res.status(400).json({ error: 'Bu login band' });
    
    const hash = await bcrypt.hash(parol, 10);
    const doc = await query(
      'INSERT INTO foydalanuvchilar (ism, login, parol, rol) VALUES ($1, $2, $3, $4) RETURNING id, ism, login, rol, created_at',
      [ism, login, hash, rol]
    );
    res.json(doc.rows[0]);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.delete('/foydalanuvchilar/:id', authMiddleware, roleCheck('admin'), async (req, res) => {
  try {
    if (req.user.id === req.params.id) {
      return res.status(400).json({ error: "Xavfsizlik: Siz o'z profilingizni o'chira olmaysiz!" });
    }
    await query('DELETE FROM foydalanuvchilar WHERE id = $1', [req.params.id]);
    res.json({ ok: true });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// ============================================================
// MIJOZLAR
// ============================================================
router.get('/mijozlar', authMiddleware, async (req, res) => {
  try {
    const data = await query('SELECT * FROM mijozlar ORDER BY nomi ASC');
    res.json(data.rows);
  } catch (e) { res.status(500).json({ error: e.message }); }
});
router.post('/mijozlar', authMiddleware, async (req, res) => {
  try {
    const { nomi, turi, tel, masul, manzil, narx_tur, kredit, maxsus_narxlar, login, parol } = req.body;
    const doc = await query(
      'INSERT INTO mijozlar (nomi, turi, tel, masul, manzil, narx_tur, kredit, maxsus_narxlar, login, parol) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10) RETURNING *',
      [nomi, turi, tel, masul, manzil, narx_tur, kredit || 0, maxsus_narxlar ? JSON.stringify(maxsus_narxlar) : '{}', login || null, parol || null]
    );
    res.json(doc.rows[0]);
  } catch (e) { res.status(500).json({ error: e.message }); }
});
router.put('/mijozlar/:id', authMiddleware, async (req, res) => {
  try {
    const { nomi, turi, tel, masul, manzil, narx_tur, kredit, jami, tolangan, qarz, maxsus_narxlar, login, parol } = req.body;
    await query(
      'UPDATE mijozlar SET nomi=$1, turi=$2, tel=$3, masul=$4, manzil=$5, narx_tur=$6, kredit=$7, jami=$8, tolangan=$9, qarz=$10, maxsus_narxlar=$11, login=$12, parol=$13 WHERE id=$14',
      [nomi, turi, tel, masul, manzil, narx_tur, kredit, jami, tolangan, qarz, maxsus_narxlar ? JSON.stringify(maxsus_narxlar) : '{}', login || null, parol || null, req.params.id]
    );
    res.json({ ok: true });
  } catch (e) { res.status(500).json({ error: e.message }); }
});
router.delete('/mijozlar/:id', authMiddleware, roleCheck('admin', 'menejer'), async (req, res) => {
  try {
    await query('DELETE FROM mijozlar WHERE id = $1', [req.params.id]);
    res.json({ ok: true });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// ============================================================
// SOTUVLAR (Zavod mahsulotlari sotuvi)
// ============================================================
router.get('/sotuvlar', authMiddleware, async (req, res) => {
  try {
    const data = await query(`
      SELECT s.*, s.tolov_turi as "tolovTuri", s.total_kg as "totalKg", s.created_at as "createdAt",
             m.nomi as mijoz_nomi, m.turi as mijoz_turi 
      FROM sotuvlar s 
      LEFT JOIN mijozlar m ON m.id = s.mijoz_id 
      ORDER BY s.created_at DESC
    `);
    res.json(data.rows);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.post('/sotuvlar', authMiddleware, async (req, res) => {
  try {
    const { sana, mijoz_id, summa, qarz, tolangan, holat, cart, tolovTuri, totalKg, chegirma, izoh } = req.body;
    const doc = await query(
      'INSERT INTO sotuvlar (sana, mijoz_id, summa, qarz, tolangan, holat, cart, qoshgan, tolov_turi, total_kg, chegirma, izoh) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12) RETURNING *',
      [sana, mijoz_id, summa, qarz, tolangan, holat, JSON.stringify(cart || []), req.user.login, tolovTuri || 'qarz', totalKg || 0, chegirma || 0, izoh || null]
    );

    // Qarzni mijoz profiliga qo'shish
    if (qarz > 0) {
      await query('UPDATE mijozlar SET qarz = qarz + $1, jami = jami + $2 WHERE id = $3', [qarz, summa, mijoz_id]);
    } else {
      await query('UPDATE mijozlar SET jami = jami + $1, tolangan = tolangan + $2 WHERE id = $3', [summa, summa, mijoz_id]);
    }

    res.json(doc.rows[0]);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.put('/sotuvlar/:id/tolov', authMiddleware, async (req, res) => {
  try {
    const { summa } = req.body;
    const { rows } = await query('SELECT * FROM sotuvlar WHERE id = $1', [req.params.id]);
    if (rows.length === 0) return res.status(404).json({ error: 'Topilmadi' });
    const sotuv = rows[0];

    // Qarzni hisoblash
    const y_tolangan = Number(sotuv.tolangan || 0) + Number(summa);
    const y_qarz = Math.max(0, Number(sotuv.qarz || 0) - Number(summa));
    const holat = y_qarz > 0 ? 'qarz' : 'tolandi';

    // Sotuvni yangilash
    await query(
      'UPDATE sotuvlar SET tolangan = $1, qarz = $2, holat = $3 WHERE id = $4',
      [y_tolangan, y_qarz, holat, req.params.id]
    );

    // Mijoz qarzini ham kamaytirish (ortiqcha to'lasa manfiy bo'ladi -> haq)
    await query(
      'UPDATE mijozlar SET qarz = qarz - $1, tolangan = tolangan + $1 WHERE id = $2',
      [summa, sotuv.mijoz_id]
    );

    res.json({ ok: true, qarz: y_qarz });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.put('/mijozlar/:id/tolov', authMiddleware, async (req, res) => {
  try {
    const { summa } = req.body;
    await query(
      'UPDATE mijozlar SET qarz = qarz - $1, tolangan = tolangan + $1 WHERE id = $2',
      [summa, req.params.id]
    );

    // Qarz sotuvlari bo'lsa, ulardan bittasini yopish
    const unpaidSotuvlar = await query('SELECT id, qarz, tolangan FROM sotuvlar WHERE mijoz_id = $1 AND qarz > 0 ORDER BY sana ASC LIMIT 1', [req.params.id]);
    if (unpaidSotuvlar.rows.length > 0) {
      const s = unpaidSotuvlar.rows[0];
      const y_tolangan = Number(s.tolangan || 0) + Number(summa);
      const y_qarz = Math.max(0, Number(s.qarz || 0) - Number(summa));
      const holat = y_qarz > 0 ? 'qarz' : 'tolandi';
      await query('UPDATE sotuvlar SET tolangan = $1, qarz = $2, holat = $3 WHERE id = $4', [y_tolangan, y_qarz, holat, s.id]);
    }

    res.json({ ok: true });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.delete('/sotuvlar/:id', authMiddleware, roleCheck('admin'), async (req, res) => {
  try {
    await query('DELETE FROM sotuvlar WHERE id = $1', [req.params.id]);
    res.json({ ok: true });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// ============================================================
// ISHLAB CHIQARISH VA PARTIYALAR
// ============================================================
router.get('/harajatlar', authMiddleware, async (req, res) => {
  try {
    const data = await query('SELECT * FROM harajatlar ORDER BY sana DESC');
    res.json(data.rows);
  } catch (e) { res.status(500).json({ error: e.message }); }
});
router.post('/harajatlar', authMiddleware, async (req, res) => {
  try {
    const { sana, oy, tur, summa, izoh, qoshgan } = req.body;
    const doc = await query(
      'INSERT INTO harajatlar (sana, oy, tur, summa, izoh, qoshgan) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *',
      [sana, oy, tur, summa, izoh, qoshgan]
    );
    res.json(doc.rows[0]);
  } catch (e) { res.status(500).json({ error: e.message }); }
});
router.delete('/harajatlar/:id', authMiddleware, async (req, res) => {
  try {
    await query('DELETE FROM harajatlar WHERE id = $1', [req.params.id]);
    res.json({ ok: true });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// ============================================================
// MAHSULOTLAR
// ============================================================
router.get('/mahsulotlar', authMiddleware, async (req, res) => {
  try {
    const data = await query('SELECT * FROM mahsulotlar ORDER BY nomi ASC');
    res.json(data.rows);
  } catch (e) { res.status(500).json({ error: e.message }); }
});
router.post('/mahsulotlar', authMiddleware, async (req, res) => {
  try {
    const { nomi, qisqa, tur, xom, narx, ombor, min, icon, poterya } = req.body;
    const doc = await query(
      'INSERT INTO mahsulotlar (nomi, qisqa, tur, xom, narx, ombor, min, icon, poterya) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING *',
      [nomi, qisqa, tur, xom, narx, ombor || 0, min, icon, poterya || 0]
    );
    res.json(doc.rows[0]);
  } catch (e) { res.status(500).json({ error: e.message }); }
});
router.put('/mahsulotlar/:id', authMiddleware, async (req, res) => {
  try {
    const { nomi, qisqa, tur, xom, narx, ombor, min, icon, poterya } = req.body;
    const doc = await query(
      'UPDATE mahsulotlar SET nomi=$1, qisqa=$2, tur=$3, xom=$4, narx=$5, ombor=$6, min=$7, icon=$8, poterya=$9 WHERE id=$10 RETURNING *',
      [nomi, qisqa, tur, xom, narx, ombor, min, icon, poterya || 0, req.params.id]
    );
    res.json({ ok: true });
  } catch (e) { res.status(500).json({ error: e.message }); }
});
router.delete('/mahsulotlar/:id', authMiddleware, async (req, res) => {
  try {
    await query('DELETE FROM mahsulotlar WHERE id = $1', [req.params.id]);
    res.json({ ok: true });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// ===== XODIMLAR =====
router.get('/xodimlar', authMiddleware, async (req, res) => {
  try {
    const { rows } = await query('SELECT * FROM xodimlar ORDER BY created_at ASC');
    res.json(rows);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.post('/xodimlar', authMiddleware, async (req, res) => {
  try {
    const { ism, familiya, lavozim, rol, tel, tarif, sabit, izoh } = req.body;
    const doc = await query(
      'INSERT INTO xodimlar (ism, familiya, lavozim, rol, tel, tarif, sabit, izoh) VALUES ($1,$2,$3,$4,$5,$6,$7,$8) RETURNING *',
      [ism, familiya || '', lavozim || '', rol || '', tel || '', tarif || 0, sabit || 0, izoh || '']
    );
    res.json({ ok: true, id: doc.rows[0].id });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.put('/xodimlar/:id', authMiddleware, async (req, res) => {
  try {
    const keys = []; const vals = []; let i = 1;
    for (let key of ['ism','familiya','lavozim','rol','tel','tarif','sabit','izoh','oy_kg']) {
      if (req.body[key] !== undefined) { keys.push(`${key}=$${i++}`); vals.push(req.body[key]); }
    }
    if (req.body.oy_bonus !== undefined) { keys.push(`bonus=$${i++}`); vals.push(req.body.oy_bonus); }
    if (keys.length === 0) return res.json({ ok: true });
    vals.push(req.params.id);
    await query(`UPDATE xodimlar SET ${keys.join(', ')} WHERE id=$${i}`, vals);
    res.json({ ok: true });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.delete('/xodimlar/:id', authMiddleware, async (req, res) => {
  try {
    await query('DELETE FROM xodimlar WHERE id=$1', [req.params.id]);
    res.json({ ok: true });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// ===== AVANSLAR =====
router.get('/avanslar', authMiddleware, async (req, res) => {
  try {
    const { rows } = await query('SELECT * FROM avanslar ORDER BY created_at DESC');
    res.json(rows);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.post('/avanslar', authMiddleware, async (req, res) => {
  try {
    const { xodim_id, summa, sabab, sana } = req.body;
    await query(
      'INSERT INTO avanslar (xodim_id, summa, sabab, sana, bergan) VALUES ($1,$2,$3,$4,$5)',
      [xodim_id, summa || 0, sabab || '', sana || new Date().toISOString().split('T')[0], req.user.login]
    );
    res.json({ ok: true });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.put('/avanslar/:id', authMiddleware, async (req, res) => {
  try {
    const { holat } = req.body;
    await query('UPDATE avanslar SET holat=$1 WHERE id=$2', [holat, req.params.id]);
    res.json({ ok: true });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// ===== OYLIK TO'LOVLAR =====
router.get('/oy_tolovlar', authMiddleware, async (req, res) => {
  try {
    const { rows } = await query('SELECT * FROM oy_tolovlar');
    res.json(rows);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.post('/oy_tolovlar', authMiddleware, async (req, res) => {
  try {
    const { xodim_id, oy, yili, summa, maxsus_bonus, maxsus_jarima, izoh } = req.body;
    await query(
      'INSERT INTO oy_tolovlar (xodim_id, oy, yili, summa, maxsus_bonus, maxsus_jarima, izoh, bergan) VALUES ($1,$2,$3,$4,$5,$6,$7,$8)',
      [xodim_id, oy, yili || 2026, summa, maxsus_bonus || 0, maxsus_jarima || 0, izoh || '', req.user.login]
    );
    res.json({ ok: true });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// ===== MASHINALAR VA REYSLAR =====
router.get('/mashinalar', authMiddleware, async (req, res) => {
  try {
    const { rows } = await query('SELECT * FROM mashinalar');
    res.json(rows);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.post('/mashinalar', authMiddleware, async (req, res) => {
  try {
    const { haydovchi_id, model, raqam } = req.body;
    await query('INSERT INTO mashinalar (haydovchi_id, model, raqam) VALUES ($1,$2,$3)', [haydovchi_id, model, raqam]);
    res.json({ ok: true });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.get('/reyslar', authMiddleware, async (req, res) => {
  try {
    const { rows } = await query('SELECT * FROM reyslar ORDER BY sana DESC');
    res.json(rows);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.post('/reyslar', authMiddleware, async (req, res) => {
  try {
    const { haydovchi_id, mashina_id, marshrut, masofa_km, haq, holat, izoh, sana } = req.body;
    await query(
      'INSERT INTO reyslar (haydovchi_id, mashina_id, marshrut, masofa_km, haq, holat, izoh, sana) VALUES ($1,$2,$3,$4,$5,$6,$7,$8)',
      [haydovchi_id, mashina_id, marshrut, masofa_km || 0, haq || 0, holat || 'kutilmoqda', izoh || '', sana || new Date().toISOString().split('T')[0]]
    );
    res.json({ ok: true });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.put('/reyslar/:id', authMiddleware, async (req, res) => {
  try {
    const { holat } = req.body;
    await query('UPDATE reyslar SET holat=$1 WHERE id=$2', [holat, req.params.id]);
    res.json({ ok: true });
  } catch (e) { res.status(500).json({ error: e.message }); }
});
router.delete('/reyslar/:id', authMiddleware, async (req, res) => {
  try {
    await query('DELETE FROM reyslar WHERE id=$1', [req.params.id]);
    res.json({ ok: true });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// ===== ISHLAB CHIQARISH =====
router.get('/partiyalar', authMiddleware, async (req, res) => {
  try {
    const { rows } = await query('SELECT * FROM ishlab_partiyalar ORDER BY created_at ASC');
    res.json(rows);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.post('/partiyalar', authMiddleware, async (req, res) => {
  try {
    const p = req.body;
    await query(
      "INSERT INTO ishlab_partiyalar (sana, xom_ashyo_turi, mahsulot_id, mahsulot_nomi, kirgan_kg, chiqgan_kg, poterya_kg, poterya_pct, xodimlar, izoh, qoshgan) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11)",
      [p.sana, p.xom_ashyo_turi, p.mahsulot_id, p.mahsulot_nomi, p.kirgan_kg, p.chiqgan_kg, p.poterya_kg, p.poterya_pct, p.xodimlar, p.izoh, req.user.login]
    );
    res.json({ ok: true });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.delete('/partiyalar/:id', authMiddleware, async (req, res) => {
  try {
    await query('DELETE FROM ishlab_partiyalar WHERE id=$1', [req.params.id]);
    res.json({ ok: true });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// ===== XOM OMBOR KESH =====
router.get('/xom_ombor', authMiddleware, async (req, res) => {
  try {
    const { rows } = await query("SELECT data FROM kesh_xotira WHERE key='xom_ombor'");
    if (rows.length > 0) return res.json({ data: rows[0].data });
    res.json({ data: {
      qora: {kirgan:5000, sarflangan:2400},
      rangli: {kirgan:3000, sarflangan:1800},
      rezina: {kirgan:2000, sarflangan:1020}
    }});
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.post('/xom_ombor', authMiddleware, async (req, res) => {
  try {
    await query(
      "INSERT INTO kesh_xotira (key, data) VALUES ('xom_ombor', $1) ON CONFLICT (key) DO UPDATE SET data = EXCLUDED.data",
      [JSON.stringify(req.body.data)]
    );
    res.json({ ok: true });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.get('/xom-turlar', authMiddleware, async (req, res) => {
  try {
    const { rows } = await query("SELECT data FROM kesh_xotira WHERE key='xom_turlar'");
    res.json(rows[0] ? rows[0].data : []);
  } catch(e) { res.status(500).json({ error: e.message }); }
});

router.post('/xom-turlar', authMiddleware, async (req, res) => {
  try {
    await query(
      "INSERT INTO kesh_xotira (key, data) VALUES ('xom_turlar', $1) ON CONFLICT (key) DO UPDATE SET data = EXCLUDED.data",
      [JSON.stringify(req.body.data)]
    );
    res.json({ ok: true });
  } catch(e) { res.status(500).json({ error: e.message }); }
});

// Generic Key-Value endpoints for dynamic arrays
router.get('/kesh/:key', authMiddleware, async (req, res) => {
  try {
    const { rows } = await query('SELECT data FROM kesh_xotira WHERE key=$1', [req.params.key]);
    res.json(rows[0] ? rows[0].data : null);
  } catch(e) { res.status(500).json({ error: e.message }); }
});

router.post('/kesh/:key', authMiddleware, async (req, res) => {
  try {
    await query(
      'INSERT INTO kesh_xotira (key, data) VALUES ($1, $2) ON CONFLICT (key) DO UPDATE SET data = EXCLUDED.data',
      [req.params.key, JSON.stringify(req.body.data)]
    );
    res.json({ ok: true });
  } catch(e) { res.status(500).json({ error: e.message }); }
});

// ===== MOLXONA =====
router.get('/mol/partiyalar', authMiddleware, async (req, res) => {
  try {
    const { rows } = await query('SELECT * FROM mol_partiyalar ORDER BY sana ASC');
    res.json(rows);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.post('/mol/partiyalar', authMiddleware, async (req, res) => {
  try {
    const { nomi, sana, boshlangich_son, kirim_narx, holat } = req.body;
    await query(
      'INSERT INTO mol_partiyalar (nomi, sana, boshlangich_son, kirim_narx, holat) VALUES ($1,$2,$3,$4,$5)',
      [nomi, sana, boshlangich_son, kirim_narx, holat || 'aktiv']
    );
    res.json({ ok: true });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.put('/mol/partiyalar/:id', authMiddleware, async (req, res) => {
  try {
    const { holat } = req.body;
    await query('UPDATE mol_partiyalar SET holat=$1 WHERE id=$2', [holat, req.params.id]);
    res.json({ ok: true });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.delete('/mol/partiyalar/:id', authMiddleware, async (req, res) => {
  try {
    await query('DELETE FROM mol_partiyalar WHERE id=$1', [req.params.id]);
    res.json({ ok: true });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.get('/mol/xarajatlar', authMiddleware, async (req, res) => {
  try {
    const { rows } = await query('SELECT * FROM mol_xarajatlar ORDER BY sana ASC');
    res.json(rows);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.post('/mol/xarajatlar', authMiddleware, async (req, res) => {
  try {
    const { partiya_id, sana, tur, summa, izoh } = req.body;
    await query(
      'INSERT INTO mol_xarajatlar (partiya_id, sana, tur, summa, izoh) VALUES ($1,$2,$3,$4,$5)',
      [partiya_id, sana, tur, summa, izoh]
    );
    res.json({ ok: true });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.delete('/mol/xarajatlar/:id', authMiddleware, async (req, res) => {
  try {
    await query('DELETE FROM mol_xarajatlar WHERE id=$1', [req.params.id]);
    res.json({ ok: true });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.get('/mol/sotuvlar', authMiddleware, async (req, res) => {
  try {
    const { rows } = await query('SELECT * FROM mol_sotuvlar ORDER BY sana ASC');
    res.json(rows);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.post('/mol/sotuvlar', authMiddleware, async (req, res) => {
  try {
    const { partiya_id, sana, mijoz, mollar_soni, jami_summa } = req.body;
    await query(
      'INSERT INTO mol_sotuvlar (partiya_id, sana, mijoz, mollar_soni, jami_summa) VALUES ($1,$2,$3,$4,$5)',
      [partiya_id, sana, mijoz, mollar_soni, jami_summa]
    );
    res.json({ ok: true });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.delete('/mol/sotuvlar/:id', authMiddleware, async (req, res) => {
  try {
    await query('DELETE FROM mol_sotuvlar WHERE id=$1', [req.params.id]);
    res.json({ ok: true });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// ===== REZINA =====
router.get('/rezina/kirimlar', authMiddleware, async (req, res) => {
  try {
    const { rows } = await query('SELECT * FROM rez_kirimlar ORDER BY sana ASC');
    res.json(rows);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.post('/rezina/kirimlar', authMiddleware, async (req, res) => {
  try {
    const { sana, oy, zavod, tur, kg, narx, jami, tolov, izoh } = req.body;
    const tolangan = tolov === 'tolangan' || tolov === 'naqd' || tolov === 'bank' ? jami : 0;
    await query(
      'INSERT INTO rez_kirimlar (sana, oy, zavod, tur, kg, narx, jami, tolov, izoh, tolangan) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)',
      [sana, oy, zavod, tur, kg, narx, jami, 'qarz', izoh, tolangan]
    );
    res.json({ ok: true });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.put('/rezina/kirimlar/:id', authMiddleware, async (req, res) => {
  try {
    const { tolov_summa } = req.body;
    if (tolov_summa !== undefined) {
      await query(`
        UPDATE rez_kirimlar 
        SET tolangan = COALESCE(tolangan, 0) + $1,
            tolov = CASE WHEN COALESCE(tolangan, 0) + $1 >= jami THEN 'tolangan' ELSE 'qarz' END
        WHERE id=$2
      `, [tolov_summa, req.params.id]);
    } else {
      const { tolov } = req.body;
      if (tolov === 'tolangan') {
         await query('UPDATE rez_kirimlar SET tolov=$1, tolangan=jami WHERE id=$2', [tolov, req.params.id]);
      } else {
         await query('UPDATE rez_kirimlar SET tolov=$1 WHERE id=$2', [tolov, req.params.id]);
      }
    }
    res.json({ ok: true });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.delete('/rezina/kirimlar/:id', authMiddleware, async (req, res) => {
  try {
    await query('DELETE FROM rez_kirimlar WHERE id=$1', [req.params.id]);
    res.json({ ok: true });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.get('/rezina/sotuvlar', authMiddleware, async (req, res) => {
  try {
    const { rows } = await query('SELECT * FROM rez_sotuvlar ORDER BY sana ASC');
    res.json(rows);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.post('/rezina/sotuvlar', authMiddleware, async (req, res) => {
  try {
    const { sana, oy, mijoz, tur, kg, narx, jami, tolov, holat, kir_narx } = req.body;
    await query(
      'INSERT INTO rez_sotuvlar (sana, oy, mijoz, tur, kg, narx, jami, tolov, holat, kir_narx) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)',
      [sana, oy, mijoz, tur, kg, narx, jami, tolov, holat, kir_narx]
    );
    res.json({ ok: true });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.put('/rezina/sotuvlar/:id', authMiddleware, async (req, res) => {
  try {
    const { tolov } = req.body;
    await query('UPDATE rez_sotuvlar SET holat=$1 WHERE id=$2', [tolov, req.params.id]);
    res.json({ ok: true });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.delete('/rezina/sotuvlar/:id', authMiddleware, async (req, res) => {
  try {
    await query('DELETE FROM rez_sotuvlar WHERE id=$1', [req.params.id]);
    res.json({ ok: true });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// ============================================================
// YETKAZUVCHILAR
// ============================================================
router.get('/yetkazuvchilar', authMiddleware, async (req, res) => {
  try {
    const data = await query('SELECT * FROM yetkazuvchilar ORDER BY nomi ASC');
    res.json(data.rows);
  } catch (e) { res.status(500).json({ error: e.message }); }
});
router.post('/yetkazuvchilar', authMiddleware, async (req, res) => {
  try {
    const { nomi, tel } = req.body;
    const doc = await query('INSERT INTO yetkazuvchilar (nomi, tel) VALUES ($1,$2) RETURNING *', [nomi, tel]);
    res.json(doc.rows[0]);
  } catch (e) { res.status(500).json({ error: e.message }); }
});
router.put('/yetkazuvchilar/:id', authMiddleware, async (req, res) => {
  try {
    const { nomi, tel } = req.body;
    await query('UPDATE yetkazuvchilar SET nomi=$1, tel=$2 WHERE id=$3', [nomi, tel, req.params.id]);
    res.json({ ok: true });
  } catch (e) { res.status(500).json({ error: e.message }); }
});
router.delete('/yetkazuvchilar/:id', authMiddleware, async (req, res) => {
  try {
    await query('DELETE FROM yetkazuvchilar WHERE id=$1', [req.params.id]);
    res.json({ ok: true });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// ============================================================
// XOM ASHYO KIRIMI
// ============================================================
router.get('/xom-ashyo', authMiddleware, async (req, res) => {
  try {
    const data = await query('SELECT * FROM xom_ashyo ORDER BY sana DESC, created_at DESC');
    res.json(data.rows);
  } catch (e) { res.status(500).json({ error: e.message }); }
});
router.post('/xom-ashyo', authMiddleware, async (req, res) => {
  try {
    const { sana, oy, yetkazuvchi, tur, kg, narx, jami, tolov, naqdSumma, moshina, izoh, qarz_sum, tolov_sum } = req.body;
    const doc = await query(
      'INSERT INTO xom_ashyo (sana, oy, yetkazuvchi, tur, kg, narx, jami, tolov, "naqdSumma", moshina, izoh, qarz_sum, tolov_sum) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13) RETURNING *',
      [sana, oy, yetkazuvchi, tur, kg, narx, jami, tolov, naqdSumma || 0, moshina, izoh, qarz_sum || 0, tolov_sum || 0]
    );
    res.json(doc.rows[0]);
  } catch (e) { res.status(500).json({ error: e.message }); }
});
router.put('/xom-ashyo/:id', authMiddleware, async (req, res) => {
  try {
    const { qarz_sum, tolov, tolov_sum } = req.body;
    // We update whichever fields are provided
    const fields = [];
    const values = [];
    let idx = 1;
    if (qarz_sum !== undefined) { fields.push(`qarz_sum=$${idx++}`); values.push(qarz_sum); }
    if (tolov !== undefined) { fields.push(`tolov=$${idx++}`); values.push(tolov); }
    if (tolov_sum !== undefined) { fields.push(`tolov_sum=$${idx++}`); values.push(tolov_sum); }
    
    values.push(req.params.id);
    if (fields.length > 0) {
      await query(`UPDATE xom_ashyo SET ${fields.join(', ')} WHERE id=$${idx}`, values);
    }
    res.json({ ok: true });
  } catch (e) { res.status(500).json({ error: e.message }); }
});
router.delete('/xom-ashyo/:id', authMiddleware, async (req, res) => {
  try {
    await query('DELETE FROM xom_ashyo WHERE id=$1', [req.params.id]);
    res.json({ ok: true });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.get('/xom-tolovlar', authMiddleware, async (req, res) => {
  try {
    const data = await query('SELECT * FROM xom_tolovlar ORDER BY sana ASC, created_at ASC');
    res.json(data.rows);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.post('/xom-tolovlar', authMiddleware, async (req, res) => {
  try {
    const { sana, mijoz, summa, izoh } = req.body;
    const doc = await query(
      'INSERT INTO xom_tolovlar (sana, mijoz, summa, izoh) VALUES ($1,$2,$3,$4) RETURNING *',
      [sana, mijoz, summa, izoh]
    );
    res.json(doc.rows[0]);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// ============================================================
// ADMIN: Test ma'lumotlarni tozalash (faqat admin uchun)
// Foydalanuvchilar va tizim saqlanadi!
// ============================================================
router.post('/admin/reset-data', authMiddleware, roleCheck('admin'), async (req, res) => {
  try {
    const { tasdiqlash } = req.body;
    if (tasdiqlash !== 'HA_TOZALASH') {
      return res.status(400).json({ error: 'Tasdiqlash kerak! Body: { "tasdiqlash": "HA_TOZALASH" }' });
    }

    // Barcha biznes ma'lumotlarni o'chirish
    await query('DELETE FROM sotuvlar');
    await query('DELETE FROM xom_ashyo');
    await query('DELETE FROM xom_tolovlar');
    await query('DELETE FROM mahsulotlar');
    // Mijozlar qarzini 0 ga tushirish (mijozlarni o'chirmaymiz)
    await query('UPDATE mijozlar SET qarz = 0');
    // Yetkazuvchilarni saqlaymiz, faqat qarz tozalanadi

    res.json({
      muvaffaqiyat: true,
      xabar: 'Barcha test ma\'lumotlar tozalandi!',
      tozalangan: ['sotuvlar', 'xom_ashyo', 'xom_tolovlar', 'mahsulotlar', 'mijozlar qarzlari'],
      saqlanganlar: ['foydalanuvchilar', 'mijozlar', 'yetkazuvchilar']
    });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

module.exports = router;
