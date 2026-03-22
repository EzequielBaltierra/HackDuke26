import { useEffect } from 'react';
import { Slot, useRouter, useSegments } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { AuthProvider, useAuth } from '../src/contexts/AuthContext';

function AuthGuard() {
  const { currentUser, loading } = useAuth();
  const router = useRouter();
  const segments = useSegments();

  useEffect(() => {
    if (loading) return;

    const inProtectedRoute =
      segments[0] === '(tabs)' ||
      segments[0] === 'discovery' ||
      segments[0] === 'expedition';

    if (!currentUser && inProtectedRoute) {
      router.replace('/login');
    }

    if (currentUser && segments[0] === 'login') {
      router.replace('/(tabs)');
    }
  }, [currentUser, loading, segments]);

  return <Slot />;
}

export default function RootLayout() {
  return (
    <AuthProvider>
      <StatusBar style="dark" />
      <AuthGuard />
    </AuthProvider>
  );
}
