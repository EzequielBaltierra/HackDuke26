import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, Image, ScrollView, Text, TextInput, TouchableOpacity, View } from 'react-native';
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
  const [editingCaption, setEditingCaption] = useState(false);
  const [captionText, setCaptionText] = useState('');

  useEffect(() => {
    if (id) fetchById(id).then(d => { setDiscovery(d); setCaptionText(d?.caption ?? ''); });
  }, [id]);

  async function saveCaption() {
    if (!id) return;
    const newCaption = captionText.trim() || null;
    await supabase.from('discoveries').update({ caption: newCaption }).eq('id', id);
    setDiscovery(prev => prev ? { ...prev, caption: newCaption } : prev);
    setEditingCaption(false);
  }

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
            <View style={{ flexDirection: 'row', gap: 16 }}>
              <TouchableOpacity onPress={() => setEditingCaption(true)}>
                <Text style={{ fontSize: 14, color: colors.greenBase, fontWeight: '700' }}>Edit</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={handleDelete} disabled={deleting}>
                <Text style={{ fontSize: 14, color: colors.redBase, fontWeight: '700' }}>Delete</Text>
              </TouchableOpacity>
            </View>
          ) : null}
        </View>
      </SafeAreaView>
      <Image source={{ uri: discovery.image_url }} style={{ width: '100%', height: 300 }} resizeMode="cover" />
      <View style={{ padding: 16 }}>
        <Text style={{ fontFamily: fontFamily.crimson, fontSize: 16, color: colors.red, opacity: 0.9 }}>
          by @{discovery.users?.username} · {new Date(discovery.created_at).toLocaleDateString()}
        </Text>
        {editingCaption ? (
          <View style={{ marginTop: 10 }}>
            <TextInput
              value={captionText}
              onChangeText={setCaptionText}
              placeholder="Add a caption..."
              placeholderTextColor={colors.bgAccent}
              multiline
              autoFocus
              style={{ backgroundColor: 'white', borderRadius: 10, padding: 10, fontSize: 16, borderWidth: 1, borderColor: colors.bgAccent, color: colors.textPrimary, marginBottom: 8 }}
            />
            <View style={{ flexDirection: 'row', gap: 8 }}>
              <TouchableOpacity onPress={saveCaption} style={{ flex: 1, backgroundColor: colors.greenBase, padding: 10, borderRadius: 10, alignItems: 'center' }}>
                <Text style={{ color: '#eaded0', fontWeight: '700' }}>Save</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => { setEditingCaption(false); setCaptionText(discovery.caption ?? ''); }} style={{ flex: 1, backgroundColor: colors.bgAccent, padding: 10, borderRadius: 10, alignItems: 'center' }}>
                <Text style={{ color: colors.redAccent, fontWeight: '700' }}>Cancel</Text>
              </TouchableOpacity>
            </View>
          </View>
        ) : (
          discovery.caption ? (
            <Text style={[type.postDescription, { fontSize: 22, lineHeight: 30, marginTop: 10, marginBottom: 4 }]}>
              {discovery.caption}
            </Text>
          ) : null
        )}
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
