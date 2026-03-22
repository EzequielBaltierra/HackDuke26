import React, { useCallback, useState } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { useLocalSearchParams } from 'expo-router';
import { FollowListBody } from '../../../src/components/FollowListBody';
import { fetchFollowingProfiles } from '../../../src/hooks/useFollows';
import { colors } from '../../../src/theme/colors';
import { User } from '../../../src/types';

export default function UserFollowingScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(() => {
    if (!id) {
      setUsers([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    fetchFollowingProfiles(id as string).then(data => {
      setUsers(data);
      setLoading(false);
    });
  }, [id]);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load]),
  );

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.bgPrimary }} edges={['bottom']}>
      <FollowListBody
        users={users}
        loading={loading}
        emptyHint="Not following anyone yet."
        separatorHorizontalInsetPercent={5}
      />
    </SafeAreaView>
  );
}
