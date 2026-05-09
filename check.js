const fs = require('fs');
let code = fs.readFileSync('public/sotuv.html', 'utf8');
console.log(code.includes('sotuvlar.forEach(s=>{ const mn = s.mijoz?.nomi || s.mijoz_nomi || \\'Noma\\\\\\'lum\\'; if(!mijozStat[mn]) mijozStat[mn]={count:0,sum:0}; mijozStat[mn].count++; mijozStat[mn].sum+=(parseFloat(s.summa)||0); });'));
