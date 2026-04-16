# 🏭 Valijon ERP — Node.js Backend

## O'rnatish (Setup)

### Talablar
- Node.js 18+ (https://nodejs.org)
- npm (Node.js bilan birga keladi)

### Qadamlar

```bash
# 1. Papkaga kiring
cd valijon-erp

# 2. Kutubxonalarni o'rnating
npm install

# 3. Serverni ishga tushiring
node server.js
```

### Brauzerda oching
```
http://localhost:3000
```

### Login ma'lumotlari
| Login    | Parol | Rol           |
|----------|-------|---------------|
| admin    | 1234  | Administrator |
| menejer  | 1234  | Menejer       |
| kassir   | 1234  | Kassir        |
| ishchi   | 1234  | Ishchi        |

---

## Loyiha tuzilmasi

```
valijon-erp/
├── server.js          ← Asosiy server fayl
├── package.json       ← Kutubxonalar ro'yxati
├── db/
│   ├── database.js    ← Database sozlash
│   └── *.db           ← NeDB ma'lumot fayllari (avtomatik yaratiladi)
├── routes/
│   ├── api.js         ← Barcha API yo'llar
│   └── auth.middleware.js ← JWT tekshirish
└── public/            ← Frontend fayllar
    ├── index.html     ← Login sahifasi
    ├── dashboard.html ← Asosiy panel
    ├── api.js         ← API helper
    ├── sotuv.html
    ├── mijozlar.html
    ├── xodimlar.html
    ├── harajat.html
    ├── ishlab.html
    ├── xomAshyo.html
    ├── mahsulot.html
    └── rezina.html

```

## API Endpointlar

| Method | URL                         | Tavsif                  |
|--------|-----------------------------|-------------------------|
| POST   | /api/auth/login             | Login                   |
| GET    | /api/dashboard/stats        | Dashboard statistika    |
| GET    | /api/mijozlar               | Barcha mijozlar         |
| POST   | /api/mijozlar               | Yangi mijoz             |
| GET    | /api/mahsulotlar            | Mahsulotlar             |
| GET    | /api/sotuvlar               | Sotuvlar                |
| POST   | /api/sotuvlar               | Yangi sotuv             |
| GET    | /api/xodimlar               | Xodimlar                |
| POST   | /api/avanslar               | Avans berish            |
| GET    | /api/harajatlar             | Harajatlar              |
| GET    | /api/partiyalar             | Partiyalar              |
| GET    | /api/rezina/kirimlar        | Rezina kirim            |
| GET    | /api/rezina/sotuvlar        | Rezina sotuv            |

## Texnologiyalar

- **Backend:** Node.js + Express.js
- **Database:** NeDB (faylga asoslangan, MongoDB uslubida)
- **Auth:** JWT (JSON Web Token)
- **Parol:** bcryptjs (xavfsiz shifrlash)
- **Frontend:** HTML + CSS + Vanilla JS

## Keyingi qadamlar (agar kerak bo'lsa)

- **PostgreSQL** ga o'tish (ko'p foydalanuvchi uchun)
- **Docker** bilan deploy qilish
- **HTTPS** qo'shish
- **Backup** tizimi

---
© 2025 Valijon ERP. Barcha huquqlar himoyalangan.
