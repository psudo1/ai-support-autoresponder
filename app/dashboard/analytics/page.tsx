import ResponseTimeChart from '@/components/analytics/ResponseTimeChart';
import TicketStatusChart from '@/components/analytics/TicketStatusChart';
import ConfidenceChart from '@/components/analytics/ConfidenceChart';
import CostChart from '@/components/analytics/CostChart';

export default function AnalyticsPage() {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Analytics Dashboard</h1>
        <p className="mt-2 text-sm text-gray-500">
          Track performance metrics, costs, and AI response quality
        </p>
      </div>

      {/* Response Time Metrics */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Response Time Metrics</h2>
        <ResponseTimeChart />
      </div>

      {/* Ticket Status Analytics */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Ticket Status Analytics</h2>
        <TicketStatusChart />
      </div>

      {/* AI Confidence Distribution */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">AI Confidence Distribution</h2>
        <ConfidenceChart />
      </div>

      {/* Cost Tracking */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Cost Tracking</h2>
        <CostChart />
      </div>
    </div>
  );
}

