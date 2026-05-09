import React, { useEffect } from 'react';
import { View, ActivityIndicator } from 'react-native';
import { router } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { API } from '@/utils/api';

export default function RootIndex() {
  useEffect(() => {
    (async () => {
      const token = await AsyncStorage.getItem('userToken');
      if (token) {
        API.setToken(token);
        router.replace('/(tabs)');
      } else {
        router.replace('/login');
      }
    })();
  }, []);

  return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#111827' }}>
      <ActivityIndicator size="large" color="#3B82F6" />
    </View>
  );
}
