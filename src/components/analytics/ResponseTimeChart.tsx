'use client';

import { useState, useEffect } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

interface ResponseTimeMetrics {
  average: number;
  median: number;
  p95: number;
  p99: number;
  totalResponses: number;
}

export default function ResponseTimeChart() {
  const [metrics, setMetrics] = useState<ResponseTimeMetrics | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchMetrics();
  }, []);

  const fetchMetrics = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/analytics/response-time');
      if (!response.ok) throw new Error('Failed to fetch metrics');
      const data = await response.json();
      setMetrics(data.metrics);
    } catch (error) {
      console.error('Error fetching response time metrics:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500">Loading metrics...</div>
      </div>
    );
  }

  if (!metrics || metrics.totalResponses === 0) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500">No response time data available</div>
      </div>
    );
  }

  const chartData = [
    {
      name: 'Average',
      value: Math.round(metrics.average),
    },
    {
      name: 'Median',
      value: Math.round(metrics.median),
    },
    {
      name: '95th Percentile',
      value: Math.round(metrics.p95),
    },
    {
      name: '99th Percentile',
      value: Math.round(metrics.p99),
    },
  ];

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-blue-50 p-4 rounded-lg">
          <div className="text-sm text-gray-600">Average</div>
          <div className="text-2xl font-bold text-blue-600">{Math.round(metrics.average)} min</div>
        </div>
        <div className="bg-green-50 p-4 rounded-lg">
          <div className="text-sm text-gray-600">Median</div>
          <div className="text-2xl font-bold text-green-600">{Math.round(metrics.median)} min</div>
        </div>
        <div className="bg-yellow-50 p-4 rounded-lg">
          <div className="text-sm text-gray-600">95th Percentile</div>
          <div className="text-2xl font-bold text-yellow-600">{Math.round(metrics.p95)} min</div>
        </div>
        <div className="bg-orange-50 p-4 rounded-lg">
          <div className="text-sm text-gray-600">99th Percentile</div>
          <div className="text-2xl font-bold text-orange-600">{Math.round(metrics.p99)} min</div>
        </div>
      </div>

      <div className="bg-white p-4 rounded-lg border border-gray-200">
        <h3 className="text-lg font-semibold mb-4">Response Time Distribution</h3>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="name" />
            <YAxis label={{ value: 'Minutes', angle: -90, position: 'insideLeft' }} />
            <Tooltip formatter={(value: number) => `${value} minutes`} />
            <Bar dataKey="value" fill="#3b82f6" />
          </BarChart>
        </ResponsiveContainer>
        <div className="mt-4 text-sm text-gray-500 text-center">
          Total Responses: {metrics.totalResponses}
        </div>
      </div>
    </div>
  );
}

