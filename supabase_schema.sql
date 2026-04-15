-- =========================================================================
-- AGROPLAST ERP — SUPABASE SQL SCHEMA (Barcha bo'limlar uchun)
-- =========================================================================

-- 1. FOYDALANUVCHILAR (Admin, Kassir, Ishchi, Mijoz loginlari)
CREATE TABLE foydalanuvchilar (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    ism TEXT NOT NULL,
    login TEXT UNIQUE NOT NULL,
    parol TEXT NOT NULL,
    rol TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. MIJOZLAR
CREATE TABLE mijozlar (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    nomi TEXT NOT NULL,
    turi TEXT,
    tel TEXT,
    masul TEXT,
    manzil TEXT,
    narx_tur TEXT,
    kredit NUMERIC DEFAULT 0,
    jami NUMERIC DEFAULT 0,
    tolangan NUMERIC DEFAULT 0,
    qarz NUMERIC DEFAULT 0,
    maxsus_narxlar JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. MAHSULOTLAR (Plastik, Rezina, Qoldiq)
CREATE TABLE mahsulotlar (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    nomi TEXT NOT NULL,
    qisqa TEXT,
    tur TEXT,
    xom TEXT,
    narx NUMERIC DEFAULT 0,
    ombor NUMERIC DEFAULT 0,
    min NUMERIC DEFAULT 0,
    icon TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. XODIMLAR (Oylik va ishbay hisoblash uchun)
CREATE TABLE xodimlar (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    ism TEXT NOT NULL,
    familiya TEXT,
    lavozim TEXT,
    rol TEXT,
    tel TEXT,
    tarif NUMERIC DEFAULT 0,
    sabit NUMERIC DEFAULT 0,
    oy_kg JSONB DEFAULT '{}'::jsonb,
    bonus JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 5. ISHLAB CHIQARISH (Partiyalar / Eritish)
CREATE TABLE ishlab_partiyalar (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    sana DATE NOT NULL,
    xom_ashyo_turi TEXT,
    mahsulot_id UUID REFERENCES mahsulotlar(id),
    mahsulot_nomi TEXT,
    kirgan_kg NUMERIC DEFAULT 0,
    chiqgan_kg NUMERIC DEFAULT 0,
    poterya_kg NUMERIC DEFAULT 0,
    poterya_pct NUMERIC DEFAULT 0,
    xodimlar TEXT[],
    izoh TEXT,
    qoshgan TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 6. ASOSIY SOTUVLAR (Zavod mahsuloti savdosi)
CREATE TABLE sotuvlar (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    sana DATE NOT NULL,
    mijoz_id UUID REFERENCES mijozlar(id),
    summa NUMERIC DEFAULT 0,
    qarz NUMERIC DEFAULT 0,
    tolangan NUMERIC DEFAULT 0,
    holat TEXT DEFAULT 'qarz',
    cart JSONB DEFAULT '[]'::jsonb,
    qoshgan TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 7. UMUMIY HARAJATLAR (Zavod harajatlari)
CREATE TABLE harajatlar (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    sana DATE NOT NULL,
    oy INTEGER,
    tur TEXT,
    summa NUMERIC DEFAULT 0,
    izoh TEXT,
    qoshgan TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =============================================
-- REZINA DILERLIK (ALOHIDA MODUL)
-- =============================================
CREATE TABLE rez_kirimlar (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    sana DATE,
    oy INTEGER,
    zavod TEXT,
    tur TEXT,
    kg NUMERIC DEFAULT 0,
    narx NUMERIC DEFAULT 0,
    jami NUMERIC DEFAULT 0,
    tolov TEXT,
    izoh TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE rez_sotuvlar (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    sana DATE,
    oy INTEGER,
    mijoz TEXT,
    tur TEXT,
    kg NUMERIC DEFAULT 0,
    narx NUMERIC DEFAULT 0,
    jami NUMERIC DEFAULT 0,
    tolov TEXT,
    holat TEXT,
    kir_narx NUMERIC DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =============================================
-- MOLXONA / CHORVACHILIK (YANGI MODUL)
-- =============================================
CREATE TABLE mol_partiyalar (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    nomi TEXT NOT NULL,
    sana DATE NOT NULL,
    boshlangich_son INTEGER DEFAULT 0,
    kirim_narx NUMERIC DEFAULT 0,
    holat TEXT DEFAULT 'aktiv',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE mol_xarajatlar (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    partiya_id UUID REFERENCES mol_partiyalar(id) ON DELETE CASCADE,
    sana DATE NOT NULL,
    tur TEXT,
    summa NUMERIC DEFAULT 0,
    izoh TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE mol_sotuvlar (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    partiya_id UUID REFERENCES mol_partiyalar(id) ON DELETE CASCADE,
    sana DATE NOT NULL,
    mijoz TEXT,
    mollar_soni INTEGER DEFAULT 0,
    jami_summa NUMERIC DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Optional: Avanslar, XomAshyoKirimlar, Reyslar kabi kichik table larni ham yaratish
CREATE TABLE avanslar (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    xodim_id UUID REFERENCES xodimlar(id),
    sana DATE,
    summa NUMERIC,
    bergan TEXT,
    izoh TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE reyslar (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    sana DATE,
    mashina TEXT,
    haydovchi TEXT,
    xarajat NUMERIC,
    holat TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
