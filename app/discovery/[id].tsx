import { useLocalSearchParams } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Image, ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { FactCard } from '../../src/components/FactCard';
import { useDiscoveries } from '../../src/hooks/useDiscoveries';
import { colors } from '../../src/theme/colors';
import { fontFamily, type } from '../../src/theme/typography';
import { Discovery } from '../../src/types';

export default function DiscoveryDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { fetchById } = useDiscoveries();
  const [discovery, setDiscovery] = useState<Discovery | null>(null);

  useEffect(() => {
    if (id) fetchById(id).then(setDiscovery);
  }, [id]);

  if (!discovery) {
    return (
      <SafeAreaView style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.bg }}>
        <ActivityIndicator size="large" color={colors.greenAccent} />
      </SafeAreaView>
    );
  }

  return (
    <ScrollView style={{ flex: 1, backgroundColor: colors.bg }}>
      <Image source={{ uri: discovery.image_url }} style={{ width: '100%', height: 300 }} resizeMode="cover" />
      <View style={{ padding: 16 }}>
        <Text style={{ fontFamily: fontFamily.crimson, fontSize: 16, color: colors.red, opacity: 0.9 }}>
          by @{discovery.users?.username} · {new Date(discovery.created_at).toLocaleDateString()}
        </Text>
        {discovery.caption ? (
          <Text style={[type.postDescription, { fontSize: 22, lineHeight: 30, marginTop: 10, marginBottom: 4 }]}>
            {discovery.caption}
          </Text>
        ) : null}
      </View>
      <FactCard
        commonName={discovery.common_name}
        scientificName={discovery.scientific_name}
        category={discovery.category}
        confidence={discovery.confidence}
        factCard={discovery.fact_card}
      />
    </ScrollView>
  );
}
