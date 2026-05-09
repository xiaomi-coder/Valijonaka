ALTER TABLE xodimlar ADD COLUMN izoh TEXT;

ALTER TABLE avanslar RENAME COLUMN izoh TO sabab;
ALTER TABLE avanslar ADD COLUMN holat TEXT DEFAULT 'aktiv';

CREATE TABLE mashinalar (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  haydovchi_id UUID REFERENCES xodimlar(id),
  model TEXT, raqam TEXT, km NUMERIC DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW()
);

DROP TABLE reyslar;

CREATE TABLE reyslar (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    sana DATE,
    haydovchi_id UUID REFERENCES xodimlar(id),
    mashina_id UUID,
    marshrut TEXT,
    masofa_km NUMERIC DEFAULT 0,
    haq NUMERIC DEFAULT 0,
    holat TEXT DEFAULT 'kutilmoqda',
    izoh TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE oy_tolovlar (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  xodim_id UUID REFERENCES xodimlar(id),
  oy INTEGER, yili INTEGER DEFAULT 2026,
  summa NUMERIC, maxsus_bonus NUMERIC DEFAULT 0, maxsus_jarima NUMERIC DEFAULT 0,
  izoh TEXT, bergan TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE kesh_xotira (
  key TEXT PRIMARY KEY,
  data JSONB
);
