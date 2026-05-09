import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, ActivityIndicator, Alert, FlatList, Modal } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from 'expo-router';
import { API } from '@/utils/api';
import { fmt, fmtSana, fmtInput, parseNum, isInDateRange, today, weekStart, monthStart } from '@/utils/format';

export default function XomAshyoScreen() {
  const [tab, setTab] = useState<'asosiy' | 'kirim' | 'jurnal' | 'yetkazuvchilar'>('asosiy');
  const [loading, setLoading] = useState(true);
  const [kirimlar, setKirimlar] = useState<any[]>([]);
  const [yetkazuvchilar, setYetkazuvchilar] = useState<any[]>([]);
  const [xomTolovlar, setXomTolovlar] = useState<any[]>([]);

  // Kirim form
  const [fYetkazuvchi, setFYetkazuvchi] = useState('');
  const [fTur, setFTur] = useState('');
  const [fKg, setFKg] = useState('');
  const [fNarx, setFNarx] = useState('');
  const [fTolov, setFTolov] = useState<'naqd' | 'qarz' | 'aralash'>('qarz');
  const [fNaqdSumma, setFNaqdSumma] = useState('');
  const [saving, setSaving] = useState(false);

  // Yangi yetkazuvchi modal
  const [yetModal, setYetModal] = useState(false);
  const [yetNomi, setYetNomi] = useState('');
  const [yetTel, setYetTel] = useState('');
  const [yetSaving, setYetSaving] = useState(false);

  // Yetkazuvchilar filtri
  const [yetFilter, setYetFilter] = useState<'barchasi' | 'qarz' | 'haq'>('barchasi');

  // To'lov modal
  const [tolovModal, setTolovModal] = useState(false);
  const [tYet, setTYet] = useState<any>(null);
  const [tSumma, setTSumma] = useState('');
  const [tIzoh, setTIzoh] = useState('');
  const [tSaving, setTSaving] = useState(false);

  // Sverka modal
  const [svModal, setSvModal] = useState(false);
  const [svYet, setSvYet] = useState<any>(null);
  const [svFrom, setSvFrom] = useState('');
  const [svTo, setSvTo] = useState('');

  const load = async () => {
    try {
      const [kRes, yRes, tRes] = await Promise.all([
        API.get('/xom-ashyo').catch(() => []),
        API.get('/yetkazuvchilar').catch(() => []),
        API.get('/xom-tolovlar').catch(() => []),
      ]);
      setKirimlar(Array.isArray(kRes) ? kRes : []);
      setYetkazuvchilar(Array.isArray(yRes) ? yRes : []);
      setXomTolovlar(Array.isArray(tRes) ? tRes : []);
    } catch (e) {} finally { setLoading(false); }
  };

  useFocusEffect(useCallback(() => { load(); }, []));

  const getYetQarz = (nomi: string) => {
    const kirim = kirimlar.filter(k => k.yetkazuvchi === nomi).reduce((s, k) => s + (Number(k.jami) || 0), 0);
    const tolov = xomTolovlar.filter(t => t.mijoz === nomi).reduce((s, t) => s + (Number(t.summa) || 0), 0);
    const naqd = kirimlar.filter(k => k.yetkazuvchi === nomi).reduce((s, k) => {
      if (k.tolov === 'naqd') return s + (Number(k.jami) || 0);
      if (k.tolov === 'aralash') return s + (Number(k.naqdSumma) || 0);
      return s;
    }, 0);
    return kirim - naqd - tolov;
  };

  // Statistikalar
  const jamiKirim = kirimlar.reduce((s, k) => s + (Number(k.jami) || 0), 0);
  const jamiKg = kirimlar.reduce((s, k) => s + (Number(k.kg) || 0), 0);
  const jamiNaqd = kirimlar.reduce((s, k) => {
    if (k.tolov === 'naqd') return s + (Number(k.jami) || 0);
    if (k.tolov === 'aralash') return s + (Number(k.naqdSumma) || 0);
    return s;
  }, 0);
  const jamiQarz = yetkazuvchilar.reduce((s, y) => s + Math.max(0, getYetQarz(y.nomi)), 0);
  const jamiTolov = xomTolovlar.reduce((s, t) => s + (Number(t.summa) || 0), 0);

  const handleSave = async () => {
    const rawKg = parseNum(fKg);
    const rawNarx = parseNum(fNarx);
    if (!fYetkazuvchi || !fTur || !rawKg || !rawNarx) return Alert.alert('Xato', 'Barcha maydonlarni to\'ldiring');
    setSaving(true);
    try {
      await API.post('/xom-ashyo', {
        sana: new Date().toISOString().split('T')[0],
        oy: new Date().getMonth() + 1,
        yetkazuvchi: fYetkazuvchi, tur: fTur,
        kg: parseFloat(rawKg), narx: parseFloat(rawNarx),
        jami: parseFloat(rawKg) * parseFloat(rawNarx),
        tolov: fTolov,
        naqdSumma: fTolov === 'aralash' ? parseFloat(parseNum(fNaqdSumma)) || 0 : undefined
      });
      Alert.alert('✅', 'Kirim saqlandi!');
      setFKg(''); setFNarx('');
      load();
    } catch (e: any) { Alert.alert('Xato', e.message); } finally { setSaving(false); }
  };

  const handleAddYet = async () => {
    if (!yetNomi.trim()) return Alert.alert('Xato', 'Ism kiriting!');
    setYetSaving(true);
    try {
      await API.post('/yetkazuvchilar', { nomi: yetNomi.trim(), tel: yetTel.trim() });
      Alert.alert('✅', `${yetNomi} qo'shildi!`);
      setYetNomi(''); setYetTel(''); setYetModal(false);
      load();
    } catch (e: any) { Alert.alert('Xato', e.message); } finally { setYetSaving(false); }
  };

  const handleTolov = async () => {
    const rawSumma = parseNum(tSumma);
    if (!rawSumma || Number(rawSumma) <= 0) return Alert.alert('Xato', 'Summa kiriting');
    setTSaving(true);
    try {
      await API.post('/xom-tolovlar', {
        sana: new Date().toISOString().split('T')[0],
        mijoz: tYet.nomi,
        summa: Number(rawSumma),
        izoh: tIzoh || 'Tolandi'
      });
      Alert.alert('✅', 'To\'lov qabul qilindi');
      setTolovModal(false); setTSumma(''); setTIzoh(''); setTYet(null);
      load();
    } catch (e: any) { Alert.alert('Xato', e.message); } finally { setTSaving(false); }
  };

  if (loading) return <View style={[s.container, { justifyContent: 'center', alignItems: 'center' }]}><ActivityIndicator size="large" color="#3B82F6" /></View>;

  return (
    <View style={s.container}>
      {/* Tabs */}
      <View style={s.tabs}>
        {(['asosiy', 'kirim', 'jurnal', 'yetkazuvchilar'] as const).map(t => (
          <TouchableOpacity key={t} style={[s.tab, tab === t && s.tabActive]} onPress={() => setTab(t)}>
            <Text style={[s.tabText, tab === t && s.tabTextActive]}>
              {t === 'asosiy' ? '📊' : t === 'kirim' ? '📦' : t === 'jurnal' ? '📋' : '👤'}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* ASOSIY — Statistika */}
      {tab === 'asosiy' && (
        <ScrollView style={s.pad}>
          <Text style={s.cardTitle}>Xom ashyo hisobi</Text>
          <View style={{ gap: 10 }}>
            <View style={[s.statCard, { borderLeftColor: '#3B82F6' }]}>
              <Text style={s.statLabel}>Jami kirim (xarid)</Text>
              <Text style={[s.statVal, { color: '#3B82F6' }]}>{fmt(jamiKirim)} so'm</Text>
              <Text style={s.statSub}>{fmt(jamiKg)} kg • {kirimlar.length} ta kirim</Text>
            </View>
            <View style={[s.statCard, { borderLeftColor: '#10B981' }]}>
              <Text style={s.statLabel}>Naqd to'langan</Text>
              <Text style={[s.statVal, { color: '#10B981' }]}>{fmt(jamiNaqd)} so'm</Text>
            </View>
            <View style={[s.statCard, { borderLeftColor: '#F59E0B' }]}>
              <Text style={s.statLabel}>Yetkazuvchilarga to'langan</Text>
              <Text style={[s.statVal, { color: '#F59E0B' }]}>{fmt(jamiTolov)} so'm</Text>
            </View>
            <View style={[s.statCard, { borderLeftColor: '#EF4444' }]}>
              <Text style={s.statLabel}>Yetkazuvchilarga qarzim</Text>
              <Text style={[s.statVal, { color: '#EF4444' }]}>{fmt(jamiQarz)} so'm</Text>
              <Text style={s.statSub}>{yetkazuvchilar.filter(y => getYetQarz(y.nomi) > 0).length} ta yetkazuvchiga</Text>
            </View>
          </View>

          <Text style={[s.cardTitle, { marginTop: 20 }]}>Yetkazuvchilar qarz holati</Text>
          {yetkazuvchilar.map((y, i) => {
            const q = getYetQarz(y.nomi);
            return (
              <View key={i} style={s.listItem}>
                <View style={[s.avatar, { backgroundColor: q > 0 ? '#7F1D1D' : '#064E3B' }]}>
                  <Text style={{ color: '#FFF', fontWeight: '800' }}>{y.nomi?.charAt(0)}</Text>
                </View>
                <View style={{ flex: 1, marginLeft: 12 }}>
                  <Text style={s.listTitle}>{y.nomi}</Text>
                </View>
                <Text style={{ fontSize: 16, fontWeight: '800', color: q > 0 ? '#EF4444' : '#10B981' }}>
                  {q > 0 ? fmt(q) : '0 ✅'}
                </Text>
              </View>
            );
          })}
          <View style={{ height: 30 }} />
        </ScrollView>
      )}

      {tab === 'kirim' && (
        <ScrollView style={s.pad} showsVerticalScrollIndicator={false}>
          <View style={s.card}>
            <Text style={s.cardTitle}>Yangi xom ashyo kirimi</Text>
            <Text style={s.label}>Yetkazuvchi</Text>
            <TextInput style={s.input} value={fYetkazuvchi} onChangeText={setFYetkazuvchi} placeholder="Ism yozing yoki tanlang" placeholderTextColor="#475569" />
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginTop: 8, marginBottom: 14 }}>
              {yetkazuvchilar.map((y, i) => (
                <TouchableOpacity key={i} style={[s.chip, fYetkazuvchi === y.nomi && s.chipActive]} onPress={() => setFYetkazuvchi(y.nomi)}>
                  <Text style={[s.chipText, fYetkazuvchi === y.nomi && s.chipTextActive]}>{y.nomi}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
            <Text style={s.label}>Xom ashyo turi</Text>
            <TextInput style={s.input} value={fTur} onChangeText={setFTur} placeholder="qora, rangli, rezina" placeholderTextColor="#475569" />
            <View style={{ flexDirection: 'row', gap: 12, marginTop: 14 }}>
              <View style={{ flex: 1 }}><Text style={s.label}>Kg</Text><TextInput style={s.input} value={fKg} onChangeText={v => setFKg(fmtInput(v))} keyboardType="numeric" placeholder="0" placeholderTextColor="#475569" /></View>
              <View style={{ flex: 1 }}><Text style={s.label}>Narx</Text><TextInput style={s.input} value={fNarx} onChangeText={v => setFNarx(fmtInput(v))} keyboardType="numeric" placeholder="0" placeholderTextColor="#475569" /></View>
            </View>
            {fKg && fNarx ? <View style={s.totalRow}><Text style={s.totalLabel}>Jami:</Text><Text style={s.totalVal}>{fmt(parseFloat(parseNum(fKg)) * parseFloat(parseNum(fNarx)))} so'm</Text></View> : null}
            <Text style={[s.label, { marginTop: 14 }]}>To'lov turi</Text>
            <View style={{ flexDirection: 'row', gap: 10 }}>
              <TouchableOpacity style={[s.tolovBtn, fTolov === 'naqd' && { backgroundColor: '#059669', borderColor: '#059669' }]} onPress={() => setFTolov('naqd')}><Text style={[s.tolovText, fTolov === 'naqd' && { color: '#FFF' }]}>💵 Naqd</Text></TouchableOpacity>
              <TouchableOpacity style={[s.tolovBtn, fTolov === 'aralash' && { backgroundColor: '#D97706', borderColor: '#D97706' }]} onPress={() => setFTolov('aralash')}><Text style={[s.tolovText, fTolov === 'aralash' && { color: '#FFF' }]}>🔀 Aralash</Text></TouchableOpacity>
              <TouchableOpacity style={[s.tolovBtn, fTolov === 'qarz' && { backgroundColor: '#DC2626', borderColor: '#DC2626' }]} onPress={() => setFTolov('qarz')}><Text style={[s.tolovText, fTolov === 'qarz' && { color: '#FFF' }]}>📋 Qarz</Text></TouchableOpacity>
            </View>
            {fTolov === 'aralash' && (
              <View style={{ marginTop: 14 }}>
                <Text style={s.label}>Naqd to'langan summa (so'm)</Text>
                <TextInput style={s.input} value={fNaqdSumma} onChangeText={v => setFNaqdSumma(fmtInput(v))} keyboardType="numeric" placeholder="0" placeholderTextColor="#475569" />
              </View>
            )}
            <TouchableOpacity style={[s.saveBtn, saving && { opacity: 0.6 }]} onPress={handleSave} disabled={saving}>
              {saving ? <ActivityIndicator color="#FFF" /> : <Text style={s.saveBtnText}>Saqlash</Text>}
            </TouchableOpacity>
          </View>
          <View style={{ height: 30 }} />
        </ScrollView>
      )}

      {tab === 'jurnal' && (
        <FlatList data={kirimlar} keyExtractor={(item, i) => String(item.id || item._id || i)} contentContainerStyle={s.pad}
          renderItem={({ item }) => (
            <View style={s.listItem}>
              <View style={{ flex: 1 }}>
                <Text style={s.listTitle}>{item.yetkazuvchi}</Text>
                <Text style={s.listSub}>{item.tur} • {fmtSana(item.sana)}</Text>
              </View>
              <View style={{ alignItems: 'flex-end' }}>
                <Text style={{ color: '#34D399', fontWeight: '700' }}>+{fmt(item.kg)} kg</Text>
                <Text style={{ color: '#94A3B8', fontSize: 12 }}>{fmt(item.jami)} so'm</Text>
                <View style={[s.badge, { backgroundColor: item.tolov === 'naqd' ? '#064E3B' : '#7F1D1D' }]}>
                  <Text style={{ color: item.tolov === 'naqd' ? '#34D399' : '#F87171', fontSize: 11, fontWeight: '600' }}>{item.tolov === 'naqd' ? 'Naqd' : 'Qarz'}</Text>
                </View>
              </View>
            </View>
          )}
          ListEmptyComponent={<View style={s.empty}><Text style={s.emptyText}>Kirimlar yo'q</Text></View>}
        />
      )}

      {tab === 'yetkazuvchilar' && (
        <>
          <View style={{ flexDirection: 'row', alignItems: 'center', padding: 16, paddingBottom: 0, gap: 10 }}>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }}>
              <TouchableOpacity style={[s.filterBtn, yetFilter === 'barchasi' && s.filterBtnActive]} onPress={() => setYetFilter('barchasi')}>
                <Text style={[s.filterText, yetFilter === 'barchasi' && s.filterTextActive]}>Barchasi{'\n'}<Text style={{ fontSize: 11, fontWeight: 'normal' }}>{yetkazuvchilar.length} ta</Text></Text>
              </TouchableOpacity>
              <TouchableOpacity style={[s.filterBtn, yetFilter === 'qarz' && s.filterBtnActive]} onPress={() => setYetFilter('qarz')}>
                <Text style={[s.filterText, yetFilter === 'qarz' && s.filterTextActive]}>Bizning qarz{'\n'}<Text style={{ fontSize: 11, fontWeight: 'normal' }}>{fmt(yetkazuvchilar.reduce((s, y) => s + Math.max(0, getYetQarz(y.nomi)), 0))} so'm</Text></Text>
              </TouchableOpacity>
              <TouchableOpacity style={[s.filterBtn, yetFilter === 'haq' && s.filterBtnActive]} onPress={() => setYetFilter('haq')}>
                <Text style={[s.filterText, yetFilter === 'haq' && s.filterTextActive]}>Haqimiz (Avans){'\n'}<Text style={{ fontSize: 11, fontWeight: 'normal' }}>{fmt(Math.abs(yetkazuvchilar.reduce((s, y) => s + Math.min(0, getYetQarz(y.nomi)), 0)))} so'm</Text></Text>
              </TouchableOpacity>
            </ScrollView>
            <TouchableOpacity style={s.smallAddBtn} onPress={() => setYetModal(true)}>
              <Ionicons name="person-add" size={20} color="#FFF" />
            </TouchableOpacity>
          </View>

          <FlatList 
            data={yetkazuvchilar.filter(y => {
              const q = getYetQarz(y.nomi);
              if (yetFilter === 'qarz') return q > 0;
              if (yetFilter === 'haq') return q < 0;
              return true;
            })} 
            keyExtractor={(item, i) => String(item.id || item._id || i)} 
            contentContainerStyle={s.pad}
            renderItem={({ item }) => {
              const qarz = getYetQarz(item.nomi);
              return (
                <TouchableOpacity style={s.listItem} onPress={() => { setSvYet(item); setSvModal(true); setSvFrom(''); setSvTo(''); }}>
                  <View style={[s.avatar, { backgroundColor: qarz > 0 ? '#7F1D1D' : (qarz < 0 ? '#064E3B' : '#334155') }]}><Text style={{ color: '#FFF', fontWeight: '800', fontSize: 16 }}>{item.nomi?.charAt(0)}</Text></View>
                  <View style={{ flex: 1, marginLeft: 12 }}>
                    <Text style={s.listTitle}>{item.nomi}</Text>
                    <Text style={s.listSub}>{item.tel || ''}</Text>
                  </View>
                  <View style={{ alignItems: 'flex-end', marginRight: 10 }}>
                    <Text style={{ fontSize: 12, color: '#64748B' }}>{qarz > 0 ? 'Qarzim:' : qarz < 0 ? 'Haqim:' : 'Balans:'}</Text>
                    <Text style={{ fontSize: 15, fontWeight: '800', color: qarz > 0 ? '#EF4444' : qarz < 0 ? '#10B981' : '#94A3B8' }}>{qarz === 0 ? '0 ✅' : fmt(Math.abs(qarz))}</Text>
                  </View>
                  <TouchableOpacity style={s.payAction} onPress={() => { setTYet(item); setTolovModal(true); }}>
                    <Ionicons name="card" size={20} color="#FFF" />
                  </TouchableOpacity>
                </TouchableOpacity>
              );
            }}
            ListEmptyComponent={<View style={s.empty}><Text style={s.emptyText}>Ma'lumot topilmadi</Text></View>}
          />
        </>
      )}

      {/* Yangi yetkazuvchi modal */}
      <Modal visible={yetModal} animationType="slide" transparent>
        <View style={s.modalBg}><View style={s.modalCard}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 16 }}>
            <Text style={s.cardTitle}>Yangi yetkazuvchi</Text>
            <TouchableOpacity onPress={() => setYetModal(false)}><Ionicons name="close" size={24} color="#94A3B8" /></TouchableOpacity>
          </View>
          <Text style={s.label}>Ism / Firma</Text>
          <TextInput style={s.input} value={yetNomi} onChangeText={setYetNomi} placeholder="Masalan: Abdulla aka" placeholderTextColor="#475569" />
          <Text style={[s.label, { marginTop: 14 }]}>Telefon</Text>
          <TextInput style={s.input} value={yetTel} onChangeText={setYetTel} placeholder="+998..." placeholderTextColor="#475569" keyboardType="phone-pad" />
          <TouchableOpacity style={[s.saveBtn, yetSaving && { opacity: 0.6 }]} onPress={handleAddYet} disabled={yetSaving}>
            {yetSaving ? <ActivityIndicator color="#FFF" /> : <Text style={s.saveBtnText}>Qo'shish</Text>}
          </TouchableOpacity>
        </View></View>
      </Modal>

      {/* To'lov modal */}
      <Modal visible={tolovModal} animationType="slide" transparent>
        <View style={s.modalBg}><View style={s.modalCard}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 16 }}>
            <View>
              <Text style={s.cardTitle}>To'lov qilish</Text>
              <Text style={{ color: '#94A3B8', fontSize: 13 }}>{tYet?.nomi} ga to'lov</Text>
            </View>
            <TouchableOpacity onPress={() => setTolovModal(false)}><Ionicons name="close" size={24} color="#94A3B8" /></TouchableOpacity>
          </View>
          <Text style={s.label}>Summa (so'm)</Text>
          <TextInput style={s.input} value={tSumma} onChangeText={v => setTSumma(fmtInput(v))} placeholder="Masalan: 1.000.000" keyboardType="numeric" placeholderTextColor="#475569" />
          <Text style={[s.label, { marginTop: 14 }]}>Izoh</Text>
          <TextInput style={s.input} value={tIzoh} onChangeText={setTIzoh} placeholder="Plastik, naqd..." placeholderTextColor="#475569" />
          <TouchableOpacity style={[s.saveBtn, { backgroundColor: '#10B981' }, tSaving && { opacity: 0.6 }]} onPress={handleTolov} disabled={tSaving}>
            {tSaving ? <ActivityIndicator color="#FFF" /> : <Text style={s.saveBtnText}>To'lovni tasdiqlash</Text>}
          </TouchableOpacity>
        </View></View>
      </Modal>

      {/* Sverka Modal */}
      <Modal visible={svModal} animationType="slide" transparent>
        <View style={[s.modalBg, { justifyContent: 'flex-start', paddingTop: 60 }]}>
          <View style={[s.modalCard, { flex: 1, borderTopLeftRadius: 24, borderTopRightRadius: 24 }]}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <Text style={s.cardTitle}>{svYet?.nomi} bilan Sverka</Text>
              <TouchableOpacity onPress={() => setSvModal(false)}><Ionicons name="close" size={28} color="#94A3B8" /></TouchableOpacity>
            </View>
            <View style={{ flexDirection: 'row', gap: 8, marginBottom: 16 }}>
              <TouchableOpacity style={s.svBtn} onPress={() => { setSvFrom(today()); setSvTo(today()); }}><Text style={s.svBtnText}>Bugun</Text></TouchableOpacity>
              <TouchableOpacity style={s.svBtn} onPress={() => { setSvFrom(weekStart()); setSvTo(today()); }}><Text style={s.svBtnText}>Hafta</Text></TouchableOpacity>
              <TouchableOpacity style={s.svBtn} onPress={() => { setSvFrom(monthStart()); setSvTo(today()); }}><Text style={s.svBtnText}>Oy</Text></TouchableOpacity>
              <TouchableOpacity style={s.svBtn} onPress={() => { setSvFrom(''); setSvTo(''); }}><Text style={s.svBtnText}>Barchasi</Text></TouchableOpacity>
            </View>
            <ScrollView showsVerticalScrollIndicator={false}>
              {kirimlar.filter(k => k.yetkazuvchi === svYet?.nomi && isInDateRange(k.sana, svFrom, svTo)).map((k, i) => (
                <View key={'k'+i} style={[s.listItem, { borderLeftWidth: 3, borderLeftColor: '#3B82F6' }]}>
                  <View style={{ flex: 1 }}>
                    <Text style={s.listTitle}>Xarid ({k.tur})</Text>
                    <Text style={s.listSub}>{fmtSana(k.sana)}</Text>
                  </View>
                  <View style={{ alignItems: 'flex-end' }}>
                    <Text style={{ color: '#3B82F6', fontWeight: '700' }}>+{fmt(k.jami)} so'm</Text>
                    <Text style={{ fontSize: 12, color: '#94A3B8' }}>{fmt(k.kg)} kg x {fmt(k.narx)}</Text>
                  </View>
                </View>
              ))}
              {xomTolovlar.filter(t => t.mijoz === svYet?.nomi && isInDateRange(t.sana, svFrom, svTo)).map((t, i) => (
                <View key={'t'+i} style={[s.listItem, { borderLeftWidth: 3, borderLeftColor: '#10B981' }]}>
                  <View style={{ flex: 1 }}>
                    <Text style={s.listTitle}>To'lov qildik</Text>
                    <Text style={s.listSub}>{fmtSana(t.sana)} • {t.izoh}</Text>
                  </View>
                  <Text style={{ color: '#10B981', fontWeight: '700' }}>-{fmt(t.summa)} so'm</Text>
                </View>
              ))}
              <View style={{ height: 40 }} />
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0F172A' },
  pad: { padding: 16 },
  tabs: { flexDirection: 'row', margin: 16, marginBottom: 0, backgroundColor: '#1E293B', borderRadius: 12, padding: 4 },
  tab: { flex: 1, paddingVertical: 10, alignItems: 'center', borderRadius: 8 },
  tabActive: { backgroundColor: '#334155' },
  tabText: { fontSize: 16 },
  tabTextActive: { color: '#F1F5F9' },
  card: { backgroundColor: '#1E293B', borderRadius: 16, padding: 20 },
  cardTitle: { fontSize: 18, fontWeight: '800', color: '#F1F5F9', marginBottom: 16 },
  label: { fontSize: 12, fontWeight: '600', color: '#94A3B8', marginBottom: 6, textTransform: 'uppercase', letterSpacing: 0.3 },
  input: { backgroundColor: '#0F172A', borderWidth: 1, borderColor: '#334155', borderRadius: 10, paddingHorizontal: 14, paddingVertical: 12, fontSize: 15, color: '#F1F5F9' },
  chip: { paddingHorizontal: 16, paddingVertical: 8, backgroundColor: '#334155', borderRadius: 20, marginRight: 8 },
  chipActive: { backgroundColor: '#2563EB' },
  chipText: { fontSize: 13, color: '#94A3B8', fontWeight: '500' },
  chipTextActive: { color: '#FFF' },
  totalRow: { flexDirection: 'row', justifyContent: 'space-between', backgroundColor: '#0F172A', borderRadius: 10, padding: 14, marginTop: 14 },
  totalLabel: { color: '#64748B', fontSize: 14, fontWeight: '600' },
  totalVal: { color: '#3B82F6', fontSize: 16, fontWeight: '800' },
  tolovBtn: { flex: 1, padding: 14, borderRadius: 10, alignItems: 'center', borderWidth: 1, borderColor: '#334155' },
  tolovText: { fontSize: 14, fontWeight: '600', color: '#94A3B8' },
  saveBtn: { backgroundColor: '#2563EB', paddingVertical: 16, borderRadius: 14, alignItems: 'center', marginTop: 20 },
  saveBtnText: { color: '#FFF', fontSize: 16, fontWeight: '700' },
  addBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: '#059669', marginHorizontal: 16, marginTop: 8, padding: 14, borderRadius: 12, gap: 6 },
  addBtnText: { color: '#FFF', fontSize: 15, fontWeight: '700' },
  statCard: { backgroundColor: '#1E293B', borderRadius: 14, padding: 16, borderLeftWidth: 4 },
  statLabel: { fontSize: 12, color: '#64748B', fontWeight: '600', textTransform: 'uppercase' },
  statVal: { fontSize: 22, fontWeight: '800', marginTop: 4 },
  statSub: { fontSize: 12, color: '#475569', marginTop: 2 },
  listItem: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#1E293B', padding: 14, borderRadius: 12, marginBottom: 8 },
  listTitle: { fontSize: 15, fontWeight: '600', color: '#E2E8F0' },
  listSub: { fontSize: 12, color: '#64748B', marginTop: 2 },
  badge: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 6, marginTop: 4 },
  avatar: { width: 42, height: 42, borderRadius: 12, justifyContent: 'center', alignItems: 'center' },
  empty: { padding: 40, alignItems: 'center' },
  emptyText: { color: '#475569', fontSize: 14 },
  modalBg: { flex: 1, backgroundColor: 'rgba(0,0,0,0.7)', justifyContent: 'flex-end' },
  modalCard: { backgroundColor: '#1E293B', borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24, paddingBottom: 40 },
  filterBtn: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 12, backgroundColor: '#334155', minWidth: 100, alignItems: 'center' },
  filterBtnActive: { backgroundColor: '#3B82F6' },
  filterText: { fontSize: 13, fontWeight: '600', color: '#94A3B8', textAlign: 'center' },
  filterTextActive: { color: '#FFF' },
  smallAddBtn: { backgroundColor: '#10B981', width: 40, height: 40, borderRadius: 20, justifyContent: 'center', alignItems: 'center' },
  payAction: { width: 40, height: 40, backgroundColor: '#10B981', borderRadius: 20, justifyContent: 'center', alignItems: 'center', marginLeft: 10 },
  svBtn: { flex: 1, paddingVertical: 8, backgroundColor: '#334155', borderRadius: 8, alignItems: 'center' },
  svBtnText: { color: '#E2E8F0', fontSize: 12, fontWeight: '600' },
});
