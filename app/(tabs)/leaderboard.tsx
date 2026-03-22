import React, { useEffect, useState } from 'react';
import { ActivityIndicator, FlatList, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { fetchLeaderboard } from '../../src/hooks/useProfile';
import { useAuth } from '../../src/hooks/useAuth';
import { colors } from '../../src/theme/colors';
import { fontFamily, type } from '../../src/theme/typography';
import { User } from '../../src/types';

const RANK_EMOJI = ['🥇', '🥈', '🥉'];

export default function LeaderboardScreen() {
  const { currentUser } = useAuth();
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
      <SafeAreaView style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.bg }}>
        <ActivityIndicator size="large" color={colors.greenAccent} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.bg }}>
      <View style={{ padding: 20, alignItems: 'center', borderBottomWidth: 1, borderBottomColor: colors.bgAccent }}>
        <Text style={[type.titleHeaderAccent, { fontSize: 32, textAlign: 'center' }]}>🏆 Leaderboard</Text>
        <Text style={{ fontFamily: fontFamily.crimson, fontSize: 14, color: colors.red, marginTop: 4, opacity: 0.85 }}>
          All-time points
        </Text>
      </View>

      <FlatList
        data={users}
        keyExtractor={u => u.id}
        renderItem={({ item, index }) => {
          const isMe = item.id === currentUser?.id;
          return (
            <View style={{
              flexDirection: 'row', alignItems: 'center',
              backgroundColor: isMe ? colors.green : colors.surface,
              marginHorizontal: 12, marginVertical: 4, borderRadius: 14, padding: 14,
              borderWidth: 1, borderColor: isMe ? colors.greenAccent : colors.bgAccent,
              shadowColor: colors.text, shadowOpacity: 0.04, shadowRadius: 4, elevation: 1,
            }}>
              <Text style={{ fontSize: 22, width: 36 }}>{RANK_EMOJI[index] ?? `${index + 1}.`}</Text>
              <View style={{ flex: 1 }}>
                <Text style={{
                  fontFamily: fontFamily.crimsonBold,
                  fontSize: 17,
                  color: isMe ? colors.bg : colors.redAccent,
                }}>
                  @{item.username}{isMe ? ' (you)' : ''}
                </Text>
                {item.streak > 0 ? (
                  <Text style={{ fontFamily: fontFamily.crimson, fontSize: 12, color: isMe ? colors.bgAccent : colors.red }}>
                    🔥 {item.streak} day streak
                  </Text>
                ) : null}
              </View>
              <Text style={{
                fontFamily: fontFamily.crimsonBold,
                fontSize: 18,
                color: isMe ? colors.bg : colors.greenAccent,
              }}>
                {item.total_points.toLocaleString()}
              </Text>
            </View>
          );
        }}
        contentContainerStyle={{ paddingVertical: 12, paddingBottom: 24 }}
      />
    </SafeAreaView>
  );
}
