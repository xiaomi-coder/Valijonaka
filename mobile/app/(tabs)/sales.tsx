import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, ActivityIndicator, Alert, FlatList, Modal } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from 'expo-router';
import { API } from '@/utils/api';
import { fmt, fmtSana, fmtInput, parseNum, isInDateRange, today, weekStart, monthStart } from '@/utils/format';

export default function SalesScreen() {
  const [tab, setTab] = useState<'asosiy' | 'yangi' | 'tarix' | 'qarz' | 'mijozlar'>('asosiy');
  const [loading, setLoading] = useState(true);
  const [sotuvlar, setSotuvlar] = useState<any[]>([]);
  const [mijozlar, setMijozlar] = useState<any[]>([]);
  const [mahsulotlar, setMahsulotlar] = useState<any[]>([]);

  // Yangi sotuv
  const [selMijoz, setSelMijoz] = useState<any>(null);
  const [cart, setCart] = useState<any[]>([]);
  const [prodNomi, setProdNomi] = useState('');
  const [kg, setKg] = useState('');
  const [narx, setNarx] = useState('');
  const [tolovTuri, setTolovTuri] = useState<'naqd' | 'qarz' | 'aralash'>('qarz');
  const [naqdSumma, setNaqdSumma] = useState('');
  const [saving, setSaving] = useState(false);

  // To'lov modal
  const [tolovModal, setTolovModal] = useState(false);
  const [tolovSotuv, setTolovSotuv] = useState<any>(null);
  const [tolovSumma, setTolovSumma] = useState('');

  // Yangi mijoz modal
  const [mijozModal, setMijozModal] = useState(false);
  const [mNomi, setMNomi] = useState('');
  const [mTel, setMTel] = useState('');
  const [mSaving, setMSaving] = useState(false);

  // Yangi mahsulot modal
  const [mahModal, setMahModal] = useState(false);
  const [mahNomi, setMahNomi] = useState('');
  const [mahNarx, setMahNarx] = useState('');
  const [mahSaving, setMahSaving] = useState(false);

  // Sverka modal (mijoz bo'yicha tarix)
  const [sverkaModal, setSverkaModal] = useState(false);
  const [svMijoz, setSvMijoz] = useState<any>(null);
  const [svFrom, setSvFrom] = useState('');
  const [svTo, setSvTo] = useState('');

  // Mijozlar bo'limi filtri va tolov
  const [mFilter, setMFilter] = useState<'barchasi' | 'qarz' | 'haq'>('barchasi');
  const [mTolovModal, setMTolovModal] = useState(false);
  const [mTolovMijoz, setMTolovMijoz] = useState<any>(null);
  const [mTolovSumma, setMTolovSumma] = useState('');
  const [mTSaving, setMTSaving] = useState(false);

  const load = async () => {
    try {
      const [sRes, mRes, pRes] = await Promise.all([
        API.get('/sotuvlar').catch(() => []),
        API.get('/mijozlar').catch(() => []),
        API.get('/mahsulotlar').catch(() => []),
      ]);
      setSotuvlar(Array.isArray(sRes) ? sRes : []);
      setMijozlar(Array.isArray(mRes) ? mRes : []);
      setMahsulotlar(Array.isArray(pRes) ? pRes : []);
    } catch (e) {} finally { setLoading(false); }
  };

  useFocusEffect(useCallback(() => { load(); }, []));


  const addToCart = () => {
    const rKg = parseNum(kg);
    const rNarx = parseNum(narx);
    if (!prodNomi.trim() || !rKg || !rNarx) return Alert.alert('Xato', 'Mahsulot nomi, kg va narxni kiriting');
    const p = mahsulotlar.find(x => (x.nomi || x.nom || '').toLowerCase() === prodNomi.trim().toLowerCase());
    setCart([...cart, {
      prodId: p ? String(p.id || p._id) : null,
      nomi: prodNomi.trim(),
      kg: parseFloat(rKg),
      narx: parseFloat(rNarx),
      mahsulotId: p?.id || p?._id || null
    }]);
    setProdNomi(''); setKg(''); setNarx('');
  };

  const removeFromCart = (index: number) => {
    setCart(cart.filter((_, i) => i !== index));
  };

  const saveSotuv = async () => {
    if (!selMijoz) return Alert.alert('Xato', 'Mijoz tanlang!');
    if (cart.length === 0) return Alert.alert('Xato', 'Savatga mahsulot qo\'shing!');
    setSaving(true);
    try {
      const totalKg = cart.reduce((s, i) => s + i.kg, 0);
      const summa = cart.reduce((s, i) => s + i.kg * i.narx, 0);
      let tolangan = 0;
      let qarz = 0;
      let holat = 'qarz';

      if (tolovTuri === 'naqd') {
        tolangan = summa;
        qarz = 0;
        holat = 'tolandi';
      } else if (tolovTuri === 'aralash') {
        tolangan = parseFloat(parseNum(naqdSumma)) || 0;
        qarz = Math.max(0, summa - tolangan);
        holat = qarz > 0 ? 'qarz' : 'tolandi';
      } else {
        tolangan = 0;
        qarz = summa;
        holat = 'qarz';
      }

      await API.post('/sotuvlar', {
        sana: new Date().toISOString().split('T')[0],
        mijoz_id: selMijoz.id || selMijoz._id,
        summa, qarz, tolangan, holat,
        cart, tolovTuri, totalKg,
        chegirma: 0, izoh: ''
      });
      Alert.alert('✅', 'Sotuv saqlandi!');
      setCart([]); setSelMijoz(null); setNaqdSumma('');
      load(); setTab('tarix');
    } catch (e: any) { Alert.alert('Xato', e.message); } finally { setSaving(false); }
  };

  const handleTolov = async () => {
    const rawSum = parseNum(tolovSumma);
    if (!rawSum || parseFloat(rawSum) <= 0) return Alert.alert('Xato', 'Summa kiriting!');
    try {
      await API.put(`/sotuvlar/${tolovSotuv.id}/tolov`, { summa: parseFloat(rawSum) });
      Alert.alert('✅', 'To\'lov saqlandi!');
      setTolovModal(false); setTolovSumma(''); setTolovSotuv(null);
      load();
    } catch (e: any) { Alert.alert('Xato', e.message); }
  };

  // Yangi mijoz qo'shish
  const handleAddMijoz = async () => {
    if (!mNomi.trim()) return Alert.alert('Xato', 'Mijoz ismini kiriting!');
    setMSaving(true);
    try {
      const res = await API.post('/mijozlar', { nomi: mNomi.trim(), tel: mTel.trim(), turi: 'oddiy' });
      Alert.alert('✅', `${mNomi} qo'shildi!`);
      setMNomi(''); setMTel(''); setMijozModal(false);
      load();
      // Yangi mijozni avtomatik tanlash
      if (res) setSelMijoz(res);
    } catch (e: any) { Alert.alert('Xato', e.message); } finally { setMSaving(false); }
  };

  // Yangi mahsulot qo'shish
  const handleAddMah = async () => {
    if (!mahNomi.trim()) return Alert.alert('Xato', 'Mahsulot nomini kiriting!');
    setMahSaving(true);
    try {
      await API.post('/mahsulotlar', { nomi: mahNomi.trim(), narx: parseFloat(parseNum(mahNarx)) || 0, ombor: 0, min: 0 });
      Alert.alert('✅', `${mahNomi} qo'shildi!`);
      setProdNomi(mahNomi.trim());
      setMahNomi(''); setMahNarx(''); setMahModal(false);
      load();
    } catch (e: any) { Alert.alert('Xato', e.message); } finally { setMahSaving(false); }
  };

  const handleMijozTolov = async () => {
    const rawSum = parseNum(mTolovSumma);
    if (!rawSum || parseFloat(rawSum) <= 0) return Alert.alert('Xato', 'Summa kiriting!');
    setMTSaving(true);
    try {
      await API.put(`/mijozlar/${mTolovMijoz.id || mTolovMijoz._id}/tolov`, { summa: parseFloat(rawSum) });
      Alert.alert('✅', 'To\'lov qabul qilindi!');
      setMTolovModal(false); setMTolovSumma(''); setMTolovMijoz(null);
      load();
    } catch (e: any) { Alert.alert('Xato', e.message); } finally { setMTSaving(false); }
  };

  if (loading) return <View style={[st.container, { justifyContent: 'center', alignItems: 'center' }]}><ActivityIndicator size="large" color="#3B82F6" /></View>;

  return (
    <View style={st.container}>
      {/* Tabs */}
      <View style={st.tabs}>
        {(['asosiy', 'yangi', 'mijozlar', 'tarix'] as const).map(t => (
          <TouchableOpacity key={t} style={[st.tab, tab === t && st.tabActive]} onPress={() => setTab(t)}>
            <Text style={[st.tabText, tab === t && st.tabTextActive]}>
              {t === 'asosiy' ? '📊' : t === 'yangi' ? '🛒' : t === 'mijozlar' ? '👥' : '📋'}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* ASOSIY — Statistika */}
      {tab === 'asosiy' && (
        <ScrollView style={st.pad}>
          <Text style={st.cardTitle}>Sotuvlar hisobi</Text>
          <View style={{ gap: 10 }}>
            <View style={[st.statCard, { borderLeftColor: '#3B82F6' }]}>
              <Text style={st.statLabel}>Jami sotuvlar</Text>
              <Text style={[st.statVal, { color: '#3B82F6' }]}>{fmt(sotuvlar.reduce((s, x) => s + (Number(x.summa) || 0), 0))} so'm</Text>
              <Text style={st.statSub}>{sotuvlar.length} ta sotuv</Text>
            </View>
            <View style={[st.statCard, { borderLeftColor: '#10B981' }]}>
              <Text style={st.statLabel}>Naqd to'langan</Text>
              <Text style={[st.statVal, { color: '#10B981' }]}>{fmt(sotuvlar.reduce((s, x) => s + (Number(x.tolangan) || 0), 0))} so'm</Text>
            </View>
            <View style={[st.statCard, { borderLeftColor: '#EF4444' }]}>
              <Text style={st.statLabel}>Mijozlar qarzi (menga)</Text>
              <Text style={[st.statVal, { color: '#EF4444' }]}>{fmt(sotuvlar.reduce((s, x) => s + (Number(x.qarz) || 0), 0))} so'm</Text>
              <Text style={st.statSub}>{sotuvlar.filter(x => (Number(x.qarz) || 0) > 0).length} ta qarzli sotuv</Text>
            </View>
            <View style={[st.statCard, { borderLeftColor: '#F59E0B' }]}>
              <Text style={st.statLabel}>Mijozlar</Text>
              <Text style={[st.statVal, { color: '#F59E0B' }]}>{mijozlar.length} ta</Text>
              <Text style={st.statSub}>{mijozlar.filter(m => (Number(m.qarz) || 0) > 0).length} ta qarzdor</Text>
            </View>
          </View>

          <Text style={[st.cardTitle, { marginTop: 20 }]}>Qarzdor mijozlar</Text>
          {mijozlar.filter(m => (Number(m.qarz) || 0) > 0).map((m, i) => (
            <View key={i} style={st.listItem}>
              <View style={[st.avatarSmall, { backgroundColor: '#7F1D1D' }]}><Text style={{ color: '#FFF', fontWeight: '800' }}>{m.nomi?.charAt(0)}</Text></View>
              <View style={{ flex: 1, marginLeft: 12 }}><Text style={st.listTitle}>{m.nomi}</Text></View>
              <Text style={{ fontSize: 16, fontWeight: '800', color: '#EF4444' }}>{fmt(m.qarz)}</Text>
            </View>
          ))}
          {mijozlar.filter(m => (Number(m.qarz) || 0) > 0).length === 0 && <View style={st.empty}><Text style={st.emptyText}>Qarzdor yo'q 🎉</Text></View>}
          <View style={{ height: 30 }} />
        </ScrollView>
      )}

      {tab === 'yangi' && (
        <ScrollView style={st.pad} showsVerticalScrollIndicator={false}>
          <View style={st.card}>
            <Text style={st.cardTitle}>Yangi sotuv</Text>

            {/* Mijoz tanlash */}
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
              <Text style={st.label}>Mijoz</Text>
              <TouchableOpacity onPress={() => setMijozModal(true)} style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                <Ionicons name="add-circle" size={18} color="#3B82F6" />
                <Text style={{ color: '#3B82F6', fontSize: 13, fontWeight: '600' }}>Yangi mijoz</Text>
              </TouchableOpacity>
            </View>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 6 }}>
              {mijozlar.map((m, i) => (
                <TouchableOpacity key={i} style={[st.chip, selMijoz?.nomi === m.nomi && st.chipActive]} onPress={() => setSelMijoz(m)}>
                  <Text style={[st.chipText, selMijoz?.nomi === m.nomi && st.chipTextActive]}>{m.nomi}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
            {selMijoz && <Text style={{ color: '#3B82F6', fontSize: 13, marginBottom: 12, fontWeight: '600' }}>✅ {selMijoz.nomi}</Text>}

            {/* Mahsulot */}
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
              <Text style={st.label}>Mahsulot nomi</Text>
              <TouchableOpacity onPress={() => setMahModal(true)} style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                <Ionicons name="add-circle" size={18} color="#059669" />
                <Text style={{ color: '#059669', fontSize: 13, fontWeight: '600' }}>Yangi mahsulot</Text>
              </TouchableOpacity>
            </View>
            <TextInput style={[st.input, { marginBottom: 8 }]} value={prodNomi} onChangeText={setProdNomi} placeholder="Mahsulot nomini yozing yoki tanlang" placeholderTextColor="#475569" />
            {mahsulotlar.length > 0 && (
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 12 }}>
                {mahsulotlar.map((m, i) => (
                  <TouchableOpacity key={i} style={[st.chip, prodNomi === (m.nomi || m.nom) && { backgroundColor: '#059669' }]} onPress={() => setProdNomi(m.nomi || m.nom)}>
                    <Text style={[st.chipText, prodNomi === (m.nomi || m.nom) && { color: '#FFF' }]}>{m.nomi || m.nom}</Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            )}

            <View style={{ flexDirection: 'row', gap: 10 }}>
              <View style={{ flex: 1 }}>
                <Text style={st.label}>Miqdor (kg)</Text>
                <TextInput style={st.input} value={kg} onChangeText={v => setKg(fmtInput(v))} placeholder="0" keyboardType="numeric" placeholderTextColor="#475569" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={st.label}>Narx (so'm/kg)</Text>
                <TextInput style={st.input} value={narx} onChangeText={v => setNarx(fmtInput(v))} placeholder="0" keyboardType="numeric" placeholderTextColor="#475569" />
              </View>
            </View>

            {prodNomi && kg && narx ? (
              <View style={[st.totalRow, { marginTop: 12 }]}>
                <Text style={st.totalLabel}>{prodNomi}:</Text>
                <Text style={st.totalVal}>{fmt(parseFloat(parseNum(kg) || '0') * parseFloat(parseNum(narx) || '0'))} so'm</Text>
              </View>
            ) : null}

            <TouchableOpacity style={[st.addItemBtn, { marginTop: 14 }]} onPress={addToCart}>
              <Ionicons name="add-circle" size={20} color="#FFF" />
              <Text style={{ color: '#FFF', fontWeight: '700', fontSize: 15, marginLeft: 6 }}>Savatga qo'shish</Text>
            </TouchableOpacity>
          </View>

          {/* Savat */}
          <View style={[st.card, { marginTop: 12 }]}>
            <Text style={st.cardTitle}>Savat ({cart.length})</Text>
            {cart.map((c, i) => (
              <View key={i} style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 10, borderBottomWidth: 1, borderColor: '#334155' }}>
                <View style={{ flex: 1 }}>
                  <Text style={{ color: '#E2E8F0', fontWeight: '600' }}>{c.nomi}</Text>
                  <Text style={{ color: '#64748B', fontSize: 12 }}>{c.kg} kg × {fmt(c.narx)}</Text>
                </View>
                <Text style={{ color: '#3B82F6', fontWeight: '800', fontSize: 15, marginRight: 12 }}>{fmt(c.kg * c.narx)}</Text>
                <TouchableOpacity onPress={() => removeFromCart(i)} style={{ padding: 4 }}>
                  <Ionicons name="trash-outline" size={18} color="#EF4444" />
                </TouchableOpacity>
              </View>
            ))}
            {cart.length > 0 && (
              <>
                <View style={[st.totalRow, { marginTop: 12 }]}>
                  <Text style={st.totalLabel}>JAMI:</Text>
                  <Text style={st.totalVal}>{fmt(cart.reduce((s, i) => s + i.kg * i.narx, 0))} so'm</Text>
                </View>

                <Text style={[st.label, { marginTop: 14 }]}>To'lov turi</Text>
                <View style={{ flexDirection: 'row', gap: 8 }}>
                  <TouchableOpacity style={[st.tolovBtn, tolovTuri === 'naqd' && { backgroundColor: '#059669', borderColor: '#059669' }]} onPress={() => { setTolovTuri('naqd'); setNaqdSumma(''); }}>
                    <Text style={[st.tolovText, tolovTuri === 'naqd' && { color: '#FFF' }]}>💵 Naqd</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={[st.tolovBtn, tolovTuri === 'aralash' && { backgroundColor: '#D97706', borderColor: '#D97706' }]} onPress={() => setTolovTuri('aralash')}>
                    <Text style={[st.tolovText, tolovTuri === 'aralash' && { color: '#FFF' }]}>🔀 Aralash</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={[st.tolovBtn, tolovTuri === 'qarz' && { backgroundColor: '#DC2626', borderColor: '#DC2626' }]} onPress={() => { setTolovTuri('qarz'); setNaqdSumma(''); }}>
                    <Text style={[st.tolovText, tolovTuri === 'qarz' && { color: '#FFF' }]}>📋 Qarz</Text>
                  </TouchableOpacity>
                </View>

                {tolovTuri === 'aralash' && (() => {
                  const jami = cart.reduce((s, i) => s + i.kg * i.narx, 0);
                  const naqd = parseFloat(parseNum(naqdSumma)) || 0;
                  const qoldiq = Math.max(0, jami - naqd);
                  return (
                    <View style={{ marginTop: 12 }}>
                      <Text style={st.label}>Naqd to'lagan summa</Text>
                      <TextInput style={st.input} value={naqdSumma} onChangeText={v => setNaqdSumma(fmtInput(v))} keyboardType="numeric" placeholder="Mijoz qancha naqd berdi?" placeholderTextColor="#475569" />
                      {naqd > 0 && (
                        <View style={[st.totalRow, { marginTop: 10 }]}>
                          <View>
                            <Text style={{ color: '#10B981', fontWeight: '700' }}>Naqd: {fmt(naqd)}</Text>
                            <Text style={{ color: '#EF4444', fontWeight: '700', marginTop: 4 }}>Qarz: {fmt(qoldiq)}</Text>
                          </View>
                          <Text style={{ color: '#3B82F6', fontWeight: '800', fontSize: 16 }}>Jami: {fmt(jami)}</Text>
                        </View>
                      )}
                    </View>
                  );
                })()}

                <TouchableOpacity style={[st.saveBtn, saving && { opacity: 0.6 }]} onPress={saveSotuv} disabled={saving}>
                  {saving ? <ActivityIndicator color="#FFF" /> : <Text style={st.saveBtnText}>Sotuvni saqlash</Text>}
                </TouchableOpacity>
              </>
            )}
          </View>
          <View style={{ height: 30 }} />
        </ScrollView>
      )}

      {tab === 'tarix' && (
        <FlatList
          data={sotuvlar}
          keyExtractor={(item, i) => String(item.id || i)}
          contentContainerStyle={st.pad}
          refreshing={loading}
          onRefresh={load}
          renderItem={({ item }) => {
            const isDebt = (item.qarz || 0) > 0;
            return (
              <View style={st.listItem}>
                <View style={{ flex: 1 }}>
                  <Text style={st.listTitle}>{item.mijoz_nomi || 'Mijoz'}</Text>
                  <Text style={st.listSub}>{fmtSana(item.sana)} • {item.totalKg || item.total_kg || 0} kg</Text>
                </View>
                <View style={{ alignItems: 'flex-end' }}>
                  <Text style={{ color: '#E2E8F0', fontWeight: '700' }}>{fmt(item.summa)}</Text>
                  {isDebt && (
                    <TouchableOpacity onPress={() => { setTolovSotuv(item); setTolovModal(true); }}>
                      <Text style={{ color: '#EF4444', fontSize: 12, fontWeight: '700' }}>Qarz: {fmt(item.qarz)} →</Text>
                    </TouchableOpacity>
                  )}
                  {!isDebt && <Text style={{ color: '#10B981', fontSize: 12, fontWeight: '600' }}>To'langan ✅</Text>}
                </View>
              </View>
            );
          }}
          ListEmptyComponent={<View style={st.empty}><Text style={st.emptyText}>Sotuvlar yo'q</Text></View>}
        />
      )}



      {/* MIJOZLAR */}
      {tab === 'mijozlar' && (
        <>
          <View style={{ flexDirection: 'row', alignItems: 'center', padding: 16, paddingBottom: 0, gap: 10 }}>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }}>
              <TouchableOpacity style={[st.filterBtn, mFilter === 'barchasi' && st.filterBtnActive]} onPress={() => setMFilter('barchasi')}>
                <Text style={[st.filterText, mFilter === 'barchasi' && st.filterTextActive]}>Barchasi{'\n'}<Text style={{ fontSize: 11, fontWeight: 'normal' }}>{mijozlar.length} ta</Text></Text>
              </TouchableOpacity>
              <TouchableOpacity style={[st.filterBtn, mFilter === 'qarz' && st.filterBtnActive]} onPress={() => setMFilter('qarz')}>
                <Text style={[st.filterText, mFilter === 'qarz' && st.filterTextActive]}>Ularning qarzi{'\n'}<Text style={{ fontSize: 11, fontWeight: 'normal' }}>{fmt(mijozlar.reduce((s, m) => s + Math.max(0, Number(m.qarz) || 0), 0))} so'm</Text></Text>
              </TouchableOpacity>
              <TouchableOpacity style={[st.filterBtn, mFilter === 'haq' && st.filterBtnActive]} onPress={() => setMFilter('haq')}>
                <Text style={[st.filterText, mFilter === 'haq' && st.filterTextActive]}>Bizning qarz (Haq){'\n'}<Text style={{ fontSize: 11, fontWeight: 'normal' }}>{fmt(Math.abs(mijozlar.reduce((s, m) => s + Math.min(0, Number(m.qarz) || 0), 0)))} so'm</Text></Text>
              </TouchableOpacity>
            </ScrollView>
            <TouchableOpacity style={st.smallAddBtn} onPress={() => setMijozModal(true)}>
              <Ionicons name="person-add" size={20} color="#FFF" />
            </TouchableOpacity>
          </View>

          <FlatList
            data={mijozlar.filter(m => {
              const q = Number(m.qarz) || 0;
              if (mFilter === 'qarz') return q > 0;
              if (mFilter === 'haq') return q < 0;
              return true;
            })}
            keyExtractor={(item, i) => String(item.id || item._id || i)}
            contentContainerStyle={st.pad}
            renderItem={({ item }) => {
              const qarz = Number(item.qarz) || 0;
              const mSotuvlar = sotuvlar.filter(s => s.mijoz_id === (item.id || item._id) || s.mijoz_nomi === item.nomi);
              const jamiSotuv = mSotuvlar.reduce((s, x) => s + (Number(x.summa) || 0), 0);
              return (
                <TouchableOpacity style={st.listItem} onPress={() => { setSvMijoz(item); setSvFrom(''); setSvTo(''); setSverkaModal(true); }}>
                  <View style={[st.avatarSmall, { backgroundColor: qarz > 0 ? '#7F1D1D' : (qarz < 0 ? '#064E3B' : '#334155') }]}>
                    <Text style={{ color: '#FFF', fontWeight: '800', fontSize: 14 }}>{item.nomi?.charAt(0)}</Text>
                  </View>
                  <View style={{ flex: 1, marginLeft: 12 }}>
                    <Text style={st.listTitle}>{item.nomi}</Text>
                    <Text style={st.listSub}>{mSotuvlar.length} ta sotuv • Jami: {fmt(jamiSotuv)}</Text>
                  </View>
                  <View style={{ alignItems: 'flex-end', marginRight: 10 }}>
                    {qarz > 0 ? (
                      <Text style={{ fontSize: 16, fontWeight: '800', color: '#EF4444' }}>{fmt(qarz)}</Text>
                    ) : qarz < 0 ? (
                      <Text style={{ fontSize: 15, fontWeight: '800', color: '#10B981' }}>{fmt(Math.abs(qarz))}</Text>
                    ) : (
                      <Text style={{ fontSize: 13, fontWeight: '600', color: '#94A3B8' }}>0 ✅</Text>
                    )}
                    <Text style={{ color: '#64748B', fontSize: 11, marginTop: 2 }}>{qarz > 0 ? 'Qarzi:' : qarz < 0 ? 'Bizning qarz:' : 'Sverka →'}</Text>
                  </View>
                  <TouchableOpacity style={st.payAction} onPress={() => { setMTolovMijoz(item); setMTolovModal(true); }}>
                    <Ionicons name="card" size={20} color="#FFF" />
                  </TouchableOpacity>
                </TouchableOpacity>
              );
            }}
            ListEmptyComponent={<View style={st.empty}><Text style={st.emptyText}>Ma'lumot topilmadi</Text></View>}
          />
        </>
      )}

      {/* SVERKA MODAL — Mijoz bo'yicha tarix */}
      <Modal visible={sverkaModal} animationType="slide" transparent>
        <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.85)' }}>
          <View style={{ flex: 1, backgroundColor: '#0F172A', marginTop: 50, borderTopLeftRadius: 24, borderTopRightRadius: 24 }}>
            {/* Header */}
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20, borderBottomWidth: 1, borderColor: '#1E293B' }}>
              <View>
                <Text style={{ color: '#F1F5F9', fontSize: 20, fontWeight: '800' }}>{svMijoz?.nomi}</Text>
                <Text style={{ color: '#64748B', fontSize: 13 }}>Sverka • Sotuv tarixi</Text>
              </View>
              <TouchableOpacity onPress={() => setSverkaModal(false)} style={{ padding: 8, backgroundColor: '#1E293B', borderRadius: 10 }}>
                <Ionicons name="close" size={22} color="#94A3B8" />
              </TouchableOpacity>
            </View>

            {(() => {
              if (!svMijoz) return null;
              const mId = svMijoz.id || svMijoz._id;
              const allSales = sotuvlar.filter(s => s.mijoz_id === mId || s.mijoz_nomi === svMijoz.nomi);
              const filtered = allSales.filter(s => isInDateRange(s.sana || '', svFrom, svTo));
              const jamiSumma = filtered.reduce((s, x) => s + (Number(x.summa) || 0), 0);
              const jamiTolangan = filtered.reduce((s, x) => s + (Number(x.tolangan) || 0), 0);
              const currentQarz = Math.max(0, Number(svMijoz.qarz) || 0);
              const currentHaq = Math.max(0, -(Number(svMijoz.qarz) || 0));

              return (
                <>
                  {/* Statistikalar */}
                  <View style={{ padding: 16, gap: 8 }}>
                    <View style={{ flexDirection: 'row', gap: 8 }}>
                      <View style={[st.svStatCard, { borderLeftColor: '#3B82F6', flex: 1 }]}>
                        <Text style={st.svStatLabel}>Umumiy xarid summasi</Text>
                        <Text style={[st.svStatVal, { color: '#3B82F6' }]}>{fmt(jamiSumma)}</Text>
                      </View>
                      <View style={[st.svStatCard, { borderLeftColor: '#10B981', flex: 1 }]}>
                        <Text style={st.svStatLabel}>Naqd to'lagan summasi</Text>
                        <Text style={[st.svStatVal, { color: '#10B981' }]}>{fmt(jamiTolangan)}</Text>
                      </View>
                    </View>
                    <View style={{ flexDirection: 'row', gap: 8 }}>
                      <View style={[st.svStatCard, { borderLeftColor: '#EF4444', flex: 1 }]}>
                        <Text style={st.svStatLabel}>Joriy qarzi</Text>
                        <Text style={[st.svStatVal, { color: '#EF4444' }]}>{fmt(currentQarz)}</Text>
                      </View>
                      <View style={[st.svStatCard, { borderLeftColor: '#F59E0B', flex: 1 }]}>
                        <Text style={st.svStatLabel}>Joriy haqi (Avans)</Text>
                        <Text style={[st.svStatVal, { color: '#F59E0B' }]}>{fmt(currentHaq)}</Text>
                      </View>
                    </View>
                  </View>

                  {/* Tez filter tugmalari */}
                  <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ paddingHorizontal: 16, marginBottom: 6, maxHeight: 44 }} contentContainerStyle={{ alignItems: 'center' }}>
                    <TouchableOpacity style={[st.filterChip, !svFrom && !svTo && st.filterChipActive]} onPress={() => { setSvFrom(''); setSvTo(''); }}>
                      <Text style={[st.filterChipText, !svFrom && !svTo && { color: '#FFF' }]}>Barchasi</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={[st.filterChip, svFrom === today() && st.filterChipActive]} onPress={() => { setSvFrom(today()); setSvTo(today()); }}>
                      <Text style={[st.filterChipText, svFrom === today() && { color: '#FFF' }]}>Bugun</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={[st.filterChip, svFrom === weekStart() && svTo === today() && st.filterChipActive]} onPress={() => { setSvFrom(weekStart()); setSvTo(today()); }}>
                      <Text style={[st.filterChipText, svFrom === weekStart() && svTo === today() && { color: '#FFF' }]}>Bu hafta</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={[st.filterChip, svFrom === monthStart() && svTo === today() && st.filterChipActive]} onPress={() => { setSvFrom(monthStart()); setSvTo(today()); }}>
                      <Text style={[st.filterChipText, svFrom === monthStart() && svTo === today() && { color: '#FFF' }]}>Bu oy</Text>
                    </TouchableOpacity>
                  </ScrollView>

                  {/* Qo'lda sana kiritish */}
                  <View style={{ flexDirection: 'row', paddingHorizontal: 16, gap: 8, marginBottom: 8 }}>
                    <View style={{ flex: 1 }}>
                      <Text style={{ color: '#64748B', fontSize: 10, marginBottom: 4 }}>DAN</Text>
                      <TextInput style={[st.input, { paddingVertical: 10, fontSize: 13 }]} value={svFrom} onChangeText={setSvFrom} placeholder="2026-01-01" placeholderTextColor="#475569" />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={{ color: '#64748B', fontSize: 10, marginBottom: 4 }}>GACHA</Text>
                      <TextInput style={[st.input, { paddingVertical: 10, fontSize: 13 }]} value={svTo} onChangeText={setSvTo} placeholder="2026-12-31" placeholderTextColor="#475569" />
                    </View>
                  </View>

                  {/* Sotuvlar ro'yxati */}
                  <FlatList
                    data={filtered}
                    keyExtractor={(item, i) => String(item.id || i)}
                    contentContainerStyle={{ padding: 16 }}
                    renderItem={({ item }) => {
                      const isDebt = (Number(item.qarz) || 0) > 0;
                      return (
                        <View style={[st.listItem, isDebt && { borderLeftWidth: 3, borderLeftColor: '#EF4444' }]}>
                          <View style={{ flex: 1 }}>
                            <Text style={{ color: '#E2E8F0', fontWeight: '600' }}>{fmtSana(item.sana)} • {item.mahsulot_nomi || item.mahsulot || 'Mahsulot'}</Text>
                            <Text style={{ color: '#64748B', fontSize: 12 }}>{item.totalKg || item.total_kg || 0} kg</Text>
                          </View>
                          <View style={{ alignItems: 'flex-end' }}>
                            <Text style={{ color: '#E2E8F0', fontWeight: '700' }}>{fmt(item.summa)}</Text>
                            {isDebt ? (
                              <TouchableOpacity onPress={() => { setTolovSotuv(item); setTolovModal(true); }}>
                                <Text style={{ color: '#EF4444', fontSize: 12, fontWeight: '600' }}>Qarz: {fmt(item.qarz)} →</Text>
                              </TouchableOpacity>
                            ) : (
                              <Text style={{ color: '#10B981', fontSize: 12 }}>To'langan ✅</Text>
                            )}
                          </View>
                        </View>
                      );
                    }}
                    ListEmptyComponent={<View style={st.empty}><Text style={st.emptyText}>Sotuvlar yo'q</Text></View>}
                  />
                </>
              );
            })()}
          </View>
        </View>
      </Modal>

      {/* To'lov modal */}
      <Modal visible={tolovModal} animationType="slide" transparent>
        <View style={st.modalBg}>
          <View style={st.modalCard}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <Text style={st.cardTitle}>Qarz to'lash</Text>
              <TouchableOpacity onPress={() => setTolovModal(false)}><Ionicons name="close" size={24} color="#94A3B8" /></TouchableOpacity>
            </View>
            <Text style={{ color: '#94A3B8', marginBottom: 6 }}>Mijoz: {tolovSotuv?.mijoz_nomi}</Text>
            <Text style={{ color: '#EF4444', fontWeight: '700', fontSize: 18, marginBottom: 16 }}>Qarz: {fmt(tolovSotuv?.qarz)} so'm</Text>
            <TextInput style={st.input} value={tolovSumma} onChangeText={v => setTolovSumma(fmtInput(v))} keyboardType="numeric" placeholder="To'lov summasi" placeholderTextColor="#475569" />
            <TouchableOpacity style={st.saveBtn} onPress={handleTolov}>
              <Text style={st.saveBtnText}>To'lovni saqlash</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Yangi mijoz modal */}
      <Modal visible={mijozModal} animationType="slide" transparent>
        <View style={st.modalBg}>
          <View style={st.modalCard}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 16 }}>
              <Text style={st.cardTitle}>Yangi mijoz</Text>
              <TouchableOpacity onPress={() => setMijozModal(false)}><Ionicons name="close" size={24} color="#94A3B8" /></TouchableOpacity>
            </View>
            <Text style={st.label}>Ism / Firma nomi</Text>
            <TextInput style={st.input} value={mNomi} onChangeText={setMNomi} placeholder="Masalan: Ali aka" placeholderTextColor="#475569" />
            <Text style={[st.label, { marginTop: 14 }]}>Telefon</Text>
            <TextInput style={st.input} value={mTel} onChangeText={setMTel} placeholder="+998..." placeholderTextColor="#475569" keyboardType="phone-pad" />
            <TouchableOpacity style={[st.saveBtn, mSaving && { opacity: 0.6 }]} onPress={handleAddMijoz} disabled={mSaving}>
              {mSaving ? <ActivityIndicator color="#FFF" /> : <Text style={st.saveBtnText}>Qo'shish</Text>}
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Yangi mahsulot modal */}
      <Modal visible={mahModal} animationType="slide" transparent>
        <View style={st.modalBg}>
          <View style={st.modalCard}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 16 }}>
              <Text style={st.cardTitle}>Yangi mahsulot</Text>
              <TouchableOpacity onPress={() => setMahModal(false)}><Ionicons name="close" size={24} color="#94A3B8" /></TouchableOpacity>
            </View>
            <Text style={st.label}>Mahsulot nomi</Text>
            <TextInput style={st.input} value={mahNomi} onChangeText={setMahNomi} placeholder="Masalan: Qora plastmassa" placeholderTextColor="#475569" />
            <Text style={[st.label, { marginTop: 14 }]}>Narx (so'm/kg)</Text>
            <TextInput style={st.input} value={mahNarx} onChangeText={v => setMahNarx(fmtInput(v))} placeholder="0" keyboardType="numeric" placeholderTextColor="#475569" />
            <TouchableOpacity style={[st.saveBtn, mahSaving && { opacity: 0.6 }]} onPress={handleAddMah} disabled={mahSaving}>
              {mahSaving ? <ActivityIndicator color="#FFF" /> : <Text style={st.saveBtnText}>Qo'shish</Text>}
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
      {/* Mijozga to'lov qilish modal */}
      <Modal visible={mTolovModal} animationType="slide" transparent>
        <View style={st.modalBg}>
          <View style={st.modalCard}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 16 }}>
              <View>
                <Text style={st.cardTitle}>To'lov qabul qilish</Text>
                <Text style={{ color: '#94A3B8', fontSize: 13 }}>{mTolovMijoz?.nomi} dan to'lov</Text>
              </View>
              <TouchableOpacity onPress={() => setMTolovModal(false)}><Ionicons name="close" size={24} color="#94A3B8" /></TouchableOpacity>
            </View>
            <Text style={st.label}>Summa (so'm)</Text>
            <TextInput style={st.input} value={mTolovSumma} onChangeText={v => setMTolovSumma(fmtInput(v))} placeholder="Masalan: 1.000.000" keyboardType="numeric" placeholderTextColor="#475569" />
            <TouchableOpacity style={[st.saveBtn, { backgroundColor: '#10B981' }, mTSaving && { opacity: 0.6 }]} onPress={handleMijozTolov} disabled={mTSaving}>
              {mTSaving ? <ActivityIndicator color="#FFF" /> : <Text style={st.saveBtnText}>To'lovni tasdiqlash</Text>}
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

    </View>
  );
}

const st = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0F172A' },
  pad: { padding: 16 },
  tabs: { flexDirection: 'row', margin: 16, marginBottom: 0, backgroundColor: '#1E293B', borderRadius: 12, padding: 4 },
  tab: { flex: 1, paddingVertical: 10, alignItems: 'center', borderRadius: 8 },
  tabActive: { backgroundColor: '#334155' },
  tabText: { fontSize: 13, fontWeight: '600', color: '#64748B' },
  tabTextActive: { color: '#F1F5F9' },
  card: { backgroundColor: '#1E293B', borderRadius: 16, padding: 20 },
  cardTitle: { fontSize: 18, fontWeight: '800', color: '#F1F5F9', marginBottom: 16 },
  label: { fontSize: 12, fontWeight: '600', color: '#94A3B8', marginBottom: 6, textTransform: 'uppercase', letterSpacing: 0.3 },
  input: { backgroundColor: '#0F172A', borderWidth: 1, borderColor: '#334155', borderRadius: 10, paddingHorizontal: 14, paddingVertical: 12, fontSize: 15, color: '#F1F5F9' },
  chip: { paddingHorizontal: 16, paddingVertical: 8, backgroundColor: '#334155', borderRadius: 20, marginRight: 8 },
  chipActive: { backgroundColor: '#2563EB' },
  chipText: { fontSize: 13, color: '#94A3B8', fontWeight: '500' },
  chipTextActive: { color: '#FFF' },
  totalRow: { flexDirection: 'row', justifyContent: 'space-between', backgroundColor: '#0F172A', borderRadius: 10, padding: 14 },
  totalLabel: { color: '#64748B', fontSize: 14, fontWeight: '600' },
  totalVal: { color: '#3B82F6', fontSize: 16, fontWeight: '800' },
  tolovBtn: { flex: 1, padding: 14, borderRadius: 10, alignItems: 'center', borderWidth: 1, borderColor: '#334155' },
  tolovText: { fontSize: 14, fontWeight: '600', color: '#94A3B8' },
  addItemBtn: { backgroundColor: '#059669', paddingVertical: 14, borderRadius: 12, flexDirection: 'row', alignItems: 'center', justifyContent: 'center' },
  saveBtn: { backgroundColor: '#2563EB', paddingVertical: 16, borderRadius: 14, alignItems: 'center', marginTop: 20 },
  saveBtnText: { color: '#FFF', fontSize: 16, fontWeight: '700' },
  listItem: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#1E293B', padding: 14, borderRadius: 12, marginBottom: 8 },
  listTitle: { fontSize: 15, fontWeight: '600', color: '#E2E8F0' },
  listSub: { fontSize: 12, color: '#64748B', marginTop: 2 },
  empty: { padding: 40, alignItems: 'center' },
  emptyText: { color: '#475569', fontSize: 14 },
  statCard: { backgroundColor: '#1E293B', borderRadius: 14, padding: 16, borderLeftWidth: 4 },
  statLabel: { fontSize: 12, color: '#64748B', fontWeight: '600', textTransform: 'uppercase' },
  statVal: { fontSize: 22, fontWeight: '800', marginTop: 4 },
  statSub: { fontSize: 12, color: '#475569', marginTop: 2 },
  avatarSmall: { width: 36, height: 36, borderRadius: 10, justifyContent: 'center', alignItems: 'center' },
  addBtnGreen: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: '#059669', marginHorizontal: 16, marginTop: 8, padding: 14, borderRadius: 12 },
  svStatCard: { flex: 1, backgroundColor: '#1E293B', borderRadius: 12, padding: 12, borderLeftWidth: 3 },
  svStatLabel: { fontSize: 10, color: '#64748B', fontWeight: '600', textTransform: 'uppercase' },
  svStatVal: { fontSize: 16, fontWeight: '800', marginTop: 4 },
  filterChip: { paddingHorizontal: 14, height: 34, backgroundColor: '#1E293B', borderRadius: 17, marginRight: 8, borderWidth: 1, borderColor: '#334155', justifyContent: 'center', alignItems: 'center' },
  filterChipActive: { backgroundColor: '#2563EB', borderColor: '#2563EB' },
  filterChipText: { fontSize: 12, color: '#94A3B8', fontWeight: '600' },
  modalBg: { flex: 1, backgroundColor: 'rgba(0,0,0,0.7)', justifyContent: 'flex-end' },
  modalCard: { backgroundColor: '#1E293B', borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24, paddingBottom: 40 },
  filterBtn: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 12, backgroundColor: '#334155', minWidth: 100, alignItems: 'center' },
  filterBtnActive: { backgroundColor: '#3B82F6' },
  filterText: { fontSize: 13, fontWeight: '600', color: '#94A3B8', textAlign: 'center' },
  filterTextActive: { color: '#FFF' },
  smallAddBtn: { backgroundColor: '#10B981', width: 40, height: 40, borderRadius: 20, justifyContent: 'center', alignItems: 'center' },
  payAction: { width: 40, height: 40, backgroundColor: '#10B981', borderRadius: 20, justifyContent: 'center', alignItems: 'center', marginLeft: 10 },
});
