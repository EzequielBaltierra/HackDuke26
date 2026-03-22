import { useAuth } from '../src/hooks/useAuth';
import { useRouter } from 'expo-router';
import { useEffect } from 'react';
import { Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors } from '../src/theme/colors';
import { fontFamily, type } from '../src/theme/typography';

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
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.bg, justifyContent: 'center', alignItems: 'center', padding: 24 }}>
      <Text style={[type.titleHeaderAccent, { fontSize: 56, marginBottom: 4, letterSpacing: -1, textAlign: 'center' }]}>
        Root
      </Text>
      <Text style={{ fontFamily: fontFamily.crimson, fontSize: 18, color: colors.red, marginBottom: 8, fontStyle: 'italic' }}>
        Expedition · Discovery
      </Text>
      <Text style={{ fontFamily: fontFamily.crimson, fontSize: 15, color: colors.redAccent, marginBottom: 60, textAlign: 'center', opacity: 0.85 }}>
        Spot, explore, and share nature{'\n'}with friends, points, and AI.
      </Text>

      <TouchableOpacity
        onPress={handleLogin}
        disabled={loading}
        style={{
          backgroundColor: colors.green,
          paddingHorizontal: 48,
          paddingVertical: 16,
          borderRadius: 32,
          opacity: loading ? 0.6 : 1,
          borderWidth: 2,
          borderColor: colors.greenAccent,
        }}
      >
        <Text style={{ color: colors.bg, fontFamily: fontFamily.crimsonBold, fontSize: 18 }}>
          {loading ? 'Loading...' : 'Get Started 🌿'}
        </Text>
      </TouchableOpacity>

      <TouchableOpacity
        onPress={devLogin}
        disabled={loading}
        style={{ marginTop: 16, paddingVertical: 10, paddingHorizontal: 24 }}
      >
        <Text style={{ color: colors.text, fontFamily: fontFamily.crimson, fontSize: 13, opacity: 0.45 }}>Dev bypass (skip auth)</Text>
      </TouchableOpacity>
    </SafeAreaView>
  );
}
