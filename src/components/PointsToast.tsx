import React, { useEffect, useRef } from 'react';
import { Animated, Text, View } from 'react-native';
import { colors } from '../theme/colors';
import { fontFamily } from '../theme/typography';
import { PointsBreakdown } from '../types';

type Props = {
  points: PointsBreakdown;
  visible: boolean;
};

export function PointsToast({ points, visible }: Props) {
  const opacity = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(20)).current;

  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.timing(opacity, { toValue: 1, duration: 300, useNativeDriver: true }),
        Animated.timing(translateY, { toValue: 0, duration: 300, useNativeDriver: true }),
      ]).start(() => {
        setTimeout(() => {
          Animated.parallel([
            Animated.timing(opacity, { toValue: 0, duration: 400, useNativeDriver: true }),
            Animated.timing(translateY, { toValue: -20, duration: 400, useNativeDriver: true }),
          ]).start();
        }, 2000);
      });
    }
  }, [visible]);

  return (
    <Animated.View style={{
      position: 'absolute',
      top: 60,
      alignSelf: 'center',
      opacity,
      transform: [{ translateY }],
      zIndex: 999,
    }}>
      <View style={{
        backgroundColor: colors.green,
        borderRadius: 24,
        paddingHorizontal: 24,
        paddingVertical: 14,
        alignItems: 'center',
        shadowColor: colors.text,
        shadowOpacity: 0.25,
        shadowRadius: 12,
        elevation: 8,
        borderWidth: 2,
        borderColor: colors.greenAccent,
      }}>
        <Text style={{ color: colors.bg, fontFamily: fontFamily.crimsonBold, fontSize: 22 }}>+{points.total} pts</Text>
        {points.new_species_bonus > 0 ? (
          <Text style={{ color: colors.bgAccent, fontFamily: fontFamily.crimson, fontSize: 12, marginTop: 2 }}>New species! +{points.new_species_bonus}</Text>
        ) : null}
        {points.rare_bonus > 0 ? (
          <Text style={{ color: colors.blueAccent, fontFamily: fontFamily.crimson, fontSize: 12 }}>Rare find! +{points.rare_bonus}</Text>
        ) : null}
      </View>
    </Animated.View>
  );
}
