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
  {
    type: 'first_discovery',
    check: async (userId) => {
      const { count } = await supabase.from('discoveries').select('id', { count: 'exact' }).eq('user_id', userId);
      return (count ?? 0) === 1;
    },
  },
  {
    type: 'trailblazer',
    check: async (userId) => {
      const { count } = await supabase.from('expeditions').select('id', { count: 'exact' }).eq('user_id', userId);
      return (count ?? 0) === 1;
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
];

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
