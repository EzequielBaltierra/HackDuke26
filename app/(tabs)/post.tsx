import { useRouter } from 'expo-router';
import React from 'react';
import { Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function PostScreen() {
  const router = useRouter();

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#eaded0', justifyContent: 'center', padding: 24, gap: 16 }}>
      <Text style={{ fontSize: 28, fontWeight: '800', color: '#361319', textAlign: 'center', marginBottom: 16 }}>
        What are you sharing?
      </Text>

      <TouchableOpacity
        onPress={() => router.push('/discovery/new')}
        style={{ backgroundColor: '#6d3a3c', borderRadius: 20, padding: 24, alignItems: 'center', gap: 8 }}
      >
        <Text style={{ fontSize: 40 }}>🔍</Text>
        <Text style={{ color: '#eaded0', fontSize: 22, fontWeight: '800' }}>Discovery</Text>
        <Text style={{ color: '#c7af94', fontSize: 14, textAlign: 'center' }}>
          Spot a plant, animal, or fungi{'\n'}and let AI identify it
        </Text>
      </TouchableOpacity>

      <TouchableOpacity
        onPress={() => router.push('/expedition/new')}
        style={{ backgroundColor: '#4e705e', borderRadius: 20, padding: 24, alignItems: 'center', gap: 8 }}
      >
        <Text style={{ fontSize: 40 }}>🥾</Text>
        <Text style={{ color: '#eaded0', fontSize: 22, fontWeight: '800' }}>Expedition</Text>
        <Text style={{ color: '#c7af94', fontSize: 14, textAlign: 'center' }}>
          Log a hike, trail, or nature walk
        </Text>
      </TouchableOpacity>

      <TouchableOpacity
        onPress={() => router.push('/expedition/live')}
        style={{ backgroundColor: '#361319', borderRadius: 20, padding: 24, alignItems: 'center', gap: 8 }}
      >
        <Text style={{ fontSize: 40 }}>📍</Text>
        <Text style={{ color: '#eaded0', fontSize: 22, fontWeight: '800' }}>Live Expedition</Text>
        <Text style={{ color: '#c7af94', fontSize: 14, textAlign: 'center' }}>
          Track your adventure in real time
        </Text>
      </TouchableOpacity>
    </SafeAreaView>
  );
}
