import { useAuth } from '../src/hooks/useAuth';
import { Redirect } from 'expo-router';
import { ActivityIndicator, View } from 'react-native';
import { colors } from '../src/theme/colors';

export default function Index() {
  const { loading, currentUser } = useAuth();

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.bg }}>
        <ActivityIndicator size="large" color={colors.greenAccent} />
      </View>
    );
  }

  return currentUser ? <Redirect href="/(tabs)" /> : <Redirect href="/login" />;
}
