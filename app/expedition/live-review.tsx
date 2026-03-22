import * as MediaLibrary from 'expo-media-library';
import { useRouter } from 'expo-router';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Animated,
  Dimensions,
  FlatList,
  Image,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { FactCard } from '../../src/components/FactCard';
import { ArrowRightIcon, DownloadIcon, TrashIcon } from '../../src/components/icons/ExpeditionIcons';
import { useAuth } from '../../src/hooks/useAuth';
import { identifySpecies } from '../../src/lib/openai';
import { calculateExpeditionPoints } from '../../src/lib/points';
import {
  getLiveExpeditionDraft,
  updateLiveExpeditionDraft,
  type PhotoInsight,
} from '../../src/lib/liveExpeditionSession';
import { colors } from '../../src/theme/colors';
import { ff } from '../../src/theme/typography';
import type { AIIdentificationResult } from '../../src/types';

const W = Dimensions.get('window').width;

function keyForSpecies(r: AIIdentificationResult) {
  return (r.scientific_name || r.common_name).toLowerCase().trim();
}

export default function LiveExpeditionReviewScreen() {
  const router = useRouter();
  const { currentUser } = useAuth();
  const fade = useRef(new Animated.Value(0)).current;
  const [scanning, setScanning] = useState(true);
  const [insights, setInsights] = useState<PhotoInsight[]>([]);
  const [totalPointsHint, setTotalPointsHint] = useState(0);
  const started = useRef(false);

  const draft = getLiveExpeditionDraft();

  const durationSec = draft?.durationSeconds ?? 0;
  const distMi = draft?.distanceMiles ?? 0;
  const km = distMi * 1.60934;

  const paceMinPerMi = distMi > 0.01 ? durationSec / 60 / distMi : null;
  const paceStr =
    paceMinPerMi != null
      ? (() => {
          const whole = Math.floor(paceMinPerMi);
          const secs = Math.round((paceMinPerMi - whole) * 60);
          return `${whole}:${String(secs).padStart(2, '0')}/mi`;
        })()
      : '—';

  const uniqueSpecies = useMemo(() => {
    const map = new Map<string, AIIdentificationResult>();
    for (const p of insights) {
      if (!p.ai) continue;
      const k = keyForSpecies(p.ai);
      if (!map.has(k)) map.set(k, p.ai);
    }
    return Array.from(map.values());
  }, [insights]);

  useEffect(() => {
    Animated.timing(fade, { toValue: 1, duration: 450, useNativeDriver: true }).start();
  }, [fade]);

  useEffect(() => {
    if (!draft || started.current) return;
    started.current = true;

    (async () => {
      const uris = [...(draft.photoUris ?? [])];
      if (uris.length === 0) {
        setInsights([]);
        updateLiveExpeditionDraft({ photoInsights: [] });
        setScanning(false);
        return;
      }

      const next: PhotoInsight[] = [];
      for (const uri of uris) {
        try {
          const ai = await identifySpecies(uri);
          next.push({ localUri: uri, ai });
        } catch (e: any) {
          next.push({ localUri: uri, ai: null, scanError: e?.message ?? 'Scan failed' });
        }
      }

      setInsights(next);
      updateLiveExpeditionDraft({ photoInsights: next });
      setScanning(false);
    })();
  }, [draft]);

  useEffect(() => {
    if (scanning || !currentUser) return;
    const n = insights.filter(i => i.ai).length;
    let cancelled = false;
    calculateExpeditionPoints(1, km, true, n).then(t => {
      if (!cancelled) setTotalPointsHint(t);
    });
    return () => {
      cancelled = true;
    };
  }, [insights, scanning, currentUser, km]);

  const removePhoto = useCallback((uri: string) => {
    setInsights(prev => {
      const n = prev.filter(p => p.localUri !== uri);
      updateLiveExpeditionDraft({
        photoInsights: n,
        photoUris: n.map(x => x.localUri),
      });
      return n;
    });
  }, []);

  const saveToLibrary = useCallback(async (uri: string) => {
    try {
      const { status } = await MediaLibrary.requestPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission', 'Allow photo library access to save images.');
        return;
      }
      await MediaLibrary.saveToLibraryAsync(uri);
      Alert.alert('Saved', 'Photo saved to your camera roll.');
    } catch (e: any) {
      Alert.alert('Save failed', e?.message ?? 'Could not save.');
    }
  }, []);

  useEffect(() => {
    if (!draft) {
      router.replace('/expedition/setup');
    }
  }, [draft, router]);

  if (!draft) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.surface, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator color={colors.greenBase} />
      </View>
    );
  }

  const h = Math.floor(durationSec / 3600);
  const m = Math.floor((durationSec % 3600) / 60);
  const s = durationSec % 60;
  const durStr = `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;

  return (
    <Animated.View style={{ flex: 1, opacity: fade, backgroundColor: colors.surface }}>
      <SafeAreaView style={{ flex: 1 }} edges={['top']}>
        {scanning ? (
          <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24 }}>
            <ActivityIndicator size="large" color={colors.greenBase} />
            <Text style={{ fontFamily: ff.crimsonBold, fontSize: 18, color: colors.redAccent, marginTop: 16 }}>
              Identifying species…
            </Text>
            <Text style={{ fontFamily: ff.crimson, color: colors.textMuted, marginTop: 8, textAlign: 'center' }}>
              This may take a minute for multiple photos.
            </Text>
          </View>
        ) : (
          <ScrollView contentContainerStyle={{ paddingBottom: 120 }} style={{ flex: 1 }}>
            <View style={{ paddingHorizontal: 20, paddingTop: 8, paddingBottom: 16 }}>
              <Text style={{ fontFamily: ff.faustinaSemi, fontSize: 26, color: colors.redAccent, marginBottom: 12 }}>
                Hike summary
              </Text>
              <Text style={{ fontFamily: ff.crimson, fontSize: 16, color: colors.textPrimary, marginBottom: 4 }}>
                Duration: <Text style={{ fontFamily: ff.crimsonBold }}>{durStr}</Text>
              </Text>
              <Text style={{ fontFamily: ff.crimson, fontSize: 16, color: colors.textPrimary, marginBottom: 4 }}>
                Distance:{' '}
                <Text style={{ fontFamily: ff.crimsonBold }}>{distMi.toFixed(2)} mi</Text>
              </Text>
              <Text style={{ fontFamily: ff.crimson, fontSize: 16, color: colors.textPrimary, marginBottom: 4 }}>
                Pace: <Text style={{ fontFamily: ff.crimsonBold }}>{paceStr}</Text>
              </Text>
              <Text style={{ fontFamily: ff.crimson, fontSize: 16, color: colors.textPrimary, marginBottom: 12 }}>
                Est. points (incl. expedition):{' '}
                <Text style={{ fontFamily: ff.crimsonBold, color: colors.greenBase }}>+{totalPointsHint}</Text>
              </Text>
            </View>

            {uniqueSpecies.length > 0 ? (
              <View style={{ marginBottom: 20 }}>
                <Text
                  style={{
                    fontFamily: ff.crimsonBold,
                    fontSize: 15,
                    color: colors.redBase,
                    paddingHorizontal: 20,
                    marginBottom: 10,
                  }}
                >
                  Species found
                </Text>
                <FlatList
                  horizontal
                  data={uniqueSpecies}
                  keyExtractor={item => keyForSpecies(item)}
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={{ paddingHorizontal: 16, gap: 12 }}
                  snapToInterval={W * 0.88 + 12}
                  decelerationRate="fast"
                  renderItem={({ item }) => (
                    <View style={{ width: W * 0.88 }}>
                      <FactCard
                        commonName={item.common_name}
                        scientificName={item.scientific_name}
                        category={item.category}
                        confidence={item.confidence}
                        factCard={item.fact_card}
                      />
                    </View>
                  )}
                />
              </View>
            ) : null}

            {insights.length > 0 ? (
              <Text
                style={{
                  fontFamily: ff.crimsonBold,
                  fontSize: 15,
                  color: colors.redBase,
                  paddingHorizontal: 20,
                  marginBottom: 10,
                }}
              >
                Photos & details
              </Text>
            ) : (
              <Text
                style={{
                  fontFamily: ff.crimson,
                  fontSize: 15,
                  color: colors.textMuted,
                  paddingHorizontal: 20,
                  marginBottom: 16,
                }}
              >
                No photos from this hike. You can add a title and story on the next screen.
              </Text>
            )}

            {insights.map(ins => (
              <View key={ins.localUri} style={{ marginBottom: 28, paddingHorizontal: 16 }}>
                <View style={{ position: 'relative' }}>
                  <Image
                    source={{ uri: ins.localUri }}
                    style={{ width: '100%', height: 220, borderRadius: 14 }}
                    resizeMode="cover"
                  />
                  <View style={{ position: 'absolute', top: 10, right: 10, gap: 8 }}>
                    <TouchableOpacity
                      onPress={() => saveToLibrary(ins.localUri)}
                      style={{
                        width: 40,
                        height: 40,
                        borderRadius: 20,
                        backgroundColor: colors.surface,
                        alignItems: 'center',
                        justifyContent: 'center',
                        borderWidth: 1,
                        borderColor: colors.blueAccent,
                      }}
                      accessibilityLabel="Save photo to library"
                    >
                      <DownloadIcon color={colors.blueAccent} size={20} />
                    </TouchableOpacity>
                    <TouchableOpacity
                      onPress={() => removePhoto(ins.localUri)}
                      style={{
                        width: 40,
                        height: 40,
                        borderRadius: 20,
                        backgroundColor: colors.surface,
                        alignItems: 'center',
                        justifyContent: 'center',
                        borderWidth: 1,
                        borderColor: colors.redBase,
                      }}
                      accessibilityLabel="Remove photo"
                    >
                      <TrashIcon color={colors.redBase} size={20} />
                    </TouchableOpacity>
                  </View>
                </View>
                {ins.scanError ? (
                  <Text style={{ fontFamily: ff.crimson, color: colors.redBase, marginTop: 8 }}>{ins.scanError}</Text>
                ) : null}
                {ins.ai ? (
                  <FactCard
                    commonName={ins.ai.common_name}
                    scientificName={ins.ai.scientific_name}
                    category={ins.ai.category}
                    confidence={ins.ai.confidence}
                    factCard={ins.ai.fact_card}
                  />
                ) : null}
              </View>
            ))}
          </ScrollView>
        )}

        {!scanning ? (
          <TouchableOpacity
            onPress={() => router.push('/expedition/live-post')}
            style={{
              position: 'absolute',
              bottom: 28,
              right: 20,
              backgroundColor: colors.greenBase,
              paddingHorizontal: 18,
              paddingVertical: 14,
              borderRadius: 14,
              flexDirection: 'row',
              alignItems: 'center',
              gap: 8,
            }}
            accessibilityLabel="Continue to post"
          >
            <Text style={{ fontFamily: ff.crimsonBold, fontSize: 16, color: colors.bgPrimary }}>Next</Text>
            <ArrowRightIcon color={colors.bgPrimary} size={20} />
          </TouchableOpacity>
        ) : null}
      </SafeAreaView>
    </Animated.View>
  );
}
