import React from 'react';
import { Text, TouchableOpacity, View } from 'react-native';
import { colors } from '../theme/colors';
import { ff } from '../theme/typography';

type Tab = 'discoveries' | 'expeditions';
type Props = { active: Tab; onChange: (tab: Tab) => void };

/** Figma-style "Expedition | Discovery" — Faustina, semantic reds per STYLE_GUIDE */
export function FeedToggle({ active, onChange }: Props) {
  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: 16,
        paddingVertical: 16,
        backgroundColor: colors.bgPrimary,
        borderBottomLeftRadius: 20,
        borderBottomRightRadius: 20,
      }}
    >
      <TouchableOpacity onPress={() => onChange('expeditions')} activeOpacity={0.7}>
        <Text
          style={{
            fontFamily: ff.faustinaSemi,
            fontSize: 32,
            letterSpacing: -0.5,
            color: colors.redBase,
            opacity: active === 'expeditions' ? 1 : 0.35,
          }}
        >
          Expedition
        </Text>
      </TouchableOpacity>

      <Text
        style={{
          fontFamily: ff.faustinaSemi,
          fontSize: 28,
          color: colors.redAccent,
          opacity: 0.45,
          marginHorizontal: 10,
        }}
      >
        |
      </Text>

      <TouchableOpacity onPress={() => onChange('discoveries')} activeOpacity={0.7}>
        <Text
          style={{
            fontFamily: ff.faustinaSemi,
            fontSize: 32,
            letterSpacing: -0.5,
            color: colors.redAccent,
            opacity: active === 'discoveries' ? 1 : 0.35,
          }}
        >
          Discovery
        </Text>
      </TouchableOpacity>
    </View>
  );
}
