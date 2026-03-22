import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { Discovery } from '../types';

export function useDiscoveries(userId?: string) {
  const [discoveries, setDiscoveries] = useState<Discovery[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchFeed();
  }, [userId]);

  async function fetchFeed() {
    setLoading(true);
    let query = supabase
      .from('discoveries')
      .select('*, users(id, username, profile_photo_url, total_points)')
      .order('created_at', { ascending: false })
      .limit(50);

    if (userId) query = query.eq('user_id', userId);

    const { data } = await query;
    setDiscoveries(data ?? []);
    setLoading(false);
  }

  async function fetchById(id: string): Promise<Discovery | null> {
    const { data } = await supabase
      .from('discoveries')
      .select('*, users(id, username, profile_photo_url, total_points)')
      .eq('id', id)
      .single();
    return data;
  }

  return { discoveries, loading, refresh: fetchFeed, fetchById };
}
