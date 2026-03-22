import { useAuth } from '../src/hooks/useAuth';
import { Redirect } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, View } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { colors } from '../src/theme/colors';

export default function Index() {
  const { loading, currentUser } = useAuth();
  const [checkingOnboarding, setCheckingOnboarding] = useState(true);
  const [onboardingDone, setOnboardingDone] = useState(false);

  useEffect(() => {
    AsyncStorage.getItem('onboarding_complete').then(val => {
      setOnboardingDone(val === '1');
      setCheckingOnboarding(false);
    });
  }, []);

  if (loading || checkingOnboarding) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.bg }}>
        <ActivityIndicator size="large" color={colors.greenAccent} />
      </View>
    );
  }

  if (!onboardingDone) return <Redirect href="/onboarding" />;
  return currentUser ? <Redirect href="/(tabs)" /> : <Redirect href="/login" />;
}
