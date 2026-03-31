const fs = require('fs');
const path = require('path');

const publicDir = path.join(__dirname, '../public');
const files = fs.readdirSync(publicDir).filter(f => f.endsWith('.html') && f !== 'index.html');

for (const file of files) {
  const filePath = path.join(publicDir, file);
  let content = fs.readFileSync(filePath, 'utf-8');

  // Replace <aside class="sidebar"> ... </aside> with <aside class="sidebar"></aside> and load sidebar.js
  // Using a regex to match the aside block
  const asideRegex = /<aside class="sidebar">[\s\S]*?<\/aside>/i;

  if (asideRegex.test(content)) {
    content = content.replace(asideRegex, '<aside class="sidebar"></aside>\n<script src="sidebar.js"></script>');
    fs.writeFileSync(filePath, content);
    console.log('Fixed', file);
  } else {
    console.log('No sidebar found in', file);
  }
}
