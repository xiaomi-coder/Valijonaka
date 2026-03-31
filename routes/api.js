const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { db } = require('../db/database');
const { authMiddleware, roleCheck, SECRET } = require('./auth.middleware');

const router = express.Router();

// ============================================================
// AUTH
// ============================================================
router.post('/auth/login', async (req, res) => {
  try {
    const { login, parol } = req.body;
    const user = await db.foydalanuvchilar.findOne({ login });
    if (!user) return res.status(401).json({ error: 'Login yoki parol noto\'g\'ri' });
    const ok = await bcrypt.compare(parol, user.parol);
    if (!ok) return res.status(401).json({ error: 'Login yoki parol noto\'g\'ri' });
    const token = jwt.sign({ id: user._id, ism: user.ism, login: user.login, rol: user.rol }, SECRET, { expiresIn: '8h' });
    res.json({ token, user: { ism: user.ism, login: user.login, rol: user.rol } });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.get('/auth/me', authMiddleware, (req, res) => res.json(req.user));

// Foydalanuvchilar (admin only)
router.get('/foydalanuvchilar', authMiddleware, roleCheck('admin'), async (req, res) => {
  const list = await db.foydalanuvchilar.find({}, { parol: 0 });
  res.json(list);
});
router.post('/foydalanuvchilar', authMiddleware, roleCheck('admin'), async (req, res) => {
  try {
    const { ism, login, parol, rol } = req.body;
    const exists = await db.foydalanuvchilar.findOne({ login });
    if (exists) return res.status(400).json({ error: 'Bu login band' });
    const hash = await bcrypt.hash(parol, 10);
    const doc = await db.foydalanuvchilar.insert({ ism, login, parol: hash, rol, createdAt: new Date() });
    res.json({ ...doc, parol: undefined });
  } catch (e) { res.status(500).json({ error: e.message }); }
});
router.delete('/foydalanuvchilar/:id', authMiddleware, roleCheck('admin'), async (req, res) => {
  await db.foydalanuvchilar.remove({ _id: req.params.id });
  res.json({ ok: true });
});

// ============================================================
// MIJOZLAR
// ============================================================
router.get('/mijozlar', authMiddleware, async (req, res) => {
  const list = await db.mijozlar.find({}).sort({ nomi: 1 });
  res.json(list);
});
router.post('/mijozlar', authMiddleware, async (req, res) => {
  try {
    const doc = await db.mijozlar.insert({ ...req.body, createdAt: new Date() });
    res.json(doc);
  } catch (e) { res.status(500).json({ error: e.message }); }
});
router.put('/mijozlar/:id', authMiddleware, async (req, res) => {
  await db.mijozlar.update({ _id: req.params.id }, { $set: req.body });
  res.json({ ok: true });
});
router.delete('/mijozlar/:id', authMiddleware, roleCheck('admin', 'menejer'), async (req, res) => {
  await db.mijozlar.remove({ _id: req.params.id });
  res.json({ ok: true });
});

// ============================================================
// YETKAZUVCHILAR
// ============================================================
router.get('/yetkazuvchilar', authMiddleware, async (req, res) => {
  const list = await db.yetkazuvchilar.find({}).sort({ nomi: 1 });
  res.json(list);
});
router.post('/yetkazuvchilar', authMiddleware, async (req, res) => {
  try {
    const doc = await db.yetkazuvchilar.insert({ ...req.body, createdAt: new Date() });
    res.json(doc);
  } catch (e) { res.status(500).json({ error: e.message }); }
});
router.put('/yetkazuvchilar/:id', authMiddleware, async (req, res) => {
  await db.yetkazuvchilar.update({ _id: req.params.id }, { $set: req.body });
  res.json({ ok: true });
});
router.delete('/yetkazuvchilar/:id', authMiddleware, roleCheck('admin', 'menejer'), async (req, res) => {
  await db.yetkazuvchilar.remove({ _id: req.params.id });
  res.json({ ok: true });
});

// ============================================================
// MAHSULOTLAR
// ============================================================
router.get('/mahsulotlar', authMiddleware, async (req, res) => {
  res.json(await db.mahsulotlar.find({}));
});
router.post('/mahsulotlar', authMiddleware, roleCheck('admin', 'menejer'), async (req, res) => {
  try {
    res.json(await db.mahsulotlar.insert({ ...req.body, createdAt: new Date() }));
  } catch (e) { res.status(500).json({ error: e.message }); }
});
router.put('/mahsulotlar/:id', authMiddleware, async (req, res) => {
  await db.mahsulotlar.update({ _id: req.params.id }, { $set: req.body });
  res.json({ ok: true });
});
router.delete('/mahsulotlar/:id', authMiddleware, roleCheck('admin'), async (req, res) => {
  await db.mahsulotlar.remove({ _id: req.params.id });
  res.json({ ok: true });
});

// ============================================================
// XOM ASHYO KIRIMI
// ============================================================
router.get('/xom-ashyo', authMiddleware, async (req, res) => {
  const list = await db.kirimlar.find({}).sort({ sana: -1 });
  res.json(list);
});
router.post('/xom-ashyo', authMiddleware, async (req, res) => {
  try {
    const doc = await db.kirimlar.insert({ ...req.body, createdAt: new Date(), qoshgan: req.user.ism });
    res.json(doc);
  } catch (e) { res.status(500).json({ error: e.message }); }
});
router.delete('/xom-ashyo/:id', authMiddleware, roleCheck('admin', 'menejer'), async (req, res) => {
  await db.kirimlar.remove({ _id: req.params.id });
  res.json({ ok: true });
});

// ============================================================
// ISHLAB CHIQARISH (PARTIYALAR)
// ============================================================
router.get('/partiyalar', authMiddleware, async (req, res) => {
  res.json(await db.partiyalar.find({}).sort({ sana: -1 }));
});
router.post('/partiyalar', authMiddleware, async (req, res) => {
  try {
    const p = req.body;
    // Poterya hisoblash
    p.poteryaKg = +(p.kirganKg - p.chiqganKg).toFixed(2);
    p.poteryaPct = req.body.poteryaPct !== undefined ? req.body.poteryaPct : +(p.poteryaKg / p.kirganKg * 100).toFixed(2);
    p.createdAt = new Date();
    p.qoshgan = req.user.ism;
    const doc = await db.partiyalar.insert(p);
    // Mahsulot omborini yangilash
    if (p.mahsulotId) {
      await db.mahsulotlar.update({ _id: p.mahsulotId }, { $inc: { ombor: p.chiqganKg } });
    }
    res.json(doc);
  } catch (e) { res.status(500).json({ error: e.message }); }
});
router.delete('/partiyalar/:id', authMiddleware, roleCheck('admin'), async (req, res) => {
  await db.partiyalar.remove({ _id: req.params.id });
  res.json({ ok: true });
});

// ============================================================
// SOTUVLAR
// ============================================================
router.get('/sotuvlar', authMiddleware, async (req, res) => {
  res.json(await db.sotuvlar.find({}).sort({ createdAt: -1 }));
});
router.post('/sotuvlar', authMiddleware, async (req, res) => {
  try {
    const s = { ...req.body, createdAt: new Date(), qoshgan: req.user.ism };
    const doc = await db.sotuvlar.insert(s);
    // Mijoz qarzini yangilash
    if (s.mijozId && s.qarz > 0) {
      await db.mijozlar.update({ _id: s.mijozId }, { $inc: { jami: s.summa, qarz: s.qarz } });
    } else if (s.mijozId) {
      await db.mijozlar.update({ _id: s.mijozId }, { $inc: { jami: s.summa } });
    }
    // Mahsulot omboridan kamaytirish
    if (s.cart) {
      for (const item of s.cart) {
        if (item.mahsulotId) {
          await db.mahsulotlar.update({ _id: item.mahsulotId }, { $inc: { ombor: -item.kg } });
        }
      }
    }
    res.json(doc);
  } catch (e) { res.status(500).json({ error: e.message }); }
});
router.put('/sotuvlar/:id/tolov', authMiddleware, async (req, res) => {
  try {
    const { summa } = req.body;
    const s = await db.sotuvlar.findOne({ _id: req.params.id });
    if (!s) return res.status(404).json({ error: 'Topilmadi' });
    const yangiQarz = Math.max(0, s.qarz - summa);
    const holat = yangiQarz === 0 ? 'tolandi' : 'qisman';
    await db.sotuvlar.update({ _id: req.params.id }, { $set: { qarz: yangiQarz, holat, tolangan: s.tolangan + summa } });
    if (s.mijozId) {
      await db.mijozlar.update({ _id: s.mijozId }, { $inc: { qarz: -summa, tolangan: summa } });
    }
    res.json({ ok: true, yangiQarz });
  } catch (e) { res.status(500).json({ error: e.message }); }
});
router.delete('/sotuvlar/:id', authMiddleware, roleCheck('admin'), async (req, res) => {
  await db.sotuvlar.remove({ _id: req.params.id });
  res.json({ ok: true });
});

// ============================================================
// XODIMLAR
// ============================================================
router.get('/xodimlar', authMiddleware, async (req, res) => {
  res.json(await db.xodimlar.find({}));
});
router.post('/xodimlar', authMiddleware, roleCheck('admin', 'menejer'), async (req, res) => {
  try {
    res.json(await db.xodimlar.insert({ ...req.body, createdAt: new Date() }));
  } catch (e) { res.status(500).json({ error: e.message }); }
});
router.put('/xodimlar/:id', authMiddleware, roleCheck('admin', 'menejer'), async (req, res) => {
  await db.xodimlar.update({ _id: req.params.id }, { $set: req.body });
  res.json({ ok: true });
});
router.delete('/xodimlar/:id', authMiddleware, roleCheck('admin'), async (req, res) => {
  await db.xodimlar.remove({ _id: req.params.id });
  res.json({ ok: true });
});

// ============================================================
// AVANSLAR
// ============================================================
router.get('/avanslar', authMiddleware, async (req, res) => {
  res.json(await db.avanslar.find({}).sort({ sana: -1 }));
});
router.post('/avanslar', authMiddleware, async (req, res) => {
  try {
    const doc = await db.avanslar.insert({ ...req.body, bergan: req.user.ism, holat: 'aktiv', createdAt: new Date() });
    res.json(doc);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// ============================================================
// HARAJATLAR
// ============================================================
router.get('/harajatlar', authMiddleware, async (req, res) => {
  const { oy } = req.query;
  const filter = oy ? { oy: parseInt(oy) } : {};
  res.json(await db.harajatlar.find(filter).sort({ sana: -1 }));
});
router.post('/harajatlar', authMiddleware, async (req, res) => {
  try {
    const sana = req.body.sana || new Date().toISOString().split('T')[0];
    const oy = parseInt(sana.split('-')[1]) || new Date().getMonth() + 1;
    const doc = await db.harajatlar.insert({ ...req.body, oy, qoshgan: req.user.ism, createdAt: new Date() });
    res.json(doc);
  } catch (e) { res.status(500).json({ error: e.message }); }
});
router.delete('/harajatlar/:id', authMiddleware, roleCheck('admin', 'menejer'), async (req, res) => {
  await db.harajatlar.remove({ _id: req.params.id });
  res.json({ ok: true });
});

// ============================================================
// REZINA DILERLIK
// ============================================================
router.get('/rezina/kirimlar', authMiddleware, async (req, res) => {
  res.json(await db.rezKirimlar.find({}).sort({ sana: -1 }));
});
router.post('/rezina/kirimlar', authMiddleware, async (req, res) => {
  try {
    res.json(await db.rezKirimlar.insert({ ...req.body, createdAt: new Date() }));
  } catch (e) { res.status(500).json({ error: e.message }); }
});
router.get('/rezina/sotuvlar', authMiddleware, async (req, res) => {
  res.json(await db.rezSotuvlar.find({}).sort({ sana: -1 }));
});
router.post('/rezina/sotuvlar', authMiddleware, async (req, res) => {
  try {
    res.json(await db.rezSotuvlar.insert({ ...req.body, createdAt: new Date() }));
  } catch (e) { res.status(500).json({ error: e.message }); }
});
router.put('/rezina/sotuvlar/:id/tolov', authMiddleware, async (req, res) => {
  await db.rezSotuvlar.update({ _id: req.params.id }, { $set: { holat: 'tolandi' } });
  res.json({ ok: true });
});

// ============================================================
// REYSLAR
// ============================================================
router.get('/reyslar', authMiddleware, async (req, res) => {
  res.json(await db.reyslar.find({}).sort({ sana: -1 }));
});
router.post('/reyslar', authMiddleware, async (req, res) => {
  try {
    res.json(await db.reyslar.insert({ ...req.body, createdAt: new Date() }));
  } catch (e) { res.status(500).json({ error: e.message }); }
});
router.put('/reyslar/:id/tola', authMiddleware, async (req, res) => {
  await db.reyslar.update({ _id: req.params.id }, { $set: { holat: 'tolandi' } });
  res.json({ ok: true });
});

// ============================================================
// DASHBOARD STATISTIKA
// ============================================================
router.get('/dashboard/stats', authMiddleware, async (req, res) => {
  try {
    const bugun = new Date().toISOString().split('T')[0];
    const oyNo = new Date().getMonth() + 1;

    const sotuvlar = await db.sotuvlar.find({});
    const bugunSotuvlar = sotuvlar.filter(s => s.sana === bugun);
    const harajatlar = await db.harajatlar.find({ oy: oyNo });
    const xodimlar = await db.xodimlar.find({});
    const mijozlar = await db.mijozlar.find({});
    const partiyalar = await db.partiyalar.find({});
    const mahsulotlar = await db.mahsulotlar.find({});

    const bugunSotuvSumma = bugunSotuvlar.reduce((s, x) => s + (x.summa || 0), 0);
    const oyHarajat = harajatlar.reduce((s, h) => s + (h.summa || 0), 0);
    const jamilQarz = mijozlar.reduce((s, m) => s + (m.qarz || 0), 0);
    const oyPartiyalar = partiyalar.filter(p => {
      const pOy = p.sana ? parseInt(p.sana.split('-')[1]) : 0;
      return pOy === oyNo;
    });
    const oyTayyorKg = oyPartiyalar.reduce((s, p) => s + (p.chiqganKg || 0), 0);

    res.json({
      bugunSotuv: bugunSotuvSumma,
      oyHarajat,
      jamilQarz,
      oyTayyorKg,
      xodimlarSoni: xodimlar.length,
      mijozlarSoni: mijozlar.length,
      mahsulotlarSoni: mahsulotlar.length,
      kamOmbor: mahsulotlar.filter(m => m.ombor < m.min).length,
    });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

module.exports = router;
