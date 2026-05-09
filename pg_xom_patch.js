const fs = require('fs');
const file = '/var/www/valijon-erp/routes/api_pg.js';
let code = fs.readFileSync(file, 'utf8');

const newCode = `
// ============================================================
// YETKAZUVCHILAR (PostgreSQL)
// ============================================================
router.get('/yetkazuvchilar', authMiddleware, async (req, res) => {
  try {
    const data = await query('SELECT * FROM yetkazuvchilar ORDER BY created_at DESC');
    res.json(data.rows);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.post('/yetkazuvchilar', authMiddleware, async (req, res) => {
  try {
    const { nomi, tel } = req.body;
    const doc = await query('INSERT INTO yetkazuvchilar (nomi, tel) VALUES ($1, $2) RETURNING *', [nomi, tel || '']);
    res.json(doc.rows[0]);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// ============================================================
// XOM ASHYO KIRIM (PostgreSQL — rez_kirimlar jadvali)
// ============================================================
router.get('/xom-ashyo', authMiddleware, async (req, res) => {
  try {
    const data = await query('SELECT id, sana, oy, zavod as yetkazuvchi, tur, kg, narx, jami, tolov, izoh, created_at FROM rez_kirimlar ORDER BY created_at DESC');
    res.json(data.rows);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.post('/xom-ashyo', authMiddleware, async (req, res) => {
  try {
    const { sana, oy, yetkazuvchi, tur, kg, narx, jami, tolov, izoh } = req.body;
    const doc = await query(
      'INSERT INTO rez_kirimlar (sana, oy, zavod, tur, kg, narx, jami, tolov, izoh) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9) RETURNING id, sana, oy, zavod as yetkazuvchi, tur, kg, narx, jami, tolov, izoh',
      [sana, oy || new Date().getMonth()+1, yetkazuvchi, tur, kg, narx, jami || kg*narx, tolov || 'qarz', izoh || '']
    );
    res.json(doc.rows[0]);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

`;

code = code.replace('module.exports = router;', newCode + 'module.exports = router;');
fs.writeFileSync(file, code, 'utf8');
console.log('TAYYOR! xom-ashyo va yetkazuvchilar PG endpointlari qoshildi.');
