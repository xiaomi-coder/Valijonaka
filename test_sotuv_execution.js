
let window = {};
let document = {
  getElementById: function(id) { 
    return { 
      classList: { add:()=>{} }, 
      style: {}, 
      value: '', 
      innerHTML: '', 
      textContent: '',
      addEventListener: ()=>{} 
    }; 
  },
  querySelectorAll: function() { return { forEach: ()=>{} }; }
};
let localStorage = { getItem: ()=>null, setItem: ()=>{} };
let sotuvlar = [{ id: '123', sana: '2026-04-19', mijoz: {nomi: 'Mijoz 1', tur:'Zavod'}, cart: [{nomi:'Test', kg:10, narx: 100}], summa: 1000, qarz: 0, holat: 'tolandi', totalKg: 10 }];
let API = { get: async()=>[], post: async()=>{} };
let currentMijoz = null;
let lastSotuv = null;
let mijozStat = {};
let prodStat = {};

// ===== MA'LUMOTLAR =====
function getXomTurlar() { const t=typeof window.getXomTurlar==='function'?window.getXomTurlar():JSON.parse(localStorage.getItem('xomTurlar')||'[]'); return t;}

const reqMijozlar = JSON.parse(localStorage.getItem('mijozlar')||'[]');
const reqMahsulotlar = JSON.parse(localStorage.getItem('mahsulotlar')||'[]');
const reqXomOmbor = JSON.parse(localStorage.getItem('xomOmbor')||'{}');
const xTurlar = getXomTurlar();

const MAHSULOTLAR = [];
reqMahsulotlar.forEach(p => { MAHSULOTLAR.push({ id: p.id, tur:'mahsulot', nomi: '📦 '+p.nomi, ombor: p.ombor }); });
Object.entries(reqXomOmbor).forEach(([k,v]) => {
  const nomi = xTurlar.find(x=>x.id===k)?.nomi || k;
  MAHSULOTLAR.push({ id: 'xom_'+k, tur:'xom', xomId: k, nomi: '⚙️ ' + nomi + ' (Xom ashyo)', ombor: (v.kirgan||0) - (v.sarflangan||0) });
});

const MIJOZLAR_DATA = {};
reqMijozlar.forEach(m => {
  MIJOZLAR_DATA[m.id] = { nomi: m.nomi, tur: m.tur, tel: m.tel, manzil: m.manzil, id: m.id };
});

function loadMijozOptions() {
  const sel = document.getElementById('mijozSelect');
  sel.innerHTML = '<option value="">— Mijoz tanlang —</option>' + reqMijozlar.map(m=>`<option value="${m.id}">${m.nomi} (${m.tur})</option>`).join('');
}

let cart = [];
let currentMijoz = null;
let lastSotuv = null;
let sotuvlar = JSON.parse(localStorage.getItem('sotuvlar') || '[]');

// ===== INIT =====




initSotuv();

// ===== TAB =====
function switchTab(id, btn) {
  document.querySelectorAll('.tab').forEach(t=>t.classList.remove('active'));
  document.querySelectorAll('.page').forEach(p=>p.classList.remove('active'));
  btn.classList.add('active');
  document.getElementById('tab-'+id).classList.add('active');
  if(id==='tarix') renderHistory();
  if(id==='qarz') renderQarz();
  if(id==='stat') renderStat();
}

// ===== MAHSULOT QIDIRISH =====
function renderMahsulotGrid() {
  const grid = document.getElementById('mahsulotGrid');
  grid.innerHTML = MAHSULOTLAR.map(p=>`
    <div class="pg-card" id="pgc_${p.id}" onclick="selectProd('${p.id}')">
      <div class="pg-icon">${p.nomi.split(' ')[0]}</div>
      <div class="pg-name">${p.nomi.substring(p.nomi.indexOf(' ')+1)}</div>
      <div class="pg-meta">${p.ombor.toLocaleString()} kg qoldiq</div>
    </div>`).join('');
}

function selectProd(id) {
  const p = MAHSULOTLAR.find(x=>x.id===id);
  if(!p) return;
  document.querySelectorAll('.pg-card').forEach(c=>c.classList.remove('active'));
  document.getElementById('pgc_'+id).classList.add('active');
  
  document.getElementById('selProdName').value = p.nomi.substring(p.nomi.indexOf(' ')+1);
  document.getElementById('selProdName').dataset.id = p.id;
  document.getElementById('selProdNarx').value = '';
  document.getElementById('selProdKg').value = '';
  document.getElementById('itemJami').textContent = 'Jami: —';
  document.getElementById('selProdNarx').focus();
}

function calcItem() {
  const kg = parseFloat(document.getElementById('selProdKg').value)||0;
  const narx = parseFloat(document.getElementById('selProdNarx').value)||0;
  const jami = kg*narx;
  document.getElementById('itemJami').textContent = jami>0 ? 'Jami: '+jami.toLocaleString()+' so\'m' : 'Jami: —';
}

// ===== SAVAT =====
function addToCart() {
  const prodId = document.getElementById('selProdName').dataset.id;
  if(!prodId){ alert('Avval mahsulot tanlang!'); return; }
  const prod = MAHSULOTLAR.find(p=>p.id===prodId);
  if(!prod) return;
  const kg = parseFloat(document.getElementById('selProdKg').value)||0;
  const narx = parseFloat(document.getElementById('selProdNarx').value)||0;
  if(kg<=0){ alert('Miqdorni kiriting!'); return; }
  if(narx<=0){ alert('Narxni kiriting!'); return; }
  if(kg > prod.ombor){ alert(`Omborda yetarli emas! Mavjud: ${prod.ombor} kg`); return; }
  const existing = cart.find(i=>i.prodId===prodId);
  if(existing){ existing.kg+=kg; existing.narx=narx; }
  else { cart.push({ prodId, nomi:prod.nomi, kg, narx }); }
  document.querySelectorAll('.pg-card').forEach(c=>c.classList.remove('active'));
  document.getElementById('selProdName').value='';
  document.getElementById('selProdName').dataset.id='';
  document.getElementById('selProdNarx').value='';
  document.getElementById('selProdKg').value='';
  document.getElementById('itemJami').textContent='Jami: —';
  renderCart();
}

function renderCart() {
  const el = document.getElementById('savatcha');
  if(!cart.length){ el.innerHTML='<div class="empty-cart"><div class="icon">🛒</div><div>Savat bo\'sh. Mahsulot qo\'shing.</div></div>'; recalcTotal(); return; }
  el.innerHTML = cart.map((item,i)=>`
    <div class="savatcha-item">
      <div class="sav-info">
        <div class="sav-name">${item.nomi}</div>
        <div class="sav-meta">${item.narx.toLocaleString()} so'm/kg</div>
      </div>
      <div class="sav-qty">
        <button class="qty-btn" onclick="changeQty(${i},-10)">−</button>
        <span class="qty-val">${item.kg} kg</span>
        <button class="qty-btn" onclick="changeQty(${i},10)">+</button>
      </div>
      <div class="sav-sum">${(item.kg*item.narx).toLocaleString()}</div>
      <button class="sav-remove" onclick="removeItem(${i})">✕</button>
    </div>`).join('');
  recalcTotal();
}

function changeQty(i, delta) {
  const prod = MAHSULOTLAR.find(p=>p.id===cart[i].prodId);
  cart[i].kg = Math.max(1, cart[i].kg + delta);
  if(prod && cart[i].kg > prod.ombor) cart[i].kg = prod.ombor;
  renderCart();
}
function removeItem(i){ cart.splice(i,1); renderCart(); }
function clearCart(){ cart=[]; renderCart(); }

function recalcTotal() {
  const totalKg = cart.reduce((s,i)=>s+i.kg,0);
  const total = cart.reduce((s,i)=>s+i.kg*i.narx,0);
  const ch = parseFloat(document.getElementById('chegirma').value)||0;
  const chegirmaSum = Math.round(total*ch/100);
  const final = total - chegirmaSum;
  document.getElementById('sumQty').textContent = totalKg.toLocaleString()+' kg';
  document.getElementById('sumTotal').textContent = total.toLocaleString()+' so\'m';
  document.getElementById('sumChegirma').textContent = ch>0 ? '-'+chegirmaSum.toLocaleString()+' so\'m' : '—';
  document.getElementById('sumFinal').textContent = final.toLocaleString()+' so\'m';
  calcQarz();
}

// ===== MIJOZ =====
function mijozTanlash() {
  const sel = document.getElementById('mijozSelect');
  const key = sel.value;
  const info = document.getElementById('mijozInfo');
  const badge = document.getElementById('mijozNarxBadge');
  
  // Sana hech narsa tanlanmasa ham bugungi kunni olsin
  document.getElementById('sotuvSana').value = new Date().toISOString().split('T')[0];

  if(!key){ currentMijoz=null; info.style.display='none'; badge.innerHTML=''; return; }
  currentMijoz = MIJOZLAR_DATA[key];
  info.style.display='block';
  info.innerHTML=`📍 ${currentMijoz.manzil} &nbsp;·&nbsp; 📞 ${currentMijoz.tel} &nbsp;·&nbsp; Tur: <b>${currentMijoz.tur}</b>`;
  badge.innerHTML='';
  cart=[]; renderCart();
}

// ===== TO'LOV =====
function tolovTuriOzgar() {
  const tur = document.getElementById('tolovTuri').value;
  const bank = document.getElementById('bankRow');
  const naqd = document.getElementById('naqdBlock');
  bank.style.display = tur==='aralash' ? 'flex' : 'none';
  naqd.style.display = tur==='bank' ? 'none' : '';
  if(tur==='bank'){ document.getElementById('naqdBlock').style.display='none'; }
  else if(tur==='qarz'){ document.getElementById('naqdSumma').value='0'; document.getElementById('naqdBlock').style.display=''; bank.style.display='none'; calcQarz(); }
  else { document.getElementById('naqdBlock').style.display=''; calcQarz(); }
}

function calcQarz() {
  const tur = document.getElementById('tolovTuri').value;
  const total = getFinalSum();
  const qi = document.getElementById('qarzInfo');
  if(tur==='naqd' || tur==='bank'){ qi.style.display='none'; return; }
  if(tur==='qarz'){ qi.style.display='block'; qi.className='tolov-qarz'; qi.textContent=`📋 Butun summa qarzga yoziladi: ${total.toLocaleString()} so'm`; return; }
  if(tur==='aralash'){
    const naqd = parseFloat(document.getElementById('naqdSumma').value)||0;
    const bank2 = parseFloat(document.getElementById('bankSumma').value)||0;
    const qarz = total - naqd - bank2;
    qi.style.display='block';
    if(qarz>0){ qi.className='tolov-qarz'; qi.textContent=`💳 Qarz: ${qarz.toLocaleString()} so'm`; }
    else if(qarz<0){ qi.className='tolov-qarz'; qi.style.background='var(--warning-light)'; qi.style.color='var(--warning)'; qi.style.borderColor='#f9c784'; qi.textContent=`⚠️ Ortiqcha to'lov: ${Math.abs(qarz).toLocaleString()} so'm`; }
    else { qi.className='tolov-qarz ok'; qi.textContent='✅ To\'liq to\'landi'; }
  }
}

function getFinalSum() {
  const total = cart.reduce((s,i)=>s+i.kg*i.narx,0);
  const ch = parseFloat(document.getElementById('chegirma').value)||0;
  return Math.round(total*(1-ch/100));
}

// ===== SOTUV SAQLASH =====
async function saveSotuv() {
  if(!document.getElementById('mijozSelect').value){ alert('Mijozni tanlang!'); return; }
  if(!cart.length){ alert('Savat bo\'sh!'); return; }
  const tur = document.getElementById('tolovTuri').value;
  const final = getFinalSum();
  const naqd = parseFloat(document.getElementById('naqdSumma').value)||0;
  const bank2 = parseFloat(document.getElementById('bankSumma').value)||0;
  let tolangan=0, qarz=0, holat='';
  if(tur==='naqd'){ tolangan=final; qarz=0; holat='tolandi'; }
  else if(tur==='bank'){ tolangan=final; qarz=0; holat='tolandi'; }
  else if(tur==='qarz'){ tolangan=0; qarz=final; holat='qarz'; }
  else { tolangan=naqd+bank2; qarz=Math.max(0,final-tolangan); holat=qarz>0?'qisman':'tolandi'; }

  const sotuv = {
    id: 'S-' + (1048 + sotuvlar.length + 1),
    sana: document.getElementById('sotuvSana').value,
    mijoz: currentMijoz,
    cart: JSON.parse(JSON.stringify(cart)),
    totalKg: cart.reduce((s,i)=>s+i.kg,0),
    summa: final,
    chegirma: parseFloat(document.getElementById('chegirma').value)||0,
    tolovTuri: tur,
    tolangan, qarz,
    holat,
    izoh: document.getElementById('izoh').value,
    createdAt: new Date().toISOString(),
  };
  sotuvlar.push(sotuv);
  // API handled this
  lastSotuv = sotuv;

  // Omborda kamaytirish
  cart.forEach(item=>{ 
    const prod=MAHSULOTLAR.find(p=>p.id===item.prodId); 
    if(prod) {
      if(prod.tur==='mahsulot') {
         const d = reqMahsulotlar.find(x=>x.id===prod.id);
         if(d) { d.ombor = Math.max(0, d.ombor - item.kg); localStorage.setItem('mahsulotlar',JSON.stringify(reqMahsulotlar)); }
      } else if(prod.tur==='xom') {
         if(reqXomOmbor[prod.xomId]) {
            reqXomOmbor[prod.xomId].sarflangan += item.kg;
            localStorage.setItem('xomOmbor', JSON.stringify(reqXomOmbor));
         }
      }
    }
  });

  document.getElementById('successMsg').textContent = `${sotuv.id} · ${sotuv.mijoz.nomi} · ${sotuv.summa.toLocaleString()} so'm`;
  openModal('successModal');
}

// ===== CHEK =====
function buildChekHTML(s) {
  const sana = new Date(s.createdAt).toLocaleString('uz-UZ');
  const rows = s.cart.map(i=>`
    <div class="chek-row"><span>${i.nomi}</span></div>
    <div class="chek-row"><span style="padding-left:12px">${i.kg} kg × ${i.narx.toLocaleString()}</span><span>${(i.kg*i.narx).toLocaleString()}</span></div>
  `).join('');
  const asosiy = s.cart.reduce((a,i)=>a+i.kg*i.narx,0);
  return `
    <div class="chek-header">
      <h2>Valijon MChJ</h2>
      <p>Sotuv cheki · ${s.id}</p>
      <p>${sana}</p>
    </div>
    <hr class="chek-divider">
    <div class="chek-row"><span>Mijoz:</span><span>${s.mijoz.nomi}</span></div>
    <div class="chek-row"><span>Tur:</span><span>${s.mijoz.tur}</span></div>
    <hr class="chek-divider">
    ${rows}
    <hr class="chek-divider">
    <div class="chek-row"><span>Jami (kg):</span><span>${s.totalKg} kg</span></div>
    <div class="chek-row"><span>Asosiy summa:</span><span>${asosiy.toLocaleString()}</span></div>
    ${s.chegirma>0?`<div class="chek-row"><span>Chegirma (${s.chegirma}%):</span><span>-${Math.round(asosiy*s.chegirma/100).toLocaleString()}</span></div>`:''}
    <div class="chek-row bold large"><span>JAMI:</span><span>${(parseFloat((parseFloat(s.summa)||0))||0).toLocaleString()} so'm</span></div>
    <hr class="chek-divider">
    <div class="chek-row"><span>To'lov turi:</span><span>${{naqd:'Naqd',bank:'Bank',qarz:'Qarz',aralash:'Aralash'}[s.tolovTuri]}</span></div>
    <div class="chek-row"><span>To'langan:</span><span>${s.tolangan.toLocaleString()}</span></div>
    ${s.qarz>0?`<div class="chek-row bold" style="color:var(--danger)"><span>Qarz:</span><span>${(parseFloat(s.qarz)||0).toLocaleString()}</span></div>`:''}
    <hr class="chek-divider">
    <div class="chek-footer">Xarid uchun rahmat!<br>Tel: +998 71 000 00 00</div>
  `;
}

function previewChek() {
  if(!cart.length||!currentMijoz){ alert('Avval sotuv ma\'lumotlarini to\'ldiring!'); return; }
  const tmpSotuv = {
    id:'S-PREVIEW', sana:document.getElementById('sotuvSana').value,
    mijoz:currentMijoz, cart:JSON.parse(JSON.stringify(cart)),
    totalKg:cart.reduce((s,i)=>s+i.kg,0), summa:getFinalSum(),
    chegirma:parseFloat(document.getElementById('chegirma').value)||0,
    tolovTuri:document.getElementById('tolovTuri').value,
    tolangan:0, qarz:getFinalSum(), createdAt:new Date().toISOString()
  };
  document.getElementById('chekContent').innerHTML = buildChekHTML(tmpSotuv);
  openModal('chekModal');
}

function printChek() {
  const s = lastSotuv || {};
  const html = document.getElementById('chekContent').innerHTML;
  const win = window.open('','_blank','width=400,height=600');
  win.document.write(`<!DOCTYPE html><html><head><meta charset="UTF-8"><title>Chek</title><style>
    body{font-family:'Courier New',monospace;font-size:13px;padding:20px;line-height:1.8;color:#111}
    .chek-header{text-align:center;margin-bottom:8px} .chek-header h2{font-size:18px;font-weight:900}
    hr{border:none;border-top:1px dashed #999;margin:8px 0}
    .chek-row{display:flex;justify-content:space-between}
    .bold{font-weight:700} .large{font-size:15px}
    .chek-footer{text-align:center;font-size:11px;color:#777;margin-top:8px}
  </style><script src="/api.js">
try { switchTab('tarix', document.getElementById('test')); switchTab('qarz', document.getElementById('test')); switchTab('stat', document.getElementById('test')); console.log('OK'); } catch(e) { console.error('Error during switchTab:', e); }