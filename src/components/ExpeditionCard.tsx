import { useRouter } from 'expo-router';
import React from 'react';
import { Image, Text, TouchableOpacity, View } from 'react-native';
import { colors } from '../theme/colors';
import { typeCard } from '../theme/typography';
import { Expedition } from '../types';

type Props = { expedition: Expedition };

const typeEmoji: Record<string, string> = {
  trail: '🥾', hike: '⛰', scenic_view: '🌄', walk: '🚶', nature_spot: '🌿',
};

function formatDuration(seconds: number | null) {
  if (seconds == null || seconds <= 0) return null;
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  if (h > 0) return `${h}h ${m}m`;
  return `${m}m`;
}

export function ExpeditionCard({ expedition }: Props) {
  const router = useRouter();
  const durationLabel = formatDuration(expedition.duration_seconds);

  return (
    <TouchableOpacity
      onPress={() => router.push(`/expedition/${expedition.id}`)}
      style={{
        backgroundColor: colors.surface,
        borderRadius: 16,
        marginHorizontal: 12,
        marginVertical: 6,
        overflow: 'hidden',
        shadowColor: colors.text,
        shadowOpacity: 0.07,
        shadowRadius: 8,
        elevation: 2,
        borderWidth: 1,
        borderColor: colors.bgAccent,
      }}
    >
      {expedition.photo_urls[0] ? (
        <Image source={{ uri: expedition.photo_urls[0] }} style={{ width: '100%', height: 180 }} resizeMode="cover" />
      ) : (
        <View style={{ width: '100%', height: 120, backgroundColor: colors.bg, justifyContent: 'center', alignItems: 'center' }}>
          <Text style={{ fontSize: 48 }}>{typeEmoji[expedition.type] ?? '🗺'}</Text>
        </View>
      )}

      <View style={{ padding: 14 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 6 }}>
          <View style={{
            width: 36, height: 36, borderRadius: 18,
            backgroundColor: colors.bg, justifyContent: 'center', alignItems: 'center',
            borderWidth: 1, borderColor: colors.bgAccent, marginRight: 8,
          }}>
            <Text style={{ fontSize: 16 }}>🌿</Text>
          </View>
          <Text style={[typeCard.userRowName, { flex: 1 }]}>
            {expedition.users?.username ?? 'Explorer'}
          </Text>
          {expedition.points_earned > 0 ? (
            <Text style={typeCard.userRowPoints}>
              +{expedition.points_earned} pts
            </Text>
          ) : null}
        </View>

        <Text style={[typeCard.expeditionTitle, { marginBottom: 6 }]}>
          {typeEmoji[expedition.type] ?? '🗺'} {expedition.title}
        </Text>

        {expedition.vibe_tags.length > 0 ? (
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginBottom: 8 }}>
            {expedition.vibe_tags.slice(0, 4).map(tag => (
              <View key={tag} style={{
                backgroundColor: colors.bg, borderRadius: 8, paddingHorizontal: 10, paddingVertical: 3,
                borderWidth: 1, borderColor: colors.bgAccent,
              }}>
                <Text style={typeCard.vibeChip}>{tag}</Text>
              </View>
            ))}
          </View>
        ) : null}

        {expedition.description ? (
          <Text style={[typeCard.expeditionDescription, { marginBottom: 6, opacity: 0.95 }]} numberOfLines={2}>
            {expedition.description}
          </Text>
        ) : null}

        <Text style={typeCard.meta}>
          {new Date(expedition.created_at).toLocaleDateString()}
          {durationLabel ? ` · ${durationLabel}` : ''}
          {expedition.distance ? ` · ${expedition.distance}km` : ''}
          {expedition.location ? ` · ${expedition.location}` : ''}
        </Text>
      </View>
    </TouchableOpacity>
  );
}
