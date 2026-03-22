import * as ImagePicker from 'expo-image-picker';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import {
  Alert, ScrollView, Text, TextInput, TouchableOpacity, View,
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

export default function NewExpeditionScreen() {
  const router = useRouter();
  const { currentUser } = useAuth();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [type, setType] = useState<ExpeditionType>('hike');
  const [location, setLocation] = useState('');
  const [distance, setDistance] = useState('');
  const [difficulty, setDifficulty] = useState<Difficulty>('moderate');
  const [selectedVibeTags, setSelectedVibeTags] = useState<string[]>([]);
  const [taggedUsernames, setTaggedUsernames] = useState('');
  const [posting, setPosting] = useState(false);
  const [pointsBreakdown, setPointsBreakdown] = useState<PointsBreakdown | null>(null);
  const [showToast, setShowToast] = useState(false);

  function toggleVibeTag(tag: string) {
    setSelectedVibeTags(prev =>
      prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag]
    );
  }

  async function postExpedition() {
    if (!title.trim() || !currentUser) {
      Alert.alert('Missing info', 'Please add a title.');
      return;
    }
    setPosting(true);

    try {
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
        photo_urls: [],
        is_live: false,
        points_earned: totalPoints,
      }).select().single();

      if (expedition && taggedUsernames.trim()) {
        const usernames = taggedUsernames.split(',').map(u => u.trim().replace('@', '')).filter(Boolean);
        if (usernames.length > 0) {
          const { data: taggedUsers } = await supabase
            .from('users')
            .select('id')
            .in('username', usernames);
          if (taggedUsers && taggedUsers.length > 0) {
            await supabase.from('expedition_participants').insert(
              taggedUsers.map(u => ({ expedition_id: expedition.id, user_id: u.id }))
            );
          }
        }
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

        <Label>Title *</Label>
        <TextInput value={title} onChangeText={setTitle} placeholder="e.g. Morning hike at Eno River"
          placeholderTextColor="#c7af94" style={inputStyle} />

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
        <TextInput value={location} onChangeText={setLocation} placeholder="e.g. Eno River State Park"
          placeholderTextColor="#c7af94" style={inputStyle} />

        <Label>Distance (km)</Label>
        <TextInput value={distance} onChangeText={setDistance} placeholder="e.g. 5.2"
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
            {posting ? 'Posting...' : 'Post Expedition ✨'}
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
