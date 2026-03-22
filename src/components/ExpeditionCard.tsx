import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import { Image, Text, TouchableOpacity, View } from 'react-native';
import {
  FeedBadgeShields,
  FeedUserRow,
  formatDistanceMiles,
  formatElapsed,
  formatLocationCommaDate,
} from './feed/feedCardUtils';
import { colors } from '../theme/colors';
import { textStyles } from '../theme/typography';
import { Expedition } from '../types';
import { useAuth } from '../hooks/useAuth';

type Props = { expedition: Expedition };

export function ExpeditionCard({ expedition }: Props) {
  const { currentUser } = useAuth();
  const router = useRouter();
  const [photoIndex, setPhotoIndex] = useState(0);
  const photos = expedition.photo_urls ?? [];

  const distanceStr = formatDistanceMiles(expedition.distance);
  const durationStr = formatElapsed(expedition.duration_seconds);
  const locationLine = formatLocationCommaDate(expedition.location, expedition.created_at);
  const displayTripCount = expedition.trip_count ?? 1;

  const showFooter = Boolean(distanceStr || durationStr || expedition.points_earned > 0);

  return (
    <View
      style={{
        backgroundColor: colors.bgPrimary,
        borderRadius: 20,
        marginHorizontal: 12,
        marginVertical: 8,
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: colors.bgAccent,
        shadowColor: colors.textPrimary,
        shadowOpacity: 0.08,
        shadowRadius: 10,
        elevation: 3,
      }}
    >
      <View style={{ padding: 16, paddingBottom: 10 }}>
        <FeedUserRow user={expedition.users} />

        {expedition.original_expedition_id ? (
          <View
            style={{
              alignSelf: 'flex-start',
              backgroundColor: colors.bgAccent,
              borderRadius: 20,
              paddingHorizontal: 10,
              paddingVertical: 3,
              marginBottom: 6,
            }}
          >
            <Text style={{ fontSize: 11, color: colors.redBase, fontWeight: '600' }}>
              ↩ Originally by @{expedition.original_creator_username ?? 'Explorer'}
            </Text>
          </View>
        ) : null}

        <Text style={[textStyles.postTitle, { marginBottom: 6 }]}>{expedition.title}</Text>

        <Text style={[textStyles.postLocation, { marginBottom: 10 }]}>{locationLine}</Text>

        {expedition.vibe_tags?.length > 0 ? (
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 10 }}>
            {expedition.vibe_tags.slice(0, 6).map(tag => (
              <View
                key={tag}
                style={{
                  borderRadius: 20,
                  paddingHorizontal: 12,
                  paddingVertical: 5,
                  backgroundColor: colors.bgAccent,
                  borderWidth: 1,
                  borderColor: colors.redBase,
                }}
              >
                <Text style={textStyles.vibeTag}>{tag}</Text>
              </View>
            ))}
          </View>
        ) : null}

        {expedition.description ? (
          <Text style={[textStyles.postDescription, { opacity: 0.92, marginBottom: 12 }]} numberOfLines={8}>
            {expedition.description}
          </Text>
        ) : null}
      </View>

      {photos.length > 0 ? (
        <View>
          <Image source={{ uri: photos[photoIndex] }} style={{ width: '100%', height: 220 }} resizeMode="cover" />
          {photos.length > 1 ? (
            <>
              <TouchableOpacity
                onPress={() => setPhotoIndex(i => (i - 1 + photos.length) % photos.length)}
                style={{
                  position: 'absolute',
                  left: 12,
                  top: '50%',
                  marginTop: -18,
                  width: 36,
                  height: 36,
                  borderRadius: 18,
                  backgroundColor: 'rgba(17,7,3,0.35)',
                  justifyContent: 'center',
                  alignItems: 'center',
                }}
              >
                <Text style={{ color: colors.tabIconActive, fontSize: 22, marginTop: -2 }}>‹</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => setPhotoIndex(i => (i + 1) % photos.length)}
                style={{
                  position: 'absolute',
                  right: 12,
                  top: '50%',
                  marginTop: -18,
                  width: 36,
                  height: 36,
                  borderRadius: 18,
                  backgroundColor: 'rgba(17,7,3,0.35)',
                  justifyContent: 'center',
                  alignItems: 'center',
                }}
              >
                <Text style={{ color: colors.tabIconActive, fontSize: 22, marginTop: -2 }}>›</Text>
              </TouchableOpacity>
              <View
                style={{
                  position: 'absolute',
                  bottom: 10,
                  left: 0,
                  right: 0,
                  flexDirection: 'row',
                  justifyContent: 'center',
                  gap: 6,
                }}
              >
                {photos.map((_, i) => (
                  <View
                    key={i}
                    style={{
                      width: i === photoIndex ? 18 : 7,
                      height: 7,
                      borderRadius: 4,
                      backgroundColor: i === photoIndex
                        ? colors.tabIconActive
                        : 'rgba(234,222,208,0.5)',
                    }}
                  />
                ))}
              </View>
            </>
          ) : null}
        </View>
      ) : null}

      {showFooter ? (
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            paddingHorizontal: 16,
            paddingVertical: 12,
            backgroundColor: colors.bgAccent,
          }}
        >
          <View style={{ flex: 1, flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: 6 }}>
            {distanceStr ? <Text style={textStyles.duration}>{distanceStr}</Text> : null}
            {distanceStr && durationStr ? (
              <Text style={[textStyles.duration, { opacity: 0.45 }]}>|</Text>
            ) : null}
            {durationStr ? <Text style={textStyles.duration}>{durationStr}</Text> : null}
            {!distanceStr && !durationStr ? (
              <Text style={[textStyles.duration, { opacity: 0.5 }]}>—</Text>
            ) : null}
          </View>
          <View style={{ paddingHorizontal: 8 }}>
            <FeedBadgeShields />
          </View>
          <View style={{ alignItems: 'center', paddingHorizontal: 6 }}>
            <Text style={[textStyles.duration, { fontSize: 12 }]}>🥾 {displayTripCount}</Text>
          </View>
          <View style={{ flex: 1, alignItems: 'flex-end' }}>
            {expedition.points_earned > 0 ? (
              <Text style={textStyles.points}>+{expedition.points_earned} points</Text>
            ) : (
              <Text style={[textStyles.duration, { opacity: 0.45 }]}>—</Text>
            )}
          </View>
        </View>
      ) : null}

      {currentUser && expedition.user_id !== currentUser.id ? (
        <TouchableOpacity
          onPress={() => {
            const rootId = expedition.original_expedition_id ?? expedition.id;
            router.push({
              pathname: '/expedition/new',
              params: {
                originalId: rootId,
                originalTitle: expedition.title,
                originalLocation: expedition.location ?? '',
                originalType: expedition.type,
                originalDifficulty: expedition.difficulty ?? 'moderate',
                vibes: (expedition.vibe_tags ?? []).join('|'),
                originalCreatorUsername: expedition.original_creator_username ?? expedition.users?.username ?? '',
              },
            });
          }}
          style={{
            margin: 12,
            marginTop: 8,
            padding: 12,
            borderRadius: 12,
            borderWidth: 1.5,
            borderColor: colors.greenBase,
            alignItems: 'center',
          }}
        >
          <Text style={{ color: colors.greenBase, fontWeight: '700', fontSize: 14 }}>
            Go on this expedition →
          </Text>
        </TouchableOpacity>
      ) : null}
    </View>
  );
}
