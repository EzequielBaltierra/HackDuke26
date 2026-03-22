import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, Image, ScrollView, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { FactCard } from '../../src/components/FactCard';
import { useDiscoveries } from '../../src/hooks/useDiscoveries';
import { useAuth } from '../../src/hooks/useAuth';
import { supabase } from '../../src/lib/supabase';
import { colors } from '../../src/theme/colors';
import { fontFamily, type } from '../../src/theme/typography';
import { Discovery } from '../../src/types';

export default function DiscoveryDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { fetchById } = useDiscoveries();
  const { currentUser } = useAuth();
  const router = useRouter();
  const [discovery, setDiscovery] = useState<Discovery | null>(null);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    if (id) fetchById(id).then(setDiscovery);
  }, [id]);

  async function handleDelete() {
    Alert.alert('Delete Discovery', 'Are you sure you want to delete this discovery?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete', style: 'destructive',
        onPress: async () => {
          setDeleting(true);
          await supabase.from('discoveries').delete().eq('id', id);
          router.back();
        },
      },
    ]);
  }

  if (!discovery) {
    return (
      <SafeAreaView style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.bg }}>
        <ActivityIndicator size="large" color={colors.greenAccent} />
      </SafeAreaView>
    );
  }

  const isOwner = currentUser?.id === discovery.user_id;

  return (
    <ScrollView style={{ flex: 1, backgroundColor: colors.bg }}>
      <SafeAreaView style={{ paddingHorizontal: 16, paddingTop: 12, paddingBottom: 4 }}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
          <TouchableOpacity onPress={() => router.back()}>
            <Text style={{ fontSize: 16, color: colors.greenBase, fontWeight: '700' }}>← Back</Text>
          </TouchableOpacity>
          {isOwner ? (
            <TouchableOpacity onPress={handleDelete} disabled={deleting}>
              <Text style={{ fontSize: 14, color: colors.redBase, fontWeight: '700' }}>Delete</Text>
            </TouchableOpacity>
          ) : null}
        </View>
      </SafeAreaView>
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
