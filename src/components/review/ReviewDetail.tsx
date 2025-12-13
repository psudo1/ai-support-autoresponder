'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import type { AIResponse, Ticket } from '@/types';

interface ReviewDetailProps {
  responseId: string;
}

export default function ReviewDetail({ responseId }: ReviewDetailProps) {
  const router = useRouter();
  const [aiResponse, setAiResponse] = useState<AIResponse | null>(null);
  const [ticket, setTicket] = useState<Ticket | null>(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [editedText, setEditedText] = useState('');
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchReviewData();
  }, [responseId]);

  const fetchReviewData = async () => {
    try {
      setLoading(true);
      
      // Fetch AI response directly
      const responseRes = await fetch(`/api/ai-responses/${responseId}`);
      if (!responseRes.ok) throw new Error('Failed to fetch AI response');
      const responseData = await responseRes.json();
      const fetchedResponse = responseData.response;
      
      if (!fetchedResponse) {
        throw new Error('AI response not found');
      }

      setAiResponse(fetchedResponse);
      setEditedText(fetchedResponse.response_text);

      // Fetch ticket
      const ticketId = fetchedResponse.ticket_id;
      const ticketRes = await fetch(`/api/tickets/${ticketId}`);
      if (ticketRes.ok) {
        const ticketData = await ticketRes.json();
        setTicket(ticketData.ticket);
      }
    } catch (err) {
      console.error('Error fetching review data:', err);
      setError(err instanceof Error ? err.message : 'Failed to load review data');
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (send: boolean = true) => {
    try {
      setActionLoading(true);
      setError(null);

      const res = await fetch(`/api/ai-responses/${responseId}/approve`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ send }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to approve response');
      }

      router.push('/dashboard/review');
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to approve response');
    } finally {
      setActionLoading(false);
    }
  };

  const handleReject = async () => {
    const reason = prompt('Reason for rejection (optional):');
    
    try {
      setActionLoading(true);
      setError(null);

      const res = await fetch(`/api/ai-responses/${responseId}/reject`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to reject response');
      }

      router.push('/dashboard/review');
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to reject response');
    } finally {
      setActionLoading(false);
    }
  };

  const handleEdit = async () => {
    try {
      setActionLoading(true);
      setError(null);

      const res = await fetch(`/api/ai-responses/${responseId}/edit`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ response_text: editedText }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to edit response');
      }

      const data = await res.json();
      setAiResponse(data.ai_response);
      setEditing(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to edit response');
    } finally {
      setActionLoading(false);
    }
  };

  const handleSend = async () => {
    try {
      setActionLoading(true);
      setError(null);

      const res = await fetch(`/api/ai-responses/${responseId}/send`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to send response');
      }

      router.push('/dashboard/review');
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to send response');
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-gray-500">Loading review...</div>
      </div>
    );
  }

  if (error && !aiResponse) {
    return (
      <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
        <p className="text-red-800">{error}</p>
      </div>
    );
  }

  if (!aiResponse) {
    return (
      <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
        <p className="text-yellow-800">AI response not found</p>
      </div>
    );
  }

  const confidenceScore = aiResponse.confidence_score || 0;
  const confidenceColor =
    confidenceScore < 0.5
      ? 'bg-red-100 text-red-800'
      : confidenceScore < 0.7
      ? 'bg-yellow-100 text-yellow-800'
      : 'bg-green-100 text-green-800';

  return (
    <div className="space-y-6">
      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-red-800">{error}</p>
        </div>
      )}

      {/* Ticket Context */}
      {ticket && (
        <div className="bg-gray-50 p-4 rounded-lg">
          <h3 className="font-semibold text-gray-900 mb-2">Ticket Context</h3>
          <div className="space-y-2 text-sm">
            <div>
              <span className="font-medium">Ticket #:</span>{' '}
              <Link
                href={`/dashboard/tickets/${ticket.id}`}
                className="text-blue-600 hover:underline"
              >
                {ticket.ticket_number}
              </Link>
            </div>
            <div>
              <span className="font-medium">Subject:</span> {ticket.subject}
            </div>
            <div>
              <span className="font-medium">Priority:</span>{' '}
              <span className={`px-2 py-1 rounded text-xs ${
                ticket.priority === 'urgent' ? 'bg-red-100 text-red-800' :
                ticket.priority === 'high' ? 'bg-orange-100 text-orange-800' :
                ticket.priority === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                'bg-gray-100 text-gray-800'
              }`}>
                {ticket.priority}
              </span>
            </div>
            <div>
              <span className="font-medium">Initial Message:</span>
              <p className="mt-1 text-gray-700">{ticket.initial_message}</p>
            </div>
          </div>
        </div>
      )}

      {/* AI Response */}
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold">AI Generated Response</h3>
          <div className="flex items-center gap-4">
            <span className={`px-3 py-1 rounded text-sm font-medium ${confidenceColor}`}>
              {Math.round(confidenceScore * 100)}% Confidence
            </span>
            <span className="text-sm text-gray-500">
              {aiResponse.model_used}
            </span>
          </div>
        </div>

        {editing ? (
          <div className="space-y-4">
            <textarea
              value={editedText}
              onChange={(e) => setEditedText(e.target.value)}
              className="w-full h-64 p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="Edit the response..."
            />
            <div className="flex gap-2">
              <button
                onClick={handleEdit}
                disabled={actionLoading}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
              >
                {actionLoading ? 'Saving...' : 'Save Changes'}
              </button>
              <button
                onClick={() => {
                  setEditing(false);
                  setEditedText(aiResponse.response_text);
                }}
                disabled={actionLoading}
                className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 disabled:opacity-50"
              >
                Cancel
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="prose max-w-none">
              <p className="whitespace-pre-wrap text-gray-800">
                {aiResponse.response_text}
              </p>
            </div>

            {/* Metadata */}
            <div className="pt-4 border-t border-gray-200 text-sm text-gray-500 space-y-1">
              {aiResponse.tokens_used && (
                <div>Tokens used: {aiResponse.tokens_used.toLocaleString()}</div>
              )}
              {aiResponse.cost && (
                <div>Cost: ${aiResponse.cost.toFixed(4)}</div>
              )}
              {aiResponse.knowledge_sources && aiResponse.knowledge_sources.length > 0 && (
                <div>
                  Knowledge sources: {aiResponse.knowledge_sources.length} article(s)
                </div>
              )}
              <div>Created: {new Date(aiResponse.created_at).toLocaleString()}</div>
            </div>

            {/* Actions */}
            <div className="pt-4 border-t border-gray-200 flex gap-2">
              {aiResponse.status === 'pending_review' && (
                <>
                  <button
                    onClick={() => handleApprove(true)}
                    disabled={actionLoading}
                    className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50"
                  >
                    {actionLoading ? 'Processing...' : 'Approve & Send'}
                  </button>
                  <button
                    onClick={() => handleApprove(false)}
                    disabled={actionLoading}
                    className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
                  >
                    {actionLoading ? 'Processing...' : 'Approve Only'}
                  </button>
                  <button
                    onClick={() => {
                      setEditing(true);
                      setEditedText(aiResponse.response_text);
                    }}
                    disabled={actionLoading}
                    className="px-4 py-2 bg-yellow-600 text-white rounded-md hover:bg-yellow-700 disabled:opacity-50"
                  >
                    Edit
                  </button>
                  <button
                    onClick={handleReject}
                    disabled={actionLoading}
                    className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 disabled:opacity-50"
                  >
                    {actionLoading ? 'Processing...' : 'Reject'}
                  </button>
                </>
              )}
              {aiResponse.status === 'approved' && (
                <button
                  onClick={handleSend}
                  disabled={actionLoading}
                  className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50"
                >
                  {actionLoading ? 'Sending...' : 'Send Response'}
                </button>
              )}
              {aiResponse.status === 'edited' && (
                <button
                  onClick={handleSend}
                  disabled={actionLoading}
                  className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50"
                >
                  {actionLoading ? 'Sending...' : 'Send Edited Response'}
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

