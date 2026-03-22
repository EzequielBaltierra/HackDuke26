import * as Location from 'expo-location';
import React, { useRef, useState } from 'react';
import {
  ActivityIndicator,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';

type NominatimResult = {
  place_id: number;
  display_name: string;
  lat: string;
  lon: string;
};

type Props = {
  locationName: string;
  lat: number | null;
  lng: number | null;
  onChange: (name: string, lat: number | null, lng: number | null) => void;
};

const NOMINATIM_HEADERS = {
  'User-Agent': 'Root-HackDuke/1.0',
  'Accept-Language': 'en',
};

export function LocationPicker({ locationName, onChange }: Props) {
  const [query, setQuery] = useState(locationName);
  const [results, setResults] = useState<NominatimResult[]>([]);
  const [locked, setLocked] = useState(false);
  const [gpsLoading, setGpsLoading] = useState(false);
  const [gpsError, setGpsError] = useState<string | null>(null);
  const debounceTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const currentSearch = useRef('');

  function handleTextChange(text: string) {
    setQuery(text);
    setResults([]);
    if (debounceTimer.current) clearTimeout(debounceTimer.current);
    if (text.length < 3) return;
    debounceTimer.current = setTimeout(() => doSearch(text), 1000);
  }

  async function doSearch(q: string) {
    currentSearch.current = q;
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(q)}&format=json&limit=5`,
        { headers: NOMINATIM_HEADERS }
      );
      const data: NominatimResult[] = await res.json();
      if (currentSearch.current === q) setResults(data);
    } catch {
      // silently fail — user can still submit a plain name without coords
    }
  }

  function selectResult(result: NominatimResult) {
    const name = result.display_name;
    const lat = parseFloat(result.lat);
    const lng = parseFloat(result.lon);
    setQuery(name);
    setResults([]);
    setLocked(true);
    onChange(name, lat, lng);
  }

  function clear() {
    setQuery('');
    setResults([]);
    setLocked(false);
    onChange('', null, null);
  }

  async function useGPS() {
    setGpsError(null);
    setGpsLoading(true);
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        setGpsError('Location permission needed');
        return;
      }
      const pos = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });
      const { latitude, longitude } = pos.coords;
      const res = await fetch(
        `https://nominatim.openstreetmap.org/reverse?lat=${latitude}&lon=${longitude}&format=json`,
        { headers: NOMINATIM_HEADERS }
      );
      const data = await res.json();
      const name: string =
        data.display_name ?? `${latitude.toFixed(5)}, ${longitude.toFixed(5)}`;
      setQuery(name);
      setResults([]);
      setLocked(true);
      onChange(name, latitude, longitude);
    } catch {
      setGpsError("Couldn't get location");
    } finally {
      setGpsLoading(false);
    }
  }

  return (
    <View style={{ marginBottom: 16 }}>
      <View style={{ flexDirection: 'row', gap: 8, alignItems: 'center' }}>
        <TextInput
          value={query}
          onChangeText={locked ? undefined : handleTextChange}
          editable={!locked}
          placeholder="Search for a place..."
          placeholderTextColor="#c7af94"
          style={[
            inputStyle,
            { flex: 1, marginBottom: 0 },
            locked ? { backgroundColor: '#f5efe8' } : null,
          ]}
        />
        {locked ? (
          <TouchableOpacity onPress={clear} style={actionBtnStyle}>
            <Text style={{ color: '#6d3a3c', fontWeight: '700', fontSize: 16 }}>✕</Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity
            onPress={useGPS}
            disabled={gpsLoading}
            style={[actionBtnStyle, { backgroundColor: '#4e705e' }]}
          >
            {gpsLoading ? (
              <ActivityIndicator size="small" color="#eaded0" />
            ) : (
              <Text style={{ color: '#eaded0', fontSize: 12, fontWeight: '700' }}>📍 GPS</Text>
            )}
          </TouchableOpacity>
        )}
      </View>

      {gpsError ? (
        <Text style={{ color: '#6d3a3c', fontSize: 12, marginTop: 4 }}>{gpsError}</Text>
      ) : null}

      {results.length > 0 ? (
        <View style={dropdownStyle}>
          {results.map((r, i) => (
            <TouchableOpacity
              key={r.place_id}
              onPress={() => selectResult(r)}
              style={[
                resultItemStyle,
                i === results.length - 1 ? { borderBottomWidth: 0 } : null,
              ]}
            >
              <Text style={{ fontSize: 13, color: '#110703' }} numberOfLines={2}>
                {r.display_name}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      ) : null}
    </View>
  );
}

const inputStyle = {
  backgroundColor: 'white',
  borderRadius: 12,
  padding: 14,
  fontSize: 15,
  borderWidth: 1,
  borderColor: '#c7af94',
  color: '#110703',
};

const actionBtnStyle = {
  borderRadius: 12,
  borderWidth: 1,
  borderColor: '#c7af94',
  paddingHorizontal: 14,
  height: 50,
  justifyContent: 'center' as const,
  alignItems: 'center' as const,
};

const dropdownStyle = {
  backgroundColor: 'white',
  borderRadius: 12,
  borderWidth: 1,
  borderColor: '#c7af94',
  marginTop: 4,
  overflow: 'hidden' as const,
};

const resultItemStyle = {
  padding: 12,
  borderBottomWidth: 1,
  borderBottomColor: '#f0e8dc',
};
