import React, { useState } from 'react';
import { FlatList, RefreshControl, Text, View } from 'react-native';
import { Icon } from '../../src/components/Icon';
import { SafeAreaView } from 'react-native-safe-area-context';
import { DiscoveryCard } from '../../src/components/DiscoveryCard';
import { ExpeditionCard } from '../../src/components/ExpeditionCard';
import { FeedToggle } from '../../src/components/FeedToggle';
import { useAuth } from '../../src/hooks/useAuth';
import { useDiscoveries } from '../../src/hooks/useDiscoveries';
import { useExpeditions } from '../../src/hooks/useExpeditions';
import { useViewerFollowingIds } from '../../src/hooks/useFollows';
import { colors } from '../../src/theme/colors';
import { Discovery, Expedition } from '../../src/types';

export default function FeedScreen() {
  const [activeTab, setActiveTab] = useState<'discoveries' | 'expeditions'>('expeditions');
  const { currentUser } = useAuth();
  const { followingIds, toggleFollowing } = useViewerFollowingIds(currentUser?.id);
  const { discoveries, loading: dLoading, refresh: dRefresh } = useDiscoveries();
  const { expeditions, loading: eLoading, refresh: eRefresh } = useExpeditions();

  const isExpeditions = activeTab === 'expeditions';
  const loading = isExpeditions ? eLoading : dLoading;
  const refresh = isExpeditions ? eRefresh : dRefresh;

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.bgPrimary }} edges={['top']}>
      <FeedToggle active={activeTab} onChange={setActiveTab} />
      <FlatList<Discovery | Expedition>
        data={isExpeditions ? expeditions : discoveries}
        keyExtractor={item => item.id}
        refreshControl={
          <RefreshControl refreshing={loading} onRefresh={refresh} tintColor={colors.greenAccent} />
        }
        renderItem={({ item }) =>
          isExpeditions ? (
            <ExpeditionCard
              expedition={item as Expedition}
              viewerUserId={currentUser?.id}
              followingIds={followingIds}
              onToggleFollow={toggleFollowing}
            />
          ) : (
            <DiscoveryCard
              discovery={item as Discovery}
              viewerUserId={currentUser?.id}
              followingIds={followingIds}
              onToggleFollow={toggleFollowing}
            />
          )
        }
        ListEmptyComponent={
          !loading ? (
            <View style={{ alignItems: 'center', marginTop: 80, paddingHorizontal: 32 }}>
              <Icon name={isExpeditions ? 'person-simple-hike' : 'clover'} size={64} color={colors.greenBase} />
              <Text style={{ fontSize: 20, fontWeight: '800', color: colors.redAccent, marginTop: 16, textAlign: 'center' }}>
                {isExpeditions ? 'No expeditions yet' : 'No discoveries yet'}
              </Text>
              <Text style={{ fontSize: 15, color: colors.redBase, marginTop: 8, textAlign: 'center', lineHeight: 22, opacity: 0.75 }}>
                {isExpeditions
                  ? 'Log your first hike or nature walk using the Post tab.'
                  : 'Snap a photo of a plant, insect, or animal to make your first discovery.'}
              </Text>
            </View>
          ) : null
        }
        contentContainerStyle={{ paddingBottom: 24 }}
      />
    </SafeAreaView>
  );
}
