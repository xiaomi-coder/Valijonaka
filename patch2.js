const fs = require('fs');
let code = fs.readFileSync('public/sotuv.html', 'utf8');

// Also API updates for saveSotuv
code = code.replace(
  "    izoh: document.getElementById('izoh').value,\n    createdAt: new Date().toISOString(),\n  };\n  sotuvlar.push(sotuv);\n  localStorage.setItem('sotuvlar', JSON.stringify(sotuvlar));\n  lastSotuv = sotuv;\n\n  // Omborda kamaytirish\n  cart.forEach(item=>{ \n    const prod=MAHSULOTLAR.find(p=>p.id===item.prodId); \n    if(prod) {\n      if(prod.tur==='mahsulot') {\n         const d = reqMahsulotlar.find(x=>x.id===prod.id);\n         if(d) { d.ombor = Math.max(0, d.ombor - item.kg); localStorage.setItem('mahsulotlar',JSON.stringify(reqMahsulotlar)); }\n      } else if(prod.tur==='xom') {\n         if(reqXomOmbor[prod.xomId]) {\n            reqXomOmbor[prod.xomId].sarflangan += item.kg;\n            localStorage.setItem('xomOmbor', JSON.stringify(reqXomOmbor));\n         }\n      }\n    }\n  });\n\n  document.getElementById('successMsg').textContent = `${sotuv.id} · ${sotuv.mijoz.nomi} · ${sotuv.summa.toLocaleString()} so\\'m`;\n  openModal('successModal');",
  "    holat,\n    cart\n  };\n  try {\n    const s = await API.post('/sotuvlar', { sana: sotuv.sana, mijoz_id: currentMijoz.id, summa: final, qarz, tolangan, holat, cart: sotuv.cart });\n    sotuv.id = s.id;\n    sotuvlar.unshift(sotuv);\n    lastSotuv = sotuv;\n    document.getElementById('successMsg').textContent = `Mijoz: ${currentMijoz.nomi} · Summa: ${final.toLocaleString()} so\\'m`;\n    openModal('successModal');\n  } catch(e) { alert(e.message); }"
);
code = code.replace(
  "function saveSotuv() {",
  "async function saveSotuv() {"
);
code = code.replace(
  "document.getElementById('todayDate').textContent = new Date().toLocaleDateString('uz-UZ',{weekday:'short',year:'numeric',month:'long',day:'numeric'});\ndocument.getElementById('sotuvSana').value = new Date().toISOString().split('T')[0];\nloadMijozOptions();\nrenderMahsulotGrid();",
  "initSotuv();"
);

// mijoz safety
code = code.replace(
  "const txt = (s.id+s.mijoz.nomi).toLowerCase();",
  "const mNomi = s.mijoz?.nomi || s.mijoz_nomi || ''; const txt = (s.id + mNomi).toLowerCase();"
).replace(
  "}).reverse();",
  "});"
);

code = code.replace(
  "<td>${s.mijoz.nomi}<br><small style=\"color:var(--text-muted)\">${s.mijoz.tur}</small></td>",
  "<td>${s.mijoz?.nomi || s.mijoz_nomi}<br><small style=\"color:var(--text-muted)\">${s.mijoz?.tur || s.mijoz_turi}</small></td>"
);

code = code.replace(
  "s.tolangan += miqdor;",
  "s.tolangan = parseFloat(s.tolangan||0) + miqdor;"
);

code = code.replace(
  "localStorage.setItem('sotuvlar', JSON.stringify(sotuvlar));",
  "// API handled this"
);

code = code.replace(
  "<td><b>${s.mijoz.nomi}</b></td>\n      <td><span class=\"badge ${s.mijoz.tur==='Zavod'?'blue':'green'}\">${s.mijoz.tur}</span></td>",
  "<td><b>${s.mijoz?.nomi || s.mijoz_nomi}</b></td>\n      <td><span class=\"badge ${s.mijoz_turi==='Zavod'?'blue':'green'}\">${s.mijoz?.tur || s.mijoz_turi}</span></td>"
);

code = code.replace(
  "sotuvlar.forEach(s=>{ if(!mijozStat[s.mijoz.nomi]) mijozStat[s.mijoz.nomi]={count:0,sum:0}; mijozStat[s.mijoz.nomi].count++; mijozStat[s.mijoz.nomi].sum+=(parseFloat(s.summa)||0); });",
  "sotuvlar.forEach(s=>{ const mn = s.mijoz?.nomi || s.mijoz_nomi || 'Noma\\'lum'; if(!mijozStat[mn]) mijozStat[mn]={count:0,sum:0}; mijozStat[mn].count++; mijozStat[mn].sum+=(parseFloat(s.summa)||0); });"
);

fs.writeFileSync('/tmp/sotuv2.html', code);
