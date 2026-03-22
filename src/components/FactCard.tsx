import React from 'react';
import { View, Text } from 'react-native';
import { colors } from '../theme/colors';
import { fontFamily, type } from '../theme/typography';
import { FactCard as FactCardType } from '../types';

type Props = {
  commonName: string;
  scientificName: string | null;
  category: string;
  confidence: number | null;
  factCard: FactCardType | null;
};

const categoryEmoji: Record<string, string> = {
  plants: '🌱', trees: '🌳', flowers: '🌸', fungi: '🍄',
  insects: '🦋', birds: '🦜', mammals: '🦊', other: '🔍',
};

export function FactCard({ commonName, scientificName, category, confidence, factCard }: Props) {
  return (
    <View style={{
      backgroundColor: colors.surface,
      borderRadius: 16,
      padding: 16,
      margin: 12,
      shadowColor: colors.text,
      shadowOpacity: 0.08,
      shadowRadius: 8,
      elevation: 3,
      borderWidth: 1,
      borderColor: colors.bgAccent,
    }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8 }}>
        <Text style={{ fontSize: 30, marginRight: 10 }}>{categoryEmoji[category] ?? '🔍'}</Text>
        <View style={{ flex: 1 }}>
          <Text style={[type.postTitle, { fontSize: 28, color: colors.redAccent }]}>{commonName}</Text>
          {scientificName ? (
            <Text style={{ fontFamily: fontFamily.crimson, fontSize: 15, color: colors.red, fontStyle: 'italic' }}>{scientificName}</Text>
          ) : null}
        </View>
        {confidence !== null ? (
          <View style={{
            backgroundColor: confidence > 0.7 ? colors.bg : colors.bgAccent,
            borderRadius: 12,
            paddingHorizontal: 8,
            paddingVertical: 4,
            borderWidth: 1,
            borderColor: confidence > 0.7 ? colors.greenAccent : colors.blueAccent,
          }}>
            <Text style={{
              fontFamily: fontFamily.crimsonSemi,
              fontSize: 12,
              color: confidence > 0.7 ? colors.greenAccent : colors.red,
            }}>
              {Math.round(confidence * 100)}% match
            </Text>
          </View>
        ) : null}
      </View>

      {factCard ? (
        <View style={{ gap: 10, marginTop: 8 }}>
          <Text style={[type.quickFacts, { fontSize: 28, marginBottom: 4 }]}>Quick facts</Text>
          <FactRow label="📍 Native Region" value={factCard.native_region} />
          <FactRow label="🏕 Habitat" value={factCard.habitat} />
          <FactRow label="🌍 Ecological Role" value={factCard.ecological_relevance} />
          <FactRow label="♻️ Sustainability" value={factCard.sustainability} />
          <View style={{
            backgroundColor: colors.bg,
            borderRadius: 12,
            padding: 12,
            marginTop: 4,
            borderLeftWidth: 4,
            borderLeftColor: colors.greenAccent,
          }}>
            <Text style={{ fontFamily: fontFamily.crimsonBold, fontSize: 16, color: colors.green, marginBottom: 4 }}>💡 Did you know?</Text>
            <Text style={{ fontFamily: fontFamily.crimson, fontSize: 16, color: colors.text, lineHeight: 24 }}>{factCard.interesting_fact}</Text>
          </View>
        </View>
      ) : null}
    </View>
  );
}

function FactRow({ label, value }: { label: string; value: string }) {
  return (
    <View>
      <Text style={{ fontFamily: fontFamily.crimsonBold, fontSize: 14, color: colors.red, textTransform: 'uppercase', letterSpacing: 0.8 }}>{label}</Text>
      <Text style={{ fontFamily: fontFamily.crimson, fontSize: 16, color: colors.text, marginTop: 2, lineHeight: 22 }}>{value}</Text>
    </View>
  );
}
