import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator, Alert, Image, ScrollView, Text,
  TextInput, TouchableOpacity, View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import * as FileSystem from 'expo-file-system/legacy';
import { fetchUserProfile } from '../../src/hooks/useProfile';
import { useAuth } from '../../src/hooks/useAuth';
import { supabase } from '../../src/lib/supabase';
import { Badge, Discovery, Expedition, User } from '../../src/types';

const BADGE_LABELS: Record<string, string> = {
  first_discovery: '🌿 First Discovery',
  trailblazer: '🥾 Trailblazer',
  explorer: '⛰ Explorer',
  rare_finder: '🌟 Rare Finder',
  social_explorer: '👥 Social Explorer',
};

type Profile = {
  user: User | null;
  badges: Badge[];
  discoveries: Partial<Discovery>[];
  expeditions: Partial<Expedition>[];
};

export default function ProfileScreen() {
  const { currentUser, logout } = useAuth();
  const router = useRouter();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [editingBio, setEditingBio] = useState(false);
  const [bioText, setBioText] = useState('');
  const [uploadingPhoto, setUploadingPhoto] = useState(false);

  useEffect(() => {
    if (currentUser) {
      fetchUserProfile(currentUser.id).then(data => {
        setProfile(data);
        setBioText(data.user?.bio ?? '');
      });
    }
  }, [currentUser]);

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

  if (!profile?.user) {
    return (
      <SafeAreaView style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#eaded0' }}>
        <ActivityIndicator size="large" color="#4e705e" />
      </SafeAreaView>
    );
  }

  const { user, badges, discoveries, expeditions } = profile;

  return (
    <ScrollView style={{ flex: 1, backgroundColor: '#eaded0' }}>
      <SafeAreaView>
        {/* Header */}
        <View style={{ padding: 24, alignItems: 'center', borderBottomWidth: 1, borderBottomColor: '#c7af94' }}>
          <TouchableOpacity onPress={handlePickPhoto} disabled={uploadingPhoto} style={{ marginBottom: 12 }}>
            {user.profile_photo_url ? (
              <Image
                source={{ uri: user.profile_photo_url }}
                style={{ width: 80, height: 80, borderRadius: 40, borderWidth: 2, borderColor: '#c7af94' }}
              />
            ) : (
              <View style={{ width: 80, height: 80, borderRadius: 40, backgroundColor: '#4e705e', justifyContent: 'center', alignItems: 'center', borderWidth: 2, borderColor: '#c7af94' }}>
                {uploadingPhoto ? <ActivityIndicator color="#eaded0" /> : <Text style={{ fontSize: 36 }}>🌿</Text>}
              </View>
            )}
            <View style={{ position: 'absolute', bottom: 0, right: 0, backgroundColor: '#361319', borderRadius: 10, width: 22, height: 22, justifyContent: 'center', alignItems: 'center' }}>
              <Text style={{ fontSize: 12, color: '#eaded0' }}>✎</Text>
            </View>
          </TouchableOpacity>

          <Text style={{ fontSize: 22, fontWeight: '800', color: '#361319' }}>@{user.username}</Text>

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
        </View>

        {/* Stats */}
        <View style={{ flexDirection: 'row', margin: 16, gap: 12 }}>
          <StatCard label="Points" value={user.total_points.toLocaleString()} emoji="⭐" />
          <StatCard label="Streak" value={`${user.streak}d`} emoji="🔥" />
          <StatCard label="Spots" value={discoveries.length.toString()} emoji="🔍" />
        </View>

        {/* Badges */}
        {badges.length > 0 ? (
          <View style={{ paddingHorizontal: 16, marginBottom: 8 }}>
            <Text style={{ fontSize: 16, fontWeight: '700', color: '#361319', marginBottom: 10 }}>Badges</Text>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
              {badges.map(b => (
                <View key={b.id} style={{ backgroundColor: '#c7af94', borderRadius: 12, paddingHorizontal: 12, paddingVertical: 6 }}>
                  <Text style={{ fontSize: 13, fontWeight: '600', color: '#361319' }}>
                    {BADGE_LABELS[b.badge_type] ?? b.badge_type}
                  </Text>
                </View>
              ))}
            </View>
          </View>
        ) : null}

        {/* Discovery grid */}
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

        {/* Expeditions list */}
        {expeditions.length > 0 ? (
          <View style={{ paddingHorizontal: 16, marginBottom: 16 }}>
            <Text style={{ fontSize: 16, fontWeight: '700', color: '#361319', marginBottom: 10 }}>Expeditions</Text>
            {expeditions.map(e => (
              <TouchableOpacity
                key={e.id}
                onPress={() => router.push(`/expedition/${e.id}`)}
                style={{
                  backgroundColor: 'white', borderRadius: 12, padding: 12, marginBottom: 8,
                  flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
                  borderWidth: 1, borderColor: '#c7af94',
                }}
              >
                <Text style={{ fontSize: 15, color: '#361319', fontWeight: '600', flex: 1 }}>{e.title}</Text>
                <Text style={{ fontSize: 13, color: '#4e705e', fontWeight: '700' }}>+{e.points_earned}pts →</Text>
              </TouchableOpacity>
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

function StatCard({ label, value, emoji }: { label: string; value: string; emoji: string }) {
  return (
    <View style={{
      flex: 1, backgroundColor: 'white', borderRadius: 14, padding: 14, alignItems: 'center',
      shadowColor: '#110703', shadowOpacity: 0.05, shadowRadius: 4, elevation: 1,
      borderWidth: 1, borderColor: '#c7af94',
    }}>
      <Text style={{ fontSize: 24 }}>{emoji}</Text>
      <Text style={{ fontSize: 20, fontWeight: '800', color: '#4e705e', marginTop: 4 }}>{value}</Text>
      <Text style={{ fontSize: 10, color: '#6d3a3c', textTransform: 'uppercase', letterSpacing: 0.5 }}>{label}</Text>
    </View>
  );
}
