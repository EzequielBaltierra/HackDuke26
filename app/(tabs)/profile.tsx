import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Image, ScrollView, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { fetchUserProfile } from '../../src/hooks/useProfile';
import { useAuth } from '../../src/hooks/useAuth';
import { colors } from '../../src/theme/colors';
import { fontFamily, type } from '../../src/theme/typography';
import { Badge, Discovery, Expedition, User } from '../../src/types';

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
  expeditions: Partial<Expedition>[];
};

export default function ProfileScreen() {
  const { currentUser, logout } = useAuth();
  const [profile, setProfile] = useState<Profile | null>(null);

  useEffect(() => {
    if (currentUser) {
      fetchUserProfile(currentUser.id).then(setProfile);
    }
  }, [currentUser]);

  if (!profile?.user) {
    return (
      <SafeAreaView style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.bg }}>
        <ActivityIndicator size="large" color={colors.greenAccent} />
      </SafeAreaView>
    );
  }

  const { user, badges, discoveries, expeditions } = profile;

  return (
    <ScrollView style={{ flex: 1, backgroundColor: colors.bg }}>
      <SafeAreaView>
        <View style={{ padding: 24, alignItems: 'center', borderBottomWidth: 1, borderBottomColor: colors.bgAccent }}>
          <View style={{
            width: 80, height: 80, borderRadius: 40,
            backgroundColor: colors.green, justifyContent: 'center', alignItems: 'center',
            marginBottom: 12, borderWidth: 2, borderColor: colors.greenAccent,
          }}>
            <Text style={{ fontSize: 36 }}>🌿</Text>
          </View>
          <Text style={[type.expeditionUserName, { fontSize: 28, color: colors.redAccent }]}>@{user.username}</Text>
          {user.bio ? (
            <Text style={{ fontFamily: fontFamily.crimson, fontSize: 15, color: colors.red, textAlign: 'center', marginTop: 4 }}>
              {user.bio}
            </Text>
          ) : null}
        </View>

        <View style={{ flexDirection: 'row', margin: 16, gap: 12 }}>
          <StatCard label="Points" value={user.total_points.toLocaleString()} emoji="⭐" />
          <StatCard label="Streak" value={`${user.streak}d`} emoji="🔥" />
          <StatCard label="Spots" value={discoveries.length.toString()} emoji="🔍" />
        </View>

        {badges.length > 0 ? (
          <View style={{ paddingHorizontal: 16, marginBottom: 8 }}>
            <Text style={{ fontFamily: fontFamily.crimsonBold, fontSize: 18, color: colors.redAccent, marginBottom: 10 }}>Badges</Text>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
              {badges.map(b => (
                <View key={b.id} style={{ backgroundColor: colors.bgAccent, borderRadius: 12, paddingHorizontal: 12, paddingVertical: 6 }}>
                  <Text style={{ fontFamily: fontFamily.crimsonSemi, fontSize: 13, color: colors.redAccent }}>
                    {BADGE_LABELS[b.badge_type] ?? b.badge_type}
                  </Text>
                </View>
              ))}
            </View>
          </View>
        ) : null}

        {discoveries.length > 0 ? (
          <View style={{ paddingHorizontal: 16, marginBottom: 8 }}>
            <Text style={{ fontFamily: fontFamily.crimsonBold, fontSize: 18, color: colors.redAccent, marginBottom: 10 }}>Discoveries</Text>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 4 }}>
              {discoveries.map(d => (
                d.image_url ? (
                  <Image key={d.id} source={{ uri: d.image_url }} style={{ width: 100, height: 100, borderRadius: 10 }} />
                ) : null
              ))}
            </View>
          </View>
        ) : null}

        {expeditions.length > 0 ? (
          <View style={{ paddingHorizontal: 16, marginBottom: 16 }}>
            <Text style={{ fontFamily: fontFamily.crimsonBold, fontSize: 18, color: colors.redAccent, marginBottom: 10 }}>Expeditions</Text>
            {expeditions.map(e => (
              <View key={e.id} style={{
                backgroundColor: colors.surface, borderRadius: 12, padding: 12, marginBottom: 8,
                flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
                borderWidth: 1, borderColor: colors.bgAccent,
              }}>
                <Text style={{ fontFamily: fontFamily.crimsonSemi, fontSize: 16, color: colors.redAccent, flex: 1 }}>{e.title}</Text>
                <Text style={{ fontFamily: fontFamily.crimsonBold, fontSize: 14, color: colors.greenAccent }}>+{e.points_earned}pts</Text>
              </View>
            ))}
          </View>
        ) : null}

        <TouchableOpacity
          onPress={logout}
          style={{ margin: 16, padding: 14, borderRadius: 12, backgroundColor: colors.red, alignItems: 'center' }}
        >
          <Text style={{ color: colors.bg, fontFamily: fontFamily.crimsonBold, fontSize: 16 }}>Sign Out</Text>
        </TouchableOpacity>
      </SafeAreaView>
    </ScrollView>
  );
}

function StatCard({ label, value, emoji }: { label: string; value: string; emoji: string }) {
  return (
    <View style={{
      flex: 1, backgroundColor: colors.surface, borderRadius: 14, padding: 14, alignItems: 'center',
      shadowColor: colors.text, shadowOpacity: 0.05, shadowRadius: 4, elevation: 1,
      borderWidth: 1, borderColor: colors.bgAccent,
    }}>
      <Text style={{ fontSize: 24 }}>{emoji}</Text>
      <Text style={{ fontFamily: fontFamily.crimsonBold, fontSize: 20, color: colors.greenAccent, marginTop: 4 }}>{value}</Text>
      <Text style={{ fontFamily: fontFamily.crimsonBold, fontSize: 10, color: colors.red, textTransform: 'uppercase', letterSpacing: 0.5 }}>{label}</Text>
    </View>
  );
}
