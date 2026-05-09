const { JSDOM } = require("jsdom");
const fs = require("fs");
const html = fs.readFileSync("public/sotuv-yangi.html", "utf8");
// To avoid API.js load error from network, we strip external scripts
const htmlNoExternal = html.replace(/<script src="\/api\.js"><\/script>/gi, '')
                           .replace(/<script src="sidebar\.js"><\/script>/gi, '');

const dom = new JSDOM(htmlNoExternal, { 
  runScripts: "dangerously", 
  virtualConsole: new (require("jsdom").VirtualConsole)()
});

dom.virtualConsole.on("jsdomError", (e) => {
  console.log("JSDOM GLOBAL ERROR:", e.message);
});

dom.virtualConsole.sendTo(console);

try {
  const btn = dom.window.document.querySelector('.tab');
  if(btn) {
    console.log("Clicking button:", btn.textContent);
    btn.click();
    console.log("Target active?", dom.window.document.getElementById('tab-yangi').className);
    
    const histBtn = dom.window.document.querySelectorAll('.tab')[1];
    console.log("Clicking history:", histBtn.textContent);
    histBtn.click();
    console.log("History tab active?", dom.window.document.getElementById('tab-tarix').className);
  }
} catch(e) {
  console.log("Catch:", e);
}
