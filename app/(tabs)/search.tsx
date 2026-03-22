import React, { useEffect, useMemo, useState } from 'react';
import { Image, SectionList, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { Icon } from '../../src/components/Icon';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useGlobalSearchParams, useLocalSearchParams, useRouter } from 'expo-router';
import { DiscoveryCard } from '../../src/components/DiscoveryCard';
import { ExpeditionCard } from '../../src/components/ExpeditionCard';
import { TabBarIcon } from '../../src/components/icons/TabBarIcon';
import { useAuth } from '../../src/hooks/useAuth';
import { useDiscoveries } from '../../src/hooks/useDiscoveries';
import { useExpeditions } from '../../src/hooks/useExpeditions';
import { useViewerFollowingIds } from '../../src/hooks/useFollows';
import { hrefUserProfile } from '../../src/lib/routes';
import { supabase } from '../../src/lib/supabase';
import { colors } from '../../src/theme/colors';
import { ff, textStyles } from '../../src/theme/typography';
import { Discovery, Expedition, User } from '../../src/types';

function normalize(q: string) {
  return q.trim().toLowerCase();
}

function discoveryMatches(d: Discovery, q: string) {
  if (!q) return true;
  const hay = [d.common_name, d.scientific_name, d.caption, d.users?.username, d.category]
    .filter(Boolean)
    .join(' ')
    .toLowerCase();
  return hay.includes(q);
}

function expeditionMatches(e: Expedition, q: string) {
  if (!q) return true;
  const hay = [e.title, e.description, e.location, e.type, e.users?.username, ...(e.vibe_tags ?? [])]
    .filter(Boolean)
    .join(' ')
    .toLowerCase();
  return hay.includes(q);
}

function UserResultRow({ user, onPress }: { user: User; onPress: () => void }) {
  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.85}
      style={{
        flexDirection: 'row', alignItems: 'center',
        backgroundColor: colors.surface,
        marginHorizontal: 12, marginVertical: 4,
        borderRadius: 14, padding: 14,
        borderWidth: 1, borderColor: colors.bgAccent,
      }}
    >
      {user.profile_photo_url ? (
        <Image source={{ uri: user.profile_photo_url }} style={{ width: 40, height: 40, borderRadius: 20, marginRight: 12 }} />
      ) : (
        <View style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: colors.greenBase, justifyContent: 'center', alignItems: 'center', marginRight: 12 }}>
          <Icon name="clover" size={18} color={colors.bgPrimary} />
        </View>
      )}
      <View style={{ flex: 1 }}>
        <Text style={[textStyles.userName, { fontSize: 16 }]}>@{user.username}</Text>
        <Text style={{ fontSize: 12, color: colors.redBase }}>{user.total_points.toLocaleString()} pts · {user.streak}d streak</Text>
      </View>
      <Text style={{ fontSize: 18, color: colors.bgAccent }}>›</Text>
    </TouchableOpacity>
  );
}

export default function SearchScreen() {
  const router = useRouter();
  const localParams = useLocalSearchParams<{ vibe?: string | string[] }>();
  const globalParams = useGlobalSearchParams<{ vibe?: string | string[] }>();
  const { currentUser } = useAuth();
  const { followingIds, toggleFollowing } = useViewerFollowingIds(currentUser?.id);
  const [query, setQuery] = useState('');
  const [userResults, setUserResults] = useState<User[]>([]);
  const { discoveries } = useDiscoveries();
  const { expeditions } = useExpeditions();

  const q = useMemo(() => normalize(query), [query]);

  const rawVibe = localParams.vibe ?? globalParams.vibe;
  const vibeParam = Array.isArray(rawVibe) ? rawVibe[0] : rawVibe;
  useEffect(() => {
    if (vibeParam) setQuery(vibeParam);
  }, [vibeParam]);

  const filteredDiscoveries = useMemo(() => {
    if (!q) return [];
    return discoveries.filter(d => discoveryMatches(d, q));
  }, [discoveries, q]);

  const filteredExpeditions = useMemo(() => {
    if (!q) return [];
    return expeditions.filter(e => expeditionMatches(e, q));
  }, [expeditions, q]);

  const sections = useMemo(() => {
    const out: {
      title: string;
      data: { kind: 'discovery' | 'expedition'; item: Discovery | Expedition }[];
    }[] = [];
    if (filteredExpeditions.length) {
      out.push({
        title: 'Expeditions',
        data: filteredExpeditions.map(item => ({ kind: 'expedition' as const, item })),
      });
    }
    if (filteredDiscoveries.length) {
      out.push({
        title: 'Discoveries',
        data: filteredDiscoveries.map(item => ({ kind: 'discovery' as const, item })),
      });
    }
    return out;
  }, [filteredDiscoveries, filteredExpeditions]);

  useEffect(() => {
    if (q.length < 2) {
      setUserResults([]);
      return;
    }
    const timer = setTimeout(async () => {
      const { data } = await supabase
        .from('users')
        .select('id, username, total_points, streak, profile_photo_url, bio')
        .ilike('username', `%${q}%`)
        .limit(10);
      setUserResults((data ?? []) as User[]);
    }, 300);
    return () => clearTimeout(timer);
  }, [q]);

  const hasAnyData = discoveries.length > 0 || expeditions.length > 0;

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.bgPrimary }} edges={['top']}>
      <View style={{ paddingHorizontal: 16, paddingTop: 8, paddingBottom: 12 }}>
        <Text
          style={{
            fontFamily: ff.faustinaSemi,
            fontSize: 13,
            color: colors.redBase,
            letterSpacing: 1.2,
            textTransform: 'uppercase',
            marginBottom: 10,
          }}
        >
          Search
        </Text>
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            backgroundColor: colors.surface,
            borderRadius: 16,
            borderWidth: 1,
            borderColor: colors.blueAccent,
            paddingHorizontal: 14,
            minHeight: 48,
          }}
        >
          <View style={{ marginRight: 8 }}>
            <TabBarIcon name="magnifyingGlass" color={colors.blueAccent} size={22} />
          </View>
          <TextInput
            value={query}
            onChangeText={setQuery}
            placeholder="Species, places, explorers…"
            placeholderTextColor={colors.bgAccent}
            style={{
              flex: 1,
              fontFamily: ff.crimson,
              fontSize: 18,
              color: colors.textPrimary,
              paddingVertical: 10,
            }}
            autoCapitalize="none"
            autoCorrect={false}
          />
        </View>
      </View>

      {userResults.length > 0 ? (
        <View>
          <Text style={{ fontFamily: ff.crimsonBold, fontSize: 18, color: colors.redAccent, paddingHorizontal: 16, paddingTop: 8, paddingBottom: 4 }}>
            People
          </Text>
          {userResults.map(u => (
            <UserResultRow
              key={u.id}
              user={u}
              onPress={() => router.push(hrefUserProfile(u.id))}
            />
          ))}
        </View>
      ) : null}

      <SectionList
        style={{ flex: 1 }}
        sections={sections}
        stickySectionHeadersEnabled={false}
        keyExtractor={row => `${row.kind}-${row.item.id}`}
        renderItem={({ item }) =>
          item.kind === 'expedition' ? (
            <ExpeditionCard
              expedition={item.item as Expedition}
              viewerUserId={currentUser?.id}
              followingIds={followingIds}
              onToggleFollow={toggleFollowing}
            />
          ) : (
            <DiscoveryCard
              discovery={item.item as Discovery}
              viewerUserId={currentUser?.id}
              followingIds={followingIds}
              onToggleFollow={toggleFollowing}
            />
          )
        }
        renderSectionHeader={({ section: { title } }) => (
          <Text
            style={{
              fontFamily: ff.crimsonBold,
              fontSize: 18,
              color: colors.redAccent,
              paddingHorizontal: 16,
              paddingTop: 8,
              paddingBottom: 4,
            }}
          >
            {title}
          </Text>
        )}
        contentContainerStyle={{ paddingBottom: 24 }}
        ListEmptyComponent={
          !hasAnyData ? (
            <View style={{ alignItems: 'center', marginTop: 48, paddingHorizontal: 32 }}>
              <Text style={[textStyles.postDescription, { textAlign: 'center' }]}>
                Nothing to search yet. Check back after the community posts expeditions and discoveries.
              </Text>
            </View>
          ) : !q ? (
            <View style={{ alignItems: 'center', marginTop: 48, paddingHorizontal: 32 }}>
              <Text style={[textStyles.postTitle, { textAlign: 'center', marginBottom: 8 }]}>Search the community</Text>
              <Text style={[textStyles.postDescription, { textAlign: 'center', opacity: 0.9 }]}>
                Enter a species name, place, or explorer to filter expeditions and discoveries.
              </Text>
            </View>
          ) : (
            <View style={{ alignItems: 'center', marginTop: 48, paddingHorizontal: 32 }}>
              <Text style={[textStyles.postTitle, { marginBottom: 8 }]}>No matches</Text>
              <Text style={[textStyles.postDescription, { textAlign: 'center', opacity: 0.9 }]}>
                Try another keyword or browse the feed.
              </Text>
            </View>
          )
        }
      />
    </SafeAreaView>
  );
}
