import React, { useCallback, useState } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { FollowListBody } from '../../../src/components/FollowListBody';
import { useAuth } from '../../../src/hooks/useAuth';
import { fetchFollowersProfiles } from '../../../src/hooks/useFollows';
import { colors } from '../../../src/theme/colors';
import { User } from '../../../src/types';

export default function FollowersScreen() {
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
    fetchFollowersProfiles(currentUser.id).then(data => {
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
        emptyHint="No one is following you yet."
        separatorHorizontalInsetPercent={5}
      />
    </SafeAreaView>
  );
}
