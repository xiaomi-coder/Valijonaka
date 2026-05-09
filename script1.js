window.print();window.close();<\\/script><script src="/api.js"><\\/script>
</body></html>`);
  win.document.close();
}

function printAndClose() { closeModal('successModal'); document.getElementById('chekContent').innerHTML = buildChekHTML(lastSotuv); openModal('chekModal'); }

function newSotuv() {
  closeModal('successModal');
  cart=[]; renderCart();
  document.getElementById('mijozSelect').value='';
  document.getElementById('chegirma').value='0';
  document.getElementById('izoh').value='';
  document.getElementById('mijozInfo').style.display='none';
  document.getElementById('mijozNarxBadge').innerHTML='';
  document.getElementById('sotuvSana').value = new Date().toISOString().split('T')[0];
  currentMijoz=null; lastSotuv=null;
  recalcTotal();
}

// ===== TARIX =====
function renderHistory(filter='', statusFilter='') {
  const body = document.getElementById('historyBody');
  const data = sotuvlar.filter(s=>{
    const mNomi = s.mijoz?.nomi || s.mijoz_nomi || '';
    const txt = (s.id + mNomi).toLowerCase();
    const sf = !statusFilter || s.holat===statusFilter;
    return txt.includes(filter.toLowerCase()) && sf;
  });

  // Stats
  const today = new Date().toISOString().split('T')[0];
  const bugun = sotuvlar.filter(s=>s.sana===today).reduce((a,s)=>a+s.summa,0);
  const oyJami = sotuvlar.reduce((a,s)=>a+s.summa,0);
  const qarzJami = sotuvlar.reduce((a,s)=>a+s.qarz,0);
  document.getElementById('statBugun').textContent = bugun.toLocaleString();
  document.getElementById('statOy').textContent = oyJami.toLocaleString();
  document.getElementById('statQarz').textContent = qarzJami.toLocaleString();

  if(!data.length){ body.innerHTML='<tr><td colspan="9" style="text-align:center;padding:24px;color:var(--text-muted)">Sotuvlar yo\'q</td></tr>'; return; }
  body.innerHTML = data.map(s=>{
    const holatBadge = {tolandi:'<span class="badge green">✅ To\'landi</span>',qarz:'<span class="badge red">💳 Qarz</span>',qisman:'<span class="badge amber">⚠️ Qisman</span>'}[s.holat];
    const prods = s.cart.map(i=>i.nomi.split(' ')[0]).join(', ');
    return `<tr>
      <td><b>${s.id}</b></td>
      <td>${s.sana}</td>
      <td>${s.mijoz?.nomi || s.mijoz_nomi}<br><small style="color:var(--text-muted)">${s.mijoz?.tur || s.mijoz_turi}</small></td>
      <td style="max-width:120px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${prods}</td>
      <td>${s.totalKg} kg</td>
      <td><b>${s.summa.toLocaleString()}</b></td>
      <td>{{tolov}}</td>
      <td>${holatBadge}</td>
      <td style="display:flex;gap:4px">
        <button class="btn btn-sm btn-secondary" onclick="showChekById('${s.id}')">🖨</button>
        ${s.qarz>0?`<button class="btn btn-sm btn-primary" onclick="tolovQabul('${s.id}')">💳</button>`:''}
      </td>
    </tr>`.replace('{{tolov}}', `<span style="font-size:11px;color:var(--text-muted)">${{naqd:'Naqd',bank:'Bank',qarz:'Qarz',aralash:'Aralash'}[s.tolovTuri]}</span>`);
  }).join('');
}
function filterHistory(v){ renderHistory(v); }
function filterHistoryStatus(v){ renderHistory('',v); }

function showChekById(id) {
  const s = sotuvlar.find(x=>x.id===id);
  if(!s) return;
  document.getElementById('chekContent').innerHTML = buildChekHTML(s);
  openModal('chekModal');
}

function tolovQabul(id) {
  const s = sotuvlar.find(x=>x.id===id);
  if(!s||!s.qarz) return;
  const summa = prompt(`Qabul qilingan summa (qarz: ${s.qarz.toLocaleString()} so'm):`);
  if(!summa) return;
  const miqdor = parseFloat(summa)||0;
  s.tolangan = parseFloat(s.tolangan||0) + miqdor; s.qarz = Math.max(0, s.qarz-miqdor);
  if(s.qarz===0) s.holat='tolandi';
  // API ga qo'shildiyu ulanmadi, shuning uchun faqat frontenddan o'chdi. Haqiqiy tolovni Mijozlar panelidan olasiz
  renderHistory();
  alert(`✅ ${miqdor.toLocaleString()} so'm qabul qilindi!`);
}

// ===== QARZ =====
function renderQarz() {
  const body = document.getElementById('qarzBody');
  const qarzdorlar = sotuvlar.filter(s=>s.qarz>0);
  if(!qarzdorlar.length){ body.innerHTML='<tr><td colspan="7" style="text-align:center;padding:24px;color:var(--text-muted)">✅ Qarzdor mijoz yo\'q!</td></tr>'; return; }
  body.innerHTML = qarzdorlar.map(s=>`
    <tr>
      <td><b>${s.mijoz?.nomi || s.mijoz_nomi}</b></td>
      <td><span class="badge ${s.mijoz_turi==='Zavod'?'blue':'green'}">${s.mijoz?.tur || s.mijoz_turi}</span></td>
      <td>${s.id}</td>
      <td>${s.sana}</td>
      <td style="color:var(--danger);font-weight:700">${s.qarz.toLocaleString()} so'm</td>
      <td><span class="badge amber">30 kun</span></td>
      <td><button class="btn btn-sm btn-primary" onclick="tolovQabul('${s.id}')">💳 To'lov qabul</button></td>
    </tr>`).join('');
}

// ===== STATISTIKA =====
function renderStat() {
  const count = sotuvlar.length;
  const sum = sotuvlar.reduce((a,s)=>a+s.summa,0);
  const qarzSum = sotuvlar.reduce((a,s)=>a+s.qarz,0);
  document.getElementById('statCount').textContent = count;
  document.getElementById('statSum').textContent = sum.toLocaleString();
  document.getElementById('statAvg').textContent = count ? Math.round(sum/count).toLocaleString() : '0';
  document.getElementById('statQarzSum').textContent = qarzSum.toLocaleString();
  document.getElementById('statQarz').textContent = qarzSum.toLocaleString();

  // Mijoz bo'yicha
  const mijozStat = {};
  sotuvlar.forEach(s=>{ const mn = s.mijoz?.nomi || s.mijoz_nomi || 'Noma\'lum'; if(!mijozStat[mn]) mijozStat[mn]={count:0,sum:0}; mijozStat[mn].count++; mijozStat[mn].sum+=s.summa; });
  document.getElementById('statMijozBody').innerHTML = Object.entries(mijozStat).sort((a,b)=>b[1].sum-a[1].sum).map(([nomi,d])=>`<tr><td>${nomi}</td><td>${d.count} ta</td><td><b>${d.sum.toLocaleString()}</b></td></tr>`).join('') || '<tr><td colspan="3" style="text-align:center;color:var(--text-muted);padding:16px">Ma\'lumot yo\'q</td></tr>';

  // Mahsulot bo'yicha
  const prodStat = {};
  sotuvlar.forEach(s=>s.cart.forEach(i=>{ if(!prodStat[i.nomi]) prodStat[i.nomi]={kg:0,sum:0}; prodStat[i.nomi].kg+=i.kg; prodStat[i.nomi].sum+=i.kg*i.narx; }));
  document.getElementById('statProdBody').innerHTML = Object.entries(prodStat).sort((a,b)=>b[1].sum-a[1].sum).map(([nomi,d])=>`<tr><td>${nomi}</td><td>${d.kg} kg</td><td><b>${d.sum.toLocaleString()}</b></td></tr>`).join('') || '<tr><td colspan="3" style="text-align:center;color:var(--text-muted);padding:16px">Ma\'lumot yo\'q</td></tr>';
}

// ===== MODAL =====
function openModal(id){ document.getElementById(id).classList.add('open'); }
function closeModal(id){ document.getElementById(id).classList.remove('open'); }
document.querySelectorAll('.modal-overlay').forEach(m=>m.addEventListener('click',e=>{if(e.target===m)m.classList.remove('open');}));
