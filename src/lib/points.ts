import { supabase } from './supabase';
import { PointsBreakdown } from '../types';

// Points constants
const BASE_DISCOVERY = 10;
const NEW_SPECIES_BONUS = 25;
const RARE_SPECIES_BONUS = 75;
const EXPEDITION_BASE = 30;
const LIVE_EXPEDITION_BONUS = 20;
const DISTANCE_BONUS_PER_KM = 5; // capped at 50 pts
const GROUP_EXPEDITION_PER_FRIEND = 10;
const DISCOVERY_DURING_EXPEDITION = 5;

export async function calculateDiscoveryPoints(
  userId: string,
  speciesKey: string,
  isRare: boolean
): Promise<PointsBreakdown> {
  const { data: existing } = await supabase
    .from('user_species')
    .select('count')
    .eq('user_id', userId)
    .eq('species_key', speciesKey)
    .single();

  const isNewSpecies = !existing;
  const count = existing?.count ?? 0;

  // Diminishing returns: 100% → 50% → 25% → 10%
  const diminishingMultiplier = isNewSpecies ? 1 : count === 1 ? 0.5 : count === 2 ? 0.25 : 0.1;
  const base = Math.round(BASE_DISCOVERY * diminishingMultiplier);
  const new_species_bonus = isNewSpecies ? NEW_SPECIES_BONUS : 0;
  const rare_bonus = isRare && isNewSpecies ? RARE_SPECIES_BONUS : 0;

  return { base, new_species_bonus, rare_bonus, total: base + new_species_bonus + rare_bonus };
}

export async function calculateExpeditionPoints(
  participantCount: number,
  distanceKm: number | null,
  isLive: boolean,
  discoveryCount: number
): Promise<number> {
  const base = EXPEDITION_BASE;
  const live = isLive ? LIVE_EXPEDITION_BONUS : 0;
  const distance = distanceKm ? Math.min(Math.round(distanceKm * DISTANCE_BONUS_PER_KM), 50) : 0;
  const social = (participantCount - 1) * GROUP_EXPEDITION_PER_FRIEND;
  const discoveries = discoveryCount * DISCOVERY_DURING_EXPEDITION;
  return base + live + distance + social + discoveries;
}

export async function awardPoints(userId: string, points: number): Promise<void> {
  await supabase.rpc('increment_points', { user_id: userId, amount: points });
}

export async function trackSpecies(userId: string, speciesKey: string): Promise<void> {
  const { data: existing } = await supabase
    .from('user_species')
    .select('count')
    .eq('user_id', userId)
    .eq('species_key', speciesKey)
    .single();

  if (existing) {
    await supabase
      .from('user_species')
      .update({ count: existing.count + 1 })
      .eq('user_id', userId)
      .eq('species_key', speciesKey);
  } else {
    await supabase.from('user_species').insert({ user_id: userId, species_key: speciesKey, count: 1 });
  }
}

const BADGE_RULES: { type: string; check: (userId: string) => Promise<boolean> }[] = [
  // --- Existing ---
  {
    type: 'first_discovery',
    check: async (userId) => {
      const { count } = await supabase.from('discoveries').select('id', { count: 'exact' }).eq('user_id', userId);
      return (count ?? 0) >= 1;
    },
  },
  {
    type: 'trailblazer',
    check: async (userId) => {
      const { count } = await supabase.from('expeditions').select('id', { count: 'exact' }).eq('user_id', userId);
      return (count ?? 0) >= 1;
    },
  },
  {
    type: 'explorer',
    check: async (userId) => {
      const { count } = await supabase.from('expeditions').select('id', { count: 'exact' }).eq('user_id', userId);
      return (count ?? 0) >= 5;
    },
  },
  {
    type: 'rare_finder',
    check: async (userId) => {
      const { count } = await supabase.from('discoveries').select('id', { count: 'exact' }).eq('user_id', userId).eq('is_sensitive', true);
      return (count ?? 0) >= 1;
    },
  },

  // --- Discovery-based ---
  {
    type: 'botanist',
    check: async (userId) => {
      const { data } = await supabase.from('discoveries').select('common_name').eq('user_id', userId).ilike('category', '%plant%');
      const unique = new Set((data ?? []).map(d => d.common_name));
      return unique.size >= 5;
    },
  },
  {
    type: 'entomologist',
    check: async (userId) => {
      const { data } = await supabase.from('discoveries').select('common_name').eq('user_id', userId).ilike('category', '%insect%');
      const unique = new Set((data ?? []).map(d => d.common_name));
      return unique.size >= 3;
    },
  },
  {
    type: 'fungi_hunter',
    check: async (userId) => {
      const { count } = await supabase.from('discoveries').select('id', { count: 'exact' }).eq('user_id', userId).ilike('category', '%fung%');
      return (count ?? 0) >= 1;
    },
  },
  {
    type: 'collector',
    check: async (userId) => {
      const { count } = await supabase.from('discoveries').select('id', { count: 'exact' }).eq('user_id', userId);
      return (count ?? 0) >= 10;
    },
  },
  {
    type: 'naturalist',
    check: async (userId) => {
      const { count } = await supabase.from('discoveries').select('id', { count: 'exact' }).eq('user_id', userId);
      return (count ?? 0) >= 25;
    },
  },

  // --- Expedition-based ---
  {
    type: 'summit_seeker',
    check: async (userId) => {
      const { count } = await supabase.from('expeditions').select('id', { count: 'exact' }).eq('user_id', userId).eq('difficulty', 'hard');
      return (count ?? 0) >= 1;
    },
  },
  {
    type: 'long_hauler',
    check: async (userId) => {
      const { count } = await supabase.from('expeditions').select('id', { count: 'exact' }).eq('user_id', userId).gte('distance', 16);
      return (count ?? 0) >= 1;
    },
  },
  {
    type: 'weekend_warrior',
    check: async (userId) => {
      const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
      const { count } = await supabase.from('expeditions').select('id', { count: 'exact' }).eq('user_id', userId).gte('created_at', sevenDaysAgo);
      return (count ?? 0) >= 3;
    },
  },
  {
    type: 'trailhead',
    check: async (userId) => {
      const { data } = await supabase.from('expeditions').select('location').eq('user_id', userId).not('location', 'is', null);
      const unique = new Set((data ?? []).map(e => e.location?.toLowerCase().trim()).filter(Boolean));
      return unique.size >= 3;
    },
  },

  // --- Social ---
  {
    type: 'social_explorer',
    check: async (userId) => {
      const { data: myExpeditions } = await supabase.from('expeditions').select('id').eq('user_id', userId);
      if (!myExpeditions || myExpeditions.length === 0) return false;
      const ids = myExpeditions.map(e => e.id);
      const { count } = await supabase.from('expedition_participants').select('id', { count: 'exact' }).in('expedition_id', ids);
      return (count ?? 0) >= 1;
    },
  },
  {
    type: 'trail_buddy',
    check: async (userId) => {
      const { data: participations } = await supabase.from('expedition_participants').select('expedition_id').eq('user_id', userId);
      if (!participations || participations.length === 0) return false;
      const ids = participations.map(p => p.expedition_id);
      const { count } = await supabase.from('expeditions').select('id', { count: 'exact' }).in('id', ids).neq('user_id', userId);
      return (count ?? 0) >= 1;
    },
  },

  // --- Streaks ---
  {
    type: 'on_a_roll',
    check: async (userId) => {
      const { data } = await supabase.from('users').select('streak').eq('id', userId).single();
      return (data?.streak ?? 0) >= 3;
    },
  },
  {
    type: 'unstoppable',
    check: async (userId) => {
      const { data } = await supabase.from('users').select('streak').eq('id', userId).single();
      return (data?.streak ?? 0) >= 7;
    },
  },

  // --- Fun ---
  {
    type: 'night_owl',
    check: async (userId) => {
      const { data } = await supabase.from('discoveries').select('created_at').eq('user_id', userId);
      return (data ?? []).some(d => new Date(d.created_at).getHours() >= 21);
    },
  },
];

export type Rank = {
  name: string;
  emoji: string;
  minPoints: number;
  nextMinPoints: number | null;
  color: string;
};

const RANKS: Rank[] = [
  { name: 'Observer',   emoji: '🪴',    minPoints: 0,      nextMinPoints: 750,   color: '#c7af94' },
  { name: 'Explorer',   emoji: '🌿',    minPoints: 750,    nextMinPoints: 3500,  color: '#4e705e' },
  { name: 'Tracker',    emoji: '🌲',    minPoints: 3500,   nextMinPoints: 10000, color: '#6d3a3c' },
  { name: 'Naturalist', emoji: '🌳',    minPoints: 10000,  nextMinPoints: 30000, color: '#2d6a4f' },
  { name: 'Ecologist',  emoji: '🌳🌲🌿', minPoints: 30000, nextMinPoints: null,  color: '#361319' },
];

export function getRank(totalPoints: number): Rank & { progress: number } {
  const rank = [...RANKS].reverse().find(r => totalPoints >= r.minPoints) ?? RANKS[0];
  const progress = rank.nextMinPoints
    ? (totalPoints - rank.minPoints) / (rank.nextMinPoints - rank.minPoints)
    : 1;
  return { ...rank, progress: Math.min(progress, 1) };
}

export async function checkAndAwardBadges(userId: string): Promise<string[]> {
  const { data: existing } = await supabase.from('badges').select('badge_type').eq('user_id', userId);
  const existingTypes = new Set((existing ?? []).map(b => b.badge_type));
  const awarded: string[] = [];

  for (const rule of BADGE_RULES) {
    if (existingTypes.has(rule.type)) continue;
    if (await rule.check(userId)) {
      await supabase.from('badges').insert({ user_id: userId, badge_type: rule.type });
      awarded.push(rule.type);
    }
  }

  return awarded;
}
