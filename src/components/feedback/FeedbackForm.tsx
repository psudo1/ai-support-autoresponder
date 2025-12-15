'use client';

import { useState } from 'react';
import { useToastContext } from '../providers/ToastProvider';
import LoadingSpinner from '../ui/LoadingSpinner';

interface FeedbackFormProps {
  conversationId: string;
  onSuccess?: () => void;
  ratingType?: 'thumbs' | 'stars';
}

export default function FeedbackForm({ conversationId, onSuccess, ratingType = 'stars' }: FeedbackFormProps) {
  const [rating, setRating] = useState<number | null>(null);
  const [feedbackText, setFeedbackText] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const toast = useToastContext();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (rating === null) {
      toast.error('Please select a rating');
      return;
    }

    setSubmitting(true);

    try {
      const response = await fetch('/api/feedback', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          conversation_id: conversationId,
          rating,
          feedback_text: feedbackText.trim() || undefined,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to submit feedback');
      }

      toast.success('Thank you for your feedback!');
      setRating(null);
      setFeedbackText('');
      
      if (onSuccess) {
        onSuccess();
      }
    } catch (error) {
      console.error('Error submitting feedback:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to submit feedback');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="border-t pt-4 mt-4">
      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          How would you rate this response?
        </label>
        
        {ratingType === 'thumbs' ? (
          <div className="flex gap-4">
            <button
              type="button"
              onClick={() => setRating(1)}
              className={`flex items-center gap-2 px-4 py-2 rounded-md border transition-colors ${
                rating === 1
                  ? 'bg-green-50 border-green-500 text-green-700'
                  : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'
              }`}
            >
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                <path d="M2 10.5a1.5 1.5 0 113 0v6a1.5 1.5 0 01-3 0v-6zM6 10.667v5.834a1.5 1.5 0 001.5 1.5h6.5a1.5 1.5 0 001.5-1.5v-5.834a1.5 1.5 0 00-.5-1.05L11.5 7.5a1.5 1.5 0 00-1.5-1.5h-1a1.5 1.5 0 00-1.5 1.5v3.167a1.5 1.5 0 00-.5 1.05z" />
              </svg>
              <span>Helpful</span>
            </button>
            <button
              type="button"
              onClick={() => setRating(-1)}
              className={`flex items-center gap-2 px-4 py-2 rounded-md border transition-colors ${
                rating === -1
                  ? 'bg-red-50 border-red-500 text-red-700'
                  : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'
              }`}
            >
              <svg className="w-5 h-5 transform rotate-180" fill="currentColor" viewBox="0 0 20 20">
                <path d="M2 10.5a1.5 1.5 0 113 0v6a1.5 1.5 0 01-3 0v-6zM6 10.667v5.834a1.5 1.5 0 001.5 1.5h6.5a1.5 1.5 0 001.5-1.5v-5.834a1.5 1.5 0 00-.5-1.05L11.5 7.5a1.5 1.5 0 00-1.5-1.5h-1a1.5 1.5 0 00-1.5 1.5v3.167a1.5 1.5 0 00-.5 1.05z" />
              </svg>
              <span>Not Helpful</span>
            </button>
          </div>
        ) : (
          <div className="flex gap-2">
            {[1, 2, 3, 4, 5].map((star) => (
              <button
                key={star}
                type="button"
                onClick={() => setRating(star)}
                className={`p-2 rounded transition-colors ${
                  rating !== null && star <= rating
                    ? 'text-yellow-400'
                    : 'text-gray-300 hover:text-yellow-300'
                }`}
              >
                <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                </svg>
              </button>
            ))}
            {rating !== null && (
              <span className="ml-2 text-sm text-gray-600 self-center">
                {rating === 1 ? 'Poor' : rating === 2 ? 'Fair' : rating === 3 ? 'Good' : rating === 4 ? 'Very Good' : 'Excellent'}
              </span>
            )}
          </div>
        )}
      </div>

      <div className="mb-4">
        <label htmlFor="feedback-text" className="block text-sm font-medium text-gray-700 mb-2">
          Additional comments (optional)
        </label>
        <textarea
          id="feedback-text"
          value={feedbackText}
          onChange={(e) => setFeedbackText(e.target.value)}
          rows={3}
          className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
          placeholder="Tell us more about your experience..."
        />
      </div>

      <button
        type="submit"
        disabled={submitting || rating === null}
        className="w-full sm:w-auto px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {submitting ? (
          <span className="flex items-center justify-center gap-2">
            <LoadingSpinner size="sm" />
            Submitting...
          </span>
        ) : (
          'Submit Feedback'
        )}
      </button>
    </form>
  );
}

