'use client';

import { useEffect, useState } from 'react';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import type { ResponseQualityTrends } from '@/lib/advancedAnalyticsService';

export default function ResponseQualityChart() {
  const [trends, setTrends] = useState<ResponseQualityTrends | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchTrends();
  }, []);

  const fetchTrends = async () => {
    try {
      const response = await fetch('/api/analytics/response-quality');
      if (!response.ok) {
        throw new Error('Failed to fetch response quality trends');
      }
      const data = await response.json();
      setTrends(data);
    } catch (error) {
      console.error('Error fetching response quality trends:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="h-64 flex items-center justify-center">
        <div className="text-gray-500">Loading...</div>
      </div>
    );
  }

  if (!trends) {
    return (
      <div className="h-64 flex items-center justify-center">
        <div className="text-gray-500">No response quality data available</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Summary Card */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">First Response Quality</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <p className="text-sm text-gray-600">Average Confidence</p>
            <p className="text-2xl font-bold text-blue-600">
              {(trends.first_response_quality.average_confidence * 100).toFixed(1)}%
            </p>
          </div>
          <div>
            <p className="text-sm text-gray-600">Average Rating</p>
            <p className="text-2xl font-bold text-green-600">
              {trends.first_response_quality.average_rating.toFixed(1)}/5
            </p>
          </div>
          <div>
            <p className="text-sm text-gray-600">Total Responses</p>
            <p className="text-2xl font-bold text-gray-900">
              {trends.first_response_quality.total_responses}
            </p>
          </div>
        </div>
      </div>

      {/* Quality Score Over Time */}
      {trends.quality_score_over_time.length > 0 && (
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Quality Score Over Time</h3>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={trends.quality_score_over_time}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis 
                dataKey="date" 
                label={{ value: 'Date', position: 'insideBottom', offset: -5 }}
              />
              <YAxis 
                label={{ value: 'Quality Score (0-1)', angle: -90, position: 'insideLeft' }} 
                domain={[0, 1]}
              />
              <Tooltip />
              <Legend />
              <Line 
                type="monotone" 
                dataKey="quality_score" 
                stroke="#8b5cf6" 
                name="Quality Score"
                strokeWidth={2}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Confidence vs Satisfaction */}
      {trends.confidence_vs_satisfaction.length > 0 && (
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Confidence vs Satisfaction</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={trends.confidence_vs_satisfaction}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis 
                dataKey="confidence_range" 
                label={{ value: 'Confidence Range', position: 'insideBottom', offset: -5 }}
              />
              <YAxis label={{ value: 'Average Rating', angle: -90, position: 'insideLeft' }} />
              <Tooltip />
              <Legend />
              <Bar dataKey="average_rating" fill="#8b5cf6" name="Average Rating" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Combined Trends */}
      {trends.average_confidence_over_time.length > 0 && trends.average_rating_over_time.length > 0 && (
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Confidence & Rating Trends</h3>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis 
                dataKey="date" 
                label={{ value: 'Date', position: 'insideBottom', offset: -5 }}
              />
              <YAxis yAxisId="left" label={{ value: 'Confidence (0-1)', angle: -90, position: 'insideLeft' }} domain={[0, 1]} />
              <YAxis yAxisId="right" orientation="right" label={{ value: 'Rating (1-5)', angle: 90, position: 'insideRight' }} domain={[1, 5]} />
              <Tooltip />
              <Legend />
              <Line 
                yAxisId="left"
                type="monotone" 
                data={trends.average_confidence_over_time}
                dataKey="confidence" 
                stroke="#3b82f6" 
                name="Avg Confidence"
                strokeWidth={2}
              />
              <Line 
                yAxisId="right"
                type="monotone" 
                data={trends.average_rating_over_time}
                dataKey="rating" 
                stroke="#10b981" 
                name="Avg Rating"
                strokeWidth={2}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}

