import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, ScrollView, Text, TouchableOpacity, View } from 'react-native';
import { Icon } from '../../src/components/Icon';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useExpeditions } from '../../src/hooks/useExpeditions';
import { useAuth } from '../../src/hooks/useAuth';
import { supabase } from '../../src/lib/supabase';
import { Expedition } from '../../src/types';

export default function ExpeditionDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { fetchById } = useExpeditions();
  const { currentUser } = useAuth();
  const router = useRouter();
  const [expedition, setExpedition] = useState<Expedition | null>(null);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    if (id) fetchById(id).then(setExpedition);
  }, [id]);

  async function handleDelete() {
    Alert.alert('Delete Expedition', 'Are you sure you want to delete this expedition?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete', style: 'destructive',
        onPress: async () => {
          setDeleting(true);
          await supabase.from('expeditions').delete().eq('id', id);
          router.back();
        },
      },
    ]);
  }

  if (!expedition) {
    return (
      <SafeAreaView style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#eaded0' }}>
        <ActivityIndicator size="large" color="#4e705e" />
      </SafeAreaView>
    );
  }

  const isOwner = currentUser?.id === expedition.user_id;

  return (
    <ScrollView style={{ flex: 1, backgroundColor: '#eaded0' }}>
      <SafeAreaView style={{ padding: 16 }}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <TouchableOpacity onPress={() => router.back()}>
            <Text style={{ fontSize: 16, color: '#4e705e', fontWeight: '700' }}>← Back</Text>
          </TouchableOpacity>
          {isOwner ? (
            <TouchableOpacity onPress={handleDelete} disabled={deleting}>
              <Text style={{ fontSize: 14, color: '#6d3a3c', fontWeight: '700' }}>Delete</Text>
            </TouchableOpacity>
          ) : null}
        </View>
        <Text style={{ fontSize: 26, fontWeight: '800', color: '#361319' }}>{expedition.title}</Text>
        <Text style={{ fontSize: 13, color: '#6d3a3c', marginTop: 4, marginBottom: 12, opacity: 0.8 }}>
          by @{expedition.users?.username} · {new Date(expedition.created_at).toLocaleDateString()}
        </Text>

        <View style={{ flexDirection: 'row', gap: 8, flexWrap: 'wrap', marginBottom: 12 }}>
          <Chip label={expedition.type.replace('_', ' ')} />
          {expedition.difficulty ? <Chip label={expedition.difficulty} /> : null}
          {expedition.distance ? <Chip label={`${expedition.distance}km`} /> : null}
        </View>

        {expedition.description ? (
          <Text style={{ fontSize: 15, color: '#110703', lineHeight: 22, marginBottom: 12 }}>{expedition.description}</Text>
        ) : null}

        {expedition.location ? (
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, marginBottom: 12 }}>
            <Icon name="map-pin-simple" size={14} color="#6d3a3c" />
            <Text style={{ fontSize: 14, color: '#6d3a3c' }}>{expedition.location}</Text>
          </View>
        ) : null}

        {expedition.vibe_tags.length > 0 ? (
          <View style={{ flexDirection: 'row', gap: 8, flexWrap: 'wrap', marginBottom: 12 }}>
            {expedition.vibe_tags.map(tag => <Chip key={tag} label={tag} />)}
          </View>
        ) : null}

        <View style={{ backgroundColor: '#4e705e', borderRadius: 12, padding: 16, marginTop: 8, alignItems: 'center' }}>
          <Text style={{ fontSize: 22, fontWeight: '800', color: '#eaded0' }}>+{expedition.points_earned} pts earned</Text>
        </View>
      </SafeAreaView>
    </ScrollView>
  );
}

function Chip({ label }: { label: string }) {
  return (
    <View style={{ backgroundColor: '#eaded0', borderRadius: 10, paddingHorizontal: 10, paddingVertical: 4, borderWidth: 1, borderColor: '#c7af94' }}>
      <Text style={{ fontSize: 13, color: '#361319', textTransform: 'capitalize' }}>{label}</Text>
    </View>
  );
}
