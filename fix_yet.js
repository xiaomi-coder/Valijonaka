const fs = require('fs');
let code = fs.readFileSync('public/xomAshyo.html', 'utf8');

// Replace innerHTML assignment inside setupYetkazuvchiSelect
code = code.replace(
  "  const sel = document.getElementById('kYetkazuvchi');\n  if(!sel) return;\n  sel.innerHTML = '<option value=\"\">— Tanlang yoki yangi —</option>' + \n    yetkazuvchilar.map(y => `<option value=\"${y.nomi}\">${y.nomi}</option>`).join('') + \n    '<option value=\"yangi\">+ Yangi yetkazuvchi qo\\’shish</option>';",
  "  return;"
);

// remove the event listener for kYetkazuvchi
const matchStr = "document.getElementById('kYetkazuvchi').addEventListener('change', function() {\n  if (this.value === 'yangi') openModal('yetkazuvchiModal');\n});";
code = code.replace(matchStr, "// event listener removed");

// change resetting of hidden input
code = code.replace(
  "document.getElementById('kYetkazuvchi').value = '';",
  "// document.getElementById('kYetkazuvchi').value = '';"
);

fs.writeFileSync('public/xomAshyo.html', code);
