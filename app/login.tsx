import { useAuth } from '../src/hooks/useAuth';
import { useRouter } from 'expo-router';
import { useEffect } from 'react';
import { Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function LoginScreen() {
  const { login, devLogin, currentUser, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (currentUser) router.replace('/(tabs)');
  }, [currentUser]);

  async function handleLogin() {
    try {
      await login();
    } catch (e) {
      console.error('Login failed', e);
    }
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#eaded0', justifyContent: 'center', alignItems: 'center', padding: 24 }}>
      <Text style={{ fontSize: 56, fontWeight: '800', color: '#4e705e', marginBottom: 4, letterSpacing: -1 }}>Root</Text>
      <Text style={{ fontSize: 18, color: '#6d3a3c', marginBottom: 8, fontStyle: 'italic' }}>Expedition · Discovery</Text>
      <Text style={{ fontSize: 15, color: '#361319', marginBottom: 60, textAlign: 'center', opacity: 0.7 }}>
        Spot, explore, and share nature{'\n'}with friends, points, and AI.
      </Text>

      <TouchableOpacity
        onPress={handleLogin}
        disabled={loading}
        style={{
          backgroundColor: '#4e705e',
          paddingHorizontal: 48,
          paddingVertical: 16,
          borderRadius: 32,
          opacity: loading ? 0.6 : 1,
        }}
      >
        <Text style={{ color: '#eaded0', fontSize: 18, fontWeight: '700' }}>
          {loading ? 'Loading...' : 'Get Started 🌿'}
        </Text>
      </TouchableOpacity>

      <TouchableOpacity
        onPress={devLogin}
        disabled={loading}
        style={{ marginTop: 16, paddingVertical: 10, paddingHorizontal: 24 }}
      >
        <Text style={{ color: '#110703', fontSize: 13, opacity: 0.4 }}>Dev bypass (skip auth)</Text>
      </TouchableOpacity>
    </SafeAreaView>
  );
}
