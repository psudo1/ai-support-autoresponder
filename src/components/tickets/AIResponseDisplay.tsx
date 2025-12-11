'use client';

import { useState, useEffect } from 'react';
import type { AIResponse } from '@/types';

interface AIResponseDisplayProps {
  ticketId: string;
}

export default function AIResponseDisplay({ ticketId }: AIResponseDisplayProps) {
  const [aiResponses, setAiResponses] = useState<AIResponse[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAIResponses();
  }, [ticketId]);

  const fetchAIResponses = async () => {
    try {
      const response = await fetch(`/api/tickets/${ticketId}/ai-responses`);
      const data = await response.json();
      setAiResponses(data.responses || []);
    } catch (error) {
      console.error('Error fetching AI responses:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      pending_review: 'bg-yellow-100 text-yellow-800',
      approved: 'bg-green-100 text-green-800',
      rejected: 'bg-red-100 text-red-800',
      sent: 'bg-blue-100 text-blue-800',
      edited: 'bg-purple-100 text-purple-800',
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  if (loading) {
    return null;
  }

  if (aiResponses.length === 0) {
    return null;
  }

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h2 className="text-xl font-bold text-gray-900 mb-4">AI Responses</h2>
      <div className="space-y-4">
        {aiResponses.map((response) => (
          <div key={response.id} className="border border-gray-200 rounded-lg p-4">
            <div className="flex justify-between items-start mb-2">
              <span
                className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(
                  response.status
                )}`}
              >
                {response.status.replace('_', ' ')}
              </span>
              {response.confidence_score && (
                <span className="text-sm text-gray-500">
                  Confidence: {(response.confidence_score * 100).toFixed(0)}%
                </span>
              )}
            </div>
            <p className="text-gray-900 whitespace-pre-wrap mb-3">
              {response.response_text}
            </p>
            <div className="flex justify-between items-center text-xs text-gray-500">
              <span>Model: {response.model_used}</span>
              {response.tokens_used && (
                <span>Tokens: {response.tokens_used.toLocaleString()}</span>
              )}
              {response.cost && (
                <span>Cost: ${response.cost.toFixed(4)}</span>
              )}
            </div>
            {response.knowledge_sources.length > 0 && (
              <div className="mt-2 text-xs text-gray-500">
                Knowledge sources: {response.knowledge_sources.length} articles
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

