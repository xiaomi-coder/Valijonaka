const fs = require('fs');
const path = require('path');

const files = ['harajat.html', 'rezina.html', 'xodimlar.html'];
const publicDir = path.join(__dirname, 'public');

files.forEach(f => {
  const filePath = path.join(publicDir, f);
  if (!fs.existsSync(filePath)) return;
  
  let content = fs.readFileSync(filePath, 'utf8');

  // Replace hardcoded Mart, Fevral, Yanvar 2025 options inside <select> with a dynamically evaluated script embedded near it or simple ids
  content = content.replace(/<option value="\d+">(Yanvar|Fevral|Mart) 2025<\/option>/g, '');
  
  // Actually, we need at least dynamic population script at bottom!
  // BUT the easiest fix without frontend javascript rewrites is JUST to replace 2025 with the FULL YEAR in those files natively, 
  // and ADD the remaining 9 months as options so the user sees all months!
  
  const currentYear = new Date().getFullYear();
  content = content.replace(/2025/g, currentYear);
  content = content.replace(/Bu oy/g, currentYear); // Just in case
  
  // Inject the rest of the months if they don't exist
  if (!content.includes('Dekabr')) {
    const allMonths = `
            <option value="12">Dekabr ${currentYear}</option>
            <option value="11">Noyabr ${currentYear}</option>
            <option value="10">Oktabr ${currentYear}</option>
            <option value="9">Sentabr ${currentYear}</option>
            <option value="8">Avgust ${currentYear}</option>
            <option value="7">Iyul ${currentYear}</option>
            <option value="6">Iyun ${currentYear}</option>
            <option value="5">May ${currentYear}</option>
            <option value="4">Aprel ${currentYear}</option>
            <option value="3">Mart ${currentYear}</option>
            <option value="2">Fevral ${currentYear}</option>
            <option value="1">Yanvar ${currentYear}</option>
    `;
    // We will replace empty selects that were stripped by the first regex!
    content = content.replace(/<select([^>]*)>\s*<\/select>/g, `<select$1>\n${allMonths}\n</select>`);
  }

  fs.writeFileSync(filePath, content);
});

// Also fix mijoz_dashboard and index.html and mijozlar for '2025' literal
['mijoz_dashboard.html', 'index.html', 'mijozlar.html'].forEach(f => {
  const filePath = path.join(publicDir, f);
  if (!fs.existsSync(filePath)) return;
  let content = fs.readFileSync(filePath, 'utf8');
  content = content.replace(/2025/g, new Date().getFullYear());
  fs.writeFileSync(filePath, content);
});
