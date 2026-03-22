import React from 'react';
import { Text, TouchableOpacity, View } from 'react-native';

type Tab = 'discoveries' | 'expeditions';
type Props = { active: Tab; onChange: (tab: Tab) => void };

export function FeedToggle({ active, onChange }: Props) {
  return (
    <View style={{
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 20,
      paddingVertical: 14,
      backgroundColor: '#eaded0',
    }}>
      <TouchableOpacity onPress={() => onChange('expeditions')} style={{ paddingRight: 16 }}>
        <Text style={{
          fontSize: 26,
          fontWeight: '800',
          color: '#361319',
          opacity: active === 'expeditions' ? 1 : 0.3,
          letterSpacing: -0.5,
        }}>
          Expedition
        </Text>
      </TouchableOpacity>

      <View style={{ width: 1.5, height: 30, backgroundColor: '#361319', opacity: 0.25, marginHorizontal: 2 }} />

      <TouchableOpacity onPress={() => onChange('discoveries')} style={{ paddingLeft: 16 }}>
        <Text style={{
          fontSize: 26,
          fontWeight: '800',
          color: '#6d3a3c',
          opacity: active === 'discoveries' ? 1 : 0.3,
          letterSpacing: -0.5,
        }}>
          Discovery
        </Text>
      </TouchableOpacity>
    </View>
  );
}
