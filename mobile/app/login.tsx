import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ActivityIndicator, Alert, KeyboardAvoidingView, Platform } from 'react-native';
import { router } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';
import { API } from '@/utils/api';

export default function LoginScreen() {
  const [login, setLogin] = useState('');
  const [parol, setParol] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPass, setShowPass] = useState(false);

  const handleLogin = async () => {
    if (!login.trim() || !parol.trim()) {
      return Alert.alert('Xatolik', 'Login va parolni kiriting!');
    }
    setLoading(true);
    try {
      const data = await API.post('/auth/login', { login: login.trim(), parol: parol.trim() });
      if (data.token) {
        await AsyncStorage.setItem('userToken', data.token);
        await AsyncStorage.setItem('userData', JSON.stringify(data.user));
        API.setToken(data.token);
        router.replace('/(tabs)');
      } else {
        Alert.alert('Xatolik', 'Token kelmadi');
      }
    } catch (e: any) {
      Alert.alert('Xatolik', e.message || 'Server bilan bog\'lanib bo\'lmadi');
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView style={s.container} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      <View style={s.inner}>
        {/* Logo */}
        <View style={s.logoWrap}>
          <View style={s.logoCircle}>
            <Ionicons name="business" size={36} color="#FFF" />
          </View>
          <Text style={s.brand}>Valijon ERP</Text>
          <Text style={s.sub}>Hisob-kitob tizimi</Text>
        </View>

        {/* Form */}
        <View style={s.card}>
          <Text style={s.label}>Login</Text>
          <View style={s.inputWrap}>
            <Ionicons name="person-outline" size={20} color="#6B7280" style={{ marginRight: 10 }} />
            <TextInput
              style={s.input}
              placeholder="login kiriting"
              placeholderTextColor="#9CA3AF"
              autoCapitalize="none"
              autoCorrect={false}
              value={login}
              onChangeText={setLogin}
            />
          </View>

          <Text style={[s.label, { marginTop: 18 }]}>Parol</Text>
          <View style={s.inputWrap}>
            <Ionicons name="lock-closed-outline" size={20} color="#6B7280" style={{ marginRight: 10 }} />
            <TextInput
              style={s.input}
              placeholder="parol kiriting"
              placeholderTextColor="#9CA3AF"
              secureTextEntry={!showPass}
              value={parol}
              onChangeText={setParol}
            />
            <TouchableOpacity onPress={() => setShowPass(!showPass)}>
              <Ionicons name={showPass ? 'eye-off' : 'eye'} size={22} color="#9CA3AF" />
            </TouchableOpacity>
          </View>

          <TouchableOpacity style={[s.btn, loading && { opacity: 0.6 }]} onPress={handleLogin} disabled={loading}>
            {loading ? <ActivityIndicator color="#FFF" /> : <Text style={s.btnText}>Kirish</Text>}
          </TouchableOpacity>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0F172A' },
  inner: { flex: 1, justifyContent: 'center', padding: 24 },
  logoWrap: { alignItems: 'center', marginBottom: 36 },
  logoCircle: { width: 72, height: 72, borderRadius: 20, backgroundColor: '#2563EB', justifyContent: 'center', alignItems: 'center', marginBottom: 16 },
  brand: { fontSize: 26, fontWeight: '800', color: '#F9FAFB' },
  sub: { fontSize: 14, color: '#64748B', marginTop: 4 },
  card: { backgroundColor: '#1E293B', borderRadius: 20, padding: 24 },
  label: { fontSize: 13, fontWeight: '600', color: '#94A3B8', marginBottom: 8, textTransform: 'uppercase', letterSpacing: 0.5 },
  inputWrap: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#0F172A', borderRadius: 12, paddingHorizontal: 14, paddingVertical: 14, borderWidth: 1, borderColor: '#334155' },
  input: { flex: 1, fontSize: 16, color: '#F1F5F9' },
  btn: { backgroundColor: '#2563EB', paddingVertical: 16, borderRadius: 14, alignItems: 'center', marginTop: 28 },
  btnText: { color: '#FFF', fontSize: 16, fontWeight: '700' },
});
