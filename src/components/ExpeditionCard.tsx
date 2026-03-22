import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import { Image, Text, TouchableOpacity, View } from 'react-native';
import { Expedition } from '../types';

type Props = { expedition: Expedition };

function formatDuration(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${String(s).padStart(2, '0')}`;
}

export function ExpeditionCard({ expedition }: Props) {
  const router = useRouter();
  const [photoIndex, setPhotoIndex] = useState(0);
  const photos = expedition.photo_urls ?? [];

  const distanceStr = expedition.distance ? `${expedition.distance} miles` : null;
  const durationStr = expedition.duration_seconds ? formatDuration(expedition.duration_seconds) : null;

  return (
    <TouchableOpacity
      activeOpacity={0.95}
      onPress={() => router.push(`/expedition/${expedition.id}`)}
      style={{
        backgroundColor: '#ede5d8',
        borderRadius: 20,
        marginHorizontal: 12,
        marginVertical: 8,
        overflow: 'hidden',
        shadowColor: '#110703',
        shadowOpacity: 0.1,
        shadowRadius: 10,
        elevation: 3,
      }}
    >
      {/* Header */}
      <View style={{ padding: 16, paddingBottom: 10 }}>
        {/* Avatar row */}
        <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 10 }}>
          <View style={{
            width: 44, height: 44, borderRadius: 22,
            backgroundColor: '#c7af94', justifyContent: 'center', alignItems: 'center',
            marginRight: 10, borderWidth: 1.5, borderColor: '#6d3a3c',
          }}>
            <Text style={{ fontSize: 22 }}>👤</Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={{ fontSize: 16, fontWeight: '700', color: '#110703' }}>
              {expedition.users?.username ?? 'Explorer'}
            </Text>
          </View>
          <Text style={{ fontSize: 13, fontWeight: '700', color: '#361319', marginRight: 12 }}>
            {(expedition.users?.total_points ?? 0).toLocaleString()} pts
          </Text>
          <View style={{
            width: 28, height: 28, borderRadius: 14,
            borderWidth: 2, borderColor: '#361319',
            justifyContent: 'center', alignItems: 'center',
          }}>
            <Text style={{ fontSize: 18, color: '#361319', marginTop: -2 }}>+</Text>
          </View>
        </View>

        {/* Title */}
        <Text style={{ fontSize: 18, fontWeight: '800', color: '#110703', marginBottom: 3 }}>
          {expedition.title}
        </Text>

        {/* Location · Date */}
        <Text style={{ fontSize: 13, fontWeight: '700', color: '#361319', marginBottom: 10, opacity: 0.8 }}>
          {[expedition.location, new Date(expedition.created_at).toLocaleDateString()].filter(Boolean).join(' · ')}
        </Text>

        {/* Vibe tags */}
        {expedition.vibe_tags?.length > 0 ? (
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginBottom: 10 }}>
            {expedition.vibe_tags.slice(0, 4).map(tag => (
              <View key={tag} style={{
                borderRadius: 20, paddingHorizontal: 12, paddingVertical: 4,
                borderWidth: 1.5, borderColor: '#6d3a3c',
              }}>
                <Text style={{ fontSize: 12, color: '#361319', fontWeight: '500' }}>{tag}</Text>
              </View>
            ))}
          </View>
        ) : null}

        {/* Description */}
        {expedition.description ? (
          <Text style={{ fontSize: 14, color: '#110703', opacity: 0.7, lineHeight: 20 }} numberOfLines={3}>
            {expedition.description}
          </Text>
        ) : null}
      </View>

      {/* Photo with carousel arrows */}
      {photos.length > 0 ? (
        <View>
          <Image
            source={{ uri: photos[photoIndex] }}
            style={{ width: '100%', height: 220 }}
            resizeMode="cover"
          />
          {photos.length > 1 ? (
            <>
              <TouchableOpacity
                onPress={() => setPhotoIndex(i => Math.max(0, i - 1))}
                style={{
                  position: 'absolute', left: 12, top: '50%', marginTop: -18,
                  width: 36, height: 36, borderRadius: 18,
                  backgroundColor: 'rgba(0,0,0,0.35)',
                  justifyContent: 'center', alignItems: 'center',
                }}
              >
                <Text style={{ color: 'white', fontSize: 22, marginTop: -2 }}>‹</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => setPhotoIndex(i => Math.min(photos.length - 1, i + 1))}
                style={{
                  position: 'absolute', right: 12, top: '50%', marginTop: -18,
                  width: 36, height: 36, borderRadius: 18,
                  backgroundColor: 'rgba(0,0,0,0.35)',
                  justifyContent: 'center', alignItems: 'center',
                }}
              >
                <Text style={{ color: 'white', fontSize: 22, marginTop: -2 }}>›</Text>
              </TouchableOpacity>
            </>
          ) : null}
        </View>
      ) : null}

      {/* Stats bar */}
      {(distanceStr || durationStr || expedition.points_earned > 0) ? (
        <View style={{
          flexDirection: 'row', alignItems: 'center',
          paddingHorizontal: 16, paddingVertical: 12,
          backgroundColor: '#e2d6c5', gap: 6,
        }}>
          {distanceStr ? (
            <Text style={{ fontSize: 14, fontWeight: '700', color: '#110703' }}>{distanceStr}</Text>
          ) : null}
          {distanceStr && durationStr ? (
            <Text style={{ color: '#6d3a3c', opacity: 0.4, fontSize: 14 }}> | </Text>
          ) : null}
          {durationStr ? (
            <Text style={{ fontSize: 14, fontWeight: '700', color: '#110703' }}>{durationStr}</Text>
          ) : null}
          <View style={{ flex: 1 }} />
          {expedition.points_earned > 0 ? (
            <Text style={{ fontSize: 14, fontWeight: '700', color: '#4e705e' }}>
              +{expedition.points_earned} points
            </Text>
          ) : null}
        </View>
      ) : null}
    </TouchableOpacity>
  );
}
