const fs = require('fs');
let code = fs.readFileSync('public/xomAshyo.html', 'utf8');

// event listener restore
code = code.replace("// event listener removed", "document.getElementById('kYetkazuvchi').addEventListener('change', function() {\n  if (this.value === 'yangi') openModal('yetkazuvchiModal');\n});");

// innerHTML restore
code = code.replace(
  "  const sel = document.getElementById('kYetkazuvchi');\n  if(!sel) return;\n  return;",
  "  const sel = document.getElementById('kYetkazuvchi');\n  if(!sel) return;\n  sel.innerHTML = '<option value=\"\">— Tanlang yoki yangi —</option>' + \n    yetkazuvchilar.map(y => `<option value=\"${y.nomi}\">${y.nomi}</option>`).join('') + \n    '<option value=\"yangi\">+ Yangi mijoz qo\\’shish</option>';"
);

// value restore
code = code.replace("// document.getElementById('kYetkazuvchi').value = '';", "document.getElementById('kYetkazuvchi').value = '';");

// alert text update
code = code.replace("// if (!yetkazuvchi || yetkazuvchi === 'yangi') return alert('Yetkazuvchini tanlang!');", "if (!yetkazuvchi || yetkazuvchi === 'yangi') return alert('Mijozni tanlang!');");

fs.writeFileSync('public/xomAshyo.html', code);

