'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import type { Ticket, Conversation } from '@/types';
import AIResponseDisplay from './AIResponseDisplay';

export default function TicketDetail() {
  const params = useParams();
  const ticketId = params.id as string;

  const [ticket, setTicket] = useState<Ticket | null>(null);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [newMessage, setNewMessage] = useState('');

  useEffect(() => {
    if (ticketId) {
      fetchTicket();
      fetchConversations();
    }
  }, [ticketId]);

  const fetchTicket = async () => {
    try {
      const response = await fetch(`/api/tickets/${ticketId}`);
      const data = await response.json();
      setTicket(data.ticket);
    } catch (error) {
      console.error('Error fetching ticket:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchConversations = async () => {
    try {
      const response = await fetch(`/api/conversations?ticket_id=${ticketId}`);
      const data = await response.json();
      setConversations(data.conversations || []);
    } catch (error) {
      console.error('Error fetching conversations:', error);
    }
  };

  const handleGenerateResponse = async () => {
    try {
      setGenerating(true);
      const response = await fetch(`/api/tickets/${ticketId}/respond`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });
      const data = await response.json();
      
      // Refresh conversations
      await fetchConversations();
      
      // Show success message
      alert('AI response generated successfully!');
    } catch (error) {
      console.error('Error generating response:', error);
      alert('Failed to generate AI response');
    } finally {
      setGenerating(false);
    }
  };

  const handleSendMessage = async () => {
    if (!newMessage.trim()) return;

    try {
      const response = await fetch('/api/conversations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ticket_id: ticketId,
          message: newMessage,
          sender_type: 'human',
        }),
      });

      if (response.ok) {
        setNewMessage('');
        await fetchConversations();
      }
    } catch (error) {
      console.error('Error sending message:', error);
    }
  };

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      new: 'bg-blue-100 text-blue-800',
      ai_responded: 'bg-purple-100 text-purple-800',
      human_review: 'bg-yellow-100 text-yellow-800',
      resolved: 'bg-green-100 text-green-800',
      escalated: 'bg-red-100 text-red-800',
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  if (loading) {
    return <div className="text-center py-12">Loading ticket...</div>;
  }

  if (!ticket) {
    return <div className="text-center py-12">Ticket not found</div>;
  }

  return (
    <div className="space-y-6">
      {/* Ticket Header */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex justify-between items-start mb-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{ticket.subject}</h1>
            <p className="text-sm text-gray-500 mt-1">Ticket #{ticket.ticket_number}</p>
          </div>
          <span
            className={`px-3 py-1 text-sm font-medium rounded-full ${getStatusColor(
              ticket.status
            )}`}
          >
            {ticket.status.replace('_', ' ')}
          </span>
        </div>

        <div className="grid grid-cols-2 gap-4 mt-4">
          <div>
            <p className="text-sm text-gray-500">Customer</p>
            <p className="font-medium">{ticket.customer_email}</p>
          </div>
          <div>
            <p className="text-sm text-gray-500">Priority</p>
            <p className="font-medium capitalize">{ticket.priority}</p>
          </div>
          <div>
            <p className="text-sm text-gray-500">Created</p>
            <p className="font-medium">
              {new Date(ticket.created_at).toLocaleString()}
            </p>
          </div>
          <div>
            <p className="text-sm text-gray-500">Source</p>
            <p className="font-medium capitalize">{ticket.source}</p>
          </div>
        </div>

        <div className="mt-6">
          <p className="text-sm text-gray-500 mb-2">Initial Message</p>
          <p className="text-gray-900 whitespace-pre-wrap">{ticket.initial_message}</p>
        </div>

        <div className="mt-6 flex gap-3">
          <button
            onClick={handleGenerateResponse}
            disabled={generating}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {generating ? 'Generating...' : '🤖 Generate AI Response'}
          </button>
        </div>
      </div>

      {/* AI Response Display */}
      <AIResponseDisplay ticketId={ticketId} />

      {/* Conversations */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-bold text-gray-900 mb-4">Conversation</h2>
        
        <div className="space-y-4 mb-6">
          {conversations.map((conv) => (
            <div
              key={conv.id}
              className={`p-4 rounded-lg ${
                conv.sender_type === 'customer'
                  ? 'bg-blue-50'
                  : conv.sender_type === 'ai'
                  ? 'bg-purple-50'
                  : 'bg-gray-50'
              }`}
            >
              <div className="flex justify-between items-start mb-2">
                <span className="font-medium text-sm">
                  {conv.sender_type === 'customer'
                    ? 'Customer'
                    : conv.sender_type === 'ai'
                    ? 'AI Assistant'
                    : 'Support Agent'}
                </span>
                <span className="text-xs text-gray-500">
                  {new Date(conv.created_at).toLocaleString()}
                </span>
              </div>
              <p className="text-gray-900 whitespace-pre-wrap">{conv.message}</p>
              {conv.ai_confidence && (
                <p className="text-xs text-gray-500 mt-2">
                  Confidence: {(conv.ai_confidence * 100).toFixed(0)}%
                </p>
              )}
            </div>
          ))}
        </div>

        {/* New Message Input */}
        <div className="flex gap-2">
          <textarea
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder="Type your message..."
            className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            rows={3}
          />
          <button
            onClick={handleSendMessage}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Send
          </button>
        </div>
      </div>
    </div>
  );
}

