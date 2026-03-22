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

type Props = { expedition: Expedition };

export function ExpeditionCard({ expedition }: Props) {
  const router = useRouter();
  const [photoIndex, setPhotoIndex] = useState(0);
  const photos = expedition.photo_urls ?? [];

  const distanceStr = formatDistanceMiles(expedition.distance);
  const durationStr = formatElapsed(expedition.duration_seconds);
  const locationLine = formatLocationCommaDate(expedition.location, expedition.created_at);

  const openDetail = () => router.push(`/expedition/${expedition.id}`);

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
      {/* User row — plain View so inner TouchableOpacity works */}
      <View style={{ padding: 16, paddingBottom: 0 }}>
        <FeedUserRow
          user={expedition.users}
          onPressUser={expedition.users?.id ? () => router.push(`/user/${expedition.users!.id}`) : undefined}
        />
      </View>

      {/* Card body — taps open detail */}
      <TouchableOpacity activeOpacity={0.95} onPress={openDetail}>
        <View style={{ paddingHorizontal: 16, paddingBottom: 10 }}>
          <Text style={[textStyles.postTitle, { marginBottom: 6 }]}>{expedition.title}</Text>

          <Text style={[textStyles.postLocation, { marginBottom: 10 }]}>{locationLine}</Text>

          {expedition.vibe_tags?.length > 0 ? (
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 10 }}>
              {expedition.vibe_tags.slice(0, 6).map(tag => (
                <View key={tag} style={{ borderRadius: 20, paddingHorizontal: 12, paddingVertical: 5, backgroundColor: colors.bgAccent, borderWidth: 1, borderColor: colors.redBase }}>
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
      </TouchableOpacity>

      {photos.length > 0 ? (
        <View>
          <TouchableOpacity onPress={openDetail} activeOpacity={0.95}>
            <Image source={{ uri: photos[photoIndex] }} style={{ width: '100%', height: 220 }} resizeMode="cover" />
          </TouchableOpacity>
          {photos.length > 1 ? (
            <>
              <TouchableOpacity
                onPress={() => setPhotoIndex(i => Math.max(0, i - 1))}
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
                onPress={() => setPhotoIndex(i => Math.min(photos.length - 1, i + 1))}
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
            </>
          ) : null}
        </View>
      ) : null}

      {showFooter ? (
        <TouchableOpacity activeOpacity={0.95} onPress={openDetail}>
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
            <View style={{ flex: 1, alignItems: 'flex-end' }}>
              {expedition.points_earned > 0 ? (
                <Text style={textStyles.points}>+{expedition.points_earned} points</Text>
              ) : (
                <Text style={[textStyles.duration, { opacity: 0.45 }]}>—</Text>
              )}
            </View>
          </View>
        </TouchableOpacity>
      ) : null}
    </View>
  );
}
