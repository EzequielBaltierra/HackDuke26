import type { Href } from 'expo-router';

/**
 * Public profile (`app/user/[id]/index.tsx`). The URL is `/user/:id`.
 * Navigating with pathname `/user/[id]/index` does not match and shows “Unmatched route”.
 */
export function hrefUserProfile(userId: string): Href {
  return `/user/${userId}` as Href;
}
