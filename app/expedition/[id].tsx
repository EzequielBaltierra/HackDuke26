import { useLocalSearchParams } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useExpeditions } from '../../src/hooks/useExpeditions';
import { colors } from '../../src/theme/colors';
import { fontFamily, type } from '../../src/theme/typography';
import { Expedition } from '../../src/types';

function formatDuration(seconds: number | null) {
  if (seconds == null || seconds <= 0) return null;
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  if (h > 0) return `${h}h ${m}m ${s}s`;
  if (m > 0) return `${m}m ${s}s`;
  return `${s}s`;
}

export default function ExpeditionDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { fetchById } = useExpeditions();
  const [expedition, setExpedition] = useState<Expedition | null>(null);

  useEffect(() => {
    if (id) fetchById(id).then(setExpedition);
  }, [id]);

  if (!expedition) {
    return (
      <SafeAreaView style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.bg }}>
        <ActivityIndicator size="large" color={colors.greenAccent} />
      </SafeAreaView>
    );
  }

  const durationLabel = formatDuration(expedition.duration_seconds);

  return (
    <ScrollView style={{ flex: 1, backgroundColor: colors.bg }}>
      <SafeAreaView style={{ padding: 16 }}>
        <Text style={[type.postTitle, { color: colors.redAccent }]}>{expedition.title}</Text>

        <View style={{ flexDirection: 'row', flexWrap: 'wrap', alignItems: 'baseline', justifyContent: 'space-between', marginTop: 12, gap: 8 }}>
          <Text style={[type.expeditionUserName, { fontSize: 36, flex: 1, minWidth: '50%' }]}>
            @{expedition.users?.username ?? 'explorer'}
          </Text>
          {expedition.points_earned > 0 ? (
            <Text style={[type.expeditionUserPoints, { fontSize: 32 }]}>
              +{expedition.points_earned} pts
            </Text>
          ) : null}
        </View>

        {durationLabel ? (
          <Text style={[type.expeditionDuration, { fontSize: 28, marginTop: 8 }]}>
            Duration {durationLabel}
          </Text>
        ) : null}

        <Text style={{ fontFamily: fontFamily.crimson, fontSize: 18, color: colors.red, marginTop: 8, opacity: 0.85 }}>
          {new Date(expedition.created_at).toLocaleDateString()}
        </Text>

        <View style={{ flexDirection: 'row', gap: 8, flexWrap: 'wrap', marginTop: 16, marginBottom: 12 }}>
          <Chip label={expedition.type.replace('_', ' ')} />
          {expedition.difficulty ? <Chip label={expedition.difficulty} /> : null}
          {expedition.distance ? <Chip label={`${expedition.distance}km`} /> : null}
        </View>

        {expedition.description ? (
          <Text style={[type.postDescription, { fontSize: 20, lineHeight: 28, marginBottom: 12 }]}>{expedition.description}</Text>
        ) : null}

        {expedition.location ? (
          <Text style={[type.postLocation, { fontSize: 26, marginBottom: 12, color: colors.blueAccent }]}>
            📍 {expedition.location}
          </Text>
        ) : null}

        {expedition.vibe_tags.length > 0 ? (
          <View style={{ flexDirection: 'row', gap: 8, flexWrap: 'wrap', marginBottom: 12 }}>
            {expedition.vibe_tags.map(tag => <VibeChip key={tag} label={tag} />)}
          </View>
        ) : null}

        <View style={{
          backgroundColor: colors.green,
          borderRadius: 12,
          padding: 16,
          marginTop: 8,
          alignItems: 'center',
          borderWidth: 2,
          borderColor: colors.greenAccent,
        }}>
          <Text style={[type.expeditionPoints, { color: colors.bg, fontSize: 32 }]}>
            +{expedition.points_earned} pts earned 🌿
          </Text>
        </View>
      </SafeAreaView>
    </ScrollView>
  );
}

function Chip({ label }: { label: string }) {
  return (
    <View style={{
      backgroundColor: colors.bg,
      borderRadius: 10,
      paddingHorizontal: 10,
      paddingVertical: 4,
      borderWidth: 1,
      borderColor: colors.bgAccent,
    }}>
      <Text style={{ fontFamily: fontFamily.crimsonSemi, fontSize: 14, color: colors.redAccent, textTransform: 'capitalize' }}>{label}</Text>
    </View>
  );
}

function VibeChip({ label }: { label: string }) {
  return (
    <View style={{
      backgroundColor: colors.bg,
      borderRadius: 10,
      paddingHorizontal: 12,
      paddingVertical: 6,
      borderWidth: 1,
      borderColor: colors.vibeTag,
    }}>
      <Text style={[type.postVibeTag, { fontSize: 18 }]}>{label}</Text>
    </View>
  );
}
