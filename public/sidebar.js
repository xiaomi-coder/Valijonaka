const SIDEBAR_HTML = `
  <div class="sidebar-brand"><div class="brand-logo"><div class="icon">🏭</div><div class="brand-name">Valijon ERP<span>Node.js Backend</span></div></div></div>
  <div class="nav-section"><div class="nav-label">Asosiy</div><a class="nav-item" id="nav-dashboard" href="dashboard.html"><span class="icon">📊</span>Dashboard</a></div>
  <div class="nav-section"><div class="nav-label">Ishlab chiqarish</div>
    <a class="nav-item" id="nav-xomAshyo" href="xomAshyo.html"><span class="icon">📦</span>Xom ashyo</a>
    <a class="nav-item" id="nav-ishlab" href="ishlab.html"><span class="icon">🏗️</span>Ishlab chiqarish</a>
    <a class="nav-item" id="nav-mahsulot" href="mahsulot.html"><span class="icon">🗃️</span>Mahsulotlar</a>
  </div>
  <div class="nav-section"><div class="nav-label">Sotuv</div>
    <a class="nav-item" id="nav-sotuv" href="sotuv.html"><span class="icon">🛒</span>Sotuvlar</a>
    <a class="nav-item" id="nav-mijozlar" href="mijozlar.html"><span class="icon">👥</span>Mijozlar</a>
  </div>
  <div class="nav-section"><div class="nav-label">Moliya</div>
    <a class="nav-item" id="nav-harajat" href="harajat.html"><span class="icon">💸</span>Harajatlar</a>
    <a class="nav-item" id="nav-rezina" href="rezina.html"><span class="icon">🔵</span>Rezina dilerlik</a>
    <a class="nav-item" id="nav-molxona" href="molxona.html"><span class="icon">🐄</span>Molxona</a>
  </div>
  <div class="nav-section"><div class="nav-label">HR</div>
    <a class="nav-item" id="nav-xodimlar" href="xodimlar.html"><span class="icon">👷</span>Xodimlar</a>
  </div>
  <div class="nav-section"><div class="nav-label">Tizim</div>
    <a class="nav-item" id="nav-sozlamalar" href="sozlamalar.html"><span class="icon">⚙️</span>Sozlamalar</a>
  </div>
  <div class="sidebar-footer"><div class="user-info"><div class="user-avatar" id="uAvatar">A</div><div class="user-details"><div class="name" id="uName">Admin</div><div class="role" id="uRole">Administrator</div></div><button class="logout-btn" onclick="logout()">↩</button></div></div>
`;

(function() {
  const sidebarEl = document.querySelector('.sidebar');
  if (sidebarEl) {
    sidebarEl.innerHTML = SIDEBAR_HTML;
    
    // Sahifa o'zgaruvchilari asosida activelikni o'rnatish
    let currentPath = window.location.pathname.split('/').pop() || 'dashboard.html';
    let currentFile = currentPath.split('.')[0];
    
    if (currentFile) {
        let activeEl = document.getElementById('nav-' + currentFile);
        if (activeEl) {
            activeEl.classList.add('active');
        } else {
            const anyActive = sidebarEl.querySelector('.nav-item[href="'+currentPath+'"]');
            if (anyActive) anyActive.classList.add('active');
        }
    }
  }
})();
