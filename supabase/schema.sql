-- Enable UUID extension
create extension if not exists "pgcrypto";

-- Users (linked to Auth0)
create table if not exists users (
  id uuid primary key default gen_random_uuid(),
  auth0_id text unique not null,
  username text unique not null,
  bio text,
  profile_photo_url text,
  total_points integer default 0 not null,
  streak integer default 0 not null,
  last_active_date date,
  created_at timestamptz default now() not null
);

-- Discoveries
create table if not exists discoveries (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references users(id) on delete cascade not null,
  image_url text not null,
  category text not null,
  common_name text not null,
  scientific_name text,
  confidence numeric(4,3),
  fact_card jsonb,
  caption text,
  location_lat numeric(10,6),
  location_lng numeric(10,6),
  is_sensitive boolean default false not null,
  points_earned integer default 0 not null,
  created_at timestamptz default now() not null
);

-- Expeditions
create table if not exists expeditions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references users(id) on delete cascade not null,
  title text not null,
  description text,
  type text not null,
  location text,
  location_lat numeric(10,6),
  location_lng numeric(10,6),
  distance numeric(8,2),
  difficulty text,
  vibe_tags text[] default '{}' not null,
  photo_urls text[] default '{}' not null,
  duration_seconds integer,
  start_time timestamptz,
  end_time timestamptz,
  is_live boolean default false not null,
  route_waypoints jsonb,
  points_earned integer default 0 not null,
  created_at timestamptz default now() not null
);

-- Link discoveries to expeditions
create table if not exists expedition_discoveries (
  expedition_id uuid references expeditions(id) on delete cascade,
  discovery_id uuid references discoveries(id) on delete cascade,
  primary key (expedition_id, discovery_id)
);

-- Tagged participants in group expeditions
create table if not exists expedition_participants (
  expedition_id uuid references expeditions(id) on delete cascade,
  user_id uuid references users(id) on delete cascade,
  primary key (expedition_id, user_id)
);

-- Social follows
create table if not exists follows (
  follower_id uuid references users(id) on delete cascade,
  following_id uuid references users(id) on delete cascade,
  created_at timestamptz default now() not null,
  primary key (follower_id, following_id)
);

-- Badges
create table if not exists badges (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references users(id) on delete cascade not null,
  badge_type text not null,
  earned_at timestamptz default now() not null,
  unique(user_id, badge_type)
);

-- Species tracker (for diminishing returns on points)
create table if not exists user_species (
  user_id uuid references users(id) on delete cascade,
  species_key text not null,
  count integer default 1 not null,
  primary key (user_id, species_key)
);

-- Indexes for performance
create index if not exists discoveries_user_id_idx on discoveries(user_id);
create index if not exists discoveries_created_at_idx on discoveries(created_at desc);
create index if not exists expeditions_user_id_idx on expeditions(user_id);
create index if not exists expeditions_created_at_idx on expeditions(created_at desc);
create index if not exists follows_follower_idx on follows(follower_id);
create index if not exists follows_following_idx on follows(following_id);

-- Disable RLS for hackathon
alter table users disable row level security;
alter table discoveries disable row level security;
alter table expeditions disable row level security;
alter table expedition_discoveries disable row level security;
alter table expedition_participants disable row level security;
alter table follows disable row level security;
alter table badges disable row level security;
alter table user_species disable row level security;

-- RPC to safely increment user points
create or replace function increment_points(user_id uuid, amount integer)
returns void
language sql
as $$
  update users set total_points = total_points + amount where id = user_id;
$$;
