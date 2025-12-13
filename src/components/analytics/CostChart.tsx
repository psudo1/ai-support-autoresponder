'use client';

import { useState, useEffect } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell } from 'recharts';

interface CostMetrics {
  totalCost: number;
  averageCostPerResponse: number;
  costByModel: Array<{ model: string; cost: number; count: number }>;
  costOverTime: Array<{ date: string; cost: number; count: number }>;
  totalTokens: number;
  averageTokensPerResponse: number;
}

const MODEL_COLORS: Record<string, string> = {
  'gpt-4o': '#3b82f6',
  'gpt-4': '#8b5cf6',
  'gpt-3.5-turbo': '#10b981',
  'unknown': '#6b7280',
};

export default function CostChart() {
  const [metrics, setMetrics] = useState<CostMetrics | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchMetrics();
  }, []);

  const fetchMetrics = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/analytics/cost');
      if (!response.ok) throw new Error('Failed to fetch metrics');
      const data = await response.json();
      setMetrics(data.metrics);
    } catch (error) {
      console.error('Error fetching cost metrics:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500">Loading cost metrics...</div>
      </div>
    );
  }

  if (!metrics) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500">No cost data available</div>
      </div>
    );
  }

  const costOverTimeData = metrics.costOverTime.map(item => ({
    date: new Date(item.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
    cost: item.cost,
    count: item.count,
  }));

  const modelData = metrics.costByModel.map(item => ({
    ...item,
    color: MODEL_COLORS[item.model] || MODEL_COLORS['unknown'],
  }));

  return (
    <div className="space-y-6">
      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-red-50 p-4 rounded-lg">
          <div className="text-sm text-gray-600">Total Cost</div>
          <div className="text-2xl font-bold text-red-600">
            ${metrics.totalCost.toFixed(4)}
          </div>
        </div>
        <div className="bg-blue-50 p-4 rounded-lg">
          <div className="text-sm text-gray-600">Avg Cost/Response</div>
          <div className="text-2xl font-bold text-blue-600">
            ${metrics.averageCostPerResponse.toFixed(4)}
          </div>
        </div>
        <div className="bg-green-50 p-4 rounded-lg">
          <div className="text-sm text-gray-600">Total Tokens</div>
          <div className="text-2xl font-bold text-green-600">
            {metrics.totalTokens.toLocaleString()}
          </div>
        </div>
        <div className="bg-purple-50 p-4 rounded-lg">
          <div className="text-sm text-gray-600">Avg Tokens/Response</div>
          <div className="text-2xl font-bold text-purple-600">
            {Math.round(metrics.averageTokensPerResponse).toLocaleString()}
          </div>
        </div>
      </div>

      {/* Cost Over Time */}
      {costOverTimeData.length > 0 && (
        <div className="bg-white p-6 rounded-lg border border-gray-200">
          <h3 className="text-lg font-semibold mb-4">Cost Over Time</h3>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={costOverTimeData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis />
              <Tooltip
                formatter={(value: number, name: string) => {
                  if (name === 'cost') return [`$${value.toFixed(4)}`, 'Cost'];
                  if (name === 'count') return [`${value} responses`, 'Responses'];
                  return [value, name];
                }}
              />
              <Legend />
              <Line type="monotone" dataKey="cost" stroke="#ef4444" strokeWidth={2} name="Cost ($)" />
              <Line type="monotone" dataKey="count" stroke="#3b82f6" strokeWidth={2} name="Response Count" />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Cost by Model */}
      {modelData.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white p-6 rounded-lg border border-gray-200">
            <h3 className="text-lg font-semibold mb-4">Cost by Model (Bar)</h3>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={modelData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="model" />
                <YAxis />
                <Tooltip
                  formatter={(value: number) => `$${value.toFixed(4)}`}
                />
                <Bar dataKey="cost" fill="#3b82f6" />
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="bg-white p-6 rounded-lg border border-gray-200">
            <h3 className="text-lg font-semibold mb-4">Cost by Model (Pie)</h3>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={modelData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ model, cost, percent }) => 
                    `${model}: $${cost.toFixed(2)} (${(percent * 100).toFixed(0)}%)`
                  }
                  outerRadius={100}
                  fill="#8884d8"
                  dataKey="cost"
                >
                  {modelData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip formatter={(value: number) => `$${value.toFixed(4)}`} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* Model Details */}
      {modelData.length > 0 && (
        <div className="bg-white p-6 rounded-lg border border-gray-200">
          <h3 className="text-lg font-semibold mb-4">Model Cost Breakdown</h3>
          <div className="space-y-2">
            {modelData.map((model, index) => (
              <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-3">
                  <div
                    className="w-4 h-4 rounded"
                    style={{ backgroundColor: model.color }}
                  />
                  <span className="font-medium">{model.model}</span>
                </div>
                <div className="flex items-center gap-6">
                  <span className="text-sm text-gray-600">{model.count} responses</span>
                  <span className="text-sm font-semibold">${model.cost.toFixed(4)}</span>
                  <span className="text-sm text-gray-500">
                    ${(model.cost / model.count).toFixed(4)} avg
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

