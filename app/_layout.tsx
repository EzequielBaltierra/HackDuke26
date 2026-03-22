import { Slot } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { ActivityIndicator, View } from 'react-native';
import { AuthProvider } from '../src/contexts/AuthContext';
import { colors } from '../src/theme/colors';
import { useRootFonts } from '../src/theme/fonts';

export default function RootLayout() {
  const [loaded, fontError] = useRootFonts();

  if (!loaded && !fontError) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.bgPrimary, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color={colors.greenAccent} />
      </View>
    );
  }

  return (
    <AuthProvider>
      <StatusBar style="dark" />
      <Slot />
    </AuthProvider>
  );
}
