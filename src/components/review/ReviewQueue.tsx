'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import type { AIResponse } from '@/types';

interface ReviewQueueProps {
  initialResponses?: AIResponse[];
}

export default function ReviewQueue({ initialResponses = [] }: ReviewQueueProps) {
  const [responses, setResponses] = useState<AIResponse[]>(initialResponses);
  const [loading, setLoading] = useState(false);
  const [filter, setFilter] = useState<'all' | 'low' | 'medium' | 'high'>('all');

  useEffect(() => {
    fetchResponses();
  }, [filter]);

  const fetchResponses = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      
      if (filter === 'low') {
        params.append('max_confidence', '0.5');
      } else if (filter === 'medium') {
        params.append('min_confidence', '0.5');
        params.append('max_confidence', '0.7');
      } else if (filter === 'high') {
        params.append('min_confidence', '0.7');
      }

      const response = await fetch(`/api/ai-responses?${params.toString()}`);
      if (!response.ok) {
        throw new Error('Failed to fetch responses');
      }
      const data = await response.json();
      setResponses(data.responses || []);
    } catch (error) {
      console.error('Error fetching review queue:', error);
    } finally {
      setLoading(false);
    }
  };

  const getConfidenceColor = (score: number | null) => {
    if (!score) return 'bg-gray-100 text-gray-800';
    if (score < 0.5) return 'bg-red-100 text-red-800';
    if (score < 0.7) return 'bg-yellow-100 text-yellow-800';
    return 'bg-green-100 text-green-800';
  };

  const getConfidenceLabel = (score: number | null) => {
    if (!score) return 'N/A';
    return `${Math.round(score * 100)}%`;
  };

  return (
    <div className="space-y-4">
      {/* Filters - Always visible */}
      <div className="flex gap-2">
        <button
          onClick={() => setFilter('all')}
          disabled={loading}
          className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
            filter === 'all'
              ? 'bg-blue-600 text-white'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed'
          }`}
        >
          All
        </button>
        <button
          onClick={() => setFilter('low')}
          disabled={loading}
          className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
            filter === 'low'
              ? 'bg-blue-600 text-white'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed'
          }`}
        >
          Low Confidence (&lt;50%)
        </button>
        <button
          onClick={() => setFilter('medium')}
          disabled={loading}
          className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
            filter === 'medium'
              ? 'bg-blue-600 text-white'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed'
          }`}
        >
          Medium (50-70%)
        </button>
        <button
          onClick={() => setFilter('high')}
          disabled={loading}
          className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
            filter === 'high'
              ? 'bg-blue-600 text-white'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed'
          }`}
        >
          High (&gt;70%)
        </button>
      </div>

      {/* Loading State */}
      {loading && (
        <div className="flex items-center justify-center p-8">
          <div className="text-gray-500">Loading review queue...</div>
        </div>
      )}

      {/* Empty State */}
      {!loading && responses.length === 0 && (
        <div className="text-center p-8 bg-gray-50 rounded-lg border border-gray-200">
          <p className="text-gray-500">
            No responses pending review{filter !== 'all' ? ` for ${filter} confidence` : ''}
          </p>
        </div>
      )}

      {/* Response List */}
      {!loading && responses.length > 0 && (
        <div className="space-y-3">
          {responses.map((response) => (
            <Link
              key={response.id}
              href={`/dashboard/review/${response.id}`}
              className="block p-4 bg-white rounded-lg border border-gray-200 hover:border-blue-500 hover:shadow-md transition-all"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <span className={`px-2 py-1 rounded text-xs font-medium ${getConfidenceColor(response.confidence_score)}`}>
                      {getConfidenceLabel(response.confidence_score)} Confidence
                    </span>
                    <span className="text-sm text-gray-500">
                      Ticket: {response.ticket_id.substring(0, 8)}...
                    </span>
                  </div>
                  <p className="text-sm text-gray-700 line-clamp-2">
                    {response.response_text}
                  </p>
                  <div className="mt-2 flex items-center gap-4 text-xs text-gray-500">
                    <span>Model: {response.model_used}</span>
                    {response.tokens_used && (
                      <span>Tokens: {response.tokens_used.toLocaleString()}</span>
                    )}
                    {response.cost && (
                      <span>Cost: ${response.cost.toFixed(4)}</span>
                    )}
                  </div>
                </div>
                <div className="ml-4 text-xs text-gray-500">
                  {new Date(response.created_at).toLocaleDateString()}
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

