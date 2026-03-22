import { useRouter } from 'expo-router';
import React, { useEffect, useRef, useState } from 'react';
import { Text, TouchableOpacity, View } from 'react-native';
import { Icon } from '../../src/components/Icon';
import { SafeAreaView } from 'react-native-safe-area-context';
import { calculateExpeditionPoints, awardPoints } from '../../src/lib/points';
import { supabase } from '../../src/lib/supabase';
import { PointsToast } from '../../src/components/PointsToast';
import { useAuth } from '../../src/hooks/useAuth';
import { PointsBreakdown } from '../../src/types';

export default function LiveExpeditionScreen() {
  const router = useRouter();
  const { currentUser } = useAuth();
  const [running, setRunning] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const [startTime, setStartTime] = useState<Date | null>(null);
  const [pointsBreakdown, setPointsBreakdown] = useState<PointsBreakdown | null>(null);
  const [showToast, setShowToast] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, []);

  function startExpedition() {
    setRunning(true);
    setStartTime(new Date());
    intervalRef.current = setInterval(() => setElapsed(e => e + 1), 1000);
  }

  async function endExpedition() {
    if (intervalRef.current) clearInterval(intervalRef.current);
    setRunning(false);
    if (!currentUser || !startTime) return;

    const durationSeconds = elapsed;
    const totalPoints = await calculateExpeditionPoints(1, null, true, 0);
    const breakdown: PointsBreakdown = { base: totalPoints, new_species_bonus: 0, rare_bonus: 0, total: totalPoints };
    const endTime = new Date();

    await supabase.from('expeditions').insert({
      user_id: currentUser.id,
      title: `Live expedition — ${startTime.toLocaleDateString()}`,
      type: 'hike',
      is_live: true,
      start_time: startTime.toISOString(),
      end_time: endTime.toISOString(),
      duration_seconds: durationSeconds,
      vibe_tags: [],
      photo_urls: [],
      points_earned: totalPoints,
    });

    await awardPoints(currentUser.id, totalPoints);
    setPointsBreakdown(breakdown);
    setShowToast(true);
    setTimeout(() => router.replace('/(tabs)'), 2500);
  }

  function formatTime(secs: number) {
    const h = Math.floor(secs / 3600);
    const m = Math.floor((secs % 3600) / 60);
    const s = secs % 60;
    return `${h > 0 ? `${h}:` : ''}${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#eaded0', justifyContent: 'center', alignItems: 'center', padding: 24 }}>
      {pointsBreakdown ? <PointsToast points={pointsBreakdown} visible={showToast} /> : null}

      <Icon name={running ? 'map-pin-simple' : 'footprints'} size={64} color="#361319" />
      <Text style={{ fontSize: 20, fontWeight: '700', color: '#361319', marginTop: 8 }}>
        {running ? 'Expedition in progress' : 'Ready to explore?'}
      </Text>

      {running ? (
        <View style={{ marginVertical: 32, alignItems: 'center' }}>
          <Text style={{ fontSize: 56, fontWeight: '800', color: '#4e705e' }}>
            {formatTime(elapsed)}
          </Text>
          <Text style={{ fontSize: 14, color: '#6d3a3c', marginTop: 4 }}>time elapsed</Text>
        </View>
      ) : (
        <View style={{ height: 60 }} />
      )}

      {!running ? (
        <TouchableOpacity
          onPress={startExpedition}
          style={{ backgroundColor: '#4e705e', paddingHorizontal: 48, paddingVertical: 20, borderRadius: 40 }}
        >
          <Text style={{ color: '#eaded0', fontSize: 20, fontWeight: '800' }}>Start Expedition</Text>
        </TouchableOpacity>
      ) : (
        <TouchableOpacity
          onPress={endExpedition}
          style={{ backgroundColor: '#6d3a3c', paddingHorizontal: 48, paddingVertical: 20, borderRadius: 40 }}
        >
          <Text style={{ color: '#eaded0', fontSize: 20, fontWeight: '800' }}>End Expedition</Text>
        </TouchableOpacity>
      )}

      {!running ? (
        <TouchableOpacity onPress={() => router.back()} style={{ marginTop: 20 }}>
          <Text style={{ color: '#110703', fontSize: 15, opacity: 0.5 }}>Cancel</Text>
        </TouchableOpacity>
      ) : null}
    </SafeAreaView>
  );
}
