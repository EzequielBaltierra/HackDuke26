import React, { useState } from 'react';
import { FlatList, RefreshControl, Text, View } from 'react-native';
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
            <View style={{ alignItems: 'center', marginTop: 80 }}>
              <Text style={{ fontSize: 48 }}>{isExpeditions ? '🥾' : '🌿'}</Text>
              <Text style={{ fontSize: 16, color: colors.redBase, marginTop: 12, opacity: 0.75 }}>
                No {activeTab} yet. Be the first!
              </Text>
            </View>
          ) : null
        }
        contentContainerStyle={{ paddingBottom: 24 }}
      />
    </SafeAreaView>
  );
}
