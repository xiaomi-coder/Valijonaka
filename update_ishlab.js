const fs = require('fs');
let html = fs.readFileSync('public/ishlab.html', 'utf8');

const newMain = `
<div class="main">
  <header class="topbar">
    <div class="topbar-title">Ishlab chiqarish <span>/ Eritish jarayoni</span></div>
    <div class="topbar-date" id="todayDate"></div>
  </header>

  <div class="content">
    <div class="tabs">
      <button class="tab active" onclick="switchTab('yangi',this)">➕ Yangi eritish</button>
      <button class="tab" onclick="switchTab('jurnal',this)">📋 Ishlab chiqarish jurnali</button>
      <button class="tab" onclick="switchTab('ombor',this)">🏠 Ombor holati</button>
    </div>

    <!-- ===== YANGI ERITISH ===== -->
    <div class="page active" id="tab-yangi">
      <div style="display:grid;grid-template-columns:1fr 360px;gap:20px;align-items:start;">
        <div>
          <div class="ishlab-form card" style="margin:0;">
            <div class="card-header"><div class="card-title">🏗️ Yangi ishlab chiqarish jarayoni</div></div>
            <div class="card-body">
              <div class="form-row">
                <div class="form-group"><label>Sana</label><input type="date" id="eSana"></div>
                <div class="form-group"><label>Mahsulot</label><select id="eMahsulot" onchange="mahsulotTanlash()"><option value="">— Mahsulot tanlang —</option></select></div>
              </div>
              <div class="form-row">
                <div class="form-group"><label>Zaruriy xom ashyo turi</label><input id="eTur" readonly placeholder="—"></div>
                <div class="form-group"><label>Joriy poterya (%)</label><input id="ePotF" readonly placeholder="0%"></div>
              </div>
              <div class="form-group"><label>Ombordagi xom ashyo</label><input id="eOmbor" readonly placeholder="— kg"></div>
              
              <div class="form-row-3">
                <div class="form-group"><label>Kirgan xom ashyo (kg)</label><input type="number" id="eKirgan" placeholder="0" oninput="calcEritish()"></div>
                <div class="form-group"><label>Tayyor mahsulot (kg)</label><input type="number" id="eChiqgan" readonly placeholder="0"></div>
                <div class="form-group"><label>Poterya (kg)</label><input id="ePotKg" readonly placeholder="0 kg"></div>
              </div>

              <!-- Ishchilar -->
              <div class="form-group" style="margin-top:14px;">
                <label>Ishtirok etgan xodimlar</label>
                <div class="xodim-chips" id="xodimChips">
                  <div class="xodim-chip" onclick="toggleXodim(this,'Karimov J.')">👷 Karimov J.</div>
                  <div class="xodim-chip" onclick="toggleXodim(this,'Rahimov O.')">👷 Rahimov O.</div>
                  <div class="xodim-chip" onclick="toggleXodim(this,'Toshmatov B.')">👷 Toshmatov B.</div>
                  <div class="xodim-chip" onclick="toggleXodim(this,'Hasanov F.')">👷 Hasanov F.</div>
                  <div class="xodim-chip" onclick="toggleXodim(this,'Yusupov A.')">👷 Yusupov A.</div>
                </div>
              </div>

              <div class="form-group">
                <label>Izoh</label>
                <textarea id="eIzoh" rows="2" placeholder="Qo'shimcha..."></textarea>
              </div>

              <div style="display:flex;gap:10px;margin-top:4px;">
                <button class="btn btn-primary" style="flex:1" onclick="saveEritish()">✅ Saqlash</button>
                <button class="btn btn-secondary" onclick="resetForm()">🔄 Tozalash</button>
              </div>
            </div>
          </div>
        </div>
        
        <div style="position:sticky;top:72px;display:flex;flex-direction:column;gap:14px;">
          <div class="card" style="margin:0">
            <div class="card-header"><div class="card-title">🕐 So'nggi jarayonlar</div></div>
            <div style="padding:0 4px;">
              <table><thead><tr><th>Tur</th><th>Chiqgan</th><th>Poterya</th></tr></thead><tbody id="lastEritmalar"></tbody></table>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- ===== JURNAL ===== -->
    <div class="page" id="tab-jurnal">
      <div class="stats-grid">
        <div class="stat-card g"><div class="lbl">Jami tayyor mah.</div><div class="val" id="jStatTayyor">0 kg</div><div class="ico">🏗️</div></div>
        <div class="stat-card a"><div class="lbl">Umumiy poterya</div><div class="val" id="jStatPoterya">0 kg</div><div class="ico">⚖️</div></div>
        <div class="stat-card b"><div class="lbl">Jarayonlar soni</div><div class="val" id="jStatSoni">0</div><div class="ico">📦</div></div>
      </div>
      <div class="card" style="margin:0">
        <div class="card-header">
          <div class="card-title">Ishlab chiqarish jurnali</div>
          <div style="display:flex;gap:8px;">
            <select id="jFilter" onchange="renderJurnal()" style="padding:6px 10px;border:1px solid var(--border);border-radius:8px;font-size:12px;outline:none;font-family:'Onest',sans-serif;"><option value="">Barchasi</option><option value="qora">Qora plastik</option><option value="rangli">Rangli plastik</option><option value="rezina">Rezina</option></select>
            <button class="btn btn-sm btn-secondary" onclick="exportJurnal()">📥 Eksport</button>
          </div>
        </div>
        <table>
          <thead><tr><th>#</th><th>Sana</th><th>Xom ashyo</th><th>Mahsulot</th><th>Kirgan</th><th>Chiqgan</th><th>Poterya</th><th>Xodimlar</th><th>Amal</th></tr></thead>
          <tbody id="jurnalBody"></tbody>
        </table>
      </div>
    </div>

    <!-- ===== OMBOR ===== -->
    <div class="page" id="tab-ombor">
      <div class="ombor-grid" id="omborGrid" style="margin-bottom:20px;"></div>
      <div class="card" style="margin:0">
        <div class="card-header"><div class="card-title">📦 Ombor harakatlari</div></div>
        <table>
          <thead><tr><th>Sana</th><th>Tur</th><th>Harakat</th><th>Miqdor (kg)</th><th>Kimdan/Nima uchun</th><th>Qoldiq</th></tr></thead>
          <tbody id="omborTarix"></tbody>
        </table>
      </div>
    </div>

  </div>
</div>
`;

const newScripts = `
<!-- MUVAFFAQIYAT -->
<div class="success-overlay" id="successOverlay">
  <div class="success-box">
    <div style="font-size:52px;margin-bottom:12px;">✅</div>
    <h2 style="font-size:20px;margin-bottom:8px;">Jarayon saqlandi!</h2>
    <p style="color:var(--text-muted);font-size:13px;margin-bottom:20px;" id="succMsg"></p>
    <div style="display:flex;gap:10px;justify-content:center;">
      <button class="btn btn-primary" onclick="closeSuccess()">✅ Yopish</button>
      <button class="btn btn-secondary" onclick="resetForm();closeSuccess()">➕ Yangisi</button>
    </div>
  </div>
</div>

<script src="/api.js"></script>
<script>
document.getElementById('todayDate').textContent = new Date().toLocaleDateString('uz-UZ',{weekday:'short',year:'numeric',month:'long',day:'numeric'});
document.getElementById('eSana').value = new Date().toISOString().split('T')[0];

const XOM_NOM = {qora:'Qora plastik',rangli:'Rangli plastik',rezina:'Rezina',boshqa:'Boshqa'};
const XOM_ICO = {qora:'🖤',rangli:'🌈',rezina:'⚫'};

let mahsulotlar = JSON.parse(localStorage.getItem('mahsulotlar')||'[]');
let partiyalar = JSON.parse(localStorage.getItem('partiyalar')||'[]');
let xomOmbor = JSON.parse(localStorage.getItem('xomOmbor')||JSON.stringify({
  qora:{kirgan:5000,sarflangan:2400},
  rangli:{kirgan:3000,sarflangan:1800},
  rezina:{kirgan:2000,sarflangan:1020},
}));

function setupP(){
  document.getElementById('eMahsulot').innerHTML='<option value="">— Mahsulot tanlang —</option>'+mahsulotlar.map(m=>\`<option value="\${m.id}">\${m.nomi} (\${XOM_NOM[m.xom]||m.xom})</option>\`).join('');
}

function mahsulotTanlash(){
  const id=document.getElementById('eMahsulot').value;
  if(!id) { document.getElementById('eTur').value=''; document.getElementById('ePotF').value=''; document.getElementById('eOmbor').value=''; calcEritish(); return; }
  const m=mahsulotlar.find(x=>x.id===id);
  document.getElementById('eTur').value = XOM_NOM[m.xom]||m.xom;
  document.getElementById('ePotF').value = (m.poterya||0)+'%';
  const ob = xomOmbor[m.xom];
  document.getElementById('eOmbor').value = ob ? (ob.kirgan-ob.sarflangan).toLocaleString()+' kg' : '0 kg';
  calcEritish();
}

function calcEritish(){
  const id=document.getElementById('eMahsulot').value;
  const kir=parseFloat(document.getElementById('eKirgan').value)||0;
  if(!id || kir<=0){ document.getElementById('eChiqgan').value=''; document.getElementById('ePotKg').value=''; return; }
  const m=mahsulotlar.find(x=>x.id===id);
  const potFoiz = m.poterya||0;
  const potKg = +(kir * potFoiz / 100).toFixed(1);
  const chiq = +(kir - potKg).toFixed(1);
  document.getElementById('eChiqgan').value = chiq;
  document.getElementById('ePotKg').value = potKg+' kg';
}

function toggleXodim(el, nomi){ el.classList.toggle('selected'); }
function getSelectedXodimlar(){ return [...document.querySelectorAll('.xodim-chip.selected')].map(e=>e.textContent.replace('👷 ','')); }

function saveEritish(){
  const id=document.getElementById('eMahsulot').value;
  const kir=parseFloat(document.getElementById('eKirgan').value)||0;
  if(!id) return alert('Mahsulotni tanlang!');
  if(kir<=0) return alert('Kirgan xom ashyoni kiriting!');
  
  const m=mahsulotlar.find(x=>x.id===id);
  const potFoiz = m.poterya||0;
  const potKg = +(kir * potFoiz / 100).toFixed(1);
  const chiq = +(kir - potKg).toFixed(1);

  const ob = xomOmbor[m.xom];
  if(ob && (ob.kirgan-ob.sarflangan) < kir){
    if(!confirm('Ombordagi qoldiq yetarli emas! Baribir saqlaysizmi?')) return;
  }

  const p = {
    id: 'E-'+Date.now().toString().slice(-6),
    sana: document.getElementById('eSana').value,
    xomAshyoTuri: m.xom, mahsulotId: m.id, mahsulotNomi: m.nomi,
    kirganKg: kir, chiqganKg: chiq, poteryaKg: potKg, poteryaPct: potFoiz,
    xodimlar: getSelectedXodimlar(), izoh: document.getElementById('eIzoh').value
  };

  if(!xomOmbor[m.xom]) xomOmbor[m.xom] = {kirgan:0, sarflangan:0};
  xomOmbor[m.xom].sarflangan += kir;
  localStorage.setItem('xomOmbor', JSON.stringify(xomOmbor));
  m.ombor += chiq; localStorage.setItem('mahsulotlar', JSON.stringify(mahsulotlar));

  partiyalar.push(p); localStorage.setItem('partiyalar', JSON.stringify(partiyalar));

  document.getElementById('succMsg').textContent = \`\${m.nomi} · \${chiq.toLocaleString()} kg tayyor · \${potFoiz}% poterya\`;
  document.getElementById('successOverlay').classList.add('open');
  mahsulotTanlash(); renderJurnal(); renderLastEritmalar(); renderOmbor();
}

function resetForm(){
  document.getElementById('eMahsulot').value='';
  document.getElementById('eKirgan').value='';
  document.getElementById('eIzoh').value='';
  document.querySelectorAll('.xodim-chip').forEach(c=>c.classList.remove('selected'));
  mahsulotTanlash();
}
function closeSuccess(){ document.getElementById('successOverlay').classList.remove('open'); }

function switchTab(id, btn){
  document.querySelectorAll('.tab').forEach(t=>t.classList.remove('active'));
  document.querySelectorAll('.page').forEach(p=>p.classList.remove('active'));
  if(btn) btn.classList.add('active');
  document.getElementById('tab-'+id).classList.add('active');
  if(id==='jurnal') renderJurnal();
  if(id==='ombor') renderOmbor();
}

function renderLastEritmalar(){
  const body = document.getElementById('lastEritmalar');
  const last = [...partiyalar].reverse().slice(0,5);
  if(!last.length){ body.innerHTML='<tr><td colspan="3" style="text-align:center;padding:12px;color:var(--text-muted)">Hali jarayon yo\\'q</td></tr>'; return; }
  body.innerHTML = last.map(p=>\`<tr><td>\${XOM_NOM[p.xomAshyoTuri]||p.xomAshyoTuri}</td><td>\${p.chiqganKg}kg</td><td><span class="badge gray">\${p.poteryaPct}%</span></td></tr>\`).join('');
}

function renderJurnal(){
  const f=document.getElementById('jFilter').value;
  const data=[...partiyalar].reverse().filter(p=>!f||p.xomAshyoTuri===f);
  document.getElementById('jStatTayyor').textContent = data.reduce((a,b)=>a+b.chiqganKg,0).toLocaleString()+' kg';
  document.getElementById('jStatPoterya').textContent = data.reduce((a,b)=>a+b.poteryaKg,0).toFixed(1)+' kg';
  document.getElementById('jStatSoni').textContent = data.length;
  document.getElementById('jurnalBody').innerHTML = data.length ? data.map((p,i)=>\`<tr>
    <td><b>\${p.id||'E'}</b></td><td>\${p.sana}</td><td>\${XOM_NOM[p.xomAshyoTuri]||p.xomAshyoTuri}</td><td>\${p.mahsulotNomi}</td>
    <td>\${p.kirganKg} kg</td><td><b style="color:var(--primary)">\${p.chiqganKg} kg</b></td><td>\${p.poteryaKg} kg</td>
    <td style="font-size:11px;color:var(--text-muted)">\${p.xodimlar.join(', ')||'—'}</td>
    <td><button class="btn btn-sm btn-danger" onclick="delE(\'\${p.id}'\)">🗑</button></td></tr>\`).join('') : '<tr><td colspan="9" style="text-align:center;padding:16px;">Jarayon yo\\'q</td></tr>';
}

function delE(id){
  if(!confirm('O\\'chirishni tasdiqlaysizmi?')) return;
  partiyalar=partiyalar.filter(p=>p.id!==id); localStorage.setItem('partiyalar',JSON.stringify(partiyalar)); renderJurnal(); renderLastEritmalar();
}

function exportJurnal(){
  let csv = 'Id,Sana,Xom ashyo,Mahsulot,Kirgan(kg),Chiqgan(kg),Poterya(kg)\\n';
  partiyalar.forEach(k=>{ csv+=\`\${k.id},\${k.sana},\${k.xomAshyoTuri},\${k.mahsulotNomi},\${k.kirganKg},\${k.chiqganKg},\${k.poteryaKg}\\n\`; });
  const a=document.createElement('a'); a.href='data:text/csv;charset=utf-8,\\uFEFF'+encodeURIComponent(csv); a.download='Eritish_jurnali.csv'; a.click();
}

function renderOmbor(){
  let html='';
  Object.entries(xomOmbor).forEach(([k,v])=>{
    const qoldiq=v.kirgan-v.sarflangan;
    const pct=v.kirgan>0?Math.min(100,qoldiq/v.kirgan*100):0;
    html+=\`<div class="ombor-card">
      <div class="oc-header"><div class="oc-name">\${XOM_ICO[k]||'📦'} \${XOM_NOM[k]||k}</div><span class="badge \${qoldiq>500?'green':qoldiq>200?'amber':'red'}">\${qoldiq>500?'Yetarli':qoldiq>200?'Kam':'Kritik!'}</span></div>
      <div class="oc-kg" style="color:var(--primary)">\${qoldiq.toLocaleString()} kg</div>
      <div class="oc-meta">Jami kirim: \${v.kirgan.toLocaleString()} kg &nbsp;·&nbsp; Sarflangan: \${v.sarflangan.toLocaleString()} kg</div>
      <div style="margin-top:8px;"><div class="prog-bg"><div class="prog-fill \${qoldiq/v.kirgan>0.4?'green':'amber'}" style="width:\${pct}%"></div></div></div>
    </div>\`;
  });
  document.getElementById('omborGrid').innerHTML=html;
  const harakatlar = partiyalar.map(p=>({sana:p.sana,tur:p.xomAshyoTuri,harakat:'Sarflandi',miqdor:\`-\${p.kirganKg}\`,uchun:\`Eritish (Tayyor \${p.mahsulotNomi})\`,rang:'var(--warning)'}));
  // Xom ashyo kirimlarni ham qo'shamiz (localStorage kirimlar orqali bo'lsa)
  const kirimlar=JSON.parse(localStorage.getItem('xomAshyoKirimlar')||'[]');
  kirimlar.forEach(k=>{ harakatlar.push({sana:k.sana,tur:k.tur,harakat:'Kirim',miqdor:\`+\${k.kg}\`,uchun:k.yetkazuvchi,rang:'var(--primary)'}); });
  harakatlar.sort((a,b)=>b.sana.localeCompare(a.sana));
  document.getElementById('omborTarix').innerHTML = harakatlar.map(t=>\`<tr><td>\${t.sana}</td><td>\${XOM_NOM[t.tur]||t.tur}</td><td><span class="badge \${t.miqdor.includes('+')?'green':'amber'}">\${t.harakat}</span></td><td style="color:\${t.rang};font-weight:700">\${t.miqdor} kg</td><td>\${t.uchun}</td><td>—</td></tr>\`).join('')||'<tr><td colspan="6" style="text-align:center;padding:16px;">Harakat yo\\'q</td></tr>';
}

setupP(); renderLastEritmalar();
</script>
</body>
</html>
`;

html = html.replace(/<div class="main">[\s\S]*<\/body>/, newMain + newScripts);
fs.writeFileSync('public/ishlab_new.html', html);
const assert = require('assert');
assert(html.includes('mahsulotTanlash()'));
console.log('Successfully written ishlab_new.html');
