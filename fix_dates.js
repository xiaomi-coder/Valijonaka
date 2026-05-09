const fs = require('fs');
const path = require('path');

const files = ['harajat.html', 'rezina.html', 'xodimlar.html', 'mijoz_dashboard.html', 'index.html', 'mijozlar.html'];

files.forEach(file => {
  const p = path.join(__dirname, 'public', file);
  if (!fs.existsSync(p)) return;
  let content = fs.readFileSync(p, 'utf8');

  // Replace hardcoded options
  content = content.replace(/<option value="\d+">(Yanvar|Fevral|Mart) 2025<\/option>\n?\s*/g, '');
  content = content.replace(/<option value="\d+">(Yanvar|Fevral|Mart) 2025<\/option>/g, '');
  
  // Replace static strings of 2025
  content = content.replace(/Mart 2025/g, 'Bu oy');
  content = content.replace(/2025/g, '${new Date().getFullYear()}');
  
  // In places where we had string literals like `_2025.csv` to `_${new Date().getFullYear()}.csv`
  // Actually, wait, replacing 2025 with ${new Date().getFullYear()} inside backticks works PERFECTLY!
  // Wait, if it wasn't in backticks, it will literalize.
  // But wait `O'zbekiston, 2025` -> `O'zbekiston, ${new Date().getFullYear()}` which might show literally in HTML.
  // Let's manually replace the known spots via regex carefully.
  
  fs.writeFileSync(p, content);
});

// Since the above might break, let's just do a smarter script.
