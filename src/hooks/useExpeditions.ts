import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { Expedition } from '../types';

export function useExpeditions(userId?: string) {
  const [expeditions, setExpeditions] = useState<Expedition[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchFeed();
  }, [userId]);

  async function fetchFeed() {
    setLoading(true);
    let query = supabase
      .from('expeditions')
      .select('*, users!expeditions_user_id_fkey(id, username, profile_photo_url, total_points)')
      .order('created_at', { ascending: false })
      .limit(50);

    if (userId) query = query.eq('user_id', userId);

    const { data, error } = await query;
    if (error) console.error('[useExpeditions]', error);
    setExpeditions(data ?? []);
    setLoading(false);
  }

  async function fetchById(id: string): Promise<Expedition | null> {
    const { data } = await supabase
      .from('expeditions')
      .select('*, users!expeditions_user_id_fkey(id, username, profile_photo_url, total_points)')
      .eq('id', id)
      .single();
    return data;
  }

  return { expeditions, loading, refresh: fetchFeed, fetchById };
}
