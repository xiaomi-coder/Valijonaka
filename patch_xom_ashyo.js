const fs = require('fs');
let code = fs.readFileSync('public/xomAshyo.html', 'utf8');

// 1. Move the tab button
code = code.replace(
  '<button class=\"tab\" onclick=\"switchTab(\\'yetkazuvchi\\',this)\">🚚 Yetkazuvchilar</button>\n      <button class=\"tab\" onclick=\"switchTab(\\'kategoriya\\',this)\">⚙️ Kategoriyalar</button>',
  '<button class=\"tab\" onclick=\"switchTab(\\'kategoriya\\',this)\">⚙️ Kategoriyalar</button>\n      <button class=\"tab\" onclick=\"switchTab(\\'yetkazuvchi\\',this)\">👥 Mijozlar</button>'
);

// 2. Add the select back to form-group inside form
// Wait, previously I replaced it with `<input type="hidden" id="kYetkazuvchi" value="Noma'lum">`
code = code.replace(
  '<div class="form-group" style="margin-bottom:16px;">\n                <label>Sana</label><input type="date" id="kSana">\n                <input type="hidden" id="kYetkazuvchi" value="Noma\'lum">\n              </div>',
  '<div class="form-row">\n                <div class="form-group"><label>Sana</label><input type="date" id="kSana"></div>\n                <div class="form-group"><label>Mijoz (kimdan olingan)</label>\n                  <select id="kYetkazuvchi">\n                    <option value="">— Tanlang yoki yangi —</option>\n                  </select>\n                </div>\n              </div>'
);
// Make sure it matches if I made format error earlier
if (!code.includes('<div class="form-row">\n                <div class="form-group"><label>Sana</label>')) {
  // Try regex replace
  code = code.replace(/<div class="form-group"[^>]*>\s*<label>Sana<\/label><input type="date" id="kSana">\s*<input type="hidden" id="kYetkazuvchi"[^>]*>\s*<\/div>/g, '<div class="form-row">\n                <div class="form-group"><label>Sana</label><input type="date" id="kSana"></div>\n                <div class="form-group"><label>Mijoz (kimdan olingan)</label>\n                  <select id="kYetkazuvchi">\n                    <option value="">— Tanlang yoki yangi —</option>\n                  </select>\n                </div>\n              </div>');
}

// 3. Rename UI texts in the HTML from "Yetkazuvchi" to "Mijoz"
code = code.replace('Tab: 🚚 Yetkazuvchilar', 'Tab: 👥 Mijozlar');
code = code.replace('<div style="font-size:16px;font-weight:700;">🚚 Yetkazuvchilar</div>', '<div style="font-size:16px;font-weight:700;">👥 Mijozlar</div>');
code = code.replace('<button class="btn btn-primary" onclick="openModal(\'yetkazuvchiModal\')">+ Yangi yetkazuvchi</button>', '<button class="btn btn-primary" onclick="openModal(\'yetkazuvchiModal\')">+ Yangi mijoz</button>');
code = code.replace('<h3>🚚 Yangi yetkazuvchi</h3>', '<h3>👥 Yangi mijoz</h3>');
code = code.replace('+ Yangi yetkazuvchi qo’shish', '+ Yangi mijoz qo’shish');
code = code.replace('<div class="lbl">Qarz (yetkazuvchiga)</div>', '<div class="lbl">Qarz (mijozga)</div>');
code = code.replace('<th>Yetkazuvchi</th>', '<th>Mijoz</th>');

// restore event listener for opening modal
// Previously I commented it out: `// event listener removed`
code = code.replace('// event listener removed', "document.getElementById('kYetkazuvchi').addEventListener('change', function() {\n  if (this.value === 'yangi') openModal('yetkazuvchiModal');\n});");

// restore innerHTML setup in setupYetkazuvchiSelect
code = code.replace(
  "  const sel = document.getElementById('kYetkazuvchi');\n  if(!sel) return;\n  return;",
  "  const sel = document.getElementById('kYetkazuvchi');\n  if(!sel) return;\n  sel.innerHTML = '<option value=\"\">— Tanlang yoki yangi —</option>' + \n    yetkazuvchilar.map(y => `<option value=\"${y.nomi}\">${y.nomi}</option>`).join('') + \n    '<option value=\"yangi\">+ Yangi mijoz qo\\’shish</option>';"
);

// restore document val reset
code = code.replace("// document.getElementById('kYetkazuvchi').value = '';", "document.getElementById('kYetkazuvchi').value = '';");

fs.writeFileSync('public/xomAshyo.html', code);

