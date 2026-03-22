import React, { useEffect, useState } from 'react';
import { ActivityIndicator, FlatList, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { fetchLeaderboard } from '../../src/hooks/useProfile';
import { useAuth } from '../../src/hooks/useAuth';
import { User } from '../../src/types';

const RANK_EMOJI = ['🥇', '🥈', '🥉'];

export default function LeaderboardScreen() {
  const { currentUser } = useAuth();
  const router = useRouter();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchLeaderboard().then(data => {
      setUsers(data ?? []);
      setLoading(false);
    });
  }, []);

  if (loading) {
    return (
      <SafeAreaView style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#eaded0' }}>
        <ActivityIndicator size="large" color="#4e705e" />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#eaded0' }}>
      <View style={{ padding: 20, alignItems: 'center', borderBottomWidth: 1, borderBottomColor: '#c7af94' }}>
        <Text style={{ fontSize: 28, fontWeight: '800', color: '#361319' }}>🏆 Leaderboard</Text>
        <Text style={{ fontSize: 13, color: '#6d3a3c', marginTop: 4, opacity: 0.8 }}>All-time points</Text>
      </View>

      <FlatList
        data={users}
        keyExtractor={u => u.id}
        renderItem={({ item, index }) => {
          const isMe = item.id === currentUser?.id;
          return (
            <TouchableOpacity
              activeOpacity={0.85}
              onPress={() => router.push(`/user/${item.id}`)}
            >
              <View style={{
                flexDirection: 'row', alignItems: 'center',
                backgroundColor: isMe ? '#4e705e' : 'white',
                marginHorizontal: 12, marginVertical: 4, borderRadius: 14, padding: 14,
                borderWidth: 1, borderColor: isMe ? '#4e705e' : '#c7af94',
                shadowColor: '#110703', shadowOpacity: 0.04, shadowRadius: 4, elevation: 1,
              }}>
                <Text style={{ fontSize: 22, width: 36 }}>{RANK_EMOJI[index] ?? `${index + 1}.`}</Text>
                <View style={{ flex: 1 }}>
                  <Text style={{ fontSize: 16, fontWeight: '700', color: isMe ? '#eaded0' : '#361319' }}>
                    @{item.username}{isMe ? ' (you)' : ''}
                  </Text>
                  {item.streak > 0 ? (
                    <Text style={{ fontSize: 12, color: isMe ? '#c7af94' : '#6d3a3c' }}>🔥 {item.streak} day streak</Text>
                  ) : null}
                </View>
                <Text style={{ fontSize: 18, fontWeight: '800', color: isMe ? '#eaded0' : '#4e705e' }}>
                  {item.total_points.toLocaleString()}
                </Text>
              </View>
            </TouchableOpacity>
          );
        }}
        contentContainerStyle={{ paddingVertical: 12, paddingBottom: 24 }}
      />
    </SafeAreaView>
  );
}
