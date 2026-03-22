import { useRouter } from 'expo-router';
import React from 'react';
import { Image, Text, TouchableOpacity, View } from 'react-native';
import { Expedition } from '../types';

type Props = { expedition: Expedition };

const typeEmoji: Record<string, string> = {
  trail: '🥾', hike: '⛰', scenic_view: '🌄', walk: '🚶', nature_spot: '🌿',
};

export function ExpeditionCard({ expedition }: Props) {
  const router = useRouter();

  return (
    <TouchableOpacity
      onPress={() => router.push(`/expedition/${expedition.id}`)}
      style={{
        backgroundColor: '#ffffff',
        borderRadius: 16,
        marginHorizontal: 12,
        marginVertical: 6,
        overflow: 'hidden',
        shadowColor: '#110703',
        shadowOpacity: 0.07,
        shadowRadius: 8,
        elevation: 2,
        borderWidth: 1,
        borderColor: '#c7af94',
      }}
    >
      {expedition.photo_urls[0] ? (
        <Image source={{ uri: expedition.photo_urls[0] }} style={{ width: '100%', height: 180 }} resizeMode="cover" />
      ) : (
        <View style={{ width: '100%', height: 120, backgroundColor: '#eaded0', justifyContent: 'center', alignItems: 'center' }}>
          <Text style={{ fontSize: 48 }}>{typeEmoji[expedition.type] ?? '🗺'}</Text>
        </View>
      )}

      <View style={{ padding: 14 }}>
        {/* Header: user + points */}
        <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 6 }}>
          <View style={{
            width: 36, height: 36, borderRadius: 18,
            backgroundColor: '#eaded0', justifyContent: 'center', alignItems: 'center',
            borderWidth: 1, borderColor: '#c7af94', marginRight: 8,
          }}>
            <Text style={{ fontSize: 16 }}>🌿</Text>
          </View>
          <Text style={{ fontSize: 15, fontWeight: '600', color: '#110703', flex: 1 }}>
            {expedition.users?.username ?? 'Explorer'}
          </Text>
          {expedition.points_earned > 0 ? (
            <Text style={{ fontSize: 13, color: '#4e705e', fontWeight: '700' }}>
              +{expedition.points_earned} pts
            </Text>
          ) : null}
        </View>

        {/* Title */}
        <Text style={{ fontSize: 17, fontWeight: '700', color: '#361319', marginBottom: 6 }}>
          {typeEmoji[expedition.type] ?? '🗺'} {expedition.title}
        </Text>

        {/* Vibe tags */}
        {expedition.vibe_tags.length > 0 ? (
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginBottom: 8 }}>
            {expedition.vibe_tags.slice(0, 4).map(tag => (
              <View key={tag} style={{
                backgroundColor: '#eaded0', borderRadius: 8, paddingHorizontal: 10, paddingVertical: 3,
                borderWidth: 1, borderColor: '#c7af94',
              }}>
                <Text style={{ fontSize: 12, color: '#361319' }}>{tag}</Text>
              </View>
            ))}
          </View>
        ) : null}

        {/* Description */}
        {expedition.description ? (
          <Text style={{ fontSize: 14, color: '#110703', marginBottom: 6, opacity: 0.8 }} numberOfLines={2}>
            {expedition.description}
          </Text>
        ) : null}

        {/* Meta */}
        <Text style={{ fontSize: 12, color: '#6d3a3c', opacity: 0.7 }}>
          {new Date(expedition.created_at).toLocaleDateString()}
          {expedition.distance ? ` · ${expedition.distance}km` : ''}
          {expedition.location ? ` · ${expedition.location}` : ''}
        </Text>
      </View>
    </TouchableOpacity>
  );
}
