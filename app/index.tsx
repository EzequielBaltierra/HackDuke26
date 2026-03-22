import { useAuth } from '../src/hooks/useAuth';
import { Redirect } from 'expo-router';
import { ActivityIndicator, View } from 'react-native';

export default function Index() {
  const { loading, currentUser } = useAuth();

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#eaded0' }}>
        <ActivityIndicator size="large" color="#4e705e" />
      </View>
    );
  }

  return currentUser ? <Redirect href="/(tabs)" /> : <Redirect href="/login" />;
}
