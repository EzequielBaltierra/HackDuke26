import { MaterialCommunityIcons } from '@expo/vector-icons';
import React, { useMemo, useState } from 'react';
import {
  SectionList,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { DiscoveryCard } from '../../src/components/DiscoveryCard';
import { ExpeditionCard } from '../../src/components/ExpeditionCard';
import { useDiscoveries } from '../../src/hooks/useDiscoveries';
import { useExpeditions } from '../../src/hooks/useExpeditions';
import { colors } from '../../src/theme/colors';
import { fontFamily, type } from '../../src/theme/typography';
import { Discovery, Expedition } from '../../src/types';

function normalize(q: string) {
  return q.trim().toLowerCase();
}

function discoveryMatches(d: Discovery, q: string) {
  if (!q) return true;
  const hay = [
    d.common_name,
    d.scientific_name,
    d.caption,
    d.users?.username,
    d.category,
  ]
    .filter(Boolean)
    .join(' ')
    .toLowerCase();
  return hay.includes(q);
}

function expeditionMatches(e: Expedition, q: string) {
  if (!q) return true;
  const hay = [
    e.title,
    e.description,
    e.location,
    e.type,
    e.users?.username,
    ...(e.vibe_tags ?? []),
  ]
    .filter(Boolean)
    .join(' ')
    .toLowerCase();
  return hay.includes(q);
}

export default function SearchScreen() {
  const [query, setQuery] = useState('');
  const { discoveries } = useDiscoveries();
  const { expeditions } = useExpeditions();

  const q = useMemo(() => normalize(query), [query]);

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

  const hasAnyData = discoveries.length > 0 || expeditions.length > 0;

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.bg }} edges={['top']}>
      <View style={{ paddingHorizontal: 16, paddingTop: 8, paddingBottom: 12 }}>
        <Text
          style={{
            fontFamily: fontFamily.title,
            fontSize: 13,
            color: colors.red,
            letterSpacing: 1.2,
            textTransform: 'uppercase',
            opacity: 0.9,
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
          <MaterialCommunityIcons name="magnify" size={22} color={colors.blueAccent} style={{ marginRight: 8 }} />
          <TextInput
            value={query}
            onChangeText={setQuery}
            placeholder="Species, places, explorers…"
            placeholderTextColor={colors.bgAccent}
            style={{
              flex: 1,
              fontFamily: fontFamily.crimson,
              fontSize: 18,
              color: colors.text,
              paddingVertical: 10,
            }}
            autoCapitalize="none"
            autoCorrect={false}
            clearButtonMode="while-editing"
          />
        </View>
      </View>

      <SectionList
        sections={sections}
        keyExtractor={row => `${row.kind}-${row.item.id}`}
        renderItem={({ item }) =>
          item.kind === 'expedition' ? (
            <ExpeditionCard expedition={item.item as Expedition} />
          ) : (
            <DiscoveryCard discovery={item.item as Discovery} />
          )
        }
        renderSectionHeader={({ section: { title } }) => (
          <Text
            style={{
              fontFamily: fontFamily.crimsonBold,
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
              <Text style={{ fontFamily: fontFamily.crimson, fontSize: 16, color: colors.red, textAlign: 'center', opacity: 0.9 }}>
                Nothing to search yet. Check back after the community posts expeditions and discoveries.
              </Text>
            </View>
          ) : !q ? (
            <View style={{ alignItems: 'center', marginTop: 48, paddingHorizontal: 32 }}>
              <MaterialCommunityIcons name="magnify" size={48} color={colors.bgAccent} />
              <Text style={[type.navTitle, { marginTop: 16, textAlign: 'center', fontSize: 20 }]}>
                Search the community
              </Text>
              <Text style={{ fontFamily: fontFamily.crimson, fontSize: 16, color: colors.red, marginTop: 8, textAlign: 'center', opacity: 0.9 }}>
                Enter a species name, place, or explorer to filter expeditions and discoveries.
              </Text>
            </View>
          ) : (
            <View style={{ alignItems: 'center', marginTop: 48, paddingHorizontal: 32 }}>
              <MaterialCommunityIcons name="magnify" size={48} color={colors.bgAccent} />
              <Text style={[type.navTitle, { marginTop: 16, fontSize: 20 }]}>
                No matches
              </Text>
              <Text style={{ fontFamily: fontFamily.crimson, fontSize: 16, color: colors.red, marginTop: 8, textAlign: 'center', opacity: 0.85 }}>
                Try another keyword or browse the feed.
              </Text>
            </View>
          )
        }
      />
    </SafeAreaView>
  );
}
