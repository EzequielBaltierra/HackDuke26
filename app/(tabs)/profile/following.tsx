import React, { useCallback, useState } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { FollowListBody } from '../../../src/components/FollowListBody';
import { useAuth } from '../../../src/hooks/useAuth';
import { fetchFollowingProfiles } from '../../../src/hooks/useFollows';
import { colors } from '../../../src/theme/colors';
import { User } from '../../../src/types';

export default function FollowingScreen() {
  const { currentUser } = useAuth();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(() => {
    if (!currentUser?.id) {
      setUsers([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    fetchFollowingProfiles(currentUser.id).then(data => {
      setUsers(data);
      setLoading(false);
    });
  }, [currentUser?.id]);

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
        emptyHint="You are not following anyone yet. Tap + on a post in the feed to follow."
        separatorHorizontalInsetPercent={5}
      />
    </SafeAreaView>
  );
}
