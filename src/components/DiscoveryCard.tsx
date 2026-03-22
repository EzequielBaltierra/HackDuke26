import { useRouter } from 'expo-router';
import React from 'react';
import { Image, Text, TouchableOpacity, View } from 'react-native';
import { colors } from '../theme/colors';
import { fontFamily, typeCard } from '../theme/typography';
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
      <Image source={{ uri: discovery.image_url }} style={{ width: '100%', height: 220 }} resizeMode="cover" />
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
            {discovery.users?.username ?? 'Explorer'}
          </Text>
          {discovery.points_earned > 0 ? (
            <Text style={typeCard.userRowPoints}>
              +{discovery.points_earned} pts
            </Text>
          ) : null}
        </View>

        <Text style={[typeCard.discoveryTitle, { marginBottom: 2 }]}>
          {categoryEmoji[discovery.category] ?? '🔍'} {discovery.common_name}
        </Text>

        {discovery.scientific_name ? (
          <Text style={{ fontFamily: fontFamily.crimson, fontSize: 14, color: colors.red, fontStyle: 'italic', marginBottom: 4 }}>
            {discovery.scientific_name}
          </Text>
        ) : null}

        {discovery.caption ? (
          <Text style={[typeCard.discoveryCaption, { marginBottom: 6, opacity: 0.95 }]} numberOfLines={2}>
            {discovery.caption}
          </Text>
        ) : null}

        <Text style={typeCard.meta}>
          {new Date(discovery.created_at).toLocaleDateString()}
        </Text>
      </View>
    </TouchableOpacity>
  );
}
