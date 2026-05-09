const fs = require('fs');

// ==== 1. Update mijozlar.html ====
let mijoz = fs.readFileSync('public/mijozlar.html', 'utf8');

// Replace "Narx turi" field block in modal
mijoz = mijoz.replace(
  '<div class="form-row"><div class="form-group"><label>Shahar / Viloyat</label><input id="mManzil" placeholder="Toshkent"></div><div class="form-group"><label>Narx turi (default)</label><select id="mNarxTur"><option value="baza">Baza narx</option><option value="standart">Standart</option><option value="vip">VIP (zavod)</option><option value="maxsus">Maxsus (alohida)</option></select></div></div>',
  '<div class="form-group"><label>Shahar / Viloyat</label><input id="mManzil" placeholder="Toshkent"></div><input type="hidden" id="mNarxTur" value="baza">'
);

fs.writeFileSync('public/mijozlar.html', mijoz);

// ==== 2. Update xomAshyo.html ====
let xom = fs.readFileSync('public/xomAshyo.html', 'utf8');

// Remove Yetkazuvchi from HTML
xom = xom.replace(
  '<div class="form-row">\n                <div class="form-group"><label>Sana</label><input type="date" id="kSana"></div>\n                <div class="form-group"><label>Yetkazuvchi (kimdan olingan)</label>\n                  <select id="kYetkazuvchi">\n                    <option value="">— Tanlang yoki yangi —</option>\n                  </select>\n                </div>\n              </div>',
  '<div class="form-group" style="margin-bottom:16px"><label>Sana</label><input type="date" id="kSana"></div>\n              <input type="hidden" id="kYetkazuvchi" value="Tizim">'
);
// Sometimes format differs, replace manually:
xom = xom.replace(/<div class="form-row">\s*<div class="form-group"><label>Sana<\/label><input type="date" id="kSana"><\/div>\s*<div class="form-group"><label>Yetkazuvchi \(kimdan olingan\)<\/label>\s*<select id="kYetkazuvchi">\s*<option value="">— Tanlang yoki yangi —<\/option>\s*<\/select>\s*<\/div>\s*<\/div>/g, 
'<div class="form-group" style="margin-bottom:16px"><label>Sana</label><input type="date" id="kSana"></div>\n<input type="hidden" id="kYetkazuvchi" value="Tizim">');

// Moshina / Transport HTML
xom = xom.replace(
  '<div class="form-group"><label>Moshina / Transport</label><input id="kMoshina" placeholder="01 A 234 BC"></div>',
  '<input type="hidden" id="kMoshina" value="">'
);

// JS logic in saveKirim()
xom = xom.replace(
  "if (!yetkazuvchi || yetkazuvchi === 'yangi') return alert('Yetkazuvchini tanlang!');",
  "// if (!yetkazuvchi || yetkazuvchi === 'yangi') return alert('Yetkazuvchini tanlang!');"
);

// Document reset
xom = xom.replace(
  "document.getElementById('kYetkazuvchi').value = '';",
  "// document.getElementById('kYetkazuvchi').value = '';"
);

fs.writeFileSync('public/xomAshyo.html', xom);

console.log('UI Patched!');
