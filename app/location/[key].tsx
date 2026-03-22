import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useMemo } from 'react';
import { Dimensions, Image, Platform, ScrollView, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useDiscoveries } from '../../src/hooks/useDiscoveries';
import { useExpeditions } from '../../src/hooks/useExpeditions';
import { discoveryLocationKey, expeditionLocationKey, titleFromKey } from '../../src/lib/locationKey';
import { openInMaps } from '../../src/lib/mapLink';
import { colors } from '../../src/theme/colors';
import { ff, textStyles } from '../../src/theme/typography';
import { Discovery, Expedition } from '../../src/types';

const CATEGORY_LABEL: Record<string, string> = {
  plants: 'Plants',
  trees: 'Trees',
  flowers: 'Flowers',
  fungi: 'Fungi',
  insects: 'Insects',
  birds: 'Birds',
  mammals: 'Mammals',
  other: 'Other',
};

type LocationPhotoItem = {
  uri: string;
  expeditionId?: string;
  discoveryId?: string;
};

function LocationMapBlock({
  lat,
  lng,
  height,
}: {
  lat: number;
  lng: number;
  height: number;
}) {
  const w = Dimensions.get('window').width - 32;
  if (Platform.OS === 'web') {
    const uri = `https://staticmap.openstreetmap.de/staticmap.php?center=${lat},${lng}&zoom=15&size=${Math.round(w)}x${height}&markers=${lat},${lng},red-pushpin`;
    return (
      <Image
        source={{ uri }}
        style={{ width: w, height, borderRadius: 12, backgroundColor: colors.bgAccent }}
        resizeMode="cover"
      />
    );
  }
  const { default: MapView, Marker } = require('react-native-maps');
  return (
    <MapView
      style={{ width: w, height, borderRadius: 12, overflow: 'hidden' }}
      initialRegion={{
        latitude: lat,
        longitude: lng,
        latitudeDelta: 0.025,
        longitudeDelta: 0.025,
      }}
      scrollEnabled={false}
      rotateEnabled={false}
      pitchEnabled={false}
      zoomEnabled={false}
    >
      <Marker coordinate={{ latitude: lat, longitude: lng }} />
    </MapView>
  );
}

function LocationPhotoGrid({
  items,
  onOpenPost,
}: {
  items: LocationPhotoItem[];
  onOpenPost: (item: LocationPhotoItem) => void;
}) {
  const fullW = Dimensions.get('window').width - 32;
  const gap = 6;
  const cell = (fullW - gap * 2) / 3;

  if (items.length === 0) {
    return (
      <Text style={[textStyles.postDescription, { opacity: 0.65 }]}>No photos yet for this spot.</Text>
    );
  }

  if (items.length === 1) {
    return (
      <TouchableOpacity activeOpacity={0.9} onPress={() => onOpenPost(items[0])}>
        <Image
          source={{ uri: items[0].uri }}
          style={{ width: fullW, minHeight: 220, borderRadius: 12, backgroundColor: colors.bgAccent }}
          resizeMode="cover"
        />
      </TouchableOpacity>
    );
  }

  if (items.length === 2) {
    return (
      <View style={{ flexDirection: 'row', width: fullW, gap }}>
        {items.map((item, idx) => (
          <TouchableOpacity key={idx} activeOpacity={0.9} onPress={() => onOpenPost(item)} style={{ flex: 1 }}>
            <Image
              source={{ uri: item.uri }}
              style={{ width: '100%', aspectRatio: 1, borderRadius: 10, backgroundColor: colors.bgAccent }}
              resizeMode="cover"
            />
          </TouchableOpacity>
        ))}
      </View>
    );
  }

  const rest = items.slice(3);
  return (
    <View>
      <View style={{ flexDirection: 'row', width: fullW, gap, marginBottom: gap }}>
        <TouchableOpacity activeOpacity={0.9} onPress={() => onOpenPost(items[0])}>
          <View style={{ width: cell * 2 + gap }}>
            <Image
              source={{ uri: items[0].uri }}
              style={{ width: cell * 2 + gap, height: cell * 2 + gap, borderRadius: 10, backgroundColor: colors.bgAccent }}
              resizeMode="cover"
            />
          </View>
        </TouchableOpacity>
        <View style={{ width: cell, justifyContent: 'space-between' }}>
          {items[1] ? (
            <TouchableOpacity activeOpacity={0.9} onPress={() => onOpenPost(items[1])}>
              <Image
                source={{ uri: items[1].uri }}
                style={{ width: cell, height: cell, borderRadius: 10, backgroundColor: colors.bgAccent }}
                resizeMode="cover"
              />
            </TouchableOpacity>
          ) : null}
          {items[2] ? (
            <TouchableOpacity activeOpacity={0.9} onPress={() => onOpenPost(items[2])}>
              <Image
                source={{ uri: items[2].uri }}
                style={{ width: cell, height: cell, borderRadius: 10, backgroundColor: colors.bgAccent }}
                resizeMode="cover"
              />
            </TouchableOpacity>
          ) : null}
        </View>
      </View>
      {rest.length > 0 ? (
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap, width: fullW }}>
          {rest.map((item, i) => (
            <TouchableOpacity key={`${item.uri}-${i}`} activeOpacity={0.9} onPress={() => onOpenPost(item)}>
              <Image
                source={{ uri: item.uri }}
                style={{ width: cell, height: cell, borderRadius: 8, backgroundColor: colors.bgAccent }}
                resizeMode="cover"
              />
            </TouchableOpacity>
          ))}
        </View>
      ) : null}
    </View>
  );
}

export default function LocationScreen() {
  const router = useRouter();
  const { key: keyParam, title: titleParam } = useLocalSearchParams<{ key: string; title?: string }>();
  const key = decodeURIComponent(typeof keyParam === 'string' ? keyParam : keyParam?.[0] ?? '');
  const titleOverride =
    typeof titleParam === 'string' ? titleParam : decodeURIComponent(titleParam?.[0] ?? '');

  const { discoveries } = useDiscoveries();
  const { expeditions } = useExpeditions();

  const { expMatches, discMatches, tags, photoItems, mapCoords, addressLabel } = useMemo(() => {
    const ex: Expedition[] = [];
    const di: Discovery[] = [];
    for (const e of expeditions) {
      if (expeditionLocationKey(e) === key) ex.push(e);
    }
    for (const d of discoveries) {
      if (discoveryLocationKey(d) === key) di.push(d);
    }
    const tagSet = new Set<string>();
    ex.forEach(e => (e.vibe_tags ?? []).forEach(t => tagSet.add(t)));
    di.forEach(d => tagSet.add(CATEGORY_LABEL[d.category] ?? d.category));

    const photos: LocationPhotoItem[] = [];
    ex.forEach(e => (e.photo_urls ?? []).forEach(uri => photos.push({ uri, expeditionId: e.id })));
    di.forEach(d => photos.push({ uri: d.image_url, discoveryId: d.id }));

    let lat: number | null = null;
    let lng: number | null = null;
    let label = '';
    for (const e of ex) {
      if (e.location_lat != null && e.location_lng != null) {
        lat = e.location_lat;
        lng = e.location_lng;
        label = e.location ?? '';
        break;
      }
    }
    if (lat == null) {
      for (const d of di) {
        if (d.location_lat != null && d.location_lng != null) {
          lat = d.location_lat;
          lng = d.location_lng;
          break;
        }
      }
    }
    return {
      expMatches: ex,
      discMatches: di,
      tags: [...tagSet],
      photoItems: photos,
      mapCoords: lat != null && lng != null ? { lat, lng } : null,
      addressLabel: label,
    };
  }, [discoveries, expeditions, key]);

  const displayTitle =
    titleOverride.trim() ||
    titleFromKey(key) ||
    'Location';

  const mapAddressText =
    addressLabel.trim() ||
    (mapCoords ? `${mapCoords.lat.toFixed(4)}, ${mapCoords.lng.toFixed(4)}` : '');

  function openSearchTag(tag: string) {
    router.push(`/(tabs)/search?vibe=${encodeURIComponent(tag)}`);
  }

  function openPost(item: LocationPhotoItem) {
    if (item.discoveryId) {
      router.push(`/discovery/${item.discoveryId}`);
      return;
    }
    if (item.expeditionId) {
      router.push(`/expedition/${item.expeditionId}`);
    }
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.bgPrimary }} edges={['top']}>
      <View style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 6, paddingBottom: 8 }}>
        <TouchableOpacity onPress={() => router.back()} hitSlop={12} style={{ padding: 10 }}>
          <Text style={{ fontSize: 22, color: colors.redAccent, fontWeight: '700' }}>‹</Text>
        </TouchableOpacity>
        <Text style={{ flex: 1, fontFamily: ff.faustinaSemi, fontSize: 15, color: colors.redBase, letterSpacing: 1.1, textTransform: 'uppercase' }}>
          Location
        </Text>
      </View>

      <ScrollView
        contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 40 }}
        showsVerticalScrollIndicator={false}
        nestedScrollEnabled
      >
        <Text style={{ fontFamily: ff.crimsonBold, fontSize: 26, color: colors.textPrimary, marginBottom: 12 }}>
          {displayTitle}
        </Text>

        {tags.length > 0 ? (
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 16 }}>
            {tags.map(tag => (
              <TouchableOpacity
                key={tag}
                onPress={() => openSearchTag(tag)}
                activeOpacity={0.75}
                style={{
                  borderRadius: 20,
                  paddingHorizontal: 12,
                  paddingVertical: 5,
                  backgroundColor: colors.bgAccent,
                  borderWidth: 1,
                  borderColor: colors.redBase,
                }}
              >
                <Text style={textStyles.vibeTag}>{tag}</Text>
              </TouchableOpacity>
            ))}
          </View>
        ) : (
          <Text style={[textStyles.postDescription, { opacity: 0.65, marginBottom: 16 }]}>No tags yet.</Text>
        )}

        <Text style={{ fontFamily: ff.faustinaSemi, fontSize: 13, color: colors.redBase, marginBottom: 8, letterSpacing: 0.8 }}>
          Community photos
        </Text>
        <LocationPhotoGrid items={photoItems} onOpenPost={openPost} />

        <Text style={[textStyles.postDescription, { opacity: 0.55, marginTop: 16, fontSize: 12 }]}>
          {expMatches.length} expedition{expMatches.length === 1 ? '' : 's'} · {discMatches.length} discovery
          {discMatches.length === 1 ? '' : 'ies'}
        </Text>

        {mapCoords ? (
          <View style={{ marginTop: 28 }}>
            <Text style={{ fontFamily: ff.faustinaSemi, fontSize: 13, color: colors.redBase, marginBottom: 10, letterSpacing: 0.8 }}>
              Map
            </Text>
            <LocationMapBlock lat={mapCoords.lat} lng={mapCoords.lng} height={200} />
            {mapAddressText ? (
              <TouchableOpacity
                onPress={() => openInMaps(mapAddressText, mapCoords.lat, mapCoords.lng)}
                activeOpacity={0.8}
                style={{ marginTop: 12, paddingVertical: 4 }}
              >
                <Text style={{ fontFamily: ff.crimson, fontSize: 17, color: colors.greenBase, textDecorationLine: 'underline' }}>
                  {mapAddressText}
                </Text>
              </TouchableOpacity>
            ) : null}
          </View>
        ) : null}
      </ScrollView>
    </SafeAreaView>
  );
}
