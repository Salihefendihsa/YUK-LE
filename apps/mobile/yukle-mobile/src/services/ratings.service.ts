import { apiClient } from './api.client';

export interface SubmitRatingRequest {
  loadId: string;
  givenToUserId: number;
  score: number;
  comment?: string;
}

export async function submitRating(data: SubmitRatingRequest): Promise<void> {
  await apiClient.post('/Ratings/submit', data);
}

export interface UserRatingSummary {
  average: number;
  count: number;
}

/** GET /Ratings/user/{userId} — kullanicinin aldigi puanlarin ortalamasi + adedi. */
export async function getUserRatings(userId: number): Promise<UserRatingSummary> {
  const res = await apiClient.get(`/Ratings/user/${userId}`);
  const d = (res.data ?? {}) as { average?: number; count?: number };
  return { average: Number(d.average ?? 0), count: Number(d.count ?? 0) };
}
