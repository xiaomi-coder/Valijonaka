// ===== API HELPER =====
const API = {
  BASE: '/api',

  getToken() { return localStorage.getItem('erp_token'); },
  getUser()  { return JSON.parse(localStorage.getItem('erp_user') || 'null'); },

  async req(method, url, body = null) {
    const opts = {
      method,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer ' + this.getToken()
      }
    };
    if (body) opts.body = JSON.stringify(body);
    const res = await fetch(this.BASE + url, opts);
    if (res.status === 401) { localStorage.clear(); window.location.href = '/'; return; }
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Xatolik');
    return data;
  },

  get: (url)         => API.req('GET',    url),
  post: (url, body)  => API.req('POST',   url, body),
  put: (url, body)   => API.req('PUT',    url, body),
  del: (url)         => API.req('DELETE', url),
};

// Toast xabar
function toast(msg, type = 'success') {
  const el = document.createElement('div');
  const bg = type === 'success' ? '#1a6b3c' : type === 'error' ? '#c0392b' : '#f0a500';
  el.style.cssText = `position:fixed;bottom:24px;right:24px;background:${bg};color:#fff;padding:12px 20px;border-radius:10px;font-family:'Onest',sans-serif;font-size:14px;font-weight:600;z-index:9999;box-shadow:0 4px 20px rgba(0,0,0,0.2);animation:slideUp .3s ease;`;
  el.textContent = msg;
  document.body.appendChild(el);
  setTimeout(() => el.remove(), 3000);
}

// Foydalanuvchini ko'rsatish
function showUser() {
  const user = API.getUser();
  if (!user) return;
  const rolNom = { admin: 'Administrator', menejer: 'Menejer', kassir: 'Kassir', operator: 'Operator', ishchi: 'Ishchi' };
  const a = document.getElementById('uAvatar'); if (a) a.textContent = user.ism.charAt(0).toUpperCase();
  const n = document.getElementById('uName');   if (n) n.textContent = user.ism;
  const r = document.getElementById('uRole');   if (r) r.textContent = rolNom[user.rol] || user.rol;
}

// Sana
function setDate() {
  const el = document.getElementById('todayDate');
  if (el) el.textContent = new Date().toLocaleDateString('uz-UZ', { weekday: 'short', year: 'numeric', month: 'long', day: 'numeric' });
}

// Logout
function logout() {
  localStorage.clear();
  window.location.href = '/';
}

// Auto init layout details if elements exist
showUser();
setDate();

// Token yo'q bo'lsa login ga
if (!API.getToken() && !window.location.pathname.endsWith('index.html') && window.location.pathname !== '/') {
  window.location.href = '/';
}

// Stil animatsiya
const styleEl = document.createElement('style');
styleEl.textContent = '@keyframes slideUp{from{opacity:0;transform:translateY(20px);}to{opacity:1;transform:translateY(0);}}';
document.head.appendChild(styleEl);

// ============================================
// XOM ASHYO TURLARI (Dinamik ro'yxat)
// ============================================
function getXomTurlar() {
  const dflt = [
    { id: 'qora', nomi: 'Qora plastik', ico: '🖤' },
    { id: 'rangli', nomi: 'Rangli plastik', ico: '🌈' },
    { id: 'rezina', nomi: 'Rezina', ico: '⚫' }
  ];
  return JSON.parse(localStorage.getItem('xomTurlar') || JSON.stringify(dflt));
}

function saveXomTur(nomi) {
  const t = getXomTurlar();
  const id = 'xt_' + Date.now();
  t.push({ id, nomi, ico: '📦' });
  localStorage.setItem('xomTurlar', JSON.stringify(t));
  return id;
}
