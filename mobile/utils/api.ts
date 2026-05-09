import { Platform } from 'react-native';
import Constants from 'expo-constants';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Server URL — agar tunnel ishlatilsa shu yerdan o'zgartirasiz
const getBaseUrl = () => {
  const hostUri = Constants?.expoConfig?.hostUri;
  if (hostUri) {
    const ip = hostUri.split(':')[0];
    return `http://${ip}:5001/api`;
  }
  if (Platform.OS === 'android') return 'http://10.0.2.2:5001/api';
  return 'http://localhost:5001/api';
};

// VPS2 — haqiqiy server (barcha ma'lumotlar shu yerda)
const BASE_URL = 'https://valijon-erp.uz/api';

export const API = {
  token: null as string | null,

  setToken(t: string) {
    this.token = t;
  },

  async loadToken() {
    if (this.token) return;
    try {
      const t = await AsyncStorage.getItem('userToken');
      if (t) this.token = t;
    } catch (e) {}
  },

  async req(method: string, url: string, body: any = null) {
    await this.loadToken();
    
    const headers: any = {
      'Content-Type': 'application/json',
    };
    if (this.token) {
      headers['Authorization'] = `Bearer ${this.token}`;
    }

    const opts: RequestInit = { method, headers };
    if (body) opts.body = JSON.stringify(body);

    console.log(`[API] ${method} ${BASE_URL}${url}`);

    try {
      const res = await fetch(`${BASE_URL}${url}`, opts);
      const text = await res.text();

      let data;
      try {
        data = JSON.parse(text);
      } catch {
        throw new Error('Server javob bermadi');
      }

      if (!res.ok) {
        // Token eskirgan yoki noto'g'ri — avtomatik logout
        if (res.status === 401) {
          this.token = null;
          await AsyncStorage.multiRemove(['userToken', 'userData']);
          // Login sahifasiga tashlash
          const { router } = require('expo-router');
          router.replace('/login');
          throw new Error('Sessiya tugadi, qayta kiring');
        }
        throw new Error(data.error || `Xatolik: ${res.status}`);
      }

      return data;
    } catch (error: any) {
      console.error(`[API] ${method} ${url}: ${error.message}`);
      throw error;
    }
  },

  get: (url: string) => API.req('GET', url),
  post: (url: string, body: any) => API.req('POST', url, body),
  put: (url: string, body: any) => API.req('PUT', url, body),
  del: (url: string) => API.req('DELETE', url),
};
