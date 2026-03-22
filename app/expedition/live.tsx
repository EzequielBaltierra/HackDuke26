import * as ImagePicker from 'expo-image-picker';
import * as Location from 'expo-location';
import { useRouter } from 'expo-router';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  Alert,
  Image,
  Modal,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { CameraIcon } from '../../src/components/expedition/CameraIcon';
import { haversineMeters, metersToMiles } from '../../src/lib/geo';
import { getLiveExpeditionDraft, updateLiveExpeditionDraft } from '../../src/lib/liveExpeditionSession';
import { colors } from '../../src/theme/colors';
import { ff } from '../../src/theme/typography';

const TAB_BAR_OFFSET = 72;

export default function LiveExpeditionScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [elapsed, setElapsed] = useState(0);
  const elapsedRef = useRef(0);
  const [distanceMiles, setDistanceMiles] = useState(0);
  const [photos, setPhotos] = useState<string[]>([]);
  const photosRef = useRef<string[]>([]);
  const [previewUri, setPreviewUri] = useState<string | null>(null);
  const [manualDistanceOpen, setManualDistanceOpen] = useState(false);
  const [manualInput, setManualInput] = useState('');
  const [gpsReady, setGpsReady] = useState(false);
  const [gpsTracks, setGpsTracks] = useState(true);

  const watchRef = useRef<Location.LocationSubscription | null>(null);
  const lastFixRef = useRef<Location.LocationObject | null>(null);
  const pathMetersRef = useRef(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const startCapturedRef = useRef(false);
  const lastWaypointCoordsRef = useRef<Location.LocationObject['coords'] | null>(null);
  const waypointsRef = useRef<{ lat: number; lng: number }[]>([]);

  useEffect(() => {
    elapsedRef.current = elapsed;
  }, [elapsed]);

  useEffect(() => {
    photosRef.current = photos;
  }, [photos]);

  const stopAndGoReview = useCallback(
    (finalMiles: number) => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
      watchRef.current?.remove();
      watchRef.current = null;

      if (!getLiveExpeditionDraft()) return;
      const end = new Date();
      updateLiveExpeditionDraft({
        durationSeconds: elapsedRef.current,
        endTimeIso: end.toISOString(),
        distanceMiles: finalMiles,
        photoUris: photosRef.current,
        routeWaypoints: waypointsRef.current,
      });
      router.push('/expedition/live-review');
    },
    [router],
  );

  const finishStop = useCallback(() => {
    const d = getLiveExpeditionDraft();
    if (!d) return;
    if (d.gpsEnabled) {
      stopAndGoReview(metersToMiles(pathMetersRef.current));
    } else {
      setManualDistanceOpen(true);
    }
  }, [stopAndGoReview]);

  const confirmManualDistance = useCallback(() => {
    const n = parseFloat(manualInput.replace(/,/g, '.'));
    if (Number.isNaN(n) || n < 0) {
      Alert.alert('Invalid distance', 'Enter miles using a number (e.g. 2.5).');
      return;
    }
    setManualDistanceOpen(false);
    setManualInput('');
    stopAndGoReview(n);
  }, [manualInput, stopAndGoReview]);

  useEffect(() => {
    const d = getLiveExpeditionDraft();
    if (!d) {
      router.replace('/expedition/setup');
      return;
    }
    setGpsTracks(d.gpsEnabled);

    const start = new Date();
    updateLiveExpeditionDraft({
      startTimeIso: start.toISOString(),
      endTimeIso: '',
    });

    timerRef.current = setInterval(() => setElapsed(e => e + 1), 1000);

    let cancelled = false;

    (async () => {
      if (!d.gpsEnabled) {
        setGpsReady(true);
        return;
      }
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted' || cancelled) {
        Alert.alert(
          'Location permission',
          'GPS distance needs location access. You can enter distance manually when you finish.',
        );
        updateLiveExpeditionDraft({ gpsEnabled: false });
        setGpsTracks(false);
        setGpsReady(true);
        return;
      }

      const sub = await Location.watchPositionAsync(
        {
          accuracy: Location.Accuracy.BestForNavigation,
          distanceInterval: 4,
          timeInterval: 800,
        },
        loc => {
          // --- Start location capture (first fix only) ---
          if (!startCapturedRef.current) {
            startCapturedRef.current = true;
            updateLiveExpeditionDraft({
              startLat: loc.coords.latitude,
              startLng: loc.coords.longitude,
            });
            fetch(
              `https://nominatim.openstreetmap.org/reverse?lat=${loc.coords.latitude}&lon=${loc.coords.longitude}&format=json`,
              { headers: { 'User-Agent': 'Root-HackDuke/1.0' } }
            )
              .then(r => r.json())
              .then(data => {
                if (data.display_name) {
                  updateLiveExpeditionDraft({ locationLabel: data.display_name });
                }
              })
              .catch(() => {
                updateLiveExpeditionDraft({
                  locationLabel: `${loc.coords.latitude.toFixed(4)}, ${loc.coords.longitude.toFixed(4)}`,
                });
              });
          }

          // --- Distance accumulation (existing logic) ---
          const prev = lastFixRef.current;
          if (prev) {
            const delta = haversineMeters(prev.coords, loc.coords);
            if (delta > 0.5 && delta < 5000) {
              pathMetersRef.current += delta;
              setDistanceMiles(metersToMiles(pathMetersRef.current));
            }
          }
          lastFixRef.current = loc;

          // --- Waypoint recording (every 25m) ---
          const waypoint = { lat: loc.coords.latitude, lng: loc.coords.longitude };
          if (!lastWaypointCoordsRef.current) {
            waypointsRef.current.push(waypoint);
            lastWaypointCoordsRef.current = loc.coords;
          } else {
            const distFromLast = haversineMeters(lastWaypointCoordsRef.current, loc.coords);
            if (distFromLast >= 25) {
              waypointsRef.current.push(waypoint);
              lastWaypointCoordsRef.current = loc.coords;
            }
          }
        },
      );
      watchRef.current = sub;
      setGpsReady(true);
    })();

    return () => {
      cancelled = true;
      if (timerRef.current) clearInterval(timerRef.current);
      watchRef.current?.remove();
    };
  }, [router]);

  async function openCamera() {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission needed', 'Allow camera to capture trail photos.');
      return;
    }
    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ['images'],
      quality: 0.85,
    });
    if (!result.canceled && result.assets[0]) {
      setPreviewUri(result.assets[0].uri);
    }
  }

  function keepPreview() {
    if (previewUri) {
      setPhotos(prev => [...prev, previewUri]);
    }
    setPreviewUri(null);
  }

  function discardPreview() {
    setPreviewUri(null);
  }

  const draft = getLiveExpeditionDraft();
  const locationTitle = draft?.locationLabel ?? 'Expedition';

  const h = Math.floor(elapsed / 3600);
  const m = Math.floor((elapsed % 3600) / 60);
  const s = elapsed % 60;
  const timeStr = `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;

  return (
    <View style={{ flex: 1, backgroundColor: colors.bgPrimary }}>
      <View
        style={{
          backgroundColor: colors.redAccent,
          paddingTop: insets.top,
          paddingBottom: 12,
          paddingHorizontal: 16,
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Text
          style={{
            fontFamily: ff.crimsonBold,
            fontSize: 17,
            color: colors.bgPrimary,
            textAlign: 'center',
          }}
          numberOfLines={2}
        >
          {locationTitle}
        </Text>
      </View>

      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 24 }}>
        {!gpsReady ? (
          <Text style={{ fontFamily: ff.crimson, color: colors.textMuted }}>Starting GPS…</Text>
        ) : (
          <>
            <Text
              style={{
                fontFamily: ff.faustinaSemi,
                fontSize: 44,
                color: colors.blueAccent,
                marginBottom: 8,
              }}
            >
              {gpsTracks ? distanceMiles.toFixed(2) : '—'} mi
            </Text>
            <Text style={{ fontFamily: ff.crimson, fontSize: 14, color: colors.textMuted, marginBottom: 24 }}>
              Distance
            </Text>
            <Text style={{ fontFamily: ff.faustinaSemi, fontSize: 40, color: colors.blueAccent }}>{timeStr}</Text>
            <Text style={{ fontFamily: ff.crimson, fontSize: 14, color: colors.textMuted, marginTop: 8 }}>Time</Text>
          </>
        )}
      </View>

      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'center',
          paddingBottom: insets.bottom + TAB_BAR_OFFSET,
          gap: 28,
        }}
      >
        <TouchableOpacity onPress={openCamera} activeOpacity={0.85} accessibilityLabel="Take photo">
          <View
            style={{
              width: 88,
              height: 88,
              borderRadius: 44,
              backgroundColor: colors.redAccent,
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <View
              style={{
                width: 72,
                height: 72,
                borderRadius: 36,
                borderWidth: 3,
                borderColor: colors.redAccent,
                backgroundColor: 'transparent',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <CameraIcon color={colors.bgAccent} size={34} />
            </View>
          </View>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={finishStop}
          style={{
            backgroundColor: colors.redBase,
            paddingHorizontal: 22,
            paddingVertical: 16,
            borderRadius: 16,
            minWidth: 100,
            alignItems: 'center',
          }}
        >
          <Text style={{ fontFamily: ff.crimsonBold, fontSize: 17, color: colors.bgPrimary }}>Stop</Text>
        </TouchableOpacity>
      </View>

      <Modal visible={!!previewUri} transparent animationType="fade">
        <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.85)', justifyContent: 'center', padding: 24 }}>
          {previewUri ? (
            <Image source={{ uri: previewUri }} style={{ width: '100%', height: 320, borderRadius: 16 }} resizeMode="cover" />
          ) : null}
          <View style={{ flexDirection: 'row', gap: 16, marginTop: 20 }}>
            <TouchableOpacity
              onPress={discardPreview}
              style={{ flex: 1, padding: 16, backgroundColor: colors.redBase, borderRadius: 14, alignItems: 'center' }}
            >
              <Text style={{ color: colors.bgPrimary, fontFamily: ff.crimsonBold }}>Discard</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={keepPreview}
              style={{ flex: 1, padding: 16, backgroundColor: colors.greenBase, borderRadius: 14, alignItems: 'center' }}
            >
              <Text style={{ color: colors.bgPrimary, fontFamily: ff.crimsonBold }}>Use photo</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      <Modal visible={manualDistanceOpen} transparent animationType="fade">
        <View style={{ flex: 1, justifyContent: 'center', backgroundColor: 'rgba(0,0,0,0.45)', padding: 24 }}>
          <View style={{ backgroundColor: colors.bgPrimary, borderRadius: 16, padding: 20 }}>
            <Text style={{ fontFamily: ff.crimsonBold, fontSize: 18, color: colors.redAccent, marginBottom: 8 }}>
              Distance hiked
            </Text>
            <Text style={{ fontFamily: ff.crimson, color: colors.textMuted, marginBottom: 12 }}>
              GPS was off. Enter total miles for this hike.
            </Text>
            <TextInput
              value={manualInput}
              onChangeText={setManualInput}
              placeholder="e.g. 3.25"
              placeholderTextColor={colors.bgAccent}
              keyboardType="decimal-pad"
              style={{
                borderWidth: 1,
                borderColor: colors.bgAccent,
                borderRadius: 12,
                padding: 14,
                fontFamily: ff.crimson,
                fontSize: 18,
                color: colors.textPrimary,
                marginBottom: 16,
              }}
            />
            <View style={{ flexDirection: 'row', gap: 12 }}>
              <TouchableOpacity
                onPress={() => {
                  setManualDistanceOpen(false);
                  setManualInput('');
                }}
                style={{ flex: 1, padding: 14, borderRadius: 12, backgroundColor: colors.bgAccent, alignItems: 'center' }}
              >
                <Text style={{ fontFamily: ff.crimsonBold, color: colors.redAccent }}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={confirmManualDistance}
                style={{ flex: 1, padding: 14, borderRadius: 12, backgroundColor: colors.greenBase, alignItems: 'center' }}
              >
                <Text style={{ fontFamily: ff.crimsonBold, color: colors.bgPrimary }}>Continue</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}
