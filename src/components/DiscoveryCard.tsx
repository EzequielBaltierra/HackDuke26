import { useRouter } from 'expo-router';
import React from 'react';
import { hrefUserProfile } from '../lib/routes';
import { Image, Text, TouchableOpacity, View } from 'react-native';
import {
  FeedBadgeShields,
  FeedUserRow,
  formatFeedDate,
  formatLocationCommaDate,
} from './feed/feedCardUtils';
import { colors } from '../theme/colors';
import { textStyles } from '../theme/typography';
import { Discovery } from '../types';

type Props = {
  discovery: Discovery;
  viewerUserId?: string;
  followingIds?: Set<string>;
  onToggleFollow?: (authorUserId: string) => void;
};

const categoryLabel: Record<string, string> = {
  plants: 'Plants',
  trees: 'Trees',
  flowers: 'Flowers',
  fungi: 'Fungi',
  insects: 'Insects',
  birds: 'Birds',
  mammals: 'Mammals',
  other: 'Other',
};

function discoveryLocationLine(d: Discovery) {
  const date = formatFeedDate(d.created_at);
  if (d.is_sensitive) {
    return `Location withheld, ${date}`;
  }
  return formatLocationCommaDate(null, d.created_at);
}

export function DiscoveryCard({ discovery, viewerUserId, followingIds, onToggleFollow }: Props) {
  const router = useRouter();
  const openDetail = () => router.push(`/discovery/${discovery.id}`);
  const authorId = discovery.users?.id;
  const isFollowing = authorId ? followingIds?.has(authorId) : false;

  const goUser = authorId ? () => router.push(hrefUserProfile(authorId)) : undefined;

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
          user={discovery.users}
          viewerUserId={viewerUserId}
          isFollowing={isFollowing}
          onToggleFollow={
            authorId && onToggleFollow ? () => onToggleFollow(authorId) : undefined
          }
          onPressUser={goUser}
        />
      </View>

      <TouchableOpacity activeOpacity={0.95} onPress={openDetail}>
        <View style={{ paddingHorizontal: 16, paddingBottom: 10 }}>
          <Text style={[textStyles.postTitle, { marginBottom: 4 }]}>{discovery.common_name}</Text>

          {discovery.scientific_name ? (
            <Text style={{ fontFamily: textStyles.postDescription.fontFamily, fontSize: 15, color: colors.redBase, fontStyle: 'italic', marginBottom: 6 }}>
              {discovery.scientific_name}
            </Text>
          ) : null}

          <Text style={[textStyles.postLocation, { marginBottom: 10 }]}>{discoveryLocationLine(discovery)}</Text>

          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 10 }}>
            <View style={{ borderRadius: 20, paddingHorizontal: 12, paddingVertical: 5, backgroundColor: colors.bgAccent, borderWidth: 1, borderColor: colors.redBase }}>
              <Text style={textStyles.vibeTag}>{categoryLabel[discovery.category] ?? discovery.category}</Text>
            </View>
          </View>

          {discovery.caption ? (
            <Text style={[textStyles.postDescription, { opacity: 0.92, marginBottom: 12 }]} numberOfLines={8}>
              {discovery.caption}
            </Text>
          ) : null}
        </View>
      </TouchableOpacity>

      <TouchableOpacity onPress={openDetail} activeOpacity={0.95}>
        <Image source={{ uri: discovery.image_url }} style={{ width: '100%', height: 220 }} resizeMode="cover" />
      </TouchableOpacity>

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
          <View style={{ flex: 1 }}>
            <Text style={[textStyles.duration, { opacity: 0.9 }]} numberOfLines={1}>
              {formatFeedDate(discovery.created_at)}
            </Text>
          </View>
          <View style={{ paddingHorizontal: 8 }}>
            <FeedBadgeShields />
          </View>
          <View style={{ flex: 1, alignItems: 'flex-end' }}>
            {discovery.points_earned > 0 ? (
              <Text style={textStyles.points}>+{discovery.points_earned} points</Text>
            ) : (
              <Text style={[textStyles.duration, { opacity: 0.45 }]}>—</Text>
            )}
          </View>
        </View>
      </TouchableOpacity>
    </View>
  );
}
