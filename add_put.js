const fs = require('fs');
let code = fs.readFileSync('routes/api.js', 'utf8');

const target = "router.delete('/xom-ashyo/:id', authMiddleware, roleCheck('admin', 'menejer'), async (req, res) => {\n  await db.kirimlar.remove({ _id: req.params.id });\n  res.json({ ok: true });\n});";

const putEndpoint = `
router.put('/xom-ashyo/:id', authMiddleware, async (req, res) => {
  await db.kirimlar.update({ _id: req.params.id }, { $set: req.body });
  res.json({ ok: true });
});
`;

if (!code.includes("router.put('/xom-ashyo/:id'")) {
  code = code.replace(target, putEndpoint + '\n' + target);
  fs.writeFileSync('routes/api.js', code);
  console.log("PUT endpoint added.");
} else {
  console.log("PUT endpoint already exists.");
}

