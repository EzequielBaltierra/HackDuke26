import React from 'react';
import { Text, TouchableOpacity, View } from 'react-native';
import { colors } from '../theme/colors';
import { type } from '../theme/typography';

type Tab = 'discoveries' | 'expeditions';

type Props = {
  active: Tab;
  onChange: (tab: Tab) => void;
};

export function FeedToggle({ active, onChange }: Props) {
  return (
    <View
      style={{
        paddingHorizontal: 16,
        paddingTop: 8,
        paddingBottom: 16,
        backgroundColor: colors.bg,
      }}
    >
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          backgroundColor: colors.bgAccent,
          borderRadius: 28,
          padding: 4,
          minHeight: 52,
          borderWidth: 1,
          borderColor: colors.greenAccent,
        }}
      >
        <TouchableOpacity
          onPress={() => onChange('expeditions')}
          activeOpacity={0.85}
          style={{
            flex: 1,
            paddingVertical: 12,
            borderRadius: 24,
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: active === 'expeditions' ? colors.green : 'transparent',
          }}
        >
          <Text
            style={[
              type.feedToggle,
              {
                color: active === 'expeditions' ? colors.bg : colors.redAccent,
                opacity: active === 'expeditions' ? 1 : 0.55,
              },
            ]}
          >
            Expedition
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={() => onChange('discoveries')}
          activeOpacity={0.85}
          style={{
            flex: 1,
            paddingVertical: 12,
            borderRadius: 24,
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: active === 'discoveries' ? colors.green : 'transparent',
          }}
        >
          <Text
            style={[
              type.feedToggle,
              {
                color: active === 'discoveries' ? colors.bg : colors.redAccent,
                opacity: active === 'discoveries' ? 1 : 0.55,
              },
            ]}
          >
            Discovery
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}
