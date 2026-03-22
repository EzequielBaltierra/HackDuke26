import React, { useState } from 'react';
import { Dimensions, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';

const { width } = Dimensions.get('window');

const SLIDES = [
  {
    emoji: '🌿',
    title: 'Welcome to Root',
    body: 'Explore nature, identify species with AI, and earn points for every discovery you make.',
  },
  {
    emoji: '📸',
    title: 'Snap & Identify',
    body: 'Take a photo of any plant, animal, fungi, or insect. Our AI identifies it instantly and generates a fact card.',
  },
  {
    emoji: '🥾',
    title: 'Log Expeditions',
    body: 'Track your outdoor hikes and nature walks. Start a live expedition and let Root record your distance automatically.',
  },
  {
    emoji: '🏆',
    title: 'Climb the Ranks',
    body: 'Earn points, collect badges, and level up from Observer all the way to Ecologist. Compete on the leaderboard!',
  },
];

export default function OnboardingScreen() {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const slide = SLIDES[step];
  const isLast = step === SLIDES.length - 1;

  async function finish() {
    await AsyncStorage.setItem('onboarding_complete', '1');
    router.replace('/');
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#eaded0' }}>
      {/* Skip */}
      <View style={{ flexDirection: 'row', justifyContent: 'flex-end', paddingHorizontal: 20, paddingTop: 8 }}>
        {!isLast ? (
          <TouchableOpacity onPress={finish}>
            <Text style={{ fontSize: 15, color: '#c7af94', fontWeight: '600' }}>Skip</Text>
          </TouchableOpacity>
        ) : <View />}
      </View>

      {/* Content */}
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 36 }}>
        <Text style={{ fontSize: 96, marginBottom: 24 }}>{slide.emoji}</Text>
        <Text style={{ fontSize: 28, fontWeight: '800', color: '#361319', textAlign: 'center', marginBottom: 16 }}>
          {slide.title}
        </Text>
        <Text style={{ fontSize: 17, color: '#6d3a3c', textAlign: 'center', lineHeight: 26 }}>
          {slide.body}
        </Text>
      </View>

      {/* Dots */}
      <View style={{ flexDirection: 'row', justifyContent: 'center', gap: 8, marginBottom: 24 }}>
        {SLIDES.map((_, i) => (
          <View
            key={i}
            style={{
              width: i === step ? 24 : 8,
              height: 8,
              borderRadius: 4,
              backgroundColor: i === step ? '#4e705e' : '#c7af94',
            }}
          />
        ))}
      </View>

      {/* Button */}
      <View style={{ paddingHorizontal: 24, paddingBottom: 32 }}>
        <TouchableOpacity
          onPress={isLast ? finish : () => setStep(s => s + 1)}
          style={{ backgroundColor: '#4e705e', borderRadius: 16, paddingVertical: 18, alignItems: 'center' }}
        >
          <Text style={{ color: '#eaded0', fontSize: 18, fontWeight: '800' }}>
            {isLast ? 'Get Started' : 'Next'}
          </Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}
