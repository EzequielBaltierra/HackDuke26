import { Stack } from 'expo-router';
import { colors } from '../../../src/theme/colors';

export default function ProfileStackLayout() {
  return (
    <Stack
      screenOptions={{
        headerStyle: { backgroundColor: colors.bgPrimary },
        headerTintColor: colors.redAccent,
        headerTitleStyle: { fontWeight: '700', color: colors.redAccent },
        headerShadowVisible: false,
        contentStyle: { backgroundColor: colors.bgPrimary },
      }}
    >
      <Stack.Screen name="index" options={{ headerShown: false }} />
      <Stack.Screen name="followers" options={{ title: 'Followers' }} />
      <Stack.Screen name="following" options={{ title: 'Following' }} />
    </Stack>
  );
}
