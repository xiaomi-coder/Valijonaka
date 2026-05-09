const fs = require('fs');
let code = fs.readFileSync('public/xomAshyo.html', 'utf8');

// 1. In renderYetkazuvchilar, dynamically calculate stats
const renderReplacement = `function renderYetkazuvchilar() {
  const TN = { qora: 'Qora plastik', rangli: 'Rangli plastik', rezina: 'Rezina', barchasi: 'Barchasi' };
  
  // Hisoblash
  const stats = {};
  yetkazuvchilar.forEach(y => {
    stats[y.nomi] = { jami: 0, qarz: 0 };
  });
  
  kirimlar.forEach(k => {
    const n = k.yetkazuvchi || "Noma'lum";
    if (!stats[n]) stats[n] = { jami: 0, qarz: 0 };
    stats[n].jami += (k.jami || 0);
    // xom ashyoda qarz faqat k.tolov==='qarz' bo'lsa yoki partial bo'lsa k.qarz_sum
    let q = 0;
    if (k.tolov === 'qarz') q = (k.qarz_sum !== undefined ? k.qarz_sum : (k.jami||0));
    stats[n].qarz += q;
  });

  document.getElementById('yetkazuvchiBody').innerHTML = yetkazuvchilar.map(y => {
    const s = stats[y.nomi] || { jami:0, qarz:0 };
    const qarzHTML = s.qarz > 0 ? \`<div style="color:var(--danger);font-weight:700">\${s.qarz.toLocaleString()} so'm</div><button class="btn btn-sm btn-primary" style="margin-top:4px" onclick="tolovQilishXom('\${y.nomi}')">💳 To'lov</button>\` : \`<span class="badge green">Qarz yo'q</span>\`;
    return \`<tr>
      <td><b>\${y.nomi}</b></td>
      <td>\${y.telefon || y.tel || '—'}</td>
      <td>\${TN[y.tur] || y.tur || 'Barchasi'}</td>
      <td>\${s.jami.toLocaleString()} so'm</td>
      <td>\${qarzHTML}</td>
      <td><button class="btn btn-sm btn-danger" onclick="deleteYetkazuvchi('\${y._id}')">🗑</button></td>
    </tr>\`;
  }).join('');
}`;

// Replacing renderYetkazuvchilar function completely using regex
code = code.replace(/function renderYetkazuvchilar\(\) \{[\s\S]*?\}\n/, renderReplacement + "\n");
if(!code.includes("function tolovQilishXom")) {
  code = code.replace("function switchTab", `async function tolovQilishXom(nomi) {
  const s = kirimlar.filter(k => k.yetkazuvchi === nomi && k.tolov === 'qarz' && (k.qarz_sum === undefined || k.qarz_sum > 0));
  if(!s.length) return alert("Qarz topilmadi!");
  const umumiyQarz = s.reduce((a,k) => a + (k.qarz_sum !== undefined ? k.qarz_sum : k.jami), 0);
  
  const p = prompt(\`\${nomi} ga to'lov miqdorini kiriting (Umumiy qarz: \${umumiyQarz.toLocaleString()} so'm):\`);
  if (!p) return;
  let qoldiqP = parseFloat(p) || 0;
  if(qoldiqP <= 0) return;
  
  for (const k of s) {
    if(qoldiqP <= 0) break;
    let kQarz = (k.qarz_sum !== undefined ? k.qarz_sum : k.jami);
    let tolandi = Math.min(kQarz, qoldiqP);
    kQarz -= tolandi;
    qoldiqP -= tolandi;
    
    k.qarz_sum = kQarz;
    if(kQarz === 0) k.tolov = 'tolangan';
    
    // update on server logic
    try {
      await API.put('/xom-ashyo/' + k._id, { qarz_sum: k.qarz_sum, tolov: k.tolov });
    } catch(e) {}
  }
  
  alert("To'lov qabul qilindi!");
  renderYetkazuvchilar();
  renderKirimOmborPanel();
}

function switchTab`);
}

// Ensure html table headers match the new format
code = code.replace(
  "<th>Nomi</th><th>Manzil</th><th>Telefon</th><th>Xom ashyo turi</th><th>Jami yuborgan (Summa)</th><th>Amal</th>",
  "<th>Mijoz</th><th>Telefon</th><th>Turi</th><th>Jami yuborgan</th><th>QARZ HOLATI</th><th>Amal</th>"
);
code = code.replace(
  "<th>Nomi</th><th>Telefon</th><th>Tur</th><th>Manzil</th><th>Amal</th>",
  "<th>Mijoz</th><th>Telefon</th><th>Turi</th><th>Jami yuborgan</th><th>QARZ HOLATI</th><th>Amal</th>"
);

// We need to also fix global qarz calculation `jStQarz` update
code = code.replace(
  "document.getElementById('jStQarz').textContent = kirimlar.filter(k => k.tolov === 'qarz').reduce((s, k) => s + k.jami, 0).toLocaleString();",
  "document.getElementById('jStQarz').textContent = kirimlar.filter(k => k.tolov === 'qarz').reduce((s, k) => s + (k.qarz_sum !== undefined ? k.qarz_sum : k.jami), 0).toLocaleString();"
);

fs.writeFileSync('public/xomAshyo.html', code);
