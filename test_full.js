const fs = require('fs');
let code = fs.readFileSync('public/sotuv.html', 'utf8');
let js = code.slice(code.indexOf('<script src="/api.js"></script>') + 31);
js = js.slice(0, js.lastIndexOf('</script>'));

// Mocks
global.window = { location: { href: '' } };
global.document = {
  getElementById: (id) => ({ 
    classList: { add:()=>{}, remove:()=>{} }, 
    value: '', dataset: {}, textContent: '', innerHTML: '', style: {}, focus:()=>{}
  }),
  querySelectorAll: () => [{ classList: { add:()=>{}, remove:()=>{} } }],
  addEventListener: ()=>{}
};
global.localStorage = { getItem: ()=>null, setItem: ()=>{} };
global.API = {
  get: async (url) => { if(url=='/sotuvlar') return [{ id:'1', summa:500, qarz:200, tolovTuri:'naqd', tolov: 'qisman', cart:[{nomi:'A',kg:2}] }]; return []; },
  post: async () => ({})
};
global.alert = console.log;
global.prompt = ()=>null;
global.console.error = (msg, e) => { console.log('CAUGHT ERR:', msg, e); };

const vm = require('vm');
const script = new vm.Script(js);
const context = vm.createContext(global);

try {
  script.runInContext(context);
  // Wait for async init
  setTimeout(() => {
    try {
      context.switchTab('yangi', context.document.querySelectorAll()[0]);
      context.switchTab('tarix', context.document.querySelectorAll()[0]);
      context.switchTab('qarz', context.document.querySelectorAll()[0]);
      context.switchTab('stat', context.document.querySelectorAll()[0]);
      console.log("All tabs switched successfully without throwing.");
    } catch(e) {
      console.log("RUNTIME ERROR during switchTab:", e);
    }
  }, 100);
} catch(e) {
  console.log("SYNTAX/PARSE ERROR:", e);
}
