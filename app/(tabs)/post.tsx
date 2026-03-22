import { useRouter } from 'expo-router';
import React from 'react';
import { ScrollView, Text, TouchableOpacity } from 'react-native';
import { Icon } from '../../src/components/Icon';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors } from '../../src/theme/colors';
import { textStyles } from '../../src/theme/typography';

export default function PostScreen() {
  const router = useRouter();

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.bgPrimary }} edges={['top']}>
      <ScrollView contentContainerStyle={{ padding: 24, gap: 16, paddingBottom: 40 }}>
        <Text
          style={[
            textStyles.titleHeaderAccent,
            { textAlign: 'center', marginBottom: 8, fontSize: 28 },
          ]}
        >
          What are you sharing?
        </Text>

        <TouchableOpacity
          onPress={() => router.push('/discovery/new')}
          style={{ backgroundColor: colors.redBase, borderRadius: 20, padding: 24, alignItems: 'center', gap: 8 }}
        >
          <Icon name="magnifying-glass" size={40} color={colors.tabIconActive} />
          <Text style={[textStyles.postTitle, { color: colors.tabIconActive, fontSize: 22 }]}>Discovery</Text>
          <Text style={[textStyles.postDescription, { color: colors.bgAccent, fontSize: 14, textAlign: 'center' }]}>
            Spot a plant, animal, or fungi{'\n'}and let AI identify it
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => router.push('/expedition/new')}
          style={{
            backgroundColor: colors.greenBase,
            borderRadius: 20,
            padding: 24,
            alignItems: 'center',
            gap: 8,
            borderWidth: 1,
            borderColor: colors.greenAccent,
          }}
        >
          <Icon name="person-simple-hike" size={40} color={colors.tabIconActive} />
          <Text style={[textStyles.postTitle, { color: colors.tabIconActive, fontSize: 22 }]}>Expedition</Text>
          <Text style={[textStyles.postDescription, { color: colors.bgAccent, fontSize: 14, textAlign: 'center' }]}>
            Log a hike, trail, or nature walk
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => router.push('/expedition/live')}
          style={{ backgroundColor: colors.redAccent, borderRadius: 20, padding: 24, alignItems: 'center', gap: 8 }}
        >
          <Icon name="map-pin-simple" size={40} color={colors.tabIconActive} />
          <Text style={[textStyles.postTitle, { color: colors.tabIconActive, fontSize: 22 }]}>Live Expedition</Text>
          <Text style={[textStyles.postDescription, { color: colors.bgAccent, fontSize: 14, textAlign: 'center' }]}>
            Track your adventure in real time
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}
