import { useAuth0 } from 'react-native-auth0';
import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { User } from '../types';

export function useAuth() {
  const { user: auth0User, authorize, clearSession, isLoading: auth0Loading } = useAuth0();
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!auth0User) {
      setCurrentUser(null);
      setLoading(false);
      return;
    }
    syncUser(auth0User.sub!, auth0User.name ?? auth0User.email ?? 'Explorer');
  }, [auth0User]);

  async function syncUser(auth0Id: string, displayName: string) {
    setLoading(true);
    try {
      const { data: existing } = await supabase
        .from('users')
        .select('*')
        .eq('auth0_id', auth0Id)
        .single();

      if (existing) {
        setCurrentUser(existing);
        return;
      }

      const baseUsername = displayName.toLowerCase().replace(/[^a-z0-9]/g, '').slice(0, 15);
      const username = `${baseUsername}${Math.floor(Math.random() * 9999)}`;

      const { data: newUser } = await supabase
        .from('users')
        .insert({ auth0_id: auth0Id, username })
        .select('*')
        .single();

      setCurrentUser(newUser);
    } finally {
      setLoading(false);
    }
  }

  async function login() {
    await authorize();
  }

  async function logout() {
    await clearSession();
    setCurrentUser(null);
  }

  return {
    currentUser,
    loading: loading || auth0Loading,
    isAuthenticated: !!auth0User,
    login,
    logout,
    refreshUser: () => auth0User && syncUser(auth0User.sub!, auth0User.name ?? ''),
  };
}
