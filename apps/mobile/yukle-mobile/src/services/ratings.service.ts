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
