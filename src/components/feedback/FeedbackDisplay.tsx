'use client';

import type { Feedback } from '@/types/feedback';

interface FeedbackDisplayProps {
  feedback: Feedback[];
  showConversationId?: boolean;
}

export default function FeedbackDisplay({ feedback, showConversationId = false }: FeedbackDisplayProps) {
  if (!feedback || feedback.length === 0) {
    return null;
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getRatingDisplay = (rating: number) => {
    if (rating === -1) {
      return (
        <span className="inline-flex items-center gap-1 text-red-600">
          <svg className="w-4 h-4 transform rotate-180" fill="currentColor" viewBox="0 0 20 20">
            <path d="M2 10.5a1.5 1.5 0 113 0v6a1.5 1.5 0 01-3 0v-6zM6 10.667v5.834a1.5 1.5 0 001.5 1.5h6.5a1.5 1.5 0 001.5-1.5v-5.834a1.5 1.5 0 00-.5-1.05L11.5 7.5a1.5 1.5 0 00-1.5-1.5h-1a1.5 1.5 0 00-1.5 1.5v3.167a1.5 1.5 0 00-.5 1.05z" />
          </svg>
          Not Helpful
        </span>
      );
    }
    
    if (rating === 1 && feedback.length > 1) {
      // Thumbs up
      return (
        <span className="inline-flex items-center gap-1 text-green-600">
          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
            <path d="M2 10.5a1.5 1.5 0 113 0v6a1.5 1.5 0 01-3 0v-6zM6 10.667v5.834a1.5 1.5 0 001.5 1.5h6.5a1.5 1.5 0 001.5-1.5v-5.834a1.5 1.5 0 00-.5-1.05L11.5 7.5a1.5 1.5 0 00-1.5-1.5h-1a1.5 1.5 0 00-1.5 1.5v3.167a1.5 1.5 0 00-.5 1.05z" />
          </svg>
          Helpful
        </span>
      );
    }

    // Star rating
    return (
      <span className="inline-flex items-center gap-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <svg
            key={star}
            className={`w-4 h-4 ${
              star <= rating ? 'text-yellow-400' : 'text-gray-300'
            }`}
            fill="currentColor"
            viewBox="0 0 20 20"
          >
            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
          </svg>
        ))}
        <span className="ml-1 text-sm text-gray-600">({rating}/5)</span>
      </span>
    );
  };

  return (
    <div className="space-y-3">
      <h3 className="text-sm font-semibold text-gray-900">Feedback</h3>
      {feedback.map((item) => (
        <div
          key={item.id}
          className="bg-gray-50 rounded-lg p-4 border border-gray-200"
        >
          <div className="flex items-start justify-between mb-2">
            <div className="flex items-center gap-2">
              {getRatingDisplay(item.rating)}
              {showConversationId && (
                <span className="text-xs text-gray-500">
                  Conversation: {item.conversation_id.slice(0, 8)}...
                </span>
              )}
            </div>
            <span className="text-xs text-gray-500">
              {formatDate(item.created_at)}
            </span>
          </div>
          {item.feedback_text && (
            <p className="text-sm text-gray-700 mt-2">{item.feedback_text}</p>
          )}
        </div>
      ))}
    </div>
  );
}

