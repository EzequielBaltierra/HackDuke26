import React, { useEffect, useRef } from 'react';
import { Animated, TouchableOpacity, View } from 'react-native';
import { colors } from '../theme/colors';
import { ff } from '../theme/typography';

type Tab = 'discoveries' | 'expeditions';
type Props = { active: Tab; onChange: (tab: Tab) => void };

export function FeedToggle({ active, onChange }: Props) {
  const expeditionsOpacity = useRef(new Animated.Value(active === 'expeditions' ? 1 : 0.35)).current;
  const discoveriesOpacity = useRef(new Animated.Value(active === 'discoveries' ? 1 : 0.35)).current;
  const expeditionsScale = useRef(new Animated.Value(active === 'expeditions' ? 1 : 0.95)).current;
  const discoveriesScale = useRef(new Animated.Value(active === 'discoveries' ? 1 : 0.95)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(expeditionsOpacity, { toValue: active === 'expeditions' ? 1 : 0.35, duration: 200, useNativeDriver: true }),
      Animated.timing(discoveriesOpacity, { toValue: active === 'discoveries' ? 1 : 0.35, duration: 200, useNativeDriver: true }),
      Animated.spring(expeditionsScale, { toValue: active === 'expeditions' ? 1 : 0.95, useNativeDriver: true, speed: 20, bounciness: 6 }),
      Animated.spring(discoveriesScale, { toValue: active === 'discoveries' ? 1 : 0.95, useNativeDriver: true, speed: 20, bounciness: 6 }),
    ]).start();
  }, [active]);

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
        <Animated.Text
          style={{
            fontFamily: ff.faustinaSemi,
            fontSize: 32,
            letterSpacing: -0.5,
            color: colors.redBase,
            opacity: expeditionsOpacity,
            transform: [{ scale: expeditionsScale }],
          }}
        >
          Expedition
        </Animated.Text>
      </TouchableOpacity>

      <Animated.Text
        style={{
          fontFamily: ff.faustinaSemi,
          fontSize: 28,
          color: colors.redAccent,
          opacity: 0.45,
          marginHorizontal: 10,
        }}
      >
        |
      </Animated.Text>

      <TouchableOpacity onPress={() => onChange('discoveries')} activeOpacity={0.7}>
        <Animated.Text
          style={{
            fontFamily: ff.faustinaSemi,
            fontSize: 32,
            letterSpacing: -0.5,
            color: colors.redAccent,
            opacity: discoveriesOpacity,
            transform: [{ scale: discoveriesScale }],
          }}
        >
          Discovery
        </Animated.Text>
      </TouchableOpacity>
    </View>
  );
}
