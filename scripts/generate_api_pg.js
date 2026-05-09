const fs = require('fs');

const path = require('path');
const p = path.join(__dirname, 'routes', 'api_pg.js');
let code = fs.readFileSync(p, 'utf8');

const additionalRoutes = `
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
    const { nomi, qisqa, tur, xom, narx, min, icon } = req.body;
    const doc = await query(
      'INSERT INTO mahsulotlar (nomi, qisqa, tur, xom, narx, min, icon) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *',
      [nomi, qisqa, tur, xom, narx, min, icon]
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

// ============================================================
// XODIMLAR
// ============================================================
router.get('/xodimlar', authMiddleware, async (req, res) => {
  try {
    const data = await query('SELECT * FROM xodimlar ORDER BY ism ASC');
    res.json(data.rows);
  } catch (e) { res.status(500).json({ error: e.message }); }
});
router.post('/xodimlar', authMiddleware, async (req, res) => {
  try {
    const { ism, familiya, lavozim, rol, tel, tarif, sabit, oy_kg, bonus } = req.body;
    const doc = await query(
      'INSERT INTO xodimlar (ism, familiya, lavozim, rol, tel, tarif, sabit, oy_kg, bonus) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING *',
      [ism, familiya, lavozim, rol, tel, tarif, sabit, oy_kg ? JSON.stringify(oy_kg) : '{}', bonus ? JSON.stringify(bonus) : '{}']
    );
    res.json(doc.rows[0]);
  } catch (e) { res.status(500).json({ error: e.message }); }
});
router.put('/xodimlar/:id', authMiddleware, async (req, res) => {
  try {
    const { ism, familiya, lavozim, rol, tel, tarif, sabit, oy_kg, bonus } = req.body;
    await query(
      'UPDATE xodimlar SET ism=$1, familiya=$2, lavozim=$3, rol=$4, tel=$5, tarif=$6, sabit=$7, oy_kg=$8, bonus=$9 WHERE id=$10',
      [ism, familiya, lavozim, rol, tel, tarif, sabit, oy_kg ? JSON.stringify(oy_kg) : '{}', bonus ? JSON.stringify(bonus) : '{}', req.params.id]
    );
    res.json({ ok: true });
  } catch (e) { res.status(500).json({ error: e.message }); }
});
router.delete('/xodimlar/:id', authMiddleware, async (req, res) => {
  try {
    await query('DELETE FROM xodimlar WHERE id = $1', [req.params.id]);
    res.json({ ok: true });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// Qolgan API yozuvlarini ham huddi shu kabi sekin aylanib chiqamiz...
module.exports = router;
`;

if(code.includes('MIJOZLAR')) {
  console.log("Already updated routes");
} else {
  code = code.replace('// Qolgan API yozuvlarini ham huddi shu kabi sekin aylanib chiqamiz...\nmodule.exports = router;', additionalRoutes);
  fs.writeFileSync(p, code);
  console.log("Updated api_pg.js");
}

