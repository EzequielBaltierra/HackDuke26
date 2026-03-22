// app/user/[id].tsx — Read-only public profile screen
// Note: fetchUserProfile also fetches expeditions but the result is intentionally unused here.
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator, Image, ScrollView, Text, TouchableOpacity, View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { fetchUserProfile } from '../../src/hooks/useProfile';
import { colors } from '../../src/theme/colors';
import { textStyles } from '../../src/theme/typography';
import { Badge, Discovery, User } from '../../src/types';

const BADGE_LABELS: Record<string, string> = {
  first_discovery: '🌿 First Discovery',
  trailblazer: '🥾 Trailblazer',
  explorer: '⛰ Explorer',
  rare_finder: '🌟 Rare Finder',
  social_explorer: '👥 Social Explorer',
};

type Profile = {
  user: User | null;
  badges: Badge[];
  discoveries: Partial<Discovery>[];
};

export default function PublicProfileScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    fetchUserProfile(id as string)
      .then(data => {
        if (!data.user) {
          setNotFound(true);
        } else {
          setProfile(data);
        }
      })
      .catch(() => setNotFound(true))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) {
    return (
      <SafeAreaView style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.bgPrimary }}>
        <ActivityIndicator size="large" color={colors.greenBase} />
      </SafeAreaView>
    );
  }

  if (notFound || !profile?.user) {
    return (
      <SafeAreaView style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.bgPrimary, padding: 24 }}>
        <Text style={{ fontSize: 48 }}>🌿</Text>
        <Text style={[textStyles.postTitle, { marginTop: 12, textAlign: 'center' }]}>Explorer not found</Text>
        <TouchableOpacity onPress={() => router.back()} style={{ marginTop: 24 }}>
          <Text style={{ color: colors.greenBase, fontSize: 16 }}>Go back</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  const { user, badges, discoveries } = profile;

  return (
    <ScrollView style={{ flex: 1, backgroundColor: colors.bgPrimary }}>
      <SafeAreaView>
        {/* Header */}
        <View style={{ padding: 24, alignItems: 'center', borderBottomWidth: 1, borderBottomColor: colors.bgAccent }}>
          {user.profile_photo_url ? (
            <Image
              source={{ uri: user.profile_photo_url }}
              style={{ width: 80, height: 80, borderRadius: 40, borderWidth: 2, borderColor: colors.bgAccent, marginBottom: 12 }}
            />
          ) : (
            <View style={{ width: 80, height: 80, borderRadius: 40, backgroundColor: colors.greenBase, justifyContent: 'center', alignItems: 'center', borderWidth: 2, borderColor: colors.bgAccent, marginBottom: 12 }}>
              <Text style={{ fontSize: 36 }}>🌿</Text>
            </View>
          )}
          <Text style={[textStyles.userName, { fontSize: 22, fontWeight: '800' }]}>@{user.username}</Text>
          {user.bio ? (
            <Text style={[textStyles.postDescription, { color: colors.redBase, textAlign: 'center', marginTop: 4 }]}>{user.bio}</Text>
          ) : null}
        </View>

        {/* Stats */}
        <View style={{ flexDirection: 'row', margin: 16, gap: 12 }}>
          {[
            { emoji: '⭐', value: user.total_points.toLocaleString(), label: 'Points' },
            { emoji: '🔥', value: `${user.streak}d`, label: 'Streak' },
            { emoji: '🔍', value: discoveries.length.toString(), label: 'Spots' },
          ].map(({ emoji, value, label }) => (
            <View key={label} style={{ flex: 1, backgroundColor: colors.surface, borderRadius: 14, padding: 14, alignItems: 'center', borderWidth: 1, borderColor: colors.bgAccent }}>
              <Text style={{ fontSize: 24 }}>{emoji}</Text>
              <Text style={{ fontSize: 20, fontWeight: '800', color: colors.greenBase, marginTop: 4 }}>{value}</Text>
              <Text style={{ fontSize: 10, color: colors.redBase, textTransform: 'uppercase', letterSpacing: 0.5 }}>{label}</Text>
            </View>
          ))}
        </View>

        {/* Badges */}
        {badges.length > 0 ? (
          <View style={{ paddingHorizontal: 16, marginBottom: 8 }}>
            <Text style={[textStyles.postTitle, { marginBottom: 10 }]}>Badges</Text>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
              {badges.map(b => (
                <View key={b.id} style={{ backgroundColor: colors.bgAccent, borderRadius: 12, paddingHorizontal: 12, paddingVertical: 6 }}>
                  <Text style={{ fontSize: 13, fontWeight: '600', color: colors.redAccent }}>
                    {BADGE_LABELS[b.badge_type] ?? b.badge_type}
                  </Text>
                </View>
              ))}
            </View>
          </View>
        ) : null}

        {/* Discovery grid */}
        {discoveries.length > 0 ? (
          <View style={{ paddingHorizontal: 16, marginBottom: 24 }}>
            <Text style={[textStyles.postTitle, { marginBottom: 10 }]}>Discoveries</Text>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 4 }}>
              {discoveries.map(d =>
                d.image_url ? (
                  <Image key={d.id} source={{ uri: d.image_url }} style={{ width: 100, height: 100, borderRadius: 10 }} />
                ) : null
              )}
            </View>
          </View>
        ) : null}

        {/* Back button */}
        <TouchableOpacity onPress={() => router.back()} style={{ margin: 16, padding: 14, borderRadius: 12, backgroundColor: colors.bgAccent, alignItems: 'center' }}>
          <Text style={{ color: colors.redAccent, fontWeight: '700', fontSize: 15 }}>Back</Text>
        </TouchableOpacity>
      </SafeAreaView>
    </ScrollView>
  );
}
