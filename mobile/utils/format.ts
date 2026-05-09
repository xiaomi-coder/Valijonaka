// Sonni 1.230.000 formatda chiqarish
export const fmt = (n: number | string | null | undefined): string => {
  const num = typeof n === 'string' ? parseFloat(n) : (n || 0);
  if (isNaN(num)) return '0';
  return Math.round(num).toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.');
};

// Input kiritish uchun: '1.230.000' dan barcha nuqtalarni olib tashlash
export const parseNum = (s: string): string => s.replace(/\./g, '');

// Input uchun dinamik nuqta qo'yish
export const fmtInput = (val: string): string => {
  const num = val.replace(/\D/g, ''); // Faqat raqamlarni olib qolish
  if (!num) return '';
  return num.replace(/\B(?=(\d{3})+(?!\d))/g, '.');
};

// Sanani 23.04.2026 formatda chiqarish
export const fmtSana = (sana: string | null | undefined): string => {
  if (!sana) return '';
  try {
    const d = new Date(sana);
    if (isNaN(d.getTime())) {
      // Agar 2026-04-23 formatda kelsa
      const parts = sana.split('T')[0].split('-');
      if (parts.length === 3) return `${parts[2]}.${parts[1]}.${parts[0]}`;
      return sana;
    }
    const dd = String(d.getDate()).padStart(2, '0');
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const yyyy = d.getFullYear();
    return `${dd}.${mm}.${yyyy}`;
  } catch { return sana || ''; }
};

// Sana oralig'ini tekshirish
export const isInDateRange = (sana: string, from: string, to: string): boolean => {
  const d = sana?.split('T')[0] || '';
  if (from && d < from) return false;
  if (to && d > to) return false;
  return true;
};

// Bugungi sanani YYYY-MM-DD formatda
export const today = () => new Date().toISOString().split('T')[0];

// Bu haftaning boshlanishi
export const weekStart = () => {
  const d = new Date();
  d.setDate(d.getDate() - d.getDay() + 1);
  return d.toISOString().split('T')[0];
};

// Bu oyning boshlanishi
export const monthStart = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-01`;
};
