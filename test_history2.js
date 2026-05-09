const fs = require('fs');
let code = fs.readFileSync('public/sotuv.html', 'utf8');
let jsMatch = code.match(/<script>([\s\S]*?)<\/script>/);
let js = jsMatch ? jsMatch[1] : '';

js = js.replace(/let /g, 'var ').replace(/const /g, 'var ');

let mockJS = `
var window = {};
var document = {
  getElementById: function(id) { 
    return { 
      classList: { add:()=>{}, remove:()=>{} }, 
      style: {}, 
      value: '', 
      innerHTML: '', 
      textContent: '',
      addEventListener: ()=>{} 
    }; 
  },
  querySelectorAll: function() { return [{ classList: { add:()=>{}, remove:()=>{} } }]; }
};
var localStorage = { getItem: ()=>null, setItem: ()=>{} };
var sotuvlar = [{ id: '123', sana: '2026-04-19', mijoz: {nomi: 'Mijoz 1', tur:'Zavod'}, cart: [{nomi:'Test', kg:10, narx: 100}], summa: 1000, qarz: 0, holat: 'tolandi', totalKg: 10 }];
var API = { get: async()=>sotuvlar, post: async()=>{} };
`;
mockJS += js;
mockJS += `\ntry { switchTab('tarix', document.querySelectorAll('.tab')[0]); switchTab('qarz', document.querySelectorAll('.tab')[0]); switchTab('stat', document.querySelectorAll('.tab')[0]); console.log('OK'); } catch(e) { console.error('Error during switchTab:', e); }`;
fs.writeFileSync('/tmp/test_history2.js', mockJS);
