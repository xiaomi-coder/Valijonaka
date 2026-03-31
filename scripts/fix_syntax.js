const fs = require('fs');
const filepath = 'public/xomAshyo.html';
let code = fs.readFileSync(filepath, 'utf8');

code = code.replace(/qo\\\\'shish/g, 'qo’shish');
code = code.replace(/qo\\'shish/g, 'qo’shish');
code = code.replace(/qo'shish/g, 'qo’shish');

code = code.replace(/yo\\'q/g, 'yo’q');
code = code.replace(/yo'q/g, 'yo’q');

code = code.replace(/O\\'chirish/g, 'O’chirish');
code = code.replace(/O'chirish/g, 'O’chirish');

code = code.replace(/Ma\\'lumot/g, 'Ma’lumot');
code = code.replace(/Ma'lumot/g, 'Ma’lumot');

code = code.replace(/To\\'langan/g, 'To’langan');
code = code.replace(/To'langan/g, 'To’langan');

code = code.replace(/so\\'m/g, 'so’m');
code = code.replace(/so'm/g, 'so’m');

code = code.replace(/so\`m/g, 'so’m');
code = code.replace(/qo\`shish/g, 'qo’shish');
code = code.replace(/yo\`q/g, 'yo’q');
code = code.replace(/O\`chirish/g, 'O’chirish');
code = code.replace(/Ma\`lumot/g, 'Ma’lumot');
code = code.replace(/To\`langan/g, 'To’langan');

fs.writeFileSync(filepath, code);

// Verify Syntax
const match = code.match(/<script>([\s\S]*?)<\/script>/);
if (match) {
  try {
    new Function(match[1]);
    console.log('SUCCESS: No SyntaxError');
  } catch(e) {
    console.log('ERROR:', e.message);
  }
}
