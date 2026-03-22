import React, { useState } from 'react';
import { FlatList, RefreshControl, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { DiscoveryCard } from '../../src/components/DiscoveryCard';
import { ExpeditionCard } from '../../src/components/ExpeditionCard';
import { FeedToggle } from '../../src/components/FeedToggle';
import { useDiscoveries } from '../../src/hooks/useDiscoveries';
import { useExpeditions } from '../../src/hooks/useExpeditions';
import { colors } from '../../src/theme/colors';
import { fontFamily } from '../../src/theme/typography';
import { Discovery, Expedition } from '../../src/types';

export default function FeedScreen() {
  const [activeTab, setActiveTab] = useState<'discoveries' | 'expeditions'>('expeditions');
  const { discoveries, loading: dLoading, refresh: dRefresh } = useDiscoveries();
  const { expeditions, loading: eLoading, refresh: eRefresh } = useExpeditions();

  const isExpeditions = activeTab === 'expeditions';
  const loading = isExpeditions ? eLoading : dLoading;
  const refresh = isExpeditions ? eRefresh : dRefresh;

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.bg }} edges={['top']}>
      <FeedToggle active={activeTab} onChange={setActiveTab} />
      <FlatList
        data={isExpeditions ? expeditions : discoveries}
        keyExtractor={item => item.id}
        refreshControl={
          <RefreshControl refreshing={loading} onRefresh={refresh} tintColor={colors.greenAccent} />
        }
        renderItem={({ item }) =>
          isExpeditions ? (
            <ExpeditionCard expedition={item as Expedition} />
          ) : (
            <DiscoveryCard discovery={item as Discovery} />
          )
        }
        ListEmptyComponent={
          !loading ? (
            <View style={{ alignItems: 'center', marginTop: 64, paddingHorizontal: 32 }}>
              <Text style={{ fontSize: 48 }}>{isExpeditions ? '🥾' : '🌿'}</Text>
              <Text
                style={{
                  fontFamily: fontFamily.crimsonBold,
                  fontSize: 22,
                  color: colors.redAccent,
                  marginTop: 16,
                  textAlign: 'center',
                }}
              >
                No {activeTab} yet
              </Text>
              <Text
                style={{
                  fontFamily: fontFamily.crimson,
                  fontSize: 16,
                  color: colors.red,
                  marginTop: 8,
                  opacity: 0.9,
                  textAlign: 'center',
                }}
              >
                Be the first to share — switch tabs or pull to refresh.
              </Text>
            </View>
          ) : null
        }
        contentContainerStyle={{ paddingBottom: 24, flexGrow: 1 }}
      />
    </SafeAreaView>
  );
}
