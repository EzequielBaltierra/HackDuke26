import { useRouter } from 'expo-router';
import React, { useEffect, useRef, useState } from 'react';
import { Animated, Image, NativeScrollEvent, NativeSyntheticEvent, ScrollView, Text, TouchableOpacity, View } from 'react-native';
import { Icon } from './Icon';
import { hrefUserProfile, hrefLocation } from '../lib/routes';
import { expeditionLocationKey } from '../lib/locationKey';
import { openRouteInMaps } from '../lib/mapLink';
import {
  FeedUserRow,
  formatDistanceMiles,
  formatElapsed,
  formatLocationLinePlain,
} from './feed/feedCardUtils';
import { colors } from '../theme/colors';
import { textStyles } from '../theme/typography';
import { Expedition } from '../types';
import { useAuth } from '../hooks/useAuth';

type Props = {
  expedition: Expedition;
  viewerUserId?: string;
  followingIds?: Set<string>;
  onToggleFollow?: (authorUserId: string) => void;
};

export function ExpeditionCard({ expedition, viewerUserId, followingIds, onToggleFollow }: Props) {
  const { currentUser } = useAuth();
  const router = useRouter();
  const [photoIndex, setPhotoIndex] = useState(0);
  const [carouselWidth, setCarouselWidth] = useState(0);
  const photos = expedition.photo_urls ?? [];
  const dotAnims = useRef(photos.map((_, i) => new Animated.Value(i === 0 ? 18 : 7))).current;

  useEffect(() => {
    dotAnims.forEach((anim, i) => {
      Animated.timing(anim, {
        toValue: i === photoIndex ? 18 : 7,
        duration: 200,
        useNativeDriver: false,
      }).start();
    });
  }, [photoIndex]);
  const authorId = expedition.users?.id;
  const isFollowing = authorId ? followingIds?.has(authorId) : false;

  const distanceStr = formatDistanceMiles(expedition.distance);
  const durationStr = formatElapsed(expedition.duration_seconds);
  const timeIso = expedition.start_time ?? expedition.created_at;
  const locationLine = formatLocationLinePlain(expedition.location, timeIso);
  const displayTripCount = expedition.trip_count ?? 1;

  const showFooter = Boolean(distanceStr || durationStr || expedition.points_earned > 0);

  const hasRoute = (expedition.route_waypoints?.length ?? 0) >= 2;
  const locationNavKey = expeditionLocationKey(expedition);
  const isTappable = hasRoute || Boolean(locationNavKey);

  const goUser = authorId ? () => router.push(hrefUserProfile(authorId)) : undefined;

  function openLocationPage() {
    if (!locationNavKey) return;
    const title = expedition.location?.trim() || 'Outdoor location';
    router.push(hrefLocation(locationNavKey, title));
  }

  function openSearchVibe(tag: string) {
    router.push(`/(tabs)/search?vibe=${encodeURIComponent(tag)}`);
  }

  function handleScroll(e: NativeSyntheticEvent<NativeScrollEvent>) {
    if (carouselWidth === 0) return;
    const page = Math.round(e.nativeEvent.contentOffset.x / carouselWidth);
    setPhotoIndex(page);
  }

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
      <View style={{ paddingHorizontal: 16, paddingTop: 16, paddingBottom: 4 }}>
        <FeedUserRow
          user={expedition.users}
          viewerUserId={viewerUserId}
          isFollowing={isFollowing}
          onToggleFollow={authorId && onToggleFollow ? () => onToggleFollow(authorId) : undefined}
          onPressUser={goUser}
        />
      </View>

      <View style={{ paddingHorizontal: 16, paddingBottom: 10 }}>
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

        {isTappable ? (
          <TouchableOpacity
            onPress={() => {
              if (hasRoute) {
                openRouteInMaps(expedition.route_waypoints!, expedition.location ?? expedition.title);
              } else {
                openLocationPage();
              }
            }}
            activeOpacity={0.7}
            accessibilityRole="link"
            accessibilityLabel={`Open ${expedition.location ?? 'location'} in maps`}
          >
            <Text style={[textStyles.postLocation, { marginBottom: 10 }]}>{locationLine}</Text>
          </TouchableOpacity>
        ) : (
          <Text style={[textStyles.postLocation, { marginBottom: 10 }]}>{locationLine}</Text>
        )}

        {expedition.vibe_tags?.length > 0 ? (
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 10 }}>
            {expedition.vibe_tags.slice(0, 6).map(tag => (
              <TouchableOpacity
                key={tag}
                onPress={() => openSearchVibe(tag)}
                activeOpacity={0.75}
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
              </TouchableOpacity>
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
        <View
          onLayout={e => setCarouselWidth(e.nativeEvent.layout.width)}
        >
          <ScrollView
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            scrollEventThrottle={16}
            onScroll={handleScroll}
          >
            {photos.map((uri, i) => (
              <Image
                key={i}
                source={{ uri }}
                style={{ width: carouselWidth || 300, height: 220 }}
                resizeMode="cover"
              />
            ))}
          </ScrollView>

          {photos.length > 1 ? (
            <View
              style={{
                position: 'absolute',
                bottom: 10,
                left: 0,
                right: 0,
                alignItems: 'center',
              }}
            >
              <View
                style={{
                  flexDirection: 'row',
                  gap: 6,
                  backgroundColor: 'rgba(17,7,3,0.45)',
                  paddingHorizontal: 10,
                  paddingVertical: 5,
                  borderRadius: 20,
                }}
              >
                {photos.map((_, i) => (
                  <Animated.View
                    key={i}
                    style={{
                      width: dotAnims[i],
                      height: 7,
                      borderRadius: 4,
                      backgroundColor: i === photoIndex
                        ? colors.tabIconActive
                        : 'rgba(234,222,208,0.45)',
                    }}
                  />
                ))}
              </View>
            </View>
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
          <View style={{ alignItems: 'center', paddingHorizontal: 6 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                <Icon name="footprints" size={12} color={colors.textPrimary} />
                <Text style={[textStyles.duration, { fontSize: 12 }]}>{displayTripCount}</Text>
              </View>
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
