const fs = require('fs');
let code = fs.readFileSync('public/sotuv.html', 'utf8');
let jsMatch = code.match(/<script>([\s\S]*?)<\/script>/); // getting the main script block
if (!jsMatch) { console.log('No script block found'); process.exit(1); }
let js = jsMatch[1];

let mockJS = `
let window = {};
let document = {
  getElementById: function(id) { 
    return { 
      classList: { add:()=>{} }, 
      style: {}, 
      value: '', 
      innerHTML: '', 
      textContent: '',
      addEventListener: ()=>{} 
    }; 
  },
  querySelectorAll: function() { return { forEach: ()=>{} }; }
};
let localStorage = { getItem: ()=>null, setItem: ()=>{} };
let sotuvlar = [{ id: '123', sana: '2026-04-19', mijoz: {nomi: 'Mijoz 1', tur:'Zavod'}, cart: [{nomi:'Test', kg:10, narx: 100}], summa: 1000, qarz: 0, holat: 'tolandi', totalKg: 10 }];
let API = { get: async()=>[], post: async()=>{} };
let currentMijoz = null;
let lastSotuv = null;
let mijozStat = {};
let prodStat = {};
`;
mockJS += js;
mockJS += `\ntry { switchTab('tarix', document.getElementById('test')); switchTab('qarz', document.getElementById('test')); switchTab('stat', document.getElementById('test')); console.log('OK'); } catch(e) { console.error('Error during switchTab:', e); }`;
fs.writeFileSync('test_sotuv_execution.js', mockJS);
