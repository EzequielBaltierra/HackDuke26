import type { AIIdentificationResult } from '../types';

export type PhotoInsight = {
  localUri: string;
  ai: AIIdentificationResult | null;
  scanError?: string;
};

export type LiveExpeditionDraft = {
  locationLabel: string;
  vibeTags: string[];
  gpsEnabled: boolean;
  durationSeconds: number;
  startTimeIso: string;
  endTimeIso: string;
  /** Final hike distance in miles (GPS path or manual). */
  distanceMiles: number;
  photoUris: string[];
  /** Filled after AI review step. */
  photoInsights: PhotoInsight[];
};

let draft: LiveExpeditionDraft | null = null;

export function setLiveExpeditionDraft(next: LiveExpeditionDraft) {
  draft = next;
}

export function getLiveExpeditionDraft() {
  return draft;
}

export function updateLiveExpeditionDraft(patch: Partial<LiveExpeditionDraft>) {
  if (!draft) return;
  draft = { ...draft, ...patch };
}

export function clearLiveExpeditionDraft() {
  draft = null;
}
