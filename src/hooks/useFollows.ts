import { useCallback, useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { User } from '../types';

const USER_FIELDS = 'id, username, profile_photo_url, total_points, streak, bio, auth0_id, created_at, last_active_date';

export async function fetchFollowCounts(userId: string) {
  const [followersRes, followingRes] = await Promise.all([
    supabase.from('follows').select('follower_id', { count: 'exact', head: true }).eq('following_id', userId),
    supabase.from('follows').select('following_id', { count: 'exact', head: true }).eq('follower_id', userId),
  ]);
  return {
    followerCount: followersRes.count ?? 0,
    followingCount: followingRes.count ?? 0,
  };
}

async function usersByIds(ids: string[]): Promise<User[]> {
  if (ids.length === 0) return [];
  const { data, error } = await supabase.from('users').select(USER_FIELDS).in('id', ids);
  if (error || !data) return [];
  const order = new Map(ids.map((id, i) => [id, i]));
  return (data as User[]).sort((a, b) => (order.get(a.id) ?? 0) - (order.get(b.id) ?? 0));
}

export async function fetchFollowersProfiles(userId: string): Promise<User[]> {
  const { data: rows } = await supabase.from('follows').select('follower_id').eq('following_id', userId);
  const ids = (rows ?? []).map(r => r.follower_id as string);
  return usersByIds(ids);
}

export async function fetchFollowingProfiles(userId: string): Promise<User[]> {
  const { data: rows } = await supabase.from('follows').select('following_id').eq('follower_id', userId);
  const ids = (rows ?? []).map(r => r.following_id as string);
  return usersByIds(ids);
}

export async function followUser(viewerId: string, targetId: string) {
  if (viewerId === targetId) return;
  await supabase.from('follows').insert({ follower_id: viewerId, following_id: targetId });
}

export async function unfollowUser(viewerId: string, targetId: string) {
  await supabase.from('follows').delete().eq('follower_id', viewerId).eq('following_id', targetId);
}

export function useViewerFollowingIds(viewerId: string | undefined) {
  const [followingIds, setFollowingIds] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);

  const reload = useCallback(async () => {
    if (!viewerId) {
      setFollowingIds(new Set());
      setLoading(false);
      return;
    }
    setLoading(true);
    const { data } = await supabase.from('follows').select('following_id').eq('follower_id', viewerId);
    setFollowingIds(new Set((data ?? []).map(r => r.following_id as string)));
    setLoading(false);
  }, [viewerId]);

  useEffect(() => {
    reload();
  }, [reload]);

  const toggleFollowing = useCallback(
    async (targetUserId: string) => {
      if (!viewerId || viewerId === targetUserId) return;
      const isOn = followingIds.has(targetUserId);
      try {
        if (isOn) {
          await unfollowUser(viewerId, targetUserId);
          setFollowingIds(prev => {
            const n = new Set(prev);
            n.delete(targetUserId);
            return n;
          });
        } else {
          await followUser(viewerId, targetUserId);
          setFollowingIds(prev => new Set(prev).add(targetUserId));
        }
      } catch {
        void reload();
      }
    },
    [viewerId, followingIds, reload],
  );

  return { followingIds, toggleFollowing, reloadFollowing: reload, loading };
}
