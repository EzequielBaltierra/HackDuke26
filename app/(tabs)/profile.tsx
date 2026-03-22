import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Image, ScrollView, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { fetchUserProfile } from '../../src/hooks/useProfile';
import { useAuth } from '../../src/hooks/useAuth';
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
      <SafeAreaView style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#eaded0' }}>
        <ActivityIndicator size="large" color="#4e705e" />
      </SafeAreaView>
    );
  }

  const { user, badges, discoveries, expeditions } = profile;

  return (
    <ScrollView style={{ flex: 1, backgroundColor: '#eaded0' }}>
      <SafeAreaView>
        {/* Header */}
        <View style={{ padding: 24, alignItems: 'center', borderBottomWidth: 1, borderBottomColor: '#c7af94' }}>
          <View style={{
            width: 80, height: 80, borderRadius: 40,
            backgroundColor: '#4e705e', justifyContent: 'center', alignItems: 'center',
            marginBottom: 12, borderWidth: 2, borderColor: '#c7af94',
          }}>
            <Text style={{ fontSize: 36 }}>🌿</Text>
          </View>
          <Text style={{ fontSize: 22, fontWeight: '800', color: '#361319' }}>@{user.username}</Text>
          {user.bio ? (
            <Text style={{ fontSize: 14, color: '#6d3a3c', textAlign: 'center', marginTop: 4 }}>{user.bio}</Text>
          ) : null}
        </View>

        {/* Stats */}
        <View style={{ flexDirection: 'row', margin: 16, gap: 12 }}>
          <StatCard label="Points" value={user.total_points.toLocaleString()} emoji="⭐" />
          <StatCard label="Streak" value={`${user.streak}d`} emoji="🔥" />
          <StatCard label="Spots" value={discoveries.length.toString()} emoji="🔍" />
        </View>

        {/* Badges */}
        {badges.length > 0 ? (
          <View style={{ paddingHorizontal: 16, marginBottom: 8 }}>
            <Text style={{ fontSize: 16, fontWeight: '700', color: '#361319', marginBottom: 10 }}>Badges</Text>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
              {badges.map(b => (
                <View key={b.id} style={{ backgroundColor: '#c7af94', borderRadius: 12, paddingHorizontal: 12, paddingVertical: 6 }}>
                  <Text style={{ fontSize: 13, fontWeight: '600', color: '#361319' }}>
                    {BADGE_LABELS[b.badge_type] ?? b.badge_type}
                  </Text>
                </View>
              ))}
            </View>
          </View>
        ) : null}

        {/* Discovery grid */}
        {discoveries.length > 0 ? (
          <View style={{ paddingHorizontal: 16, marginBottom: 8 }}>
            <Text style={{ fontSize: 16, fontWeight: '700', color: '#361319', marginBottom: 10 }}>Discoveries</Text>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 4 }}>
              {discoveries.map(d => (
                d.image_url ? (
                  <Image key={d.id} source={{ uri: d.image_url }} style={{ width: 100, height: 100, borderRadius: 10 }} />
                ) : null
              ))}
            </View>
          </View>
        ) : null}

        {/* Expeditions list */}
        {expeditions.length > 0 ? (
          <View style={{ paddingHorizontal: 16, marginBottom: 16 }}>
            <Text style={{ fontSize: 16, fontWeight: '700', color: '#361319', marginBottom: 10 }}>Expeditions</Text>
            {expeditions.map(e => (
              <View key={e.id} style={{
                backgroundColor: 'white', borderRadius: 12, padding: 12, marginBottom: 8,
                flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
                borderWidth: 1, borderColor: '#c7af94',
              }}>
                <Text style={{ fontSize: 15, color: '#361319', fontWeight: '600', flex: 1 }}>{e.title}</Text>
                <Text style={{ fontSize: 13, color: '#4e705e', fontWeight: '700' }}>+{e.points_earned}pts</Text>
              </View>
            ))}
          </View>
        ) : null}

        <TouchableOpacity
          onPress={logout}
          style={{ margin: 16, padding: 14, borderRadius: 12, backgroundColor: '#6d3a3c', alignItems: 'center' }}
        >
          <Text style={{ color: '#eaded0', fontWeight: '700', fontSize: 15 }}>Sign Out</Text>
        </TouchableOpacity>
      </SafeAreaView>
    </ScrollView>
  );
}

function StatCard({ label, value, emoji }: { label: string; value: string; emoji: string }) {
  return (
    <View style={{
      flex: 1, backgroundColor: 'white', borderRadius: 14, padding: 14, alignItems: 'center',
      shadowColor: '#110703', shadowOpacity: 0.05, shadowRadius: 4, elevation: 1,
      borderWidth: 1, borderColor: '#c7af94',
    }}>
      <Text style={{ fontSize: 24 }}>{emoji}</Text>
      <Text style={{ fontSize: 20, fontWeight: '800', color: '#4e705e', marginTop: 4 }}>{value}</Text>
      <Text style={{ fontSize: 10, color: '#6d3a3c', textTransform: 'uppercase', letterSpacing: 0.5 }}>{label}</Text>
    </View>
  );
}
