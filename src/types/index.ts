export type User = {
  id: string;
  auth0_id: string;
  username: string;
  bio: string | null;
  profile_photo_url: string | null;
  total_points: number;
  streak: number;
  last_active_date: string | null;
  created_at: string;
};

export type FactCard = {
  native_region: string;
  sustainability: string;
  habitat: string;
  interesting_fact: string;
  ecological_relevance: string;
  sources: string[];
};

export type Discovery = {
  id: string;
  user_id: string;
  image_url: string;
  category: 'plants' | 'trees' | 'flowers' | 'fungi' | 'insects' | 'birds' | 'mammals' | 'other';
  common_name: string;
  scientific_name: string | null;
  confidence: number | null;
  fact_card: FactCard | null;
  caption: string | null;
  location_lat: number | null;
  location_lng: number | null;
  is_sensitive: boolean;
  points_earned: number;
  created_at: string;
  users?: User;
};

export type ExpeditionType = 'trail' | 'hike' | 'scenic_view' | 'walk' | 'nature_spot';
export type Difficulty = 'easy' | 'moderate' | 'hard';

export type Expedition = {
  id: string;
  user_id: string;
  title: string;
  description: string | null;
  type: ExpeditionType;
  location: string | null;
  location_lat: number | null;
  location_lng: number | null;
  route_waypoints: { lat: number; lng: number }[] | null;
  distance: number | null;
  difficulty: Difficulty | null;
  vibe_tags: string[];
  photo_urls: string[];
  duration_seconds: number | null;
  start_time: string | null;
  end_time: string | null;
  is_live: boolean;
  points_earned: number;
  created_at: string;
  users?: User;
  discoveries?: Discovery[];
  participants?: User[];
  original_expedition_id: string | null;
  trip_count: number;
  original_creator_username: string | null;
  original_expedition?: {
    id: string;
    trip_count: number;
  } | null;
};

export type Badge = {
  id: string;
  user_id: string;
  badge_type: string;
  earned_at: string;
};

export type AIIdentificationResult = {
  common_name: string;
  scientific_name: string;
  category: Discovery['category'];
  confidence: number;
  is_rare: boolean;
  is_nature: boolean;
  rejection_reason: string | null;
  fact_card: FactCard;
};

export type PointsBreakdown = {
  base: number;
  new_species_bonus: number;
  rare_bonus: number;
  total: number;
};
