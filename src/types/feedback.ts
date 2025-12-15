export interface Feedback {
  id: string;
  conversation_id: string;
  rating: number; // -1, 1 (thumbs) or 1-5 (stars)
  feedback_text: string | null;
  created_at: string;
}

export interface CreateFeedbackInput {
  conversation_id: string;
  rating: number;
  feedback_text?: string;
}

export interface FeedbackStats {
  total: number;
  average_rating: number;
  rating_distribution: {
    rating: number;
    count: number;
  }[];
  positive_count: number; // ratings >= 4 or thumbs up
  negative_count: number; // ratings <= 2 or thumbs down
  neutral_count: number; // ratings = 3
  with_text_count: number;
  recent_feedback: Feedback[];
}

export type FeedbackRatingType = 'thumbs' | 'stars';

