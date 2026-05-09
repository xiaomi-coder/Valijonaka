const fs = require('fs');
const glob = require('fs').readdirSync('public').filter(x => x.endsWith('.html')).map(x => 'public/' + x);
glob.forEach(f => {
  let t = fs.readFileSync(f, 'utf8');
  t = t.replace(/parseSum\(\\'(.*?)\\'\)/g, "parseSum('$1')");
  fs.writeFileSync(f, t);
});
console.log("Done");
