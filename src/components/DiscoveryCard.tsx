import { useRouter } from 'expo-router';
import React from 'react';
import { Image, Text, TouchableOpacity, View } from 'react-native';
import { Discovery } from '../types';

type Props = { discovery: Discovery };

const categoryEmoji: Record<string, string> = {
  plants: '🌱', trees: '🌳', flowers: '🌸', fungi: '🍄',
  insects: '🦋', birds: '🦜', mammals: '🦊', other: '🔍',
};

export function DiscoveryCard({ discovery }: Props) {
  const router = useRouter();

  return (
    <TouchableOpacity
      onPress={() => router.push(`/discovery/${discovery.id}`)}
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
      <Image source={{ uri: discovery.image_url }} style={{ width: '100%', height: 220 }} resizeMode="cover" />
      <View style={{ padding: 14 }}>
        {/* Header row: avatar area + username + points */}
        <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 6 }}>
          <View style={{
            width: 36, height: 36, borderRadius: 18,
            backgroundColor: '#eaded0', justifyContent: 'center', alignItems: 'center',
            borderWidth: 1, borderColor: '#c7af94', marginRight: 8,
          }}>
            <Text style={{ fontSize: 16 }}>🌿</Text>
          </View>
          <Text style={{ fontSize: 15, fontWeight: '600', color: '#110703', flex: 1 }}>
            {discovery.users?.username ?? 'Explorer'}
          </Text>
          {discovery.points_earned > 0 ? (
            <Text style={{ fontSize: 13, color: '#4e705e', fontWeight: '700' }}>
              +{discovery.points_earned} pts
            </Text>
          ) : null}
        </View>

        {/* Title */}
        <Text style={{ fontSize: 17, fontWeight: '700', color: '#361319', marginBottom: 2 }}>
          {categoryEmoji[discovery.category] ?? '🔍'} {discovery.common_name}
        </Text>

        {/* Scientific name */}
        {discovery.scientific_name ? (
          <Text style={{ fontSize: 12, color: '#6d3a3c', fontStyle: 'italic', marginBottom: 4 }}>
            {discovery.scientific_name}
          </Text>
        ) : null}

        {/* Caption */}
        {discovery.caption ? (
          <Text style={{ fontSize: 14, color: '#110703', marginBottom: 6, opacity: 0.8 }} numberOfLines={2}>
            {discovery.caption}
          </Text>
        ) : null}

        {/* Meta */}
        <Text style={{ fontSize: 12, color: '#6d3a3c', opacity: 0.7 }}>
          {new Date(discovery.created_at).toLocaleDateString()}
        </Text>
      </View>
    </TouchableOpacity>
  );
}
