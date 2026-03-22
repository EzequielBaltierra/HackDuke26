import React from 'react';
import { Text, TouchableOpacity, View } from 'react-native';
import { colors } from '../../theme/colors';
import { ff } from '../../theme/typography';

type Props = {
  label: string;
  value: string;
  onRemove: () => void;
};

/** RN analogue of removable filter chips (label · value · ×). */
export function FilterBadge({ label, value, onRemove }: Props) {
  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        alignSelf: 'flex-start',
        backgroundColor: colors.surface,
        borderRadius: 999,
        borderWidth: 1,
        borderColor: colors.blueAccent,
        paddingVertical: 8,
        paddingLeft: 14,
        paddingRight: 10,
        gap: 8,
        marginBottom: 8,
        marginRight: 8,
      }}
    >
      <Text style={{ fontFamily: ff.crimsonSemi, fontSize: 13, color: colors.textMuted }}>{label}</Text>
      <Text style={{ fontFamily: ff.crimsonSemi, fontSize: 14, color: colors.textPrimary }} numberOfLines={1}>
        {value}
      </Text>
      <TouchableOpacity
        onPress={onRemove}
        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        accessibilityRole="button"
        accessibilityLabel={`Remove ${label}`}
      >
        <Text style={{ fontSize: 18, color: colors.redAccent, fontWeight: '700' }}>×</Text>
      </TouchableOpacity>
    </View>
  );
}
