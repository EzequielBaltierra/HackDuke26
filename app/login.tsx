import { useAuth0 } from 'react-native-auth0';
import { useRouter } from 'expo-router';
import { useEffect } from 'react';
import { Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function LoginScreen() {
  const { authorize, user, isLoading } = useAuth0();
  const router = useRouter();

  useEffect(() => {
    if (user) router.replace('/(tabs)');
  }, [user]);

  async function handleLogin() {
    try {
      await authorize();
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
        disabled={isLoading}
        style={{
          backgroundColor: '#4e705e',
          paddingHorizontal: 48,
          paddingVertical: 16,
          borderRadius: 32,
          opacity: isLoading ? 0.6 : 1,
        }}
      >
        <Text style={{ color: '#eaded0', fontSize: 18, fontWeight: '700' }}>
          {isLoading ? 'Loading...' : 'Get Started 🌿'}
        </Text>
      </TouchableOpacity>
    </SafeAreaView>
  );
}
