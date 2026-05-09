
const user=JSON.parse(localStorage.getItem('erp_user')||'{"name":"admin","role":"admin"}');



document.getElementById('todayDate').textContent=new Date().toLocaleDateString('uz-UZ',{weekday:'short',year:'numeric',month:'long',day:'numeric'});
document.getElementById('kmSana').value=new Date().toISOString().split('T')[0];
document.getElementById('smSana').value=new Date().toISOString().split('T')[0];

let kirimlar=[];
let sotuvlar=[];
let rezinaTurlari=JSON.parse(localStorage.getItem('rezinaTurlari')||'[]');

async function initRezina() {
  try {
    const [kRes, sRes] = await Promise.all([
      API.get('/rezina/kirimlar'), API.get('/rezina/sotuvlar')
    ]);
    kirimlar = kRes.map(k => ({
      ...k, sana: k.sana ? k.sana.substring(0, 10) : '',
      kg: parseFloat(k.kg) || 0, narx: parseFloat(k.narx) || 0, jami: parseFloat(k.jami) || 0
    }));
    sotuvlar = sRes.map(s => ({
      ...s, sana: s.sana ? s.sana.substring(0, 10) : '',
      kg: parseFloat(s.kg) || 0, narx: parseFloat(s.narx) || 0, jami: parseFloat(s.jami) || 0,
      kirNarx: parseFloat(s.kir_narx) || 0
    }));
    
    const cm = new Date().getMonth()+1;
    if(document.getElementById("hisobotOy")) document.getElementById("hisobotOy").value = cm;
    document.querySelectorAll(".dynYil").forEach(e=>e.innerText=new Date().getFullYear());
    document.querySelectorAll(".dynYilSot").forEach(e=>e.innerText=new Date().getFullYear());
    
    renderDashboard();
    
    const act = document.querySelector('.tab.active');
    if(act) {
        if(act.textContent.includes('Kirim')) renderKirim();
        if(act.textContent.includes('Sotuv')) renderSotuv();
        if(act.textContent.includes('Foyda')) renderHisobot();
    }
  } catch(e) { console.error('Rezina err:', e); }
}

function loadRezinaTurlariSelect(){
  const html = rezinaTurlari.map(t=>`<option value="${t}">${t}</option>`).join('');
  document.getElementById('kmTur').innerHTML = html;
  document.getElementById('smTur').innerHTML = html;
}
function addYangiRezinaTur(){
  const t = prompt("Yangi rezina turini kiriting (masalan: Traktor rezinasi):");
  if(t && t.trim()){
    if(!rezinaTurlari.includes(t.trim())){
      rezinaTurlari.push(t.trim());
      localStorage.setItem('rezinaTurlari', JSON.stringify(rezinaTurlari));
      loadRezinaTurlariSelect();
      renderDashboard();
      renderHisobot();
    } else {
      alert("Bu tur allaqachon mavjud!");
    }
  }
}
loadRezinaTurlariSelect();

let zavodTurlari=JSON.parse(localStorage.getItem('rezZavodTurlari')||'[]');
function loadZavodlarSelect(){
  const html = zavodTurlari.map(z=>`<option value="${z}">${z}</option>`).join('');
  document.getElementById('kmZavod').innerHTML = html;
}
function addYangiZavod(){
  const z = prompt("Yangi Zavod nomini kiriting (masalan: Angren Rezina):");
  if(z && z.trim()){
    if(!zavodTurlari.includes(z.trim())){
      zavodTurlari.push(z.trim());
      localStorage.setItem('rezZavodTurlari', JSON.stringify(zavodTurlari));
      loadZavodlarSelect();
    } else {
      alert("Bu zavod allaqachon mavjud!");
    }
  }
}
loadZavodlarSelect();

// Ombor hisob
function omborBylTur(tur){
  const kir=kirimlar.filter(k=>k.tur===tur).reduce((s,k)=>s+k.kg,0);
  const sot=sotuvlar.filter(s=>s.tur===tur).reduce((s,x)=>s+x.kg,0);
  return kir-sot;
}
function omborJami(){return kirimlar.reduce((s,k)=>s+k.kg,0)-sotuvlar.reduce((s,x)=>s+x.kg,0);}
function avgKirNarx(tur){const k=kirimlar.filter(x=>x.tur===tur);return k.length?Math.round(k.reduce((s,x)=>s+x.narx,0)/k.length):0;}

// DASHBOARD
function renderDashboard(){
  const sYil = sotuvlar.filter(s=>s.sana && s.sana.startsWith(new Date().getFullYear().toString()));
  const sotKg=sYil.reduce((s,x)=>s+x.kg,0);const daromad=sYil.reduce((s,x)=>s+x.jami,0);
  const xarajat=sYil.reduce((s,x)=>s+x.kg*x.kirNarx,0);const foyda=daromad-xarajat;
  document.getElementById('dOmbor').textContent=omborJami().toLocaleString();
  document.getElementById('dSotildi').textContent=sotKg.toLocaleString();
  document.getElementById('dDaromad').textContent=daromad.toLocaleString();
  document.getElementById('dFoyda').textContent=foyda.toLocaleString();

  // Ombor panel
  const turlar=rezinaTurlari;
  const jami=omborJami()||1;
  document.getElementById('rezOmborPanel').innerHTML=`<div style="text-align:center;margin-bottom:12px;"><div style="font-size:36px;font-weight:700;color:var(--primary);">${omborJami().toLocaleString()} dona</div><div style="font-size:13px;color:var(--text-muted);">Jami ombor</div></div>`;
  document.getElementById('rezTurPanel').innerHTML=turlar.map(t=>{const q=omborBylTur(t);const pct=Math.round(q/jami*100)||0;return q?`<div class="prog-wrap"><div class="prog-label"><span>${t}</span><span style="font-weight:700;">${q.toLocaleString()} dona</span></div><div class="prog-bg"><div class="prog-fill" style="width:${pct}%;background:var(--primary)"></div></div></div>`:''}).join('');

  // So'nggi ops
  const ops=[...kirimlar.map(k=>({...k,tip:'kirim'})),...sotuvlar.map(s=>({...s,tip:'sotuv'}))].sort((a,b)=>b.sana.localeCompare(a.sana)).slice(0,6);
  document.getElementById('lastOps').innerHTML=ops.map(o=>`<div style="display:flex;align-items:center;gap:10px;padding:8px 0;border-bottom:1px solid var(--border);">
    <div style="width:32px;height:32px;border-radius:50%;background:${o.tip==='kirim'?'var(--info-light)':'var(--success-light)'};display:flex;align-items:center;justify-content:center;font-size:14px;">${o.tip==='kirim'?'📥':'🛒'}</div>
    <div style="flex:1;"><div style="font-size:13px;font-weight:600;">${o.tip==='kirim'?o.zavod:o.mijoz}</div><div style="font-size:11px;color:var(--text-muted);">${o.sana} · ${o.tur} · ${o.kg} dona</div></div>
    <div style="font-weight:700;color:${o.tip==='kirim'?'var(--danger)':'var(--primary)'};">${o.tip==='kirim'?'-':'+'}${o.jami.toLocaleString()}</div>
  </div>`).join('');
}

// KIRIM
function renderKirim(){
  const jKg=kirimlar.reduce((s,k)=>s+k.kg,0);
  const jSum=kirimlar.reduce((s,k)=>s+k.jami,0);
  const jQarz=kirimlar.reduce((s,k)=>s+Math.max(0, k.jami-(parseFloat(k.tolangan)||0)),0);
  document.getElementById('kStKg').textContent=jKg.toLocaleString();
  document.getElementById('kStSum').textContent=jSum.toLocaleString();
  document.getElementById('kStQarz').textContent=jQarz.toLocaleString();
  document.getElementById('kirimBody').innerHTML=[...kirimlar].reverse().map((k,i)=>{
    const qarz = Math.max(0, k.jami - (parseFloat(k.tolangan)||0));
    const isPaid = (k.tolov==='tolangan' || qarz===0);
    return `<tr>
      <td>${i+1}</td><td>${k.sana}</td><td>${k.zavod}</td><td>${k.tur}</td>
      <td><b>${k.kg.toLocaleString()} dona</b></td><td>${k.narx.toLocaleString()}</td>
      <td><b>${k.jami.toLocaleString()}</b></td>
      <td>${isPaid?'<span class="badge green">✅ To\'langan</span>':`<span class="badge red">📋 Qarz: ${qarz.toLocaleString()}</span>`}</td>
      <td style="display:flex;gap:4px">
        ${!isPaid?`<button class="btn btn-sm btn-primary" onclick="tolovKirim('${k.id}', ${qarz})">💳 To'lash</button>`:''}
        <button class="btn btn-sm btn-danger" onclick="deleteKirim('${k.id}')">🗑</button>
      </td>
    </tr>`;
  }).join('');
}

function calcKm(){const kg=parseFloat(document.getElementById('kmKg').value)||0;const narx=parseSum('kmNarx');document.getElementById('kmJami').value=kg*narx?(kg*narx).toLocaleString()+' so\'m':'';}

async function saveKirim(){
  const zavod=document.getElementById('kmZavod').value;const tur=document.getElementById('kmTur').value;
  const kg=parseFloat(document.getElementById('kmKg').value)||0;const narx=parseSum('kmNarx');
  if(!kg||!narx){alert('Miqdor va narxni kiriting!');return;}
  const sana=document.getElementById('kmSana').value;const oy=parseInt(sana.split('-')[1])||(new Date().getMonth()+1);
  await API.post('/rezina/kirimlar', {
    sana, oy, zavod, tur, kg, narx, jami: kg*narx, tolov: document.getElementById('kmTolov').value, izoh: document.getElementById('kmIzoh').value
  });
  closeModal('kirimModal'); initRezina();
}

async function tolovKirim(id, qarzSumma) {
  const sum = prompt(`Zavodga to'lanayotgan summani kiriting (Qolgan qarz: ${qarzSumma.toLocaleString()} so'm):`, qarzSumma);
  if(!sum) return;
  const miqdor = parseFloat(sum.replace(/,/g, ''));
  if(isNaN(miqdor) || miqdor <= 0) return alert('Noto\'g\'ri summa kiritildi!');
  
  if(!confirm(`Zavodga qarz uchun ${miqdor.toLocaleString()} so'm to'langanini tasdiqlaysizmi?`)) return;
  try {
    await API.put('/rezina/kirimlar/' + id, { tolov_summa: miqdor });
    initRezina();
  } catch(e) { alert(e.message); }
}

async function deleteKirim(id){if(!confirm('O\'chirishni tasdiqlaysizmi?'))return; await API.del('/rezina/kirimlar/'+id); initRezina();}

// SOTUV
function renderSotuv(){
  const sYil = sotuvlar.filter(s=>s.sana && s.sana.startsWith(new Date().getFullYear().toString()));
  document.getElementById('sStKg').textContent=sYil.reduce((s,x)=>s+x.kg,0).toLocaleString();
  document.getElementById('sStSum').textContent=sYil.reduce((s,x)=>s+x.jami,0).toLocaleString();
  document.getElementById('sStQarz').textContent=sotuvlar.filter(s=>s.holat==='qarz').reduce((s,x)=>s+x.jami,0).toLocaleString();
  document.getElementById('sotuvBody').innerHTML=[...sotuvlar].reverse().map((s,i)=>`<tr>
    <td>${i+1}</td><td>${s.sana}</td><td><b>${s.mijoz}</b></td><td>${s.tur}</td>
    <td>${s.kg.toLocaleString()} dona</td><td>${s.narx.toLocaleString()}</td>
    <td><b>${s.jami.toLocaleString()}</b></td>
    <td>${{naqd:'Naqd',bank:'Bank',qarz:'Qarz'}[s.tolov]}</td>
    <td>${s.holat==='tolandi'?'<span class="badge green">✅ To\'landi</span>':'<span class="badge red">💳 Qarz</span>'}</td>
    <td>${s.holat==='qarz'?`<button class="btn btn-sm btn-primary" onclick="sotuvTola('${s.id}')">✅</button>`:''}
    <button class="btn btn-sm btn-danger" onclick="deleteSotuv('${s.id}')">🗑</button></td>
  </tr>`).join('');
}

function smTurTanlash(){const tur=document.getElementById('smTur').value;const q=omborBylTur(tur);document.getElementById('smOmbor').value=q.toLocaleString()+' dona';calcSm();}
function calcSm(){
  const kg=parseFloat(document.getElementById('smKg').value)||0;const narx=parseSum('smNarx');
  const tur=document.getElementById('smTur').value;const kirNarx=avgKirNarx(tur);
  document.getElementById('smJami').value=kg*narx?(kg*narx).toLocaleString()+' so\'m':'';
  const foyda=(narx-kirNarx)*kg;
  document.getElementById('smFoyda').value=foyda?(foyda>0?'+':'')+foyda.toLocaleString()+' so\'m':'';
}

async function saveSotuv(){
  const mijoz=document.getElementById('smMijoz').value.trim();const tur=document.getElementById('smTur').value;
  const kg=parseFloat(document.getElementById('smKg').value)||0;const narx=parseSum('smNarx');
  if(!mijoz){alert('Mijoz nomini kiriting!');return;}
  if(!kg||!narx){alert('Miqdor va narxni kiriting!');return;}
  if(kg>omborBylTur(tur)){alert('Omborda yetarli rezina yo\'q!');return;}
  const sana=document.getElementById('smSana').value;const oy=parseInt(sana.split('-')[1])||(new Date().getMonth()+1);
  const tolov=document.getElementById('smTolov').value;
  
  await API.post('/rezina/sotuvlar', {
    sana, oy, mijoz, tur, kg, narx, jami: kg*narx, tolov, holat: tolov==='qarz'?'qarz':'tolandi', kir_narx: avgKirNarx(tur)
  });
  closeModal('sotuvModal'); initRezina();
}
async function sotuvTola(id){ await API.put('/rezina/sotuvlar/'+id, { tolov: 'tolandi' }); initRezina();}
async function deleteSotuv(id){if(!confirm('O\'chirishni tasdiqlaysizmi?'))return; await API.del('/rezina/sotuvlar/'+id); initRezina();}

// HISOBOT
function renderHisobot(){
  const oy=parseInt(document.getElementById('hisobotOy').value)||(new Date().getMonth()+1);
  const oyNom={1:'Yanvar',2:'Fevral',3:'Mart',4:'Aprel',5:'May',6:'Iyun',7:'Iyul',8:'Avgust',9:'Sentabr',10:'Oktabr',11:'Noyabr',12:'Dekabr'};
  document.getElementById('hisobotTitle').textContent=`${oyNom[oy]} ${new Date().getFullYear()} — Foyda hisobi`;
  const kOy=kirimlar.filter(k=>k.oy===oy);const sOy=sotuvlar.filter(s=>s.oy===oy);
  const xarajat=kOy.reduce((s,k)=>s+k.jami,0);const daromad=sOy.reduce((s,x)=>s+x.jami,0);
  const foyda=sOy.reduce((s,x)=>s+(x.narx-x.kirNarx)*x.kg,0);
  document.getElementById('foydaBox').innerHTML=`
    <div class="foyda-row"><span style="color:var(--text-muted)">Kirim xarajati:</span><span style="color:var(--danger);font-weight:600;">${xarajat.toLocaleString()} so'm</span></div>
    <div class="foyda-row"><span style="color:var(--text-muted)">Sotuv daromadi:</span><span style="color:var(--primary);font-weight:600;">${daromad.toLocaleString()} so'm</span></div>
    <div class="foyda-row"><span style="color:var(--text-muted)">Kirim dona:</span><span style="font-weight:600;">${kOy.reduce((s,k)=>s+k.kg,0).toLocaleString()} dona</span></div>
    <div class="foyda-row"><span style="color:var(--text-muted)">Sotuv dona:</span><span style="font-weight:600;">${sOy.reduce((s,x)=>s+x.kg,0).toLocaleString()} dona</span></div>
    <div class="foyda-row total"><span>SOF FOYDA:</span><span style="color:${foyda>=0?'var(--primary)':'var(--danger)'};">${foyda.toLocaleString()} so'm</span></div>
    <div class="foyda-row" style="border:none;padding-top:2px;"><span style="color:var(--text-muted);font-size:12px;">Rentabellik:</span><span style="font-weight:700;color:var(--primary);">${daromad?Math.round(foyda/daromad*100):0}%</span></div>`;

  const turlar=rezinaTurlari;
  const maxFoyda=Math.max(...turlar.map(t=>sOy.filter(s=>s.tur===t).reduce((s,x)=>s+(x.narx-x.kirNarx)*x.kg,0)),1);
  document.getElementById('turFoydaChart').innerHTML=turlar.map(t=>{
    const tf=sOy.filter(s=>s.tur===t).reduce((s,x)=>s+(x.narx-x.kirNarx)*x.kg,0);
    const pct=Math.round(tf/maxFoyda*100)||0;
    return `<div class="prog-wrap"><div class="prog-label"><span>${t}</span><span style="font-weight:700;">${tf.toLocaleString()} so'm</span></div><div class="prog-bg"><div class="prog-fill" style="width:${pct}%;background:var(--primary)"></div></div></div>`;
  }).join('');

  const rows=[
    {nomi:'Kirim (dona)',[1]:kirimlar.filter(k=>k.oy===1).reduce((s,k)=>s+k.kg,0),[2]:kirimlar.filter(k=>k.oy===2).reduce((s,k)=>s+k.kg,0),[3]:kirimlar.filter(k=>k.oy===3).reduce((s,k)=>s+k.kg,0)},
    {nomi:'Sotuv (dona)',[1]:sotuvlar.filter(s=>s.oy===1).reduce((s,x)=>s+x.kg,0),[2]:sotuvlar.filter(s=>s.oy===2).reduce((s,x)=>s+x.kg,0),[3]:sotuvlar.filter(s=>s.oy===3).reduce((s,x)=>s+x.kg,0)},
    {nomi:'Daromad (so\'m)',[1]:sotuvlar.filter(s=>s.oy===1).reduce((s,x)=>s+x.jami,0),[2]:sotuvlar.filter(s=>s.oy===2).reduce((s,x)=>s+x.jami,0),[3]:sotuvlar.filter(s=>s.oy===3).reduce((s,x)=>s+x.jami,0)},
    {nomi:'Sof foyda (so\'m)',[1]:sotuvlar.filter(s=>s.oy===1).reduce((s,x)=>s+(x.narx-x.kirNarx)*x.kg,0),[2]:sotuvlar.filter(s=>s.oy===2).reduce((s,x)=>s+(x.narx-x.kirNarx)*x.kg,0),[3]:sotuvlar.filter(s=>s.oy===3).reduce((s,x)=>s+(x.narx-x.kirNarx)*x.kg,0)},
  ];
  document.getElementById('oyTaqqos').innerHTML=rows.map(r=>`<tr><td><b>${r.nomi}</b></td><td>${r[1].toLocaleString()}</td><td>${r[2].toLocaleString()}</td><td style="font-weight:700;color:var(--primary);">${r[3].toLocaleString()}</td></tr>`).join('');
}

function exportHisobot(){
  const oy=parseInt(document.getElementById('hisobotOy').value)||(new Date().getMonth()+1);
  const sOy=sotuvlar.filter(s=>s.oy===oy);
  let csv='Sana,Mijoz,Tur,Dona,Narx,Jami,Foyda\n';
  sOy.forEach(s=>{csv+=`${s.sana},"${s.mijoz}",${s.tur},${s.kg},${s.narx},${s.jami},${(s.narx-s.kirNarx)*s.kg}\n`;});
  const a=document.createElement('a');a.href='data:text/csv;charset=utf-8,\uFEFF'+encodeURIComponent(csv);a.download='RezinaDilerlik.csv';a.click();
}

function switchTab(id,btn){
  document.querySelectorAll('.tab').forEach(t=>t.classList.remove('active'));
  document.querySelectorAll('.page').forEach(p=>p.classList.remove('active'));
  btn.classList.add('active');document.getElementById('tab-'+id).classList.add('active');
  if(id==='kirim')renderKirim();if(id==='sotuv')renderSotuv();if(id==='hisobot')renderHisobot();
}
function openModal(id){
  document.getElementById(id).classList.add('open');
  if(id==='sotuvModal') smTurTanlash();
}
function closeModal(id){document.getElementById(id).classList.remove('open');}
document.querySelectorAll('.modal-overlay').forEach(m=>m.addEventListener('click',e=>{if(e.target===m)m.classList.remove('open');}));
initRezina();
