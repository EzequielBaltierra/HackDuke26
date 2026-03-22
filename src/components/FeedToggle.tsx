import React from 'react';
import { Text, TouchableOpacity, View } from 'react-native';

type Tab = 'discoveries' | 'expeditions';

type Props = {
  active: Tab;
  onChange: (tab: Tab) => void;
};

export function FeedToggle({ active, onChange }: Props) {
  return (
    <View style={{
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 20,
      paddingVertical: 16,
      backgroundColor: '#eaded0',
    }}>
      <TouchableOpacity onPress={() => onChange('expeditions')} style={{ paddingRight: 16 }}>
        <Text style={{
          fontSize: 28,
          fontWeight: '700',
          color: active === 'expeditions' ? '#361319' : '#361319',
          opacity: active === 'expeditions' ? 1 : 0.35,
          letterSpacing: -0.5,
        }}>
          Expedition
        </Text>
      </TouchableOpacity>
      <View style={{ width: 1, height: 32, backgroundColor: '#110703', opacity: 0.3, marginHorizontal: 4 }} />
      <TouchableOpacity onPress={() => onChange('discoveries')} style={{ paddingLeft: 16 }}>
        <Text style={{
          fontSize: 28,
          fontWeight: '700',
          color: active === 'discoveries' ? '#6d3a3c' : '#6d3a3c',
          opacity: active === 'discoveries' ? 1 : 0.35,
          letterSpacing: -0.5,
        }}>
          Discovery
        </Text>
      </TouchableOpacity>
    </View>
  );
}
