const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { query } = require('../db/pg_database');
const { authMiddleware, roleCheck, SECRET } = require('./auth.middleware');

const router = express.Router();

// ============================================================
// AUTH (PostgreSQL orqali)
// ============================================================
router.post('/auth/login', async (req, res) => {
  try {
    const { login, parol } = req.body;
    
    // Foydalanuvchini izlash
    let resUser = await query('SELECT * FROM foydalanuvchilar WHERE login = $1', [login]);
    
    if (resUser.rowCount === 0) {
      // Agar foydalanuvchi topilmasa, mijozni izlaymiz (agar klient kirsa)
      // Eslatma: Hozirgi postgreSQL schemada Mijozlarda "parol" yoki "login" maydoni yo'q, 
      // agar u oldin bo'lgan bo'lsa, mijozlar jadvaliga ham qo'shishingiz kerak bo'ladi.
      return res.status(401).json({ error: 'Login yoki parol noto\'g\'ri' });
    }

    const user = resUser.rows[0];
    const ok = await bcrypt.compare(parol, user.parol);
    
    if (!ok) return res.status(401).json({ error: 'Login yoki parol noto\'g\'ri' });
    
    const token = jwt.sign({ id: user.id, ism: user.ism, login: user.login, rol: user.rol }, SECRET, { expiresIn: '8h' });
    res.json({ token, user: { ism: user.ism, login: user.login, rol: user.rol } });
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
    const { nomi, turi, tel, masul, manzil, narx_tur, kredit, maxsus_narxlar } = req.body;
    const doc = await query(
      'INSERT INTO mijozlar (nomi, turi, tel, masul, manzil, narx_tur, kredit, maxsus_narxlar) VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *',
      [nomi, turi, tel, masul, manzil, narx_tur, kredit || 0, maxsus_narxlar ? JSON.stringify(maxsus_narxlar) : '{}']
    );
    res.json(doc.rows[0]);
  } catch (e) { res.status(500).json({ error: e.message }); }
});
router.put('/mijozlar/:id', authMiddleware, async (req, res) => {
  try {
    const { nomi, turi, tel, masul, manzil, narx_tur, kredit, jami, tolangan, qarz, maxsus_narxlar } = req.body;
    await query(
      'UPDATE mijozlar SET nomi=$1, turi=$2, tel=$3, masul=$4, manzil=$5, narx_tur=$6, kredit=$7, jami=$8, tolangan=$9, qarz=$10, maxsus_narxlar=$11 WHERE id=$12',
      [nomi, turi, tel, masul, manzil, narx_tur, kredit, jami, tolangan, qarz, maxsus_narxlar ? JSON.stringify(maxsus_narxlar) : '{}', req.params.id]
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
// HARAJATLAR
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
    const { nomi, qisqa, tur, xom, narx, ombor, min, icon } = req.body;
    const doc = await query(
      'INSERT INTO mahsulotlar (nomi, qisqa, tur, xom, narx, ombor, min, icon) VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *',
      [nomi, qisqa, tur, xom, narx, ombor || 0, min, icon]
    );
    res.json(doc.rows[0]);
  } catch (e) { res.status(500).json({ error: e.message }); }
});
router.put('/mahsulotlar/:id', authMiddleware, async (req, res) => {
  try {
    const { nomi, qisqa, tur, xom, narx, ombor, min, icon } = req.body;
    await query(
      'UPDATE mahsulotlar SET nomi=$1, qisqa=$2, tur=$3, xom=$4, narx=$5, ombor=$6, min=$7, icon=$8 WHERE id=$9',
      [nomi, qisqa, tur, xom, narx, ombor, min, icon, req.params.id]
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

// Qolgan API yozuvlarini ham huddi shu kabi sekin aylanib chiqamiz...
module.exports = router;
