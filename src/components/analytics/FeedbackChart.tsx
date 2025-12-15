'use client';

import { useEffect, useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, LineChart, Line } from 'recharts';
import type { FeedbackAnalytics } from '@/lib/analyticsService';

export default function FeedbackChart() {
  const [analytics, setAnalytics] = useState<FeedbackAnalytics | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAnalytics();
  }, []);

  const fetchAnalytics = async () => {
    try {
      const response = await fetch('/api/analytics/feedback');
      if (!response.ok) {
        throw new Error('Failed to fetch feedback analytics');
      }
      const data = await response.json();
      setAnalytics(data);
    } catch (error) {
      console.error('Error fetching feedback analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Feedback Analytics</h3>
        <div className="h-64 flex items-center justify-center">
          <div className="text-gray-500">Loading...</div>
        </div>
      </div>
    );
  }

  if (!analytics || analytics.total_feedback === 0) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Feedback Analytics</h3>
        <div className="h-64 flex items-center justify-center">
          <div className="text-gray-500">No feedback data available</div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg shadow p-4">
          <p className="text-sm text-gray-600">Total Feedback</p>
          <p className="text-2xl font-bold text-gray-900">{analytics.total_feedback}</p>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <p className="text-sm text-gray-600">Average Rating</p>
          <p className="text-2xl font-bold text-gray-900">
            {analytics.average_rating.toFixed(2)}/5
          </p>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <p className="text-sm text-gray-600">Positive Rate</p>
          <p className="text-2xl font-bold text-green-600">
            {analytics.positive_rate.toFixed(1)}%
          </p>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <p className="text-sm text-gray-600">With Comments</p>
          <p className="text-2xl font-bold text-blue-600">
            {analytics.feedback_with_text_rate.toFixed(1)}%
          </p>
        </div>
      </div>

      {/* Rating Distribution */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Rating Distribution</h3>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={analytics.rating_distribution}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis 
              dataKey="rating" 
              label={{ value: 'Rating', position: 'insideBottom', offset: -5 }}
            />
            <YAxis label={{ value: 'Count', angle: -90, position: 'insideLeft' }} />
            <Tooltip />
            <Legend />
            <Bar dataKey="count" fill="#3b82f6" name="Feedback Count" />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Feedback Over Time */}
      {analytics.feedback_over_time.length > 0 && (
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Feedback Over Time</h3>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={analytics.feedback_over_time}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis 
                dataKey="date" 
                label={{ value: 'Date', position: 'insideBottom', offset: -5 }}
              />
              <YAxis yAxisId="left" label={{ value: 'Count', angle: -90, position: 'insideLeft' }} />
              <YAxis yAxisId="right" orientation="right" label={{ value: 'Avg Rating', angle: 90, position: 'insideRight' }} />
              <Tooltip />
              <Legend />
              <Line 
                yAxisId="left"
                type="monotone" 
                dataKey="count" 
                stroke="#3b82f6" 
                name="Feedback Count"
                strokeWidth={2}
              />
              <Line 
                yAxisId="right"
                type="monotone" 
                dataKey="average_rating" 
                stroke="#10b981" 
                name="Average Rating"
                strokeWidth={2}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}

