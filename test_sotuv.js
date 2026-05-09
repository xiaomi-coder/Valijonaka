const fs = require('fs');
let code = fs.readFileSync('public/sotuv.html', 'utf8');
let scripts = code.match(/<script\b[^>]*>([\s\S]*?)<\/script>/gi);
if (scripts) {
  let js = scripts.map(s => s.replace(/<script\b[^>]*>/i, '').replace(/<\/script>/i, '')).join('\n');
  try {
    new Function(js);
    console.log("Syntax OK");
  } catch(e) {
    console.log("Syntax Error:", e);
  }
}
