import type { Load } from '../types/load';
import { normalizeLoad } from '../utils/format';
import { apiClient } from './api.client';

export interface MatchedLoad {
  load: Load;
  match: {
    loadId: string;
    matchScore: number;
    personalizedReason: string;
    priorityTag: string;
    isAiGenerated: boolean;
  };
}

function normalizeMatch(raw: unknown): MatchedLoad | null {
  if (!raw || typeof raw !== 'object') return null;
  const r = raw as Record<string, unknown>;
  const loadRaw = r.load ?? r.Load;
  const matchRaw = (r.match ?? r.Match) as Record<string, unknown> | undefined;
  if (!loadRaw || !matchRaw) return null;
  return {
    load: normalizeLoad(loadRaw),
    match: {
      loadId: String(matchRaw.loadId ?? matchRaw.LoadId ?? ''),
      matchScore: Number(matchRaw.matchScore ?? matchRaw.MatchScore ?? 0),
      personalizedReason: String(matchRaw.personalizedReason ?? matchRaw.PersonalizedReason ?? ''),
      priorityTag: String(matchRaw.priorityTag ?? matchRaw.PriorityTag ?? ''),
      isAiGenerated: Boolean(matchRaw.isAiGenerated ?? matchRaw.IsAiGenerated ?? false),
    },
  };
}

/** GET /Matching/recommended */
export async function getRecommendedLoads(): Promise<MatchedLoad[]> {
  const res = await apiClient.get('/Matching/recommended', { timeout: 60000 });
  const data = res.data;
  if (!Array.isArray(data)) return [];
  return data.map(normalizeMatch).filter((row): row is MatchedLoad => row != null);
}
