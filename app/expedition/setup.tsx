import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Switch,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ArrowLeftIcon } from '../../src/components/icons/ExpeditionIcons';
import { EXPEDITION_VIBE_TAGS } from '../../src/constants/expeditionVibes';
import { clearLiveExpeditionDraft, setLiveExpeditionDraft } from '../../src/lib/liveExpeditionSession';
import { colors } from '../../src/theme/colors';
import { ff, textStyles } from '../../src/theme/typography';

export default function LiveExpeditionSetupScreen() {
  const router = useRouter();
  const [locationLabel, setLocationLabel] = useState('');
  const [vibes, setVibes] = useState<string[]>([]);
  const [gpsEnabled, setGpsEnabled] = useState(true);

  function addVibe(tag: string) {
    setVibes(prev => (prev.includes(tag) ? prev : [...prev, tag]));
  }

  function removeVibe(tag: string) {
    setVibes(prev => prev.filter(t => t !== tag));
  }

  function start() {
    if (!gpsEnabled) {
      const loc = locationLabel.trim();
      if (!loc) {
        Alert.alert('Location needed', 'Enter a location for your hike.');
        return;
      }
    }
    clearLiveExpeditionDraft();
    setLiveExpeditionDraft({
      locationLabel: gpsEnabled ? '' : locationLabel.trim(),
      vibeTags: vibes,
      gpsEnabled,
      durationSeconds: 0,
      startTimeIso: '',
      endTimeIso: '',
      distanceMiles: 0,
      photoUris: [],
      photoInsights: [],
      startLat: null,
      startLng: null,
      routeWaypoints: [],
    });
    router.push('/expedition/live');
  }

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: colors.bgPrimary }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={{ paddingBottom: 40 }}
        style={{ flex: 1 }}
      >
        <SafeAreaView style={{ padding: 20 }}>
          <TouchableOpacity
            onPress={() => router.back()}
            style={{ marginBottom: 12, flexDirection: 'row', alignItems: 'center', gap: 8 }}
            accessibilityLabel="Go back"
          >
            <ArrowLeftIcon color={colors.greenBase} size={22} />
            <Text style={{ fontSize: 16, color: colors.greenBase, fontFamily: ff.crimsonBold }}>Back</Text>
          </TouchableOpacity>

          <Text style={[textStyles.titleHeaderAccent, { fontSize: 26, marginBottom: 6 }]}>Live expedition</Text>
          <Text style={[textStyles.postDescription, { marginBottom: 20, opacity: 0.9 }]}>
            Set your location and vibes, then start tracking. Distance comes from GPS (or you can enter it after the hike
            if tracking is off).
          </Text>

          {gpsEnabled ? (
            <View
              style={{
                backgroundColor: colors.surface,
                borderRadius: 14,
                paddingHorizontal: 16,
                paddingVertical: 14,
                marginBottom: 20,
                borderWidth: 1,
                borderColor: colors.bgAccent,
              }}
            >
              <Text style={{ fontFamily: ff.crimson, fontSize: 15, color: colors.textMuted }}>
                Your start location will be detected automatically.
              </Text>
            </View>
          ) : (
            <>
              <Text style={labelStyle}>Location</Text>
              <TextInput
                value={locationLabel}
                onChangeText={setLocationLabel}
                placeholder="Trail, park, city…"
                placeholderTextColor={colors.bgAccent}
                style={{
                  backgroundColor: colors.redAccent,
                  borderRadius: 14,
                  paddingHorizontal: 16,
                  paddingVertical: 14,
                  fontFamily: ff.crimson,
                  fontSize: 17,
                  color: colors.bgPrimary,
                  marginBottom: 20,
                }}
                autoCapitalize="words"
              />
            </>
          )}

          <Text style={labelStyle}>Vibe tags</Text>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', marginBottom: 8 }}>
            {EXPEDITION_VIBE_TAGS.map(tag => {
              const on = vibes.includes(tag);
              return (
                <TouchableOpacity
                  key={tag}
                  onPress={() => (on ? removeVibe(tag) : addVibe(tag))}
                  style={{
                    borderRadius: 20,
                    paddingHorizontal: 12,
                    paddingVertical: 6,
                    marginRight: 8,
                    marginBottom: 8,
                    backgroundColor: on ? colors.greenBase : colors.bgPrimary,
                    borderWidth: 1,
                    borderColor: colors.redBase,
                  }}
                >
                  <Text style={[textStyles.vibeTag, { color: on ? colors.bgPrimary : colors.textMuted }]}>{tag}</Text>
                </TouchableOpacity>
              );
            })}
          </View>

          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginTop: 16,
              marginBottom: 24,
              paddingVertical: 12,
              paddingHorizontal: 14,
              backgroundColor: colors.surface,
              borderRadius: 14,
              borderWidth: 1,
              borderColor: colors.bgAccent,
            }}
          >
            <View style={{ flex: 1, paddingRight: 12 }}>
              <Text style={{ fontFamily: ff.crimsonBold, fontSize: 16, color: colors.redAccent }}>GPS live tracking</Text>
              <Text style={{ fontFamily: ff.crimson, fontSize: 13, color: colors.textMuted, marginTop: 4 }}>
                Track distance along your path. Turn off to enter distance after your hike.
              </Text>
            </View>
            <Switch
              value={gpsEnabled}
              onValueChange={setGpsEnabled}
              trackColor={{ false: colors.bgAccent, true: colors.greenBase }}
              thumbColor={colors.bgPrimary}
            />
          </View>

          <TouchableOpacity
            onPress={start}
            style={{
              backgroundColor: colors.greenBase,
              paddingVertical: 18,
              borderRadius: 16,
              alignItems: 'center',
            }}
          >
            <Text style={{ fontFamily: ff.crimsonBold, fontSize: 18, color: colors.bgPrimary }}>Start expedition</Text>
          </TouchableOpacity>
        </SafeAreaView>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const labelStyle = {
  fontFamily: ff.crimsonBold,
  fontSize: 12,
  color: colors.redBase,
  textTransform: 'uppercase' as const,
  letterSpacing: 0.6,
  marginBottom: 8,
};
