'use client';

import { useEffect, useState } from 'react';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import type { EscalationMetrics } from '@/lib/advancedAnalyticsService';

export default function EscalationChart() {
  const [metrics, setMetrics] = useState<EscalationMetrics | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchMetrics();
  }, []);

  const fetchMetrics = async () => {
    try {
      const response = await fetch('/api/analytics/escalation');
      if (!response.ok) {
        throw new Error('Failed to fetch escalation metrics');
      }
      const data = await response.json();
      setMetrics(data);
    } catch (error) {
      console.error('Error fetching escalation metrics:', error);
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

  if (!metrics) {
    return (
      <div className="h-64 flex items-center justify-center">
        <div className="text-gray-500">No escalation data available</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white rounded-lg shadow p-4">
          <p className="text-sm text-gray-600">Total Escalated</p>
          <p className="text-2xl font-bold text-red-600">{metrics.total_escalated}</p>
          <p className="text-xs text-gray-500 mt-1">Tickets escalated</p>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <p className="text-sm text-gray-600">Escalation Rate</p>
          <p className="text-2xl font-bold text-orange-600">{metrics.escalation_rate.toFixed(1)}%</p>
          <p className="text-xs text-gray-500 mt-1">Of all tickets</p>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <p className="text-sm text-gray-600">Avg Time to Escalation</p>
          <p className="text-2xl font-bold text-gray-900">{metrics.average_time_to_escalation.toFixed(1)}h</p>
          <p className="text-xs text-gray-500 mt-1">Hours</p>
        </div>
      </div>

      {/* Escalation Over Time */}
      {metrics.escalation_over_time.length > 0 && (
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Escalation Rate Over Time</h3>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={metrics.escalation_over_time}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis 
                dataKey="date" 
                label={{ value: 'Date', position: 'insideBottom', offset: -5 }}
              />
              <YAxis yAxisId="left" label={{ value: 'Escalation Rate %', angle: -90, position: 'insideLeft' }} />
              <YAxis yAxisId="right" orientation="right" label={{ value: 'Count', angle: 90, position: 'insideRight' }} />
              <Tooltip />
              <Legend />
              <Line 
                yAxisId="left"
                type="monotone" 
                dataKey="rate" 
                stroke="#ef4444" 
                name="Escalation Rate %"
                strokeWidth={2}
              />
              <Line 
                yAxisId="right"
                type="monotone" 
                dataKey="escalated" 
                stroke="#f97316" 
                name="Escalated Count"
                strokeWidth={2}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Escalation by Priority */}
      {metrics.escalation_by_priority.length > 0 && (
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Escalation by Priority</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={metrics.escalation_by_priority}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis 
                dataKey="priority" 
                label={{ value: 'Priority', position: 'insideBottom', offset: -5 }}
              />
              <YAxis label={{ value: 'Escalation Rate %', angle: -90, position: 'insideLeft' }} />
              <Tooltip />
              <Legend />
              <Bar dataKey="rate" fill="#ef4444" name="Escalation Rate %" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Escalation by Category */}
      {metrics.escalation_by_category.length > 0 && (
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Escalation by Category</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={metrics.escalation_by_category.slice(0, 10)}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis 
                dataKey="category" 
                angle={-45}
                textAnchor="end"
                height={100}
                label={{ value: 'Category', position: 'insideBottom', offset: -5 }}
              />
              <YAxis label={{ value: 'Escalation Rate %', angle: -90, position: 'insideLeft' }} />
              <Tooltip />
              <Legend />
              <Bar dataKey="rate" fill="#f97316" name="Escalation Rate %" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}

