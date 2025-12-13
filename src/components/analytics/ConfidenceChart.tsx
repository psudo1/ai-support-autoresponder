'use client';

import { useState, useEffect } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

interface ConfidenceDistribution {
  ranges: Array<{ range: string; count: number; percentage: number }>;
  average: number;
  median: number;
  totalResponses: number;
}

const RANGE_COLORS: Record<string, string> = {
  '0-30%': '#ef4444',
  '30-50%': '#f59e0b',
  '50-70%': '#eab308',
  '70-90%': '#84cc16',
  '90-100%': '#22c55e',
};

export default function ConfidenceChart() {
  const [distribution, setDistribution] = useState<ConfidenceDistribution | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDistribution();
  }, []);

  const fetchDistribution = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/analytics/confidence');
      if (!response.ok) throw new Error('Failed to fetch distribution');
      const data = await response.json();
      setDistribution(data.distribution);
    } catch (error) {
      console.error('Error fetching confidence distribution:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500">Loading distribution...</div>
      </div>
    );
  }

  if (!distribution || distribution.totalResponses === 0) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500">No confidence data available</div>
      </div>
    );
  }

  const chartData = distribution.ranges.map(range => ({
    ...range,
    color: RANGE_COLORS[range.range] || '#6b7280',
  }));

  return (
    <div className="space-y-6">
      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-blue-50 p-4 rounded-lg">
          <div className="text-sm text-gray-600">Average Confidence</div>
          <div className="text-2xl font-bold text-blue-600">
            {(distribution.average * 100).toFixed(1)}%
          </div>
        </div>
        <div className="bg-green-50 p-4 rounded-lg">
          <div className="text-sm text-gray-600">Median Confidence</div>
          <div className="text-2xl font-bold text-green-600">
            {(distribution.median * 100).toFixed(1)}%
          </div>
        </div>
        <div className="bg-purple-50 p-4 rounded-lg">
          <div className="text-sm text-gray-600">Total Responses</div>
          <div className="text-2xl font-bold text-purple-600">
            {distribution.totalResponses}
          </div>
        </div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Bar Chart */}
        <div className="bg-white p-6 rounded-lg border border-gray-200">
          <h3 className="text-lg font-semibold mb-4">Confidence Distribution (Bar)</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="range" />
              <YAxis />
              <Tooltip
                formatter={(value: number, name: string) => {
                  if (name === 'count') return [`${value} responses`, 'Count'];
                  if (name === 'percentage') return [`${value}%`, 'Percentage'];
                  return [value, name];
                }}
              />
              <Legend />
              <Bar dataKey="count" fill="#3b82f6" name="Count" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Pie Chart */}
        <div className="bg-white p-6 rounded-lg border border-gray-200">
          <h3 className="text-lg font-semibold mb-4">Confidence Distribution (Pie)</h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={chartData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ range, percentage }) => `${range}: ${percentage}%`}
                outerRadius={100}
                fill="#8884d8"
                dataKey="count"
              >
                {chartData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Range Details */}
      <div className="bg-white p-6 rounded-lg border border-gray-200">
        <h3 className="text-lg font-semibold mb-4">Confidence Range Details</h3>
        <div className="space-y-2">
          {chartData.map((range, index) => (
            <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div className="flex items-center gap-3">
                <div
                  className="w-4 h-4 rounded"
                  style={{ backgroundColor: range.color }}
                />
                <span className="font-medium">{range.range}</span>
              </div>
              <div className="flex items-center gap-4">
                <span className="text-sm text-gray-600">{range.count} responses</span>
                <span className="text-sm font-semibold">{range.percentage}%</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

