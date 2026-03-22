import React, { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Image,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { fetchLeaderboard } from '../../src/hooks/useProfile';
import { useAuth } from '../../src/hooks/useAuth';
import { colors } from '../../src/theme/colors';
import { ff, textStyles } from '../../src/theme/typography';
import { User } from '../../src/types';

/** Pastel fills for ranks 1–3 (fully colored circles) */
const MEDAL_FILL: Record<number, string> = {
  1: '#E8D4A8',
  2: '#D0D4DC',
  3: '#D4A574',
};

/** Fixed width so ranks 1–3 and 4+ align; points column uses same right inset */
const RANK_COLUMN_WIDTH = 64;
const POINTS_MIN_WIDTH = 88;

function RankBadge({ rank }: { rank: number }) {
  const label = `# ${rank}`;
  if (rank >= 1 && rank <= 3) {
    const fill = MEDAL_FILL[rank];
    return (
      <View
        style={{
          width: RANK_COLUMN_WIDTH,
          marginRight: 10,
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <View
          style={{
            width: 56,
            height: 56,
            borderRadius: 28,
            justifyContent: 'center',
            alignItems: 'center',
            backgroundColor: fill,
          }}
        >
          <Text style={{ fontFamily: ff.crimsonBold, fontSize: 17, color: colors.textPrimary }} numberOfLines={1}>
            {label}
          </Text>
        </View>
      </View>
    );
  }
  return (
    <View
      style={{
        width: RANK_COLUMN_WIDTH,
        marginRight: 10,
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <Text style={{ fontFamily: ff.crimsonBold, fontSize: 20, color: colors.textPrimary }}>{label}</Text>
    </View>
  );
}

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

  const myIndex = useMemo(
    () => (currentUser ? users.findIndex(u => u.id === currentUser.id) : -1),
    [users, currentUser],
  );
  const myRank = myIndex >= 0 ? myIndex + 1 : null;

  if (loading) {
    return (
      <SafeAreaView style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.bgPrimary }}>
        <ActivityIndicator size="large" color={colors.greenAccent} />
      </SafeAreaView>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: colors.bgPrimary }}>
      <SafeAreaView edges={['top']} style={{ backgroundColor: colors.redBase }}>
        <View
          style={{
            width: '100%',
            paddingVertical: 14,
            alignItems: 'center',
            justifyContent: 'center',
            borderBottomLeftRadius: 0,
            borderBottomRightRadius: 0,
          }}
        >
          <Text style={{ fontFamily: ff.faustinaSemi, fontSize: 22, color: colors.bgPrimary, letterSpacing: 0.5 }}>
            Leaderboard
          </Text>
        </View>
      </SafeAreaView>

      {currentUser ? (
        <View
          style={{
            marginHorizontal: '5%',
            marginTop: 12,
            marginBottom: 8,
            backgroundColor: colors.blueAccent,
            borderRadius: 12,
            padding: 14,
            flexDirection: 'row',
            alignItems: 'center',
          }}
        >
          {currentUser.profile_photo_url ? (
            <Image
              source={{ uri: currentUser.profile_photo_url }}
              style={{
                width: 52,
                height: 52,
                borderRadius: 26,
                marginRight: 12,
                borderWidth: 1,
                borderColor: colors.bgPrimary,
              }}
            />
          ) : (
            <View
              style={{
                width: 52,
                height: 52,
                borderRadius: 26,
                marginRight: 12,
                backgroundColor: colors.greenBase,
                justifyContent: 'center',
                alignItems: 'center',
                borderWidth: 1,
                borderColor: colors.bgPrimary,
              }}
            >
              <Text style={{ fontSize: 22 }}>🌿</Text>
            </View>
          )}
          <View style={{ flex: 1, minWidth: 0 }}>
            <Text style={{ fontFamily: ff.crimsonBold, fontSize: 17, color: colors.bgPrimary }} numberOfLines={1}>
              @{currentUser.username}
            </Text>
            <Text style={{ fontFamily: ff.crimson, fontSize: 15, color: colors.bgPrimary, marginTop: 2, opacity: 0.95 }}>
              {currentUser.total_points.toLocaleString()} pts
              {myRank != null ? ` · Rank #${myRank}` : ''}
            </Text>
          </View>
        </View>
      ) : null}

      <FlatList
        data={users}
        keyExtractor={u => u.id}
        style={{ flex: 1 }}
        contentContainerStyle={{ paddingBottom: 32 }}
        ItemSeparatorComponent={() => (
          <View
            style={{
              height: 1,
              backgroundColor: colors.blueAccent,
              marginHorizontal: '5%',
            }}
          />
        )}
        ListEmptyComponent={
          <Text style={[textStyles.postDescription, { textAlign: 'center', marginTop: 32, paddingHorizontal: 24 }]}>
            No players on the leaderboard yet.
          </Text>
        }
        renderItem={({ item, index }) => {
          const rank = index + 1;
          const isMe = item.id === currentUser?.id;
          return (
            <TouchableOpacity
              activeOpacity={0.75}
              onPress={() => router.push({ pathname: '/user/[id]/index', params: { id: item.id } })}
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                paddingVertical: 14,
                paddingHorizontal: '5%',
                backgroundColor: colors.bgPrimary,
              }}
            >
              <RankBadge rank={rank} />
              {item.profile_photo_url ? (
                <Image
                  source={{ uri: item.profile_photo_url }}
                  style={{
                    width: 52,
                    height: 52,
                    borderRadius: 26,
                    marginRight: 12,
                    borderWidth: 1,
                    borderColor: colors.bgAccent,
                    backgroundColor: colors.bgAccent,
                  }}
                />
              ) : (
                <View
                  style={{
                    width: 52,
                    height: 52,
                    borderRadius: 26,
                    marginRight: 12,
                    backgroundColor: colors.greenBase,
                    justifyContent: 'center',
                    alignItems: 'center',
                    borderWidth: 1,
                    borderColor: colors.greenAccent,
                  }}
                >
                  <Text style={{ fontSize: 22 }}>🌿</Text>
                </View>
              )}
              <View style={{ flex: 1, minWidth: 0 }}>
                <Text
                  style={[
                    textStyles.userName,
                    { fontSize: 18, color: isMe ? colors.blueAccent : colors.textPrimary },
                  ]}
                  numberOfLines={1}
                >
                  @{item.username}
                </Text>
                {item.streak > 0 ? (
                  <Text style={[textStyles.postDescription, { fontSize: 13, marginTop: 2, opacity: 0.8 }]}>
                    {item.streak} day streak
                  </Text>
                ) : null}
              </View>
              <View style={{ minWidth: POINTS_MIN_WIDTH, alignItems: 'flex-end' }}>
                <Text style={{ fontFamily: ff.crimsonBold, fontSize: 17, color: colors.greenAccent }}>
                  {item.total_points.toLocaleString()}
                </Text>
              </View>
            </TouchableOpacity>
          );
        }}
      />
    </View>
  );
}
