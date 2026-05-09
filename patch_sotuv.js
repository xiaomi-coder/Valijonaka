const fs = require('fs');
let code = fs.readFileSync('public/sotuv.html', 'utf8');

// 1. Fix oninput duplicates
code = code.replace(
  'oninput="fmtSum(this)" id="selProdNarx" placeholder="0" oninput="calcItem()"',
  'oninput="fmtSum(this); calcItem()" id="selProdNarx" placeholder="0"'
);
code = code.replace(
  'oninput="fmtSum(this)" id="naqdSumma" placeholder="0" oninput="calcQarz()"',
  'oninput="fmtSum(this); calcQarz()" id="naqdSumma" placeholder="0"'
);
code = code.replace(
  'oninput="fmtSum(this)" id="bankSumma" placeholder="0" oninput="calcQarz()"',
  'oninput="fmtSum(this); calcQarz()" id="bankSumma" placeholder="0"'
);

// 2. Fix s.cart.map
code = code.replace(
  "const prods = s.cart.map(i=>i.nomi.split(' ')[0]).join(', ');",
  "const prods = (s.cart || []).map(i=>i.nomi?i.nomi.split(' ')[0]:'').join(', ');"
);
code = code.replace(
  "sotuvlar.forEach(s=>s.cart.forEach(i=>{ if(!prodStat[i.nomi]) prodStat[i.nomi]={kg:0,sum:0}; prodStat[i.nomi].kg+=i.kg; prodStat[i.nomi].sum+=i.kg*i.narx; }));",
  "sotuvlar.forEach(s=>(s.cart || []).forEach(i=>{ if(!prodStat[i.nomi]) prodStat[i.nomi]={kg:0,sum:0}; prodStat[i.nomi].kg+=parseFloat(i.kg)||0; prodStat[i.nomi].sum+=(parseFloat(i.kg)||0)*(parseFloat(i.narx)||0); }));"
);

// 3. Prevent crashing on numeric operations for missing summa/qarz
code = code.replace(
  "const bugun = sotuvlar.filter(s=>s.sana===today).reduce((a,s)=>a+s.summa,0);",
  "const bugun = sotuvlar.filter(s=>s.sana===today).reduce((a,s)=>a+(parseFloat(s.summa)||0),0);"
);
code = code.replace(
  "const oyJami = sotuvlar.reduce((a,s)=>a+s.summa,0);",
  "const oyJami = sotuvlar.reduce((a,s)=>a+(parseFloat(s.summa)||0),0);"
);
code = code.replace(
  "const qarzJami = sotuvlar.reduce((a,s)=>a+s.qarz,0);",
  "const qarzJami = sotuvlar.reduce((a,s)=>a+(parseFloat(s.qarz)||0),0);"
);
code = code.replace(
  "const sum = sotuvlar.reduce((a,s)=>a+s.summa,0);",
  "const sum = sotuvlar.reduce((a,s)=>a+(parseFloat(s.summa)||0),0);"
);
code = code.replace(
  "const qarzSum = sotuvlar.reduce((a,s)=>a+s.qarz,0);",
  "const qarzSum = sotuvlar.reduce((a,s)=>a+(parseFloat(s.qarz)||0),0);"
);

// 4. Safe s.summa/s.qarz inside template literals
code = code.replaceAll("${s.summa.toLocaleString()}", "${(parseFloat(s.summa)||0).toLocaleString()}");
code = code.replaceAll("${s.qarz.toLocaleString()}", "${(parseFloat(s.qarz)||0).toLocaleString()}");
code = code.replaceAll("s.summa", "(parseFloat(s.summa)||0)");

// oops wait, I don't want to blindly replace s.summa because of "sotuvlar.forEach(s=>...sum+=s.summa" 
// Let's replace it back to safe mode.
// Actually I'll run a custom logic

fs.writeFileSync('/tmp/sotuv.html.patched', code);
