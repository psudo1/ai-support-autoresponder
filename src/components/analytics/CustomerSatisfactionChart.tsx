'use client';

import { useEffect, useState } from 'react';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import type { CustomerSatisfactionMetrics } from '@/lib/advancedAnalyticsService';

export default function CustomerSatisfactionChart() {
  const [metrics, setMetrics] = useState<CustomerSatisfactionMetrics | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchMetrics();
  }, []);

  const fetchMetrics = async () => {
    try {
      const response = await fetch('/api/analytics/customer-satisfaction');
      if (!response.ok) {
        throw new Error('Failed to fetch customer satisfaction metrics');
      }
      const data = await response.json();
      setMetrics(data);
    } catch (error) {
      console.error('Error fetching customer satisfaction metrics:', error);
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

  if (!metrics || metrics.total_responses === 0) {
    return (
      <div className="h-64 flex items-center justify-center">
        <div className="text-gray-500">No customer satisfaction data available</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg shadow p-4">
          <p className="text-sm text-gray-600">CSAT Score</p>
          <p className="text-2xl font-bold text-blue-600">{metrics.csat_score.toFixed(1)}%</p>
          <p className="text-xs text-gray-500 mt-1">Customer Satisfaction</p>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <p className="text-sm text-gray-600">NPS Score</p>
          <p className={`text-2xl font-bold ${metrics.nps_score >= 0 ? 'text-green-600' : 'text-red-600'}`}>
            {metrics.nps_score >= 0 ? '+' : ''}{metrics.nps_score.toFixed(1)}
          </p>
          <p className="text-xs text-gray-500 mt-1">Net Promoter Score</p>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <p className="text-sm text-gray-600">Response Rate</p>
          <p className="text-2xl font-bold text-purple-600">{metrics.response_rate.toFixed(1)}%</p>
          <p className="text-xs text-gray-500 mt-1">Feedback received</p>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <p className="text-sm text-gray-600">Total Responses</p>
          <p className="text-2xl font-bold text-gray-900">{metrics.total_responses}</p>
          <p className="text-xs text-gray-500 mt-1">Feedback entries</p>
        </div>
      </div>

      {/* Satisfaction Over Time */}
      {metrics.satisfaction_over_time.length > 0 && (
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Satisfaction Over Time</h3>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={metrics.satisfaction_over_time}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis 
                dataKey="date" 
                label={{ value: 'Date', position: 'insideBottom', offset: -5 }}
              />
              <YAxis yAxisId="left" label={{ value: 'CSAT %', angle: -90, position: 'insideLeft' }} />
              <YAxis yAxisId="right" orientation="right" label={{ value: 'NPS', angle: 90, position: 'insideRight' }} />
              <Tooltip />
              <Legend />
              <Line 
                yAxisId="left"
                type="monotone" 
                dataKey="csat" 
                stroke="#3b82f6" 
                name="CSAT Score"
                strokeWidth={2}
              />
              <Line 
                yAxisId="right"
                type="monotone" 
                dataKey="nps" 
                stroke="#10b981" 
                name="NPS Score"
                strokeWidth={2}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Satisfaction by Rating */}
      {metrics.satisfaction_by_rating.length > 0 && (
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Satisfaction Distribution</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={metrics.satisfaction_by_rating}>
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
      )}
    </div>
  );
}

