import { useRouter } from 'expo-router';
import React from 'react';
import { ScrollView, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors } from '../../src/theme/colors';
import { fontFamily, type } from '../../src/theme/typography';

export default function PostScreen() {
  const router = useRouter();

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.bg }} edges={['top']}>
      <ScrollView
        contentContainerStyle={{
          padding: 24,
          gap: 16,
          paddingBottom: 40,
          justifyContent: 'center',
          flexGrow: 1,
        }}
      >
        <Text
          style={[type.titleHeader, { textAlign: 'center', marginBottom: 8 }]}
          numberOfLines={2}
          adjustsFontSizeToFit
          minimumFontScale={0.4}
        >
          What are you sharing?
        </Text>

        <TouchableOpacity
          onPress={() => router.push('/discovery/new')}
          style={{ backgroundColor: colors.red, borderRadius: 20, padding: 24, alignItems: 'center', gap: 8 }}
        >
          <Text style={{ fontSize: 40 }}>🔍</Text>
          <Text style={[type.postTitle, { color: colors.bg, fontSize: 28, textAlign: 'center' }]}>Discovery</Text>
          <Text style={{ color: colors.bgAccent, fontFamily: fontFamily.crimson, fontSize: 16, textAlign: 'center' }}>
            Spot a plant, animal, or fungi{'\n'}and let AI identify it
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => router.push('/expedition/new')}
          style={{ backgroundColor: colors.green, borderRadius: 20, padding: 24, alignItems: 'center', gap: 8, borderWidth: 1, borderColor: colors.greenAccent }}
        >
          <Text style={{ fontSize: 40 }}>🥾</Text>
          <Text style={[type.postTitle, { color: colors.bg, fontSize: 28, textAlign: 'center' }]}>Expedition</Text>
          <Text style={{ color: colors.bgAccent, fontFamily: fontFamily.crimson, fontSize: 16, textAlign: 'center' }}>
            Log a hike, trail, or nature walk
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => router.push('/expedition/live')}
          style={{ backgroundColor: colors.redAccent, borderRadius: 20, padding: 24, alignItems: 'center', gap: 8 }}
        >
          <Text style={{ fontSize: 40 }}>📍</Text>
          <Text style={[type.postTitle, { color: colors.bg, fontSize: 28, textAlign: 'center' }]}>Live Expedition</Text>
          <Text style={{ color: colors.bgAccent, fontFamily: fontFamily.crimson, fontSize: 16, textAlign: 'center' }}>
            Track your adventure in real time
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}
