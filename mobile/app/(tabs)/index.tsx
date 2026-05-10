import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, Alert, RefreshControl } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router, useFocusEffect } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { API } from '@/utils/api';
import { fmt, fmtSana } from '@/utils/format';

export default function DashboardScreen() {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [userName, setUserName] = useState('');
  const [mijozlar, setMijozlar] = useState<any[]>([]);
  const [sotuvlar, setSotuvlar] = useState<any[]>([]);
  const [kirimlar, setKirimlar] = useState<any[]>([]);
  const [yetkazuvchilar, setYetkazuvchilar] = useState<any[]>([]);
  const [xomTolovlar, setXomTolovlar] = useState<any[]>([]);
  const [omborMijozlar, setOmborMijozlar] = useState<any[]>([]);

  const load = async () => {
    try {
      const ud = await AsyncStorage.getItem('userData');
      if (ud) setUserName(JSON.parse(ud).ism || 'Admin');
      const [mRes, sRes, kRes, yRes, tRes, oMRes] = await Promise.all([
        API.get('/mijozlar').catch(() => []),
        API.get('/sotuvlar').catch(() => []),
        API.get('/xom-ashyo').catch(() => []),
        API.get('/yetkazuvchilar').catch(() => []),
        API.get('/xom-tolovlar').catch(() => []),
        API.get('/ombor_mijozlar').catch(() => []),
      ]);
      setMijozlar(Array.isArray(mRes) ? mRes : []);
      setSotuvlar(Array.isArray(sRes) ? sRes : []);
      setKirimlar(Array.isArray(kRes) ? kRes : []);
      setYetkazuvchilar(Array.isArray(yRes) ? yRes : []);
      setXomTolovlar(Array.isArray(tRes) ? tRes : []);
      setOmborMijozlar(Array.isArray(oMRes) ? oMRes : []);
    } catch (e) {
      console.log('Dashboard error', e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useFocusEffect(useCallback(() => { load(); }, []));

  const handleLogout = () => {
    Alert.alert('Chiqish', 'Tizimdan chiqmoqchimisiz?', [
      { text: 'Bekor', style: 'cancel' },
      { text: 'Chiqish', style: 'destructive', onPress: async () => {
        await AsyncStorage.multiRemove(['userToken', 'userData']);
        API.setToken('');
        router.replace('/login');
      }},
    ]);
  };

  // ---- HISOB-KITOBLAR ----
  const bugun = new Date().toISOString().split('T')[0];

  // Mijozlardan oladigan qarz (menga qarzdor)
  const jamiMijozQarz = mijozlar.reduce((s, m) => s + (Number(m.qarz) || 0), 0);
  const qarzdorMijozlar = mijozlar.filter(m => (Number(m.qarz) || 0) > 0);

  // Yetkazuvchilarga mening qarzim (Xom ashyo)
  const getYetQarz = (nomi: string) => {
    const kirim = kirimlar.filter(k => k.yetkazuvchi === nomi).reduce((s, k) => s + (Number(k.jami) || 0), 0);
    const naqd = kirimlar.filter(k => k.yetkazuvchi === nomi && k.tolov === 'naqd').reduce((s, k) => s + (Number(k.jami) || 0), 0);
    const aralashTolov = kirimlar.filter(k => k.yetkazuvchi === nomi && k.tolov === 'aralash').reduce((s, k) => s + (Number(k.naqdSumma) || 0), 0);
    const tolov = xomTolovlar.filter(t => t.mijoz === nomi).reduce((s, t) => s + (Number(t.summa) || 0), 0);
    return kirim - naqd - aralashTolov - tolov;
  };
  const jamiYetQarz = yetkazuvchilar.reduce((s, y) => s + Math.max(0, getYetQarz(y.nomi)), 0);

  // Bugungi sotuv
  const bugunSotuv = sotuvlar.filter(s => s.sana === bugun).reduce((s, x) => s + (Number(x.summa) || 0), 0);

  // So'nggi sotuvlar
  const songiSotuvlar = sotuvlar.slice(0, 5);

  if (loading) {
    return <View style={[s.container, { justifyContent: 'center', alignItems: 'center' }]}><ActivityIndicator size="large" color="#3B82F6" /></View>;
  }

  return (
    <ScrollView style={s.container} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); load(); }} tintColor="#3B82F6" />}>
      {/* Header */}
      <View style={s.header}>
        <View>
          <Text style={s.welcome}>Assalomu alaykum!</Text>
          <Text style={s.name}>{userName}</Text>
        </View>
        <TouchableOpacity onPress={handleLogout} style={s.logoutBtn}>
          <Ionicons name="log-out-outline" size={22} color="#EF4444" />
        </TouchableOpacity>
      </View>

      {/* Stat cards */}
      <View style={s.statsRow}>
        <View style={[s.stat, { borderLeftColor: '#10B981' }]}>
          <Text style={s.statLabel}>Menga qarzdor</Text>
          <Text style={[s.statVal, { color: '#10B981' }]}>{fmt(jamiMijozQarz)}</Text>
          <Text style={s.statSub}>so'm (mijozlardan)</Text>
        </View>
        <View style={[s.stat, { borderLeftColor: '#EF4444' }]}>
          <Text style={s.statLabel}>Men qarzdorman</Text>
          <Text style={[s.statVal, { color: '#EF4444' }]}>{fmt(jamiYetQarz)}</Text>
          <Text style={s.statSub}>so'm (yetkazuvchiga)</Text>
        </View>
      </View>
      <View style={s.statsRow}>
        <View style={[s.stat, { borderLeftColor: '#3B82F6' }]}>
          <Text style={s.statLabel}>Bugungi sotuv</Text>
          <Text style={[s.statVal, { color: '#3B82F6' }]}>{fmt(bugunSotuv)}</Text>
          <Text style={s.statSub}>so'm</Text>
        </View>
        <View style={[s.stat, { borderLeftColor: '#F59E0B' }]}>
          <Text style={s.statLabel}>Qarzdorlar</Text>
          <Text style={[s.statVal, { color: '#F59E0B' }]}>{qarzdorMijozlar.length} / {mijozlar.length}</Text>
          <Text style={s.statSub}>qarzdor / jami mijoz</Text>
        </View>
      </View>

      {/* Quick actions */}
      <Text style={s.sectionTitle}>Tezkor amallar</Text>
      <View style={s.actionsRow}>
        <TouchableOpacity style={[s.actionBtn, { backgroundColor: '#1D4ED8' }]} onPress={() => router.push('/(tabs)/xom-ashyo')}>
          <Ionicons name="cube" size={22} color="#FFF" />
          <Text style={s.actionText}>Xom ashyo</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[s.actionBtn, { backgroundColor: '#059669' }]} onPress={() => router.push('/(tabs)/sales')}>
          <Ionicons name="cart" size={22} color="#FFF" />
          <Text style={s.actionText}>Sotuv</Text>
        </TouchableOpacity>
      </View>

      {/* Recent sales */}
      <Text style={s.sectionTitle}>So'nggi sotuvlar</Text>
      {songiSotuvlar.length === 0 ? (
        <View style={s.empty}><Text style={s.emptyText}>Hali sotuvlar yo'q</Text></View>
      ) : (
        songiSotuvlar.map((item, i) => {
          const isDebt = (Number(item.qarz) || 0) > 0;
          return (
            <View key={item.id || i} style={s.listItem}>
              <View style={[s.dot, { backgroundColor: isDebt ? '#EF4444' : '#10B981' }]} />
              <View style={{ flex: 1 }}>
                <Text style={s.listTitle}>{item.mijoz_nomi || 'Mijoz'}</Text>
                <Text style={s.listSub}>{fmtSana(item.sana)}</Text>
              </View>
              <View style={{ alignItems: 'flex-end' }}>
                <Text style={s.listVal}>{fmt(item.summa)} so'm</Text>
                {isDebt && <Text style={s.listDebt}>Qarz: {fmt(item.qarz)}</Text>}
              </View>
            </View>
          );
        })
      )}
      <View style={{ height: 30 }} />
    </ScrollView>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0F172A' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20, paddingTop: 12 },
  welcome: { fontSize: 14, color: '#64748B' },
  name: { fontSize: 22, fontWeight: '800', color: '#F1F5F9', marginTop: 2 },
  logoutBtn: { padding: 10, backgroundColor: '#1E293B', borderRadius: 12 },
  statsRow: { flexDirection: 'row', paddingHorizontal: 16, gap: 12, marginBottom: 12 },
  stat: { flex: 1, backgroundColor: '#1E293B', borderRadius: 14, padding: 16, borderLeftWidth: 4 },
  statLabel: { fontSize: 11, color: '#64748B', fontWeight: '600', textTransform: 'uppercase', letterSpacing: 0.3 },
  statVal: { fontSize: 20, fontWeight: '800', marginTop: 6 },
  statSub: { fontSize: 11, color: '#475569', marginTop: 2 },
  sectionTitle: { fontSize: 16, fontWeight: '700', color: '#CBD5E1', padding: 16, paddingBottom: 12 },
  actionsRow: { flexDirection: 'row', paddingHorizontal: 16, gap: 12 },
  actionBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', padding: 16, borderRadius: 14, gap: 8 },
  actionText: { color: '#FFF', fontSize: 14, fontWeight: '600' },
  empty: { padding: 32, alignItems: 'center' },
  emptyText: { color: '#475569', fontSize: 14 },
  listItem: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#1E293B', marginHorizontal: 16, marginBottom: 8, padding: 14, borderRadius: 12 },
  dot: { width: 8, height: 8, borderRadius: 4, marginRight: 12 },
  listTitle: { fontSize: 15, fontWeight: '600', color: '#E2E8F0' },
  listSub: { fontSize: 12, color: '#64748B', marginTop: 2 },
  listVal: { fontSize: 14, fontWeight: '700', color: '#E2E8F0' },
  listDebt: { fontSize: 12, color: '#EF4444', fontWeight: '600', marginTop: 2 },
});
