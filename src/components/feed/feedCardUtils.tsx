import React, { useRef } from 'react';
import { Animated, Image, Text, TouchableOpacity, View } from 'react-native';
import Svg, { Path } from 'react-native-svg';
import { Icon } from '../Icon';
import { colors } from '../../theme/colors';
import { textStyles } from '../../theme/typography';
import type { User } from '../../types';

const TREE_PATH = 'M198.1,62.59a76,76,0,0,0-140.2,0A71.71,71.71,0,0,0,16,127.8C15.9,166,48,199,86.14,200A72.09,72.09,0,0,0,120,192.47V232a8,8,0,0,0,16,0V192.47A72.17,72.17,0,0,0,168,200l1.82,0C208,199,240.11,166,240,127.8A71.71,71.71,0,0,0,198.1,62.59ZM169.45,184a56.08,56.08,0,0,1-33.45-10v-41l43.58-21.78a8,8,0,1,0-7.16-14.32L136,115.06V88a8,8,0,0,0-16,0v51.06L83.58,120.84a8,8,0,1,0-7.16,14.32L120,156.94v17a56,56,0,0,1-33.45,10C56.9,183.23,31.92,157.52,32,127.84A55.77,55.77,0,0,1,67.11,76a8,8,0,0,0,4.53-4.67,60,60,0,0,1,112.72,0A8,8,0,0,0,188.89,76,55.79,55.79,0,0,1,224,127.84C224.08,157.52,199.1,183.23,169.45,184Z';

export function formatFeedDate(iso: string) {
  const d = new Date(iso);
  return `${d.getMonth() + 1}/${d.getDate()}/${d.getFullYear()}`;
}

export function formatLocationCommaDate(location: string | null | undefined, createdAt: string) {
  const date = formatFeedDate(createdAt);
  const loc = location?.trim();
  if (loc) {
    return `${loc}, ${date}`;
  }
  return date;
}

/** `(City, State - HH:MM)` using local time from `iso`. */
export function formatParenLocationTime(location: string | null | undefined, iso: string) {
  const t = new Date(iso);
  const timeStr = `${String(t.getHours()).padStart(2, '0')}:${String(t.getMinutes()).padStart(2, '0')}`;
  const loc = location?.trim();
  if (!loc) {
    return `(— - ${timeStr})`;
  }
  return `(${loc} - ${timeStr})`;
}

export function formatDiscoveryParenTime(iso: string) {
  const t = new Date(iso);
  const timeStr = `${String(t.getHours()).padStart(2, '0')}:${String(t.getMinutes()).padStart(2, '0')}`;
  return `(Wildlife sighting - ${timeStr})`;
}

/** Plain feed line: place · HH:MM (no emoji or parens). */
export function formatLocationLinePlain(location: string | null | undefined, iso: string) {
  const t = new Date(iso);
  const timeStr = `${String(t.getHours()).padStart(2, '0')}:${String(t.getMinutes()).padStart(2, '0')}`;
  const loc = location?.trim();
  if (!loc) return `— · ${timeStr}`;
  return `${loc} · ${timeStr}`;
}

export function formatDiscoveryLocationPlain(iso: string) {
  const t = new Date(iso);
  const timeStr = `${String(t.getHours()).padStart(2, '0')}:${String(t.getMinutes()).padStart(2, '0')}`;
  return `Wildlife sighting · ${timeStr}`;
}

export function formatDistanceMiles(distance: number | null | undefined) {
  if (distance == null) return null;
  return `${distance} miles`;
}

export function formatElapsed(seconds: number | null | undefined) {
  if (seconds == null || seconds <= 0) return null;
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = Math.floor(seconds % 60);
  if (h > 0) {
    return `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  }
  return `${m}:${String(s).padStart(2, '0')}`;
}

export function FeedAvatar({ user }: { user: User | undefined }) {
  const uri = user?.profile_photo_url;
  if (uri) {
    return (
      <Image
        source={{ uri }}
        style={{
          width: 44,
          height: 44,
          borderRadius: 22,
          marginRight: 10,
          borderWidth: 1,
          borderColor: colors.textPrimary,
          backgroundColor: colors.textPrimary,
        }}
      />
    );
  }
  return (
    <View
      style={{
        width: 44,
        height: 44,
        borderRadius: 22,
        marginRight: 10,
        backgroundColor: colors.textPrimary,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: colors.redAccent,
      }}
    >
      <Icon name="person-simple-hike" size={20} color={colors.bgPrimary} />
    </View>
  );
}

function FollowButton({ isFollowing, onToggleFollow }: { isFollowing: boolean; onToggleFollow: () => void }) {
  const scale = useRef(new Animated.Value(1)).current;

  function handlePress() {
    Animated.sequence([
      Animated.spring(scale, { toValue: 0.75, useNativeDriver: true, speed: 60, bounciness: 0 }),
      Animated.spring(scale, { toValue: 1, useNativeDriver: true, speed: 14, bounciness: 16 }),
    ]).start();
    onToggleFollow();
  }

  return (
    <TouchableOpacity
      onPress={handlePress}
      hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
      accessibilityRole="button"
      accessibilityLabel={isFollowing ? 'Unfollow' : 'Follow'}
    >
      <Animated.View
        style={{
          width: 34,
          height: 34,
          borderRadius: 17,
          borderWidth: 2,
          borderColor: isFollowing ? colors.greenBase : colors.redAccent,
          backgroundColor: isFollowing ? colors.greenBase : 'transparent',
          justifyContent: 'center',
          alignItems: 'center',
          transform: [{ scale }],
        }}
      >
        {isFollowing ? (
          <Svg width={18} height={18} viewBox="0 0 256 256">
            <Path d={TREE_PATH} fill={colors.bgPrimary} />
          </Svg>
        ) : (
          <Text style={{ fontSize: 20, color: colors.redAccent, marginTop: -2, fontWeight: '400' }}>
            +
          </Text>
        )}
      </Animated.View>
    </TouchableOpacity>
  );
}

export function FeedUserRow({
  user,
  viewerUserId,
  isFollowing,
  onToggleFollow,
  onPressUser,
}: {
  user: User | undefined;
  viewerUserId?: string;
  isFollowing?: boolean;
  onToggleFollow?: () => void;
  onPressUser?: () => void;
}) {
  const name = user?.username ?? 'Explorer';
  const pts = (user?.total_points ?? 0).toLocaleString();
  const authorId = user?.id;
  const showFollow =
    !!viewerUserId && !!authorId && viewerUserId !== authorId && !!onToggleFollow;

  const UserInfo = (
    <View style={{ flex: 1, flexDirection: 'row', alignItems: 'center', minWidth: 0, paddingRight: 4 }}>
      <FeedAvatar user={user} />
      <View style={{ flex: 1, minWidth: 0 }}>
        <Text style={[textStyles.userName, { flexShrink: 1 }]} numberOfLines={1}>
          @{name}
        </Text>
        <Text style={[textStyles.userPoints, { flexShrink: 0 }]}>{pts} pts</Text>
      </View>
    </View>
  );

  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 12 }}>
      {onPressUser ? (
        <TouchableOpacity style={{ flex: 1 }} onPress={onPressUser} activeOpacity={0.7}>
          {UserInfo}
        </TouchableOpacity>
      ) : (
        <View style={{ flex: 1 }}>{UserInfo}</View>
      )}
      {showFollow ? (
        <FollowButton isFollowing={!!isFollowing} onToggleFollow={onToggleFollow!} />
      ) : null}
    </View>
  );
}

