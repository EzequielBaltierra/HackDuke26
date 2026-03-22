import React, { useMemo, useState } from 'react';
import {
  ActivityIndicator,
  DimensionValue,
  FlatList,
  Image,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useRouter } from 'expo-router';
import { hrefUserProfile } from '../lib/routes';
import { colors } from '../theme/colors';
import { ff, textStyles } from '../theme/typography';
import { User } from '../types';

type Props = {
  users: User[];
  loading: boolean;
  emptyHint: string;
  separatorHorizontalInsetPercent?: number;
};

export function FollowListBody({ users, loading, emptyHint, separatorHorizontalInsetPercent = 0 }: Props) {
  const router = useRouter();
  const [query, setQuery] = useState('');
  const q = query.trim().toLowerCase();

  const filtered = useMemo(() => {
    if (!q) return users;
    return users.filter(u => u.username.toLowerCase().includes(q));
  }, [users, q]);

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', paddingTop: 48 }}>
        <ActivityIndicator size="large" color={colors.greenAccent} />
      </View>
    );
  }

  const inset: DimensionValue = separatorHorizontalInsetPercent
    ? (`${separatorHorizontalInsetPercent}%` as const)
    : 0;

  return (
    <View style={{ flex: 1, backgroundColor: colors.bgPrimary }}>
      <View style={{ paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 0 }}>
        <TextInput
          value={query}
          onChangeText={setQuery}
          placeholder="Search by username…"
          placeholderTextColor={colors.bgAccent}
          style={{
            backgroundColor: colors.surface,
            borderRadius: 12,
            borderWidth: 1,
            borderColor: colors.blueAccent,
            paddingHorizontal: 14,
            paddingVertical: 12,
            fontFamily: ff.crimson,
            fontSize: 17,
            color: colors.textPrimary,
          }}
          autoCapitalize="none"
          autoCorrect={false}
        />
      </View>
      <View style={{ height: 1, backgroundColor: colors.blueAccent, marginHorizontal: inset }} />

      <FlatList
        data={filtered}
        keyExtractor={item => item.id}
        contentContainerStyle={{ paddingBottom: 32 }}
        ItemSeparatorComponent={
          separatorHorizontalInsetPercent
            ? () => <View style={{ height: 1, backgroundColor: colors.blueAccent, marginHorizontal: inset }} />
            : undefined
        }
        ListEmptyComponent={
          <Text
            style={[
              textStyles.postDescription,
              { textAlign: 'center', marginTop: 40, paddingHorizontal: 24, opacity: 0.85 },
            ]}
          >
            {emptyHint}
          </Text>
        }
        renderItem={({ item }) => (
          <TouchableOpacity
            activeOpacity={0.7}
            onPress={() => router.push(hrefUserProfile(item.id))}
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              paddingHorizontal: 16,
              paddingVertical: 14,
              borderBottomWidth: separatorHorizontalInsetPercent ? 0 : 1,
              borderBottomColor: colors.blueAccent,
            }}
          >
            {item.profile_photo_url ? (
              <Image
                source={{ uri: item.profile_photo_url }}
                style={{
                  width: 52,
                  height: 52,
                  borderRadius: 26,
                  marginRight: 14,
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
                  marginRight: 14,
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
              <Text style={[textStyles.userName, { fontSize: 18 }]} numberOfLines={1}>
                @{item.username}
              </Text>
              <Text style={[textStyles.userPoints, { marginTop: 2 }]}>
                {item.total_points.toLocaleString()} pts
              </Text>
            </View>
          </TouchableOpacity>
        )}
      />
    </View>
  );
}
