import * as FileSystem from 'expo-file-system/legacy';
import * as ImagePicker from 'expo-image-picker';
import * as Location from 'expo-location';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import {
  ActivityIndicator, Alert, Image, ScrollView, Text, TextInput, TouchableOpacity, View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { identifySpecies } from '../../src/lib/openai';
import { calculateDiscoveryPoints, awardPoints, trackSpecies, checkAndAwardBadges } from '../../src/lib/points';
import { supabase } from '../../src/lib/supabase';
import { FactCard } from '../../src/components/FactCard';
import { PointsToast } from '../../src/components/PointsToast';
import { useAuth } from '../../src/hooks/useAuth';
import { AIIdentificationResult, PointsBreakdown } from '../../src/types';

type Step = 'pick' | 'scanning' | 'review' | 'posting' | 'done';

export default function NewDiscoveryScreen() {
  const router = useRouter();
  const { currentUser } = useAuth();
  const [step, setStep] = useState<Step>('pick');
  const [imageUri, setImageUri] = useState<string | null>(null);
  const [result, setResult] = useState<AIIdentificationResult | null>(null);
  const [caption, setCaption] = useState('');
  const [pointsBreakdown, setPointsBreakdown] = useState<PointsBreakdown | null>(null);
  const [showToast, setShowToast] = useState(false);

  async function pickImage() {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission needed', 'Please allow photo access to post discoveries.');
      return;
    }
    const picked = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      quality: 0.8,
      allowsEditing: true,
      aspect: [4, 3],
    });
    if (!picked.canceled && picked.assets[0]) {
      await scanImage(picked.assets[0].uri);
    }
  }

  async function takePhoto() {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission needed', 'Please allow camera access.');
      return;
    }
    const taken = await ImagePicker.launchCameraAsync({
      quality: 0.8,
      allowsEditing: true,
      aspect: [4, 3],
    });
    if (!taken.canceled && taken.assets[0]) {
      await scanImage(taken.assets[0].uri);
    }
  }

  async function scanImage(uri: string) {
    setImageUri(uri);
    setStep('scanning');
    try {
      const identified = await identifySpecies(uri);
      setResult(identified);
      setStep('review');
    } catch (err: any) {
      console.error('[identifySpecies error]', err);
      Alert.alert('Scan failed', err?.message ?? 'Could not identify species. Try a clearer photo.');
      setStep('pick');
    }
  }

  function base64ToUint8Array(base64: string): Uint8Array {
    const binary = atob(base64);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
    return bytes;
  }

  async function postDiscovery() {
    if (!result || !imageUri || !currentUser) {
      Alert.alert('Not ready', 'Missing image, scan result, or user session.');
      return;
    }
    setStep('posting');

    try {
      const filename = `${currentUser.id}/${Date.now()}.jpg`;
      const base64 = await FileSystem.readAsStringAsync(imageUri, { encoding: 'base64' });
      const bytes = base64ToUint8Array(base64);
      const { error: uploadError } = await supabase.storage
        .from('discoveries')
        .upload(filename, bytes, { contentType: 'image/jpeg' });

      if (uploadError) throw uploadError;

      const { data: urlData } = supabase.storage.from('discoveries').getPublicUrl(filename);
      const imageUrl = urlData.publicUrl;

      let lat: number | null = null;
      let lng: number | null = null;
      try {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status === 'granted') {
          const loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Low });
          lat = !result.is_rare ? loc.coords.latitude : null;
          lng = !result.is_rare ? loc.coords.longitude : null;
        }
      } catch {}

      const speciesKey = result.scientific_name || result.common_name;
      const breakdown = await calculateDiscoveryPoints(currentUser.id, speciesKey, result.is_rare);
      setPointsBreakdown(breakdown);

      await supabase.from('discoveries').insert({
        user_id: currentUser.id,
        image_url: imageUrl,
        category: result.category,
        common_name: result.common_name,
        scientific_name: result.scientific_name,
        confidence: result.confidence,
        fact_card: result.fact_card,
        caption: caption || null,
        location_lat: lat,
        location_lng: lng,
        is_sensitive: result.is_rare,
        points_earned: breakdown.total,
      });

      await Promise.all([
        awardPoints(currentUser.id, breakdown.total),
        trackSpecies(currentUser.id, speciesKey),
        checkAndAwardBadges(currentUser.id),
      ]);

      setStep('done');
      setShowToast(true);
      setTimeout(() => router.replace('/(tabs)'), 2500);
    } catch (err: any) {
      console.error('[postDiscovery error]', err);
      Alert.alert('Post failed', err?.message ?? String(err));
      setStep('review');
    }
  }

  if (step === 'pick') {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: '#eaded0', justifyContent: 'center', alignItems: 'center', gap: 16, padding: 24 }}>
        <Text style={{ fontSize: 28, fontWeight: '800', color: '#361319', marginBottom: 8 }}>What did you spot? 🔍</Text>
        <TouchableOpacity onPress={takePhoto} style={{ backgroundColor: '#4e705e', padding: 18, borderRadius: 16, width: '100%', alignItems: 'center' }}>
          <Text style={{ color: '#eaded0', fontSize: 18, fontWeight: '700' }}>📷 Take Photo</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={pickImage} style={{ backgroundColor: '#6d3a3c', padding: 18, borderRadius: 16, width: '100%', alignItems: 'center' }}>
          <Text style={{ color: '#eaded0', fontSize: 18, fontWeight: '700' }}>🖼 Choose from Library</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => router.back()} style={{ marginTop: 8 }}>
          <Text style={{ color: '#110703', fontSize: 16, opacity: 0.5 }}>Cancel</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  if (step === 'scanning') {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: '#eaded0', justifyContent: 'center', alignItems: 'center', gap: 16 }}>
        {imageUri ? <Image source={{ uri: imageUri }} style={{ width: 200, height: 200, borderRadius: 16 }} /> : null}
        <ActivityIndicator size="large" color="#4e705e" />
        <Text style={{ fontSize: 18, fontWeight: '600', color: '#361319' }}>Identifying species...</Text>
        <Text style={{ fontSize: 14, color: '#6d3a3c' }}>Powered by AI 🤖</Text>
      </SafeAreaView>
    );
  }

  if (step === 'review' && result) {
    return (
      <ScrollView style={{ flex: 1, backgroundColor: '#eaded0' }}>
        <SafeAreaView>
          {imageUri ? <Image source={{ uri: imageUri }} style={{ width: '100%', height: 260 }} resizeMode="cover" /> : null}
          <FactCard
            commonName={result.common_name}
            scientificName={result.scientific_name}
            category={result.category}
            confidence={result.confidence}
            factCard={result.fact_card}
          />
          <View style={{ padding: 16 }}>
            <TextInput
              value={caption}
              onChangeText={setCaption}
              placeholder="Add a caption (optional)..."
              placeholderTextColor="#c7af94"
              style={{
                backgroundColor: 'white',
                borderRadius: 12,
                padding: 14,
                fontSize: 15,
                borderWidth: 1,
                borderColor: '#c7af94',
                marginBottom: 16,
                color: '#110703',
              }}
              multiline
            />
            <TouchableOpacity onPress={postDiscovery} style={{ backgroundColor: '#4e705e', padding: 18, borderRadius: 16, alignItems: 'center' }}>
              <Text style={{ color: '#eaded0', fontSize: 18, fontWeight: '700' }}>Post Discovery ✨</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => setStep('pick')} style={{ marginTop: 12, alignItems: 'center' }}>
              <Text style={{ color: '#110703', fontSize: 15, opacity: 0.5 }}>Retake photo</Text>
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      </ScrollView>
    );
  }

  if (step === 'posting' || step === 'done') {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: '#eaded0', justifyContent: 'center', alignItems: 'center', gap: 12 }}>
        {pointsBreakdown ? <PointsToast points={pointsBreakdown} visible={showToast} /> : null}
        {step === 'posting' ? (
          <>
            <ActivityIndicator size="large" color="#4e705e" />
            <Text style={{ fontSize: 16, color: '#361319' }}>Posting discovery...</Text>
          </>
        ) : (
          <>
            <Text style={{ fontSize: 48 }}>🌿</Text>
            <Text style={{ fontSize: 22, fontWeight: '700', color: '#4e705e' }}>Discovery Posted!</Text>
            {pointsBreakdown ? (
              <Text style={{ fontSize: 16, color: '#6d3a3c' }}>+{pointsBreakdown.total} points earned</Text>
            ) : null}
          </>
        )}
      </SafeAreaView>
    );
  }

  return null;
}
