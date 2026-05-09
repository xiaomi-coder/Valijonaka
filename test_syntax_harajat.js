


// ===== INIT =====
const user=JSON.parse(localStorage.getItem('erp_user')||'{"name":"admin","role":"admin"}');



document.getElementById('todayDate').textContent=new Date().toLocaleDateString('uz-UZ',{weekday:'short',year:'numeric',month:'long',day:'numeric'});
document.getElementById('hSana').value=new Date().toISOString().split('T')[0];

// ===== MA'LUMOTLAR =====
let kategoriyalar=JSON.parse(localStorage.getItem('kategoriyalar')||'[]');

let harajatlar=[];
async function initHarajatlar() {
  try {
    const data = await API.get('/harajatlar');
    harajatlar = data.map(h => ({
      id: h.id,
      katId: h.tur,
      sana: h.sana.substring(0, 10),
      tavsif: h.izoh,
      moshina: '',
      summa: parseFloat(h.summa) || 0,
      tolov: 'Naqd',
      oy: h.oy,
      qoshgan: h.qoshgan
    }));
    renderHarajatlar();
    renderHisobot();
  } catch(e) { console.error('API Error:', e); }
}

// Demo daromadlar (sotuvlardan)
const DAROMADLAR={
  1:{plastik:32000000,rezina:9500000,poterya:2200000},
  2:{plastik:38000000,rezina:10200000,poterya:2800000},
  3:{plastik:41000000,rezina:11000000,poterya:3000000},
};
const OYLIK_FOND={1:5800000,2:6200000,3:7444000};
const OY_NOMI={1:'Yanvar',2:'Fevral',3:'Mart'};
let selectedRang='#1a6b3c';
let activeKatFilter='';

// ===== UTIL =====
function katById(id){return kategoriyalar.find(k=>k.id===id)||{nomi:'Boshqa',icon:'📌',rang:'#999'};}
function harajatByOy(oy,katId=''){
  return harajatlar.filter(h=>h.oy===oy&&(!katId||h.katId===katId));
}
function sumHarajat(list){return list.reduce((s,h)=>s+h.summa,0);}
function katSum(katId,oy){return sumHarajat(harajatlar.filter(h=>h.katId===katId&&h.oy===oy));}

// ===== HARAJAT SELECT SETUP =====
function setupKatSelect(){
  const sel=document.getElementById('hKat');
  const filter=document.getElementById('hFilterKat');
  const opts=kategoriyalar.map(k=>`<option value="${k.id}">${k.icon} ${k.nomi}</option>`).join('');
  sel.innerHTML='<option value="">— Tanlang —</option>'+opts;
  filter.innerHTML='<option value="">Barcha kategoriyalar</option>'+opts;
}

document.getElementById('hKat').addEventListener('change',function(){
  const k=katById(this.value);
  document.getElementById('moshinaSelectWrap').style.display=k.moshina?'block':'none';
});

// ===== HARAJATLAR =====
let filteredHarajatlar=[];
function renderHarajatlar(){
  const oy=parseInt(document.getElementById('hFilterOy').value)||3;
  const katF=document.getElementById('hFilterKat').value;
  filteredHarajatlar=harajatlar.filter(h=>h.oy===oy&&(!katF||h.katId===katF)&&(!activeKatFilter||h.katId===activeKatFilter));
  const body=document.getElementById('harajatBody');
  const jami=sumHarajat(filteredHarajatlar);

  // Stats
  const oyH=harajatlar.filter(h=>h.oy===oy);
  const prevH=harajatlar.filter(h=>h.oy===oy-1);
  const oySum=sumHarajat(oyH); const prevSum=sumHarajat(prevH);
  const farq=oySum-prevSum; const farqPct=prevSum?Math.abs(Math.round(farq/prevSum*100)):0;
  document.getElementById('stHarajat').textContent=oySum.toLocaleString();
  document.getElementById('stOtgan').textContent=prevSum.toLocaleString();
  document.getElementById('stFarq').innerHTML=farq>0?`<span class="trend down">↑ ${farqPct}%</span>`:`<span class="trend up">↓ ${farqPct}%</span>`;
  document.getElementById('stSon').textContent=oyH.length;
  const topKat=kategoriyalar.reduce((t,k)=>katSum(k.id,oy)>katSum(t.id,oy)?k:t,kategoriyalar[0]);
  document.getElementById('stEngKatta').textContent=topKat?(topKat.icon+' '+topKat.nomi):'—';

  // Kat chips
  const chips=document.getElementById('katChips');
  chips.innerHTML=kategoriyalar.map(k=>{
    const s=katSum(k.id,oy);
    const isActive=activeKatFilter===k.id;
    return `<div class="kat-chip ${isActive?'active':''}" onclick="katFilter('${k.id}')">
      <div class="kc-icon">${k.icon}</div>
      <div class="kc-name">${k.nomi}</div>
      <div class="kc-sum">${s.toLocaleString()}</div>
    </div>`;
  }).join('');

  if(!filteredHarajatlar.length){body.innerHTML='<tr><td colspan="8" style="text-align:center;padding:24px;color:var(--text-muted);">Harajat yo\'q</td></tr>';document.getElementById('harajatJami').textContent='0 so\'m';return;}
  body.innerHTML=filteredHarajatlar.slice().reverse().map((h,i)=>{
    const k=katById(h.katId);
    return `<tr>
      <td>${i+1}</td>
      <td>${h.sana}</td>
      <td><span style="display:inline-flex;align-items:center;gap:5px;background:${k.rang}18;color:${k.rang};padding:3px 10px;border-radius:99px;font-size:11px;font-weight:600;">${k.icon} ${k.nomi}</span></td>
      <td>${h.tavsif}</td>
      <td style="font-size:12px;color:var(--text-muted)">${h.moshina||'—'}</td>
      <td style="font-weight:700;color:var(--danger)">${h.summa.toLocaleString()}</td>
      <td style="font-size:12px;color:var(--text-muted)">${h.qoshgan}</td>
      <td class="no-print"><button class="btn btn-sm btn-danger" onclick="deleteHarajat('${h.id}')">🗑</button></td>
    </tr>`;
  }).join('');
  document.getElementById('harajatJami').textContent=jami.toLocaleString()+' so\'m';
}

function katFilter(id){
  activeKatFilter=activeKatFilter===id?'':id;
  renderHarajatlar();
}

function filterHarajat(q){
  const oy=parseInt(document.getElementById('hFilterOy').value)||3;
  const list=harajatlar.filter(h=>h.oy===oy&&(h.tavsif.toLowerCase().includes(q.toLowerCase())||katById(h.katId).nomi.toLowerCase().includes(q.toLowerCase())));
  filteredHarajatlar=list;
  const body=document.getElementById('harajatBody');
  if(!list.length){body.innerHTML='<tr><td colspan="8" style="text-align:center;padding:16px;color:var(--text-muted);">Topilmadi</td></tr>';return;}
  body.innerHTML=list.map((h,i)=>{const k=katById(h.katId);return `<tr><td>${i+1}</td><td>${h.sana}</td><td><span style="background:${k.rang}18;color:${k.rang};padding:3px 10px;border-radius:99px;font-size:11px;font-weight:600;">${k.icon} ${k.nomi}</span></td><td>${h.tavsif}</td><td style="font-size:12px;color:var(--text-muted)">${h.moshina||'—'}</td><td style="font-weight:700;color:var(--danger)">${h.summa.toLocaleString()}</td><td style="font-size:12px;color:var(--text-muted)">${h.qoshgan}</td><td><button class="btn btn-sm btn-danger" onclick="deleteHarajat('${h.id}')">🗑</button></td></tr>`;}).join('');
  document.getElementById('harajatJami').textContent=sumHarajat(list).toLocaleString()+' so\'m';
}

async function saveHarajat(){
  const katId=document.getElementById('hKat').value;
  const summa=parseSum('hSumma');
  const tavsif=document.getElementById('hTavsif').value.trim();
  const sana=document.getElementById('hSana').value;
  if(!katId){alert('Kategoriyani tanlang!');return;}
  if(!summa){alert('Summani kiriting!');return;}
  if(!tavsif){alert('Tavsifni kiriting!');return;}
  const oy=document.getElementById('monthFilter') ? parseInt(document.getElementById('monthFilter').value) || parseInt(sana.split('-')[1]) : parseInt(sana.split('-')[1]);
  const izohStr = tavsif + (document.getElementById('hIzoh').value ? ' - ' + document.getElementById('hIzoh').value : '') + (document.getElementById('hMoshina').value ? ' - Moshina: ' + document.getElementById('hMoshina').value : '');
  
  try {
    await API.post('/harajatlar', {
      sana, oy, tur: katId, summa, izoh: izohStr, qoshgan: user.name || 'Admin'
    });
    document.getElementById('hTavsif').value='';document.getElementById('hSumma').value='';document.getElementById('hIzoh').value='';document.getElementById('hKat').value='';document.getElementById('moshinaSelectWrap').style.display='none';
    closeModal('harajatModal');
    initHarajatlar();
  } catch(e) { alert(e.message); }
}

async function deleteHarajat(id){
  if(!confirm('Harajatni o\'chirishni tasdiqlaysizmi?'))return;
  await API.del('/harajatlar/'+id);
  initHarajatlar();
}

function exportHarajat(){
  const oy=parseInt(document.getElementById('hFilterOy').value)||3;
  let csv='Sana,Kategoriya,Tavsif,Moshina,Summa,Tolov,Qoshgan\n';
  harajatlar.filter(h=>h.oy===oy).forEach(h=>{const k=katById(h.katId);csv+=`"${h.sana}","${k.nomi}","${h.tavsif}","${h.moshina||''}",${h.summa},"${h.tolov}","${h.qoshgan}"\n`;});
  const a=document.createElement('a');a.href='data:text/csv;charset=utf-8,\uFEFF'+encodeURIComponent(csv);a.download=`Harajatlar_${OY_NOMI[oy]}_2026.csv`;a.click();
}

// ===== KATEGORIYALAR =====
function renderKategoriyalar(){
  const oy=3;
  const body=document.getElementById('katBody');
  body.innerHTML=kategoriyalar.map(k=>{
    const s=katSum(k.id,oy); const cnt=harajatlar.filter(h=>h.katId===k.id&&h.oy===oy).length;
    return `<tr>
      <td style="font-size:20px">${k.icon}</td>
      <td><b>${k.nomi}</b>${k.moshina?'<span class="badge blue" style="margin-left:6px;font-size:10px;">🚗</span>':''}</td>
      <td style="font-weight:700;color:var(--danger)">${s.toLocaleString()}</td>
      <td>${cnt} ta</td>
      <td style="display:flex;gap:4px;">
        <button class="btn btn-sm btn-danger" onclick="deleteKat('${k.id}')">🗑</button>
      </td>
    </tr>`;
  }).join('');

  // Pie chart (CSS progress bars)
  const total=kategoriyalar.reduce((s,k)=>s+katSum(k.id,oy),0)||1;
  document.getElementById('katChart').innerHTML=kategoriyalar.map(k=>{
    const s=katSum(k.id,oy);const pct=Math.round(s/total*100);
    return `<div class="prog-wrap">
      <div class="prog-label"><span>${k.icon} ${k.nomi}</span><span style="font-weight:700">${pct}% &nbsp; ${s.toLocaleString()}</span></div>
      <div class="prog-bg"><div class="prog-fill" style="width:${pct}%;background:${k.rang}"></div></div>
    </div>`;
  }).join('');
}

function saveKat(){
  const nomi=document.getElementById('katNomi').value.trim();
  const icon=document.getElementById('katIcon').value||'📌';
  if(!nomi){alert('Kategoriya nomini kiriting!');return;}
  kategoriyalar.push({id:'k'+Date.now(),nomi,icon,rang:selectedRang,moshina:parseInt(document.getElementById('katMoshina').value)});
  localStorage.setItem('kategoriyalar',JSON.stringify(kategoriyalar));
  closeModal('katModal');
  setupKatSelect(); renderKategoriyalar(); renderHarajatlar();
}
function deleteKat(id){
  if(!confirm('Kategoriyani o\'chirmoqchimisiz? Undagi harajatlar saqlanib qoladi.'))return;
  kategoriyalar=kategoriyalar.filter(k=>k.id!==id);
  localStorage.setItem('kategoriyalar',JSON.stringify(kategoriyalar));
  renderKategoriyalar(); setupKatSelect();
}
function selRang(el,rang){
  selectedRang=rang;
  document.getElementById('katRang').value=rang;
  document.querySelectorAll('.rang-chip').forEach(c=>c.style.border='2px solid transparent');
  el.style.border='3px solid #333';
}

function renderMoshina() {
  const moshinaCards = document.getElementById('moshinaCards');
  const tbody = document.getElementById('moshinaHarajatBody');
  const moshinaFilter = document.getElementById('moshinaFilter');
  
  // Extract unique moshina names
  const mList = [...new Set(harajatlar.filter(h=>h.moshina).map(h=>h.moshina))];
  if(moshinaFilter.children.length === 1 && mList.length > 0) {
    moshinaFilter.innerHTML = '<option value="">Barcha moshinalar</option>' + mList.map(m=>`<option value="${m}">${m}</option>`).join('');
  }

  const selectedM = moshinaFilter.value;
  const hList = harajatlar.filter(h => h.moshina && (!selectedM || h.moshina === selectedM));

  if(!mList.length) {
    moshinaCards.innerHTML = '';
    tbody.innerHTML = '<tr><td colspan="5" style="text-align:center;padding:16px;color:var(--text-muted);">Moshina harajatlari yo\'q</td></tr>';
    return;
  }

  // Cards
  moshinaCards.innerHTML = mList.map(m => {
    const s = sumHarajat(harajatlar.filter(h => h.moshina === m));
    const kount = harajatlar.filter(h => h.moshina === m).length;
    return `<div class="card p-3" style="border-left:4px solid var(--primary);margin:0">
      <div style="font-weight:700;font-size:15px;margin-bottom:8px;">🚗 ${m}</div>
      <div style="font-size:12px;color:var(--text-muted)">Jami harajat: <span style="font-weight:700;color:var(--danger)">${s.toLocaleString()}</span> so'm</div>
      <div style="font-size:11px;color:var(--text-muted);margin-top:4px;">Yozuvlar: ${kount} ta</div>
    </div>`;
  }).join('');

  if(!hList.length) {
    tbody.innerHTML = '<tr><td colspan="5" style="text-align:center;padding:16px;color:var(--text-muted);">Topilmadi</td></tr>';
    return;
  }

  tbody.innerHTML = hList.map(h => {
    const k = katById(h.katId);
    return `<tr>
      <td>${h.sana}</td>
      <td><b>${h.moshina}</b></td>
      <td><span style="font-size:11px;font-weight:600;background:${k.rang}18;color:${k.rang};padding:2px 8px;border-radius:12px;">${k.icon} ${k.nomi}</span></td>
      <td style="font-size:12px">${h.tavsif}</td>
      <td style="font-weight:700;color:var(--danger)">${h.summa.toLocaleString()}</td>
    </tr>`;
  }).join('');
}

function renderMoshinaTable() {
  renderMoshina();
}

function renderHisobot() {
  const oy=parseInt(document.getElementById('hisobotOy')?.value || document.getElementById('hFilterOy').value)||3;
  const d=DAROMADLAR[oy];
  const jDaromad=d.plastik+d.rezina+d.poterya;
  
  const dItems=[
    {nomi:'Plastik granula',val:d.plastik,rang:'#3b82f6'},
    {nomi:'Rezina dilerlik',val:d.rezina,rang:'#10b981'},
    {nomi:'Poterya',val:d.poterya,rang:'#8b5cf6'}
  ];
  
  if(document.getElementById('daromadChart')) {
    document.getElementById('daromadChart').innerHTML=dItems.map(item=>{const pct=Math.round(item.val/jDaromad*100);return `<div class="prog-wrap"><div class="prog-label"><span>${item.nomi}</span><span style="font-weight:700">${pct}% &nbsp; ${(item.val/1000000).toFixed(1)}M</span></div><div class="prog-bg"><div class="prog-fill" style="width:${pct}%;background:${item.rang}"></div></div></div>`;}).join('');
  }

  const hList=harajatlar.filter(h=>h.oy===oy);
  const jHar=sumHarajat(hList)||1;
  if(document.getElementById('harajatChart')) {
    document.getElementById('harajatChart').innerHTML=kategoriyalar.map(k=>{const s=katSum(k.id,oy);const pct=Math.round(s/jHar*100);return s?`<div class="prog-wrap"><div class="prog-label"><span>${k.icon} ${k.nomi}</span><span style="font-weight:700">${pct}%</span></div><div class="prog-bg"><div class="prog-fill" style="width:${pct}%;background:${k.rang}"></div></div></div>`:''}).join('');
  }

  // P&L Table updates
  if(document.getElementById('hPlastik')){
    document.getElementById('hisobotOyNom').textContent = OY_NOMI[oy];
    document.getElementById('hPlastik').textContent = d.plastik.toLocaleString() + " so'm";
    document.getElementById('hRezina').textContent = d.rezina.toLocaleString() + " so'm";
    document.getElementById('hPoterya').textContent = d.poterya.toLocaleString() + " so'm";
    document.getElementById('hDaromad').textContent = jDaromad.toLocaleString() + " so'm";

    document.getElementById('hKatRows').innerHTML = kategoriyalar.map(k=>{
      const s = katSum(k.id, oy);
      return s ? `<div class="hb-row"><span class="hb-label">${k.icon} ${k.nomi}</span><span class="hb-val">${s.toLocaleString()} so'm</span></div>` : '';
    }).join('');

    const jHarajat = sumHarajat(hList) + OYLIK_FOND[oy];
    document.getElementById('hOylik').textContent = OYLIK_FOND[oy].toLocaleString() + " so'm";
    document.getElementById('hHarajat').textContent = jHarajat.toLocaleString() + " so'm";
    
    document.getElementById('hSof').textContent = (jDaromad - jHarajat).toLocaleString() + " so'm";
    document.getElementById('hRent').textContent = Math.round((jDaromad - jHarajat) / jDaromad * 100) + "%";
  }
}

function exportHisobot(){
  const oy=parseInt(document.getElementById('hisobotOy').value)||3;
  const d=DAROMADLAR[oy];
  const jDaromad=d.plastik+d.rezina+d.poterya;
  const jHarajat=sumHarajat(harajatlar.filter(h=>h.oy===oy))+OYLIK_FOND[oy];
  const foyda=jDaromad-jHarajat;
  let csv=`Valijon ERP — Moliyaviy hisobot\n${OY_NOMI[oy]} 2026\n\n`;
  csv+=`DAROMADLAR\nPlastik granula,${d.plastik}\nRezina dilerlik,${d.rezina}\nPoterya sotuvi,${d.poterya}\nJami daromad,${jDaromad}\n\n`;
  csv+=`HARAJATLAR\n`;
  kategoriyalar.forEach(k=>{ csv+=`${k.nomi},${katSum(k.id,oy)}\n`; });
  csv+=`Oylik fond,${OYLIK_FOND[oy]}\nJami harajat,${jHarajat}\n\nSOF FOYDA,${foyda}\n`;
  const a=document.createElement('a');a.href='data:text/csv;charset=utf-8,\uFEFF'+encodeURIComponent(csv);a.download=`Hisobot_${OY_NOMI[oy]}_2026.csv`;a.click();
}

function renderTaqqos() {
  const oyList = [1, 2, 3];
  const tGrid = document.getElementById('taqqosGrid');
  tGrid.innerHTML = oyList.map(oy => {
    const s = sumHarajat(harajatlar.filter(h => h.oy === oy));
    return `<div class="taqqos-card">
      <div class="tc-header"><div class="tc-oy">${OY_NOMI[oy]}</div><div class="tc-jami">${s.toLocaleString()} so'm</div></div>
    </div>`;
  }).join('');

  const body = document.getElementById('taqqosBody');
  body.innerHTML = kategoriyalar.map(k => {
    const sums = oyList.map(oy => katSum(k.id, oy));
    return `<tr>
      <td>${k.icon} <b>${k.nomi}</b></td>
      <td>${sums[0] ? sums[0].toLocaleString() : '-'}</td>
      <td>${sums[1] ? sums[1].toLocaleString() : '-'}</td>
      <td>${sums[2] ? sums[2].toLocaleString() : '-'}</td>
    </tr>`;
  }).join('');
}

// ===== TABS =====
function switchTab(id,btn){
  try {
    document.querySelectorAll('.tab').forEach(t=>t.classList.remove('active'));
    document.querySelectorAll('.page').forEach(p=>p.classList.remove('active'));
    btn.classList.add('active');
    document.getElementById('tab-'+id).classList.add('active');
    if(id==='harajat') renderHarajatlar();
    if(id==='kategoriya') renderKategoriyalar();
    if(id==='moshina') renderMoshina();
    if(id==='taqqos') renderTaqqos();
    if(id==='hisobot') renderHisobot();
  } catch(e) {
    alert("Xatolik ("+id+"): "+e.message);
  }
}

// ===== MODAL =====
function openModal(id){document.getElementById(id).classList.add('open');}
function closeModal(id){document.getElementById(id).classList.remove('open');}
document.querySelectorAll('.modal-overlay').forEach(m=>m.addEventListener('click',e=>{if(e.target===m)m.classList.remove('open');}));

// ===== INIT =====
setupKatSelect();
initHarajatlar();
