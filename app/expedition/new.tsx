import * as FileSystem from 'expo-file-system/legacy';
import * as ImagePicker from 'expo-image-picker';
import { useRouter, useLocalSearchParams } from 'expo-router';
import React, { useState } from 'react';
import {
  Alert, Image, ScrollView, Text, TextInput, TouchableOpacity, View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { calculateExpeditionPoints, awardPoints, checkAndAwardBadges } from '../../src/lib/points';
import { supabase } from '../../src/lib/supabase';
import { PointsToast } from '../../src/components/PointsToast';
import { useAuth } from '../../src/hooks/useAuth';
import { ExpeditionType, Difficulty, PointsBreakdown } from '../../src/types';

const EXPEDITION_TYPES: ExpeditionType[] = ['trail', 'hike', 'scenic_view', 'walk', 'nature_spot'];
const DIFFICULTIES: Difficulty[] = ['easy', 'moderate', 'hard'];
const VIBE_TAGS = ['Peaceful', 'Scenic', 'Adventurous', 'Shaded', 'Wildlife-rich', 'Social', 'Relaxing', 'Water feature'];
const MAX_PHOTOS = 3;

function base64ToUint8Array(base64: string): Uint8Array {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return bytes;
}

export default function NewExpeditionScreen() {
  const router = useRouter();
  const { currentUser } = useAuth();
  const params = useLocalSearchParams<{
    originalId?: string;
    originalTitle?: string;
    originalLocation?: string;
    originalType?: string;
    originalDifficulty?: string;
    vibes?: string;
    originalCreatorUsername?: string;
  }>();
  const isRedo = Boolean(params.originalId);
  const [title, setTitle] = useState(params.originalTitle ?? '');
  const [description, setDescription] = useState('');
  const [type, setType] = useState<ExpeditionType>((params.originalType as ExpeditionType) ?? 'hike');
  const [location, setLocation] = useState(params.originalLocation ?? '');
  const [distance, setDistance] = useState('');
  const [difficulty, setDifficulty] = useState<Difficulty>((params.originalDifficulty as Difficulty) ?? 'moderate');
  const [selectedVibeTags, setSelectedVibeTags] = useState<string[]>(
    params.vibes ? (params.vibes as string).split('|').filter(Boolean) : []
  );
  const [taggedUsernames, setTaggedUsernames] = useState('');
  const [photos, setPhotos] = useState<string[]>([]);
  const [posting, setPosting] = useState(false);
  const [pointsBreakdown, setPointsBreakdown] = useState<PointsBreakdown | null>(null);
  const [showToast, setShowToast] = useState(false);

  function toggleVibeTag(tag: string) {
    setSelectedVibeTags(prev =>
      prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag]
    );
  }

  async function pickPhoto() {
    if (photos.length >= MAX_PHOTOS) {
      Alert.alert('Max photos', `You can add up to ${MAX_PHOTOS} photos.`);
      return;
    }
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission needed', 'Please allow photo access.');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      quality: 0.8,
      allowsEditing: true,
      aspect: [4, 3],
    });
    if (!result.canceled && result.assets[0]) {
      setPhotos(prev => [...prev, result.assets[0].uri]);
    }
  }

  async function takePhoto() {
    if (photos.length >= MAX_PHOTOS) {
      Alert.alert('Max photos', `You can add up to ${MAX_PHOTOS} photos.`);
      return;
    }
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission needed', 'Please allow camera access.');
      return;
    }
    const result = await ImagePicker.launchCameraAsync({
      quality: 0.8,
      allowsEditing: true,
      aspect: [4, 3],
    });
    if (!result.canceled && result.assets[0]) {
      setPhotos(prev => [...prev, result.assets[0].uri]);
    }
  }

  async function uploadPhotos(): Promise<string[]> {
    const urls: string[] = [];
    for (const uri of photos) {
      const filename = `${currentUser!.id}/${Date.now()}-${urls.length}.jpg`;
      const base64 = await FileSystem.readAsStringAsync(uri, { encoding: 'base64' });
      const bytes = base64ToUint8Array(base64);
      const { error } = await supabase.storage
        .from('expeditions')
        .upload(filename, bytes, { contentType: 'image/jpeg' });
      if (error) throw error;
      const { data } = supabase.storage.from('expeditions').getPublicUrl(filename);
      urls.push(data.publicUrl);
    }
    return urls;
  }

  async function postExpedition() {
    if (!title.trim() || !currentUser) {
      Alert.alert('Missing info', 'Please add a title.');
      return;
    }
    if (!location.trim()) {
      Alert.alert('Location required', 'Please add a location so others can find this expedition.');
      return;
    }
    if (photos.length === 0) {
      Alert.alert('Photo required', 'Please add at least one photo of your expedition.');
      return;
    }
    setPosting(true);

    try {
      const photoUrls = await uploadPhotos();
      const distanceKm = distance ? parseFloat(distance) : null;
      const totalPoints = await calculateExpeditionPoints(1, distanceKm, false, 0);
      const breakdown: PointsBreakdown = { base: totalPoints, new_species_bonus: 0, rare_bonus: 0, total: totalPoints };

      const { data: expedition } = await supabase.from('expeditions').insert({
        user_id: currentUser.id,
        title: title.trim(),
        description: description.trim() || null,
        type,
        location: location.trim() || null,
        distance: distanceKm,
        difficulty,
        vibe_tags: selectedVibeTags,
        photo_urls: photoUrls,
        is_live: false,
        points_earned: totalPoints,
        original_expedition_id: isRedo ? (params.originalId ?? null) : null,
        original_creator_username: isRedo ? (params.originalCreatorUsername || null) : null,
      }).select().single();

      if (expedition && taggedUsernames.trim()) {
        const usernames = taggedUsernames.split(',').map(u => u.trim().replace('@', '')).filter(Boolean);
        if (usernames.length > 0) {
          const { data: taggedUsers } = await supabase
            .from('users').select('id').in('username', usernames);
          if (taggedUsers && taggedUsers.length > 0) {
            await supabase.from('expedition_participants').insert(
              taggedUsers.map(u => ({ expedition_id: expedition.id, user_id: u.id }))
            );
          }
        }
      }

      if (isRedo && params.originalId) {
        await supabase.rpc('increment_expedition_trip_count', { expedition_id: params.originalId });
      }

      await Promise.all([
        awardPoints(currentUser.id, totalPoints),
        checkAndAwardBadges(currentUser.id),
      ]);

      setPointsBreakdown(breakdown);
      setShowToast(true);
      setTimeout(() => router.replace('/(tabs)'), 2000);
    } catch (err: any) {
      console.error('[postExpedition]', err);
      Alert.alert('Error', err?.message ?? 'Could not post expedition. Try again.');
      setPosting(false);
    }
  }

  return (
    <ScrollView style={{ flex: 1, backgroundColor: '#eaded0' }}>
      <SafeAreaView style={{ padding: 16 }}>
        {pointsBreakdown ? <PointsToast points={pointsBreakdown} visible={showToast} /> : null}

        <Text style={{ fontSize: 24, fontWeight: '800', color: '#361319', marginBottom: 20 }}>Log Expedition 🥾</Text>

        {/* Photos — required */}
        <Label>{`Photos * (up to ${MAX_PHOTOS})`}</Label>
        <View style={{ flexDirection: 'row', gap: 8, marginBottom: 16, flexWrap: 'wrap' }}>
          {photos.map((uri, i) => (
            <View key={i} style={{ position: 'relative' }}>
              <Image source={{ uri }} style={{ width: 100, height: 100, borderRadius: 12 }} />
              <TouchableOpacity
                onPress={() => setPhotos(prev => prev.filter((_, idx) => idx !== i))}
                style={{
                  position: 'absolute', top: -6, right: -6,
                  width: 22, height: 22, borderRadius: 11,
                  backgroundColor: '#6d3a3c', justifyContent: 'center', alignItems: 'center',
                }}
              >
                <Text style={{ color: 'white', fontSize: 12, fontWeight: '700' }}>✕</Text>
              </TouchableOpacity>
            </View>
          ))}
          {photos.length < MAX_PHOTOS ? (
            <View style={{ gap: 8 }}>
              <TouchableOpacity
                onPress={takePhoto}
                style={{
                  width: 100, height: 46, borderRadius: 12,
                  backgroundColor: '#4e705e', justifyContent: 'center', alignItems: 'center',
                }}
              >
                <Text style={{ color: '#eaded0', fontSize: 13, fontWeight: '700' }}>📷 Camera</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={pickPhoto}
                style={{
                  width: 100, height: 46, borderRadius: 12,
                  borderWidth: 2, borderColor: '#4e705e', justifyContent: 'center', alignItems: 'center',
                }}
              >
                <Text style={{ color: '#4e705e', fontSize: 13, fontWeight: '700' }}>🖼 Library</Text>
              </TouchableOpacity>
            </View>
          ) : null}
        </View>

        <Label>Title *</Label>
        <TextInput
          value={title}
          onChangeText={isRedo ? undefined : setTitle}
          editable={!isRedo}
          placeholder="e.g. Morning hike at Eno River"
          placeholderTextColor="#c7af94"
          style={[inputStyle, isRedo ? { opacity: 0.6 } : null]}
        />

        <Label>Description</Label>
        <TextInput value={description} onChangeText={setDescription} placeholder="What was it like?"
          placeholderTextColor="#c7af94" style={[inputStyle, { height: 80 }]} multiline />

        <Label>Type</Label>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 16 }}>
          {EXPEDITION_TYPES.map(t => (
            <TouchableOpacity key={t} onPress={() => setType(t)}
              style={{ paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20,
                backgroundColor: type === t ? '#4e705e' : '#c7af94', borderWidth: 1, borderColor: '#c7af94' }}>
              <Text style={{ color: type === t ? '#eaded0' : '#361319', fontWeight: '600', textTransform: 'capitalize' }}>
                {t.replace('_', ' ')}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <Label>Difficulty</Label>
        <View style={{ flexDirection: 'row', gap: 8, marginBottom: 16 }}>
          {DIFFICULTIES.map(d => (
            <TouchableOpacity key={d} onPress={() => setDifficulty(d)}
              style={{ flex: 1, paddingVertical: 10, borderRadius: 12, alignItems: 'center',
                backgroundColor: difficulty === d ? '#4e705e' : '#c7af94' }}>
              <Text style={{ color: difficulty === d ? '#eaded0' : '#361319', fontWeight: '600', textTransform: 'capitalize' }}>{d}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <Label>Location</Label>
        <TextInput
          value={location}
          onChangeText={isRedo ? undefined : setLocation}
          editable={!isRedo}
          placeholder="e.g. Eno River State Park"
          placeholderTextColor="#c7af94"
          style={[inputStyle, isRedo ? { opacity: 0.6 } : null]}
        />

        <Label>Distance (miles)</Label>
        <TextInput value={distance} onChangeText={setDistance} placeholder="e.g. 3.1"
          placeholderTextColor="#c7af94" keyboardType="numeric" style={inputStyle} />

        <Label>Vibes</Label>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 16 }}>
          {VIBE_TAGS.map(tag => (
            <TouchableOpacity key={tag} onPress={() => toggleVibeTag(tag)}
              style={{ paddingHorizontal: 12, paddingVertical: 6, borderRadius: 16,
                backgroundColor: selectedVibeTags.includes(tag) ? '#4e705e' : '#eaded0',
                borderWidth: 1, borderColor: '#c7af94' }}>
              <Text style={{ color: selectedVibeTags.includes(tag) ? '#eaded0' : '#361319', fontSize: 13 }}>{tag}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <Label>Tag Friends (comma-separated)</Label>
        <TextInput
          value={taggedUsernames}
          onChangeText={setTaggedUsernames}
          placeholder="@username1, @username2"
          placeholderTextColor="#c7af94"
          style={inputStyle}
          autoCapitalize="none"
        />

        <TouchableOpacity
          onPress={postExpedition}
          disabled={posting}
          style={{ backgroundColor: posting ? '#c7af94' : '#4e705e', padding: 18, borderRadius: 16, alignItems: 'center', marginBottom: 40 }}
        >
          <Text style={{ color: '#eaded0', fontSize: 18, fontWeight: '700' }}>
            {posting ? 'Uploading...' : 'Post Expedition ✨'}
          </Text>
        </TouchableOpacity>
      </SafeAreaView>
    </ScrollView>
  );
}

const inputStyle = {
  backgroundColor: 'white',
  borderRadius: 12,
  padding: 14,
  fontSize: 15,
  borderWidth: 1,
  borderColor: '#c7af94',
  marginBottom: 16,
  color: '#110703',
};

function Label({ children }: { children: string }) {
  return <Text style={{ fontSize: 12, fontWeight: '700', color: '#6d3a3c', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 6 }}>{children}</Text>;
}
