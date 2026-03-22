import React from 'react';
import { Image, Text, TouchableOpacity, View } from 'react-native';
import { colors } from '../../theme/colors';
import { textStyles } from '../../theme/typography';
import type { User } from '../../types';

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
      <Text style={{ fontSize: 20, color: colors.bgPrimary }}>👤</Text>
    </View>
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
        <TouchableOpacity
          onPress={onToggleFollow}
          hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
          accessibilityRole="button"
          accessibilityLabel={isFollowing ? 'Unfollow' : 'Follow'}
        >
          <View
            style={{
              minWidth: 30,
              height: 30,
              paddingHorizontal: 6,
              borderRadius: 15,
              borderWidth: 2,
              borderColor: isFollowing ? colors.blueAccent : colors.redAccent,
              backgroundColor: isFollowing ? colors.blueAccent : 'transparent',
              justifyContent: 'center',
              alignItems: 'center',
            }}
          >
            <Text
              style={{
                fontSize: isFollowing ? 14 : 20,
                color: isFollowing ? colors.bgPrimary : colors.redAccent,
                marginTop: isFollowing ? 0 : -2,
                fontFamily: textStyles.postTitle.fontFamily,
                fontWeight: isFollowing ? '700' : '400',
              }}
            >
              {isFollowing ? '✓' : '+'}
            </Text>
          </View>
        </TouchableOpacity>
      ) : null}
    </View>
  );
}

export function FeedBadgeShields() {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
      {[0, 1].map(i => (
        <View
          key={i}
          style={{
            width: 22,
            height: 26,
            borderWidth: 1.5,
            borderColor: colors.redBase,
            borderRadius: 3,
            opacity: 0.75,
          }}
        />
      ))}
    </View>
  );
}
