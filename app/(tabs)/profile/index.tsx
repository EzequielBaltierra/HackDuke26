import React, { useCallback, useState } from 'react';
import {
  ActivityIndicator, Alert, Image, ScrollView, Text,
  TextInput, TouchableOpacity, View, Modal, Pressable,
} from 'react-native';
import { Icon, IconName } from '../../../src/components/Icon';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useFocusEffect } from '@react-navigation/native';
import * as ImagePicker from 'expo-image-picker';
import * as FileSystem from 'expo-file-system/legacy';
import { fetchUserProfile } from '../../../src/hooks/useProfile';
import { useAuth } from '../../../src/hooks/useAuth';
import { supabase } from '../../../src/lib/supabase';
import { getNextRankName, getRank } from '../../../src/lib/points';
import { colors as themeColors } from '../../../src/theme/colors';
import { Badge, Discovery, Expedition, User } from '../../../src/types';
import { ExpeditionCard } from '../../../src/components/ExpeditionCard';

const BADGE_LABELS: Record<string, string> = {
  first_discovery: 'First Discovery',
  trailblazer: 'Trailblazer',
  explorer: 'Explorer',
  rare_finder: 'Rare Finder',
  botanist: 'Botanist',
  entomologist: 'Entomologist',
  fungi_hunter: 'Fungi Hunter',
  collector: 'Collector',
  naturalist: 'Naturalist',
  summit_seeker: 'Summit Seeker',
  long_hauler: 'Long Hauler',
  weekend_warrior: 'Weekend Warrior',
  trailhead: 'Trailhead',
  social_explorer: 'Social Explorer',
  trail_buddy: 'Trail Buddy',
  on_a_roll: 'On a Roll',
  unstoppable: 'Unstoppable',
  night_owl: 'Night Owl',
};

const BADGE_DESCRIPTIONS: Record<string, string> = {
  first_discovery: 'Made your very first species discovery.',
  trailblazer: 'Logged your first expedition.',
  explorer: 'Completed 5 expeditions.',
  rare_finder: 'Found your first rare or sensitive species.',
  botanist: 'Identified 5 unique plant species.',
  entomologist: 'Identified 3 unique insect species.',
  fungi_hunter: 'Spotted at least one fungi species.',
  collector: 'Made 10 total discoveries.',
  naturalist: 'Made 25 total discoveries.',
  summit_seeker: 'Completed a hard-difficulty expedition.',
  long_hauler: 'Finished an expedition of 16+ km.',
  weekend_warrior: 'Completed 3 expeditions in one week.',
  trailhead: 'Explored 3 different locations.',
  social_explorer: 'Had someone join one of your expeditions.',
  trail_buddy: 'Joined another explorer\'s expedition.',
  on_a_roll: 'Maintained a 3-day activity streak.',
  unstoppable: 'Maintained a 7-day activity streak.',
  night_owl: 'Made a discovery after 9 PM.',
};

type Profile = {
  user: User | null;
  badges: Badge[];
  discoveries: Partial<Discovery>[];
  expeditions: Expedition[];
  followerCount: number;
  followingCount: number;
};

export default function ProfileScreen() {
  const { currentUser, logout, refreshCurrentUser } = useAuth();
  const router = useRouter();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [editingBio, setEditingBio] = useState(false);
  const [bioText, setBioText] = useState('');
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [selectedBadge, setSelectedBadge] = useState<string | null>(null);
  const [editingUsername, setEditingUsername] = useState(false);
  const [usernameDraft, setUsernameDraft] = useState('');

  const reload = useCallback(() => {
    if (currentUser) {
      fetchUserProfile(currentUser.id).then(data => {
        setProfile(data);
        setBioText(data.user?.bio ?? '');
      });
    }
  }, [currentUser]);

  useFocusEffect(
    useCallback(() => {
      reload();
    }, [reload]),
  );

  function handleSignOut() {
    Alert.alert('Sign Out', 'Are you sure you want to sign out?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Sign Out', style: 'destructive',
        onPress: async () => {
          await logout();
          router.replace('/login');
        },
      },
    ]);
  }

  async function handlePickPhoto() {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission needed', 'Please allow photo access.');
      return;
    }
    const picked = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      quality: 0.8,
      allowsEditing: true,
      aspect: [1, 1],
    });
    if (picked.canceled || !picked.assets[0] || !currentUser) return;
    setUploadingPhoto(true);
    try {
      const uri = picked.assets[0].uri;
      const base64 = await FileSystem.readAsStringAsync(uri, { encoding: 'base64' });
      const binary = atob(base64);
      const bytes = new Uint8Array(binary.length);
      for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
      const filename = `${currentUser.id}/avatar.jpg`;
      const { error } = await supabase.storage
        .from('avatars')
        .upload(filename, bytes, { contentType: 'image/jpeg', upsert: true });
      if (error) throw error;
      const { data: urlData } = supabase.storage.from('avatars').getPublicUrl(filename);
      const photoUrl = urlData.publicUrl;
      await supabase.from('users').update({ profile_photo_url: photoUrl }).eq('id', currentUser.id);
      setProfile(prev => prev ? { ...prev, user: prev.user ? { ...prev.user, profile_photo_url: photoUrl } : null } : null);
    } catch (err: any) {
      Alert.alert('Upload failed', err?.message ?? 'Could not upload photo.');
    } finally {
      setUploadingPhoto(false);
    }
  }

  async function saveBio() {
    if (!currentUser) return;
    const newBio = bioText.trim() || null;
    await supabase.from('users').update({ bio: newBio }).eq('id', currentUser.id);
    setProfile(prev => prev ? { ...prev, user: prev.user ? { ...prev.user, bio: newBio } : null } : null);
    setEditingBio(false);
  }

  async function saveUsername() {
    if (!currentUser) return;
    const next = usernameDraft.trim().replace(/^@+/, '').replace(/\s+/g, '');
    if (next.length < 2 || next.length > 32) {
      Alert.alert('Username', 'Use 2–32 characters.');
      return;
    }
    if (!/^[a-zA-Z0-9_]+$/.test(next)) {
      Alert.alert('Username', 'Letters, numbers, and underscores only.');
      return;
    }
    const { data: taken } = await supabase.from('users').select('id').eq('username', next).maybeSingle();
    if (taken && taken.id !== currentUser.id) {
      Alert.alert('Username taken', 'Pick another username.');
      return;
    }
    const { error } = await supabase.from('users').update({ username: next }).eq('id', currentUser.id);
    if (error) {
      Alert.alert('Could not update', error.message);
      return;
    }
    setProfile(prev => prev ? { ...prev, user: prev.user ? { ...prev.user, username: next } : null } : null);
    await refreshCurrentUser();
    setEditingUsername(false);
  }

  if (!profile?.user) {
    return (
      <SafeAreaView style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#eaded0' }}>
        <ActivityIndicator size="large" color="#4e705e" />
      </SafeAreaView>
    );
  }

  const { user, badges, discoveries, expeditions, followerCount, followingCount } = profile;
  const rank = getRank(user.total_points);
  const nextRankName = getNextRankName(user.total_points);
  const ptsToNext =
    rank.nextMinPoints != null ? Math.max(0, rank.nextMinPoints - user.total_points) : null;
  const progressPct = Math.min(
    100,
    Math.max(0, Number.isFinite(rank.progress) ? Math.round(rank.progress * 100) : 0),
  );

  return (
    <ScrollView style={{ flex: 1, backgroundColor: '#eaded0' }}>
      <SafeAreaView>
        <View style={{ padding: 24, alignItems: 'center', borderBottomWidth: 1, borderBottomColor: '#c7af94' }}>
          <TouchableOpacity onPress={handlePickPhoto} disabled={uploadingPhoto} style={{ marginBottom: 12 }}>
            {user.profile_photo_url ? (
              <Image
                source={{ uri: user.profile_photo_url }}
                style={{ width: 80, height: 80, borderRadius: 40, borderWidth: 2, borderColor: '#c7af94' }}
              />
            ) : (
              <View style={{ width: 80, height: 80, borderRadius: 40, backgroundColor: '#4e705e', justifyContent: 'center', alignItems: 'center', borderWidth: 2, borderColor: '#c7af94' }}>
                {uploadingPhoto ? <ActivityIndicator color="#eaded0" /> : <Icon name="clover" size={36} color="#eaded0" />}
              </View>
            )}
            <View style={{ position: 'absolute', bottom: 0, right: 0, backgroundColor: '#361319', borderRadius: 10, width: 22, height: 22, justifyContent: 'center', alignItems: 'center' }}>
              <Text style={{ fontSize: 12, color: '#eaded0' }}>✎</Text>
            </View>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => {
              setUsernameDraft(user.username);
              setEditingUsername(true);
            }}
            activeOpacity={0.75}
            accessibilityLabel="Edit username"
          >
            <Text style={{ fontSize: 22, fontWeight: '800', color: '#361319' }}>
              @{user.username}
            </Text>
          </TouchableOpacity>

          {/* Rank badge */}
          <View style={{ alignItems: 'center', marginTop: 10, marginBottom: 4 }}>
            <View style={{
              flexDirection: 'row', alignItems: 'center', gap: 6,
              backgroundColor: rank.color, borderRadius: 20,
              paddingHorizontal: 14, paddingVertical: 5, marginBottom: 8,
            }}>
              <Icon name={rank.iconName as IconName} size={18} color="#eaded0" />
              <Text style={{ fontSize: 15, fontWeight: '800', color: '#eaded0', letterSpacing: 0.5 }}>{rank.name}</Text>
            </View>
            <View style={{ width: '100%', maxWidth: 280, alignSelf: 'center' }}>
              <View style={{ height: 10, backgroundColor: '#c7af94', borderRadius: 5, overflow: 'hidden', width: '100%' }}>
                <View
                  style={{
                    width: `${progressPct}%`,
                    height: '100%',
                    backgroundColor: themeColors.blueAccent,
                    borderRadius: 5,
                  }}
                />
              </View>
              {rank.nextMinPoints ? (
                <Text style={{ fontSize: 11, color: '#6d3a3c', marginTop: 6, textAlign: 'center', lineHeight: 16 }}>
                  {user.total_points.toLocaleString()} / {rank.nextMinPoints.toLocaleString()} pts
                  {nextRankName ? ` · ${ptsToNext?.toLocaleString()} to ${nextRankName}` : ''}
                </Text>
              ) : (
                <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 4, marginTop: 6 }}>
                  <Icon name="globe-hemisphere-west" size={12} color="#6d3a3c" />
                  <Text style={{ fontSize: 11, color: '#6d3a3c' }}>Maximum rank achieved</Text>
                </View>
              )}
            </View>
          </View>

          {editingBio ? (
            <View style={{ width: '100%', marginTop: 8 }}>
              <TextInput
                value={bioText}
                onChangeText={setBioText}
                placeholder="Write a bio..."
                placeholderTextColor="#c7af94"
                multiline
                autoFocus
                style={{
                  backgroundColor: 'white', borderRadius: 10, padding: 10,
                  fontSize: 14, borderWidth: 1, borderColor: '#c7af94',
                  color: '#110703', marginBottom: 8,
                }}
              />
              <View style={{ flexDirection: 'row', gap: 8 }}>
                <TouchableOpacity onPress={saveBio} style={{ flex: 1, backgroundColor: '#4e705e', padding: 10, borderRadius: 10, alignItems: 'center' }}>
                  <Text style={{ color: '#eaded0', fontWeight: '700' }}>Save</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={() => { setEditingBio(false); setBioText(user.bio ?? ''); }} style={{ flex: 1, backgroundColor: '#c7af94', padding: 10, borderRadius: 10, alignItems: 'center' }}>
                  <Text style={{ color: '#361319', fontWeight: '700' }}>Cancel</Text>
                </TouchableOpacity>
              </View>
            </View>
          ) : (
            <TouchableOpacity onPress={() => setEditingBio(true)} style={{ marginTop: 4 }}>
              {user.bio ? (
                <Text style={{ fontSize: 14, color: '#6d3a3c', textAlign: 'center' }}>{user.bio}</Text>
              ) : (
                <Text style={{ fontSize: 14, color: '#c7af94', fontStyle: 'italic' }}>Tap to add a bio...</Text>
              )}
            </TouchableOpacity>
          )}

          {!editingBio ? (
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', marginTop: 10, paddingHorizontal: 8 }}>
              <TouchableOpacity onPress={() => router.push('/(tabs)/profile/followers')} activeOpacity={0.7}>
                <Text style={{ fontSize: 15, textAlign: 'center' }}>
                  <Text style={{ fontWeight: '800', color: themeColors.redAccent }}>{followerCount}</Text>
                  <Text style={{ fontWeight: '400', color: themeColors.redBase }}> Followers</Text>
                </Text>
              </TouchableOpacity>
              <Text style={{ fontSize: 15, color: themeColors.redBase, marginHorizontal: 6 }}>|</Text>
              <TouchableOpacity onPress={() => router.push('/(tabs)/profile/following')} activeOpacity={0.7}>
                <Text style={{ fontSize: 15, textAlign: 'center' }}>
                  <Text style={{ fontWeight: '800', color: themeColors.redAccent }}>{followingCount}</Text>
                  <Text style={{ fontWeight: '400', color: themeColors.redBase }}> Following</Text>
                </Text>
              </TouchableOpacity>
            </View>
          ) : null}
        </View>

        <View style={{ flexDirection: 'row', margin: 16, gap: 12 }}>
          <StatCard label="Points" value={user.total_points.toLocaleString()} iconName="star" />
          <StatCard label="Streak" value={`${user.streak}d`} iconName="campfire" />
          <StatCard label="Spots" value={discoveries.length.toString()} iconName="magnifying-glass" />
        </View>
        {user.streak > 0 ? (
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 4, marginTop: -8, marginBottom: 8, paddingHorizontal: 24, opacity: 0.8 }}>
            <Icon name="campfire" size={13} color="#6d3a3c" />
            <Text style={{ fontSize: 12, color: '#6d3a3c' }}>Post daily to keep your streak alive!</Text>
          </View>
        ) : (
          <Text style={{ fontSize: 12, color: '#c7af94', textAlign: 'center', marginTop: -8, marginBottom: 8, paddingHorizontal: 24 }}>
            Post a discovery or expedition today to start a streak
          </Text>
        )}

        {badges.length > 0 ? (
          <View style={{ paddingHorizontal: 16, marginBottom: 8 }}>
            <Text style={{ fontSize: 16, fontWeight: '700', color: '#361319', marginBottom: 4 }}>Badges</Text>
            <Text style={{ fontSize: 12, color: '#c7af94', marginBottom: 10 }}>Tap a badge to learn more</Text>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
              {badges.map(b => (
                <TouchableOpacity key={b.id} onPress={() => setSelectedBadge(b.badge_type)} style={{ backgroundColor: '#c7af94', borderRadius: 12, paddingHorizontal: 12, paddingVertical: 6 }}>
                  <Text style={{ fontSize: 13, fontWeight: '600', color: '#361319' }}>
                    {BADGE_LABELS[b.badge_type] ?? b.badge_type}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        ) : null}

        <Modal visible={editingUsername} transparent animationType="fade">
          <Pressable
            style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'center', alignItems: 'center' }}
            onPress={() => setEditingUsername(false)}
          >
            <Pressable
              style={{ backgroundColor: '#eaded0', borderRadius: 16, padding: 24, marginHorizontal: 24, width: '90%', maxWidth: 360 }}
              onPress={() => {}}
            >
              <Text style={{ fontSize: 17, fontWeight: '800', color: '#361319', marginBottom: 12 }}>Username</Text>
              <TextInput
                value={usernameDraft}
                onChangeText={setUsernameDraft}
                placeholder="username"
                placeholderTextColor="#c7af94"
                autoCapitalize="none"
                autoCorrect={false}
                style={{
                  backgroundColor: 'white', borderRadius: 10, padding: 12,
                  fontSize: 16, borderWidth: 1, borderColor: '#c7af94', color: '#110703', marginBottom: 16,
                }}
              />
              <View style={{ flexDirection: 'row', gap: 8 }}>
                <TouchableOpacity onPress={saveUsername} style={{ flex: 1, backgroundColor: '#4e705e', padding: 12, borderRadius: 10, alignItems: 'center' }}>
                  <Text style={{ color: '#eaded0', fontWeight: '700' }}>Save</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => setEditingUsername(false)}
                  style={{ flex: 1, backgroundColor: '#c7af94', padding: 12, borderRadius: 10, alignItems: 'center' }}
                >
                  <Text style={{ color: '#361319', fontWeight: '700' }}>Cancel</Text>
                </TouchableOpacity>
              </View>
            </Pressable>
          </Pressable>
        </Modal>

        {/* Badge description modal */}
        <Modal visible={selectedBadge !== null} transparent animationType="fade">
          <Pressable style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'center', alignItems: 'center' }} onPress={() => setSelectedBadge(null)}>
            <Pressable style={{ backgroundColor: '#eaded0', borderRadius: 16, padding: 24, marginHorizontal: 32, alignItems: 'center' }} onPress={() => {}}>
              <Text style={{ fontSize: 28, marginBottom: 8 }}>{(BADGE_LABELS[selectedBadge ?? ''] ?? '').split(' ')[0]}</Text>
              <Text style={{ fontSize: 17, fontWeight: '800', color: '#361319', marginBottom: 8, textAlign: 'center' }}>
                {BADGE_LABELS[selectedBadge ?? ''] ?? selectedBadge}
              </Text>
              <Text style={{ fontSize: 14, color: '#6d3a3c', textAlign: 'center', lineHeight: 20 }}>
                {BADGE_DESCRIPTIONS[selectedBadge ?? ''] ?? ''}
              </Text>
              <TouchableOpacity onPress={() => setSelectedBadge(null)} style={{ marginTop: 16, backgroundColor: '#4e705e', borderRadius: 10, paddingHorizontal: 24, paddingVertical: 10 }}>
                <Text style={{ color: '#eaded0', fontWeight: '700' }}>Got it</Text>
              </TouchableOpacity>
            </Pressable>
          </Pressable>
        </Modal>

        {discoveries.length > 0 ? (
          <View style={{ paddingHorizontal: 16, marginBottom: 8 }}>
            <Text style={{ fontSize: 16, fontWeight: '700', color: '#361319', marginBottom: 10 }}>Discoveries</Text>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 4 }}>
              {discoveries.map(d => (
                d.image_url ? (
                  <TouchableOpacity key={d.id} onPress={() => router.push(`/discovery/${d.id}`)}>
                    <Image source={{ uri: d.image_url }} style={{ width: 100, height: 100, borderRadius: 10 }} />
                  </TouchableOpacity>
                ) : null
              ))}
            </View>
          </View>
        ) : null}

        {expeditions.length > 0 ? (
          <View style={{ marginBottom: 16 }}>
            <Text style={{ fontSize: 16, fontWeight: '700', color: '#361319', paddingHorizontal: 16, marginBottom: 10 }}>
              Expeditions
            </Text>
            {expeditions.map(e => (
              <ExpeditionCard key={e.id} expedition={e} />
            ))}
          </View>
        ) : null}

        <TouchableOpacity
          onPress={handleSignOut}
          style={{ margin: 16, padding: 14, borderRadius: 12, backgroundColor: '#6d3a3c', alignItems: 'center' }}
        >
          <Text style={{ color: '#eaded0', fontWeight: '700', fontSize: 15 }}>Sign Out</Text>
        </TouchableOpacity>
      </SafeAreaView>
    </ScrollView>
  );
}

function StatCard({ label, value, iconName }: { label: string; value: string; iconName: IconName }) {
  return (
    <View style={{
      flex: 1, backgroundColor: 'white', borderRadius: 14, padding: 14, alignItems: 'center',
      shadowColor: '#110703', shadowOpacity: 0.05, shadowRadius: 4, elevation: 1,
      borderWidth: 1, borderColor: '#c7af94',
    }}>
      <Icon name={iconName} size={24} color="#4e705e" />
      <Text style={{ fontSize: 20, fontWeight: '800', color: '#4e705e', marginTop: 4 }}>{value}</Text>
      <Text style={{ fontSize: 10, color: '#6d3a3c', textTransform: 'uppercase', letterSpacing: 0.5 }}>{label}</Text>
    </View>
  );
}
