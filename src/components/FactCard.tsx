import React from 'react';
import { View, Text } from 'react-native';
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
      backgroundColor: '#ffffff',
      borderRadius: 16,
      padding: 16,
      margin: 12,
      shadowColor: '#110703',
      shadowOpacity: 0.08,
      shadowRadius: 8,
      elevation: 3,
      borderWidth: 1,
      borderColor: '#c7af94',
    }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8 }}>
        <Text style={{ fontSize: 30, marginRight: 10 }}>{categoryEmoji[category] ?? '🔍'}</Text>
        <View style={{ flex: 1 }}>
          <Text style={{ fontSize: 20, fontWeight: '700', color: '#361319' }}>{commonName}</Text>
          {scientificName ? (
            <Text style={{ fontSize: 13, color: '#6d3a3c', fontStyle: 'italic' }}>{scientificName}</Text>
          ) : null}
        </View>
        {confidence !== null ? (
          <View style={{
            backgroundColor: confidence > 0.7 ? '#d1fae5' : '#fef3c7',
            borderRadius: 12,
            paddingHorizontal: 8,
            paddingVertical: 4,
          }}>
            <Text style={{
              fontSize: 12,
              fontWeight: '600',
              color: confidence > 0.7 ? '#065f46' : '#92400e',
            }}>
              {Math.round(confidence * 100)}% match
            </Text>
          </View>
        ) : null}
      </View>

      {factCard ? (
        <View style={{ gap: 10, marginTop: 8 }}>
          <FactRow label="📍 Native Region" value={factCard.native_region} />
          <FactRow label="🏕 Habitat" value={factCard.habitat} />
          <FactRow label="🌍 Ecological Role" value={factCard.ecological_relevance} />
          <FactRow label="♻️ Sustainability" value={factCard.sustainability} />
          <View style={{ backgroundColor: '#eaded0', borderRadius: 12, padding: 12, marginTop: 4, borderLeftWidth: 3, borderLeftColor: '#4e705e' }}>
            <Text style={{ fontSize: 12, fontWeight: '700', color: '#4e705e', marginBottom: 4 }}>💡 Did you know?</Text>
            <Text style={{ fontSize: 13, color: '#110703', lineHeight: 20 }}>{factCard.interesting_fact}</Text>
          </View>
        </View>
      ) : null}
    </View>
  );
}

function FactRow({ label, value }: { label: string; value: string }) {
  return (
    <View>
      <Text style={{ fontSize: 10, fontWeight: '700', color: '#6d3a3c', textTransform: 'uppercase', letterSpacing: 0.8 }}>{label}</Text>
      <Text style={{ fontSize: 13, color: '#110703', marginTop: 2, lineHeight: 18 }}>{value}</Text>
    </View>
  );
}
