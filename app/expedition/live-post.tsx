import * as FileSystem from 'expo-file-system/legacy';
import { useRouter } from 'expo-router';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { EXPEDITION_VIBE_TAGS } from '../../src/constants/expeditionVibes';
import { ArrowLeftIcon, CheckIcon } from '../../src/components/icons/ExpeditionIcons';
import { useAuth } from '../../src/hooks/useAuth';
import {
  awardPoints,
  calculateDiscoveryPoints,
  calculateExpeditionPoints,
  checkAndAwardBadges,
  trackSpecies,
} from '../../src/lib/points';
import { clearLiveExpeditionDraft, getLiveExpeditionDraft } from '../../src/lib/liveExpeditionSession';
import { supabase } from '../../src/lib/supabase';
import { PointsToast } from '../../src/components/PointsToast';
import { colors } from '../../src/theme/colors';
import { ff, textStyles } from '../../src/theme/typography';
import type { PointsBreakdown } from '../../src/types';

const MAX_POST_PHOTOS = 5;

function base64ToUint8Array(base64: string): Uint8Array {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return bytes;
}

export default function LiveExpeditionPostScreen() {
  const router = useRouter();
  const { currentUser } = useAuth();
  const draft = getLiveExpeditionDraft();

  const [title, setTitle] = useState('');
  const [locationDetail, setLocationDetail] = useState(draft?.locationLabel ?? '');
  const [description, setDescription] = useState('');
  const [vibes, setVibes] = useState<string[]>(draft?.vibeTags ?? []);
  const [selectedUris, setSelectedUris] = useState<string[]>([]);
  const [posting, setPosting] = useState(false);
  const [pointsBreakdown, setPointsBreakdown] = useState<PointsBreakdown | null>(null);
  const [showToast, setShowToast] = useState(false);

  const pool = useMemo(() => draft?.photoUris ?? [], [draft]);

  useEffect(() => {
    if (pool.length > 0 && selectedUris.length === 0) {
      setSelectedUris(pool.slice(0, MAX_POST_PHOTOS));
    }
  }, [pool, selectedUris.length]);

  useEffect(() => {
    if (!draft) router.replace('/expedition/setup');
  }, [draft, router]);

  function toggleVibe(tag: string) {
    setVibes(prev => (prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag]));
  }

  function togglePhoto(uri: string) {
    setSelectedUris(prev => {
      if (prev.includes(uri)) {
        return prev.filter(u => u !== uri);
      }
      if (prev.length >= MAX_POST_PHOTOS) {
        Alert.alert('Limit', `You can post up to ${MAX_POST_PHOTOS} photos.`);
        return prev;
      }
      return [...prev, uri];
    });
  }

  const discardHike = useCallback(() => {
    Alert.alert(
      'Discard this hike?',
      'Your draft expedition, photos, and AI results on this device will be cleared. Nothing will be posted.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Discard',
          style: 'destructive',
          onPress: () => {
            clearLiveExpeditionDraft();
            router.replace('/(tabs)');
          },
        },
      ],
    );
  }, [router]);

  const postExpedition = useCallback(async () => {
    if (!currentUser || !draft) return;
    const t = title.trim();
    const desc = description.trim();
    if (!t && !desc) {
      Alert.alert('Add text', 'Enter a title and/or description for your expedition.');
      return;
    }

    setPosting(true);
    try {
      const allInsights = draft.photoInsights ?? [];
      const km = draft.distanceMiles * 1.60934;
      const selectedInsights = allInsights.filter(i => selectedUris.includes(i.localUri) && i.ai);

      const photoUrls: string[] = [];
      for (const uri of selectedUris) {
        const filename = `${currentUser.id}/live-${Date.now()}-${photoUrls.length}.jpg`;
        const base64 = await FileSystem.readAsStringAsync(uri, { encoding: 'base64' });
        const bytes = base64ToUint8Array(base64);
        const { error } = await supabase.storage
          .from('expeditions')
          .upload(filename, bytes, { contentType: 'image/jpeg' });
        if (error) throw error;
        const { data } = supabase.storage.from('expeditions').getPublicUrl(filename);
        photoUrls.push(data.publicUrl);
      }

      const uriToPublic = new Map<string, string>();
      selectedUris.forEach((uri, i) => {
        uriToPublic.set(uri, photoUrls[i]);
      });

      const n = selectedInsights.length;
      const expeditionPoints = await calculateExpeditionPoints(1, km, true, n);

      const displayTitle = t || desc.slice(0, 80) || 'Live expedition';

      const { data: expedition, error: expErr } = await supabase
        .from('expeditions')
        .insert({
          user_id: currentUser.id,
          title: displayTitle,
          description: desc || null,
          type: 'hike',
          location: locationDetail.trim() || draft.locationLabel,
          distance: draft.distanceMiles,
          difficulty: 'moderate',
          vibe_tags: vibes,
          photo_urls: photoUrls,
          is_live: true,
          duration_seconds: draft.durationSeconds,
          start_time: draft.startTimeIso,
          end_time: draft.endTimeIso,
          points_earned: expeditionPoints,
        })
        .select()
        .single();

      if (expErr) throw expErr;
      if (!expedition) throw new Error('No expedition returned');

      for (const ins of selectedInsights) {
        const result = ins.ai!;
        const imageUrl = uriToPublic.get(ins.localUri);
        if (!imageUrl) continue;

        const speciesKey = result.scientific_name || result.common_name;
        const breakdown = await calculateDiscoveryPoints(currentUser.id, speciesKey, result.is_rare);

        const { data: disc, error: dErr } = await supabase
          .from('discoveries')
          .insert({
            user_id: currentUser.id,
            image_url: imageUrl,
            category: result.category,
            common_name: result.common_name,
            scientific_name: result.scientific_name,
            confidence: result.confidence,
            fact_card: result.fact_card,
            caption: null,
            location_lat: null,
            location_lng: null,
            is_sensitive: result.is_rare,
            points_earned: breakdown.total,
          })
          .select()
          .single();

        if (dErr) throw dErr;
        if (disc) {
          await supabase.from('expedition_discoveries').insert({
            expedition_id: expedition.id,
            discovery_id: disc.id,
          });
          await trackSpecies(currentUser.id, speciesKey);
        }
      }

      await awardPoints(currentUser.id, expeditionPoints);
      const newBadges = await checkAndAwardBadges(currentUser.id);

      clearLiveExpeditionDraft();

      setPointsBreakdown({
        base: expeditionPoints,
        new_species_bonus: 0,
        rare_bonus: 0,
        total: expeditionPoints,
      });
      setShowToast(true);

      setTimeout(() => router.replace('/(tabs)'), newBadges.length > 0 ? 2800 : 2200);
    } catch (e: any) {
      console.error('[live-post]', e);
      Alert.alert('Post failed', e?.message ?? 'Try again.');
    } finally {
      setPosting(false);
    }
  }, [currentUser, draft, description, locationDetail, selectedUris, title, vibes, router]);

  if (!draft) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.bgPrimary }}>
        <ActivityIndicator color={colors.greenBase} />
      </View>
    );
  }

  return (
    <ScrollView style={{ flex: 1, backgroundColor: colors.bgPrimary }} keyboardShouldPersistTaps="handled">
      <SafeAreaView style={{ padding: 16, paddingBottom: 40 }}>
        {pointsBreakdown ? <PointsToast points={pointsBreakdown} visible={showToast} /> : null}

        <TouchableOpacity
          onPress={() => router.back()}
          style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 12 }}
          accessibilityLabel="Back"
        >
          <ArrowLeftIcon color={colors.greenBase} size={22} />
          <Text style={{ fontFamily: ff.crimsonBold, color: colors.greenBase }}>Back</Text>
        </TouchableOpacity>

        <Text style={[textStyles.titleHeaderAccent, { fontSize: 24, marginBottom: 8 }]}>Post expedition</Text>
        <Text style={[textStyles.postDescription, { marginBottom: 16, opacity: 0.9 }]}>
          Optional photos (up to {MAX_POST_PHOTOS}). Text-only posts are fine.
        </Text>

        <Label>Title</Label>
        <TextInput
          value={title}
          onChangeText={setTitle}
          placeholder="Name your hike (optional if you write below)"
          placeholderTextColor={colors.bgAccent}
          style={inputStyle}
        />

        <Label>Location</Label>
        <TextInput
          value={locationDetail}
          onChangeText={setLocationDetail}
          placeholder="Refine location"
          placeholderTextColor={colors.bgAccent}
          style={inputStyle}
        />

        <Label>Vibes</Label>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 16 }}>
          {EXPEDITION_VIBE_TAGS.map(tag => {
            const on = vibes.includes(tag);
            return (
              <TouchableOpacity
                key={tag}
                onPress={() => toggleVibe(tag)}
                style={{
                  borderRadius: 20,
                  paddingHorizontal: 12,
                  paddingVertical: 6,
                  backgroundColor: on ? colors.greenBase : colors.surface,
                  borderWidth: 1,
                  borderColor: colors.redBase,
                }}
              >
                <Text style={[textStyles.vibeTag, { color: on ? colors.bgPrimary : colors.textMuted }]}>{tag}</Text>
              </TouchableOpacity>
            );
          })}
        </View>

        <Label>Description</Label>
        <TextInput
          value={description}
          onChangeText={setDescription}
          placeholder="How did it go?"
          placeholderTextColor={colors.bgAccent}
          style={[inputStyle, { height: 100, textAlignVertical: 'top' }]}
          multiline
        />

        {pool.length > 0 ? (
          <>
            <Label>{`Photos (tap up to ${MAX_POST_PHOTOS}, or deselect all)`}</Label>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 20 }}>
              {pool.map(uri => {
                const on = selectedUris.includes(uri);
                return (
                  <TouchableOpacity key={uri} onPress={() => togglePhoto(uri)} style={{ position: 'relative' }}>
                    <Image
                      source={{ uri }}
                      style={{
                        width: 88,
                        height: 88,
                        borderRadius: 12,
                        opacity: on ? 1 : 0.35,
                        borderWidth: on ? 3 : 0,
                        borderColor: colors.greenBase,
                      }}
                    />
                    {on ? (
                      <View
                        style={{
                          position: 'absolute',
                          top: 4,
                          right: 4,
                          backgroundColor: colors.greenBase,
                          borderRadius: 10,
                          width: 22,
                          height: 22,
                          alignItems: 'center',
                          justifyContent: 'center',
                        }}
                      >
                        <CheckIcon color={colors.bgPrimary} size={14} />
                      </View>
                    ) : null}
                  </TouchableOpacity>
                );
              })}
            </View>
          </>
        ) : (
          <Text style={{ fontFamily: ff.crimson, color: colors.textMuted, marginBottom: 20 }}>
            No photos from this hike. Post with text only.
          </Text>
        )}

        <TouchableOpacity
          onPress={postExpedition}
          disabled={posting}
          style={{
            backgroundColor: posting ? colors.bgAccent : colors.greenBase,
            padding: 18,
            borderRadius: 16,
            alignItems: 'center',
            marginBottom: 12,
          }}
        >
          <Text style={{ fontFamily: ff.crimsonBold, fontSize: 18, color: colors.bgPrimary }}>
            {posting ? 'Posting…' : 'Post expedition'}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={discardHike}
          disabled={posting}
          style={{
            padding: 16,
            borderRadius: 16,
            alignItems: 'center',
            borderWidth: 2,
            borderColor: colors.redBase,
            backgroundColor: colors.surface,
          }}
        >
          <Text style={{ fontFamily: ff.crimsonBold, fontSize: 16, color: colors.redAccent }}>
            Do not post — discard hike data
          </Text>
        </TouchableOpacity>
      </SafeAreaView>
    </ScrollView>
  );
}

const inputStyle = {
  backgroundColor: colors.surface,
  borderRadius: 12,
  padding: 14,
  fontSize: 15,
  borderWidth: 1,
  borderColor: colors.bgAccent,
  marginBottom: 16,
  color: colors.textPrimary,
  fontFamily: ff.crimson,
};

function Label({ children }: { children: string }) {
  return (
    <Text
      style={{
        fontFamily: ff.crimsonBold,
        fontSize: 12,
        color: colors.redBase,
        textTransform: 'uppercase',
        letterSpacing: 0.5,
        marginBottom: 6,
      }}
    >
      {children}
    </Text>
  );
}
