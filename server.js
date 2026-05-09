require('dotenv').config();
const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const path = require('path');
const { initDB } = require('./db/database');
const apiRoutes = require('./routes/api');
const apiPgRoutes = require('./routes/api_pg');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(morgan('dev'));

// Statik fayllar (HTML, CSS, JS)
app.use(express.static(path.join(__dirname, 'public'), {
  setHeaders: function (res, path) {
    res.set('Cache-Control', 'no-store, no-cache, must-revalidate, private');
  }
}));

// API yo'llar — NeDB (asosiy, har doim ishlaydi)
app.use('/api', apiRoutes);
// PG routes faqat PG ishlasa
try { app.use('/api/pg', apiPgRoutes); } catch(e) {}

// Barcha boshqa so'rovlar — index.html
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Server ishga tushirish
initDB().then(() => {
  app.listen(PORT, () => {
    console.log('');
    console.log('╔════════════════════════════════════════╗');
    console.log('║   🏭  Valijon ERP — Server TAYYOR!   ║');
    console.log('╠════════════════════════════════════════╣');
    console.log(`║   🌐  http://localhost:${PORT}             ║`);
    console.log('║   📋  Login: admin | Parol: 1234       ║');
    console.log('╚════════════════════════════════════════╝');
    console.log('');
  });
});
