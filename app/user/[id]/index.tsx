import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator, Image, ScrollView, Text, TouchableOpacity, View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { fetchUserProfile } from '../../../src/hooks/useProfile';
import { useAuth } from '../../../src/hooks/useAuth';
import { useViewerFollowingIds } from '../../../src/hooks/useFollows';
import { ExpeditionCard } from '../../../src/components/ExpeditionCard';
import { colors } from '../../../src/theme/colors';
import { textStyles } from '../../../src/theme/typography';
import { Badge, Discovery, Expedition, User } from '../../../src/types';

const BADGE_LABELS: Record<string, string> = {
  first_discovery: '🌿 First Discovery',
  trailblazer: '🥾 Trailblazer',
  explorer: '⛰ Explorer',
  rare_finder: '🌟 Rare Finder',
  botanist: '🌿 Botanist',
  entomologist: '🦋 Entomologist',
  fungi_hunter: '🍄 Fungi Hunter',
  collector: '📚 Collector',
  naturalist: '🌎 Naturalist',
  summit_seeker: '🏔️ Summit Seeker',
  long_hauler: '🚶 Long Hauler',
  weekend_warrior: '🌅 Weekend Warrior',
  trailhead: '🗺️ Trailhead',
  social_explorer: '👥 Social Explorer',
  trail_buddy: '🤝 Trail Buddy',
  on_a_roll: '🔥 On a Roll',
  unstoppable: '⚡ Unstoppable',
  night_owl: '🌙 Night Owl',
};

type Profile = {
  user: User | null;
  badges: Badge[];
  discoveries: Partial<Discovery>[];
  expeditions: Expedition[];
  followerCount: number;
  followingCount: number;
};

export default function PublicProfileScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { currentUser } = useAuth();
  const { followingIds, toggleFollowing } = useViewerFollowingIds(currentUser?.id);

  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [followerCount, setFollowerCount] = useState(0);

  const profileUserId = id as string;
  const isOwnProfile = currentUser?.id === profileUserId;
  const isFollowing = followingIds.has(profileUserId);

  useEffect(() => {
    if (!profileUserId) return;
    setLoading(true);
    fetchUserProfile(profileUserId)
      .then(data => {
        if (!data.user) {
          setNotFound(true);
        } else {
          setProfile(data);
          setFollowerCount(data.followerCount);
        }
      })
      .catch(() => setNotFound(true))
      .finally(() => setLoading(false));
  }, [profileUserId]);

  async function handleFollowToggle() {
    await toggleFollowing(profileUserId);
    setFollowerCount(prev => isFollowing ? prev - 1 : prev + 1);
  }

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

  const { user, badges, discoveries, expeditions, followingCount } = profile;

  return (
    <ScrollView style={{ flex: 1, backgroundColor: colors.bgPrimary }}>
      <SafeAreaView>
        {/* Back */}
        <TouchableOpacity onPress={() => router.back()} style={{ paddingHorizontal: 16, paddingTop: 12 }}>
          <Text style={{ color: colors.greenBase, fontSize: 15, fontWeight: '700' }}>← Back</Text>
        </TouchableOpacity>

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
            <Text style={[textStyles.postDescription, { color: colors.redBase, textAlign: 'center', marginTop: 4, marginBottom: 4 }]}>
              {user.bio}
            </Text>
          ) : null}

          {/* Follower / Following counts */}
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', marginTop: 10, paddingHorizontal: 8 }}>
            <TouchableOpacity
              onPress={() => router.push({ pathname: '/user/[id]/followers', params: { id: user.id } })}
              activeOpacity={0.7}
            >
              <Text style={{ fontSize: 15, textAlign: 'center' }}>
                <Text style={{ fontWeight: '800', color: colors.redAccent }}>{followerCount}</Text>
                <Text style={{ fontWeight: '400', color: colors.redBase }}> Followers</Text>
              </Text>
            </TouchableOpacity>
            <Text style={{ fontSize: 15, color: colors.redBase, marginHorizontal: 6 }}>|</Text>
            <TouchableOpacity
              onPress={() => router.push({ pathname: '/user/[id]/following', params: { id: user.id } })}
              activeOpacity={0.7}
            >
              <Text style={{ fontSize: 15, textAlign: 'center' }}>
                <Text style={{ fontWeight: '800', color: colors.redAccent }}>{followingCount}</Text>
                <Text style={{ fontWeight: '400', color: colors.redBase }}> Following</Text>
              </Text>
            </TouchableOpacity>
          </View>

          {/* Follow / Unfollow button */}
          {!isOwnProfile ? (
            <TouchableOpacity
              onPress={handleFollowToggle}
              style={{
                marginTop: 14,
                paddingHorizontal: 32,
                paddingVertical: 10,
                borderRadius: 20,
                backgroundColor: isFollowing ? colors.bgAccent : colors.greenBase,
                borderWidth: 1.5,
                borderColor: isFollowing ? colors.greenBase : colors.greenBase,
              }}
            >
              <Text style={{
                fontWeight: '700',
                fontSize: 14,
                color: isFollowing ? colors.greenBase : colors.bgPrimary,
              }}>
                {isFollowing ? 'Following' : 'Follow'}
              </Text>
            </TouchableOpacity>
          ) : null}
        </View>

        {/* Stats */}
        <View style={{ flexDirection: 'row', margin: 16, gap: 12 }}>
          {[
            { emoji: '⭐', value: user.total_points.toLocaleString(), label: 'Points' },
            { emoji: '🔥', value: `${user.streak}d`, label: 'Streak' },
            { emoji: '🔍', value: discoveries.length.toString(), label: 'Spots' },
            { emoji: '🥾', value: expeditions.length.toString(), label: 'Trips' },
          ].map(({ emoji, value, label }) => (
            <View key={label} style={{ flex: 1, backgroundColor: colors.surface, borderRadius: 14, padding: 10, alignItems: 'center', borderWidth: 1, borderColor: colors.bgAccent }}>
              <Text style={{ fontSize: 20 }}>{emoji}</Text>
              <Text style={{ fontSize: 16, fontWeight: '800', color: colors.greenBase, marginTop: 2 }}>{value}</Text>
              <Text style={{ fontSize: 9, color: colors.redBase, textTransform: 'uppercase', letterSpacing: 0.5 }}>{label}</Text>
            </View>
          ))}
        </View>

        {/* Badges */}
        {badges.length > 0 ? (
          <View style={{ paddingHorizontal: 16, marginBottom: 16 }}>
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
          <View style={{ paddingHorizontal: 16, marginBottom: 16 }}>
            <Text style={[textStyles.postTitle, { marginBottom: 10 }]}>Discoveries</Text>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 4 }}>
              {discoveries.map(d =>
                d.image_url ? (
                  <TouchableOpacity key={d.id} onPress={() => router.push(`/discovery/${d.id}`)}>
                    <Image source={{ uri: d.image_url }} style={{ width: 100, height: 100, borderRadius: 10 }} />
                  </TouchableOpacity>
                ) : null
              )}
            </View>
          </View>
        ) : null}

        {/* Expeditions */}
        {expeditions.length > 0 ? (
          <View style={{ marginBottom: 24 }}>
            <Text style={[textStyles.postTitle, { paddingHorizontal: 16, marginBottom: 10 }]}>Expeditions</Text>
            {expeditions.map(e => (
              <ExpeditionCard
                key={e.id}
                expedition={e}
                viewerUserId={currentUser?.id}
                followingIds={followingIds}
                onToggleFollow={toggleFollowing}
              />
            ))}
          </View>
        ) : null}
      </SafeAreaView>
    </ScrollView>
  );
}
