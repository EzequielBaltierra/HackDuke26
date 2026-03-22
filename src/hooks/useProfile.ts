import { supabase } from '../lib/supabase';
import { User, Badge, Discovery, Expedition } from '../types';

export async function fetchUserProfile(userId: string) {
  const [userRes, badgesRes, discoveriesRes, expeditionsRes] = await Promise.all([
    supabase.from('users').select('*').eq('id', userId).single(),
    supabase.from('badges').select('*').eq('user_id', userId).order('earned_at', { ascending: false }),
    supabase.from('discoveries').select('id, image_url, common_name, points_earned, created_at').eq('user_id', userId).order('created_at', { ascending: false }).limit(20),
    supabase.from('expeditions').select('id, title, type, points_earned, created_at').eq('user_id', userId).order('created_at', { ascending: false }).limit(10),
  ]);

  return {
    user: userRes.data as User | null,
    badges: (badgesRes.data ?? []) as Badge[],
    discoveries: (discoveriesRes.data ?? []) as Partial<Discovery>[],
    expeditions: (expeditionsRes.data ?? []) as Partial<Expedition>[],
  };
}

export async function fetchLeaderboard(limit = 50) {
  const { data } = await supabase
    .from('users')
    .select('id, username, total_points, profile_photo_url, streak')
    .order('total_points', { ascending: false })
    .limit(limit);
  return (data ?? []) as User[];
}
