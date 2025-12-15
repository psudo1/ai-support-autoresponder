import ResponseTimeChart from '@/components/analytics/ResponseTimeChart';
import TicketStatusChart from '@/components/analytics/TicketStatusChart';
import ConfidenceChart from '@/components/analytics/ConfidenceChart';
import CostChart from '@/components/analytics/CostChart';
import FeedbackChart from '@/components/analytics/FeedbackChart';
import CustomerSatisfactionChart from '@/components/analytics/CustomerSatisfactionChart';
import EscalationChart from '@/components/analytics/EscalationChart';
import ResponseQualityChart from '@/components/analytics/ResponseQualityChart';
import ExportButton from '@/components/analytics/ExportButton';

export default function AnalyticsPage() {
  return (
    <div className="space-y-8">
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Analytics Dashboard</h1>
          <p className="mt-2 text-sm text-gray-500">
            Track performance metrics, costs, and AI response quality
          </p>
        </div>
        <div className="flex gap-2">
          <ExportButton type="tickets" format="csv" />
          <ExportButton type="feedback" format="csv" />
          <ExportButton type="responses" format="csv" />
        </div>
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

      {/* Feedback Analytics */}
      <div>
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Feedback Analytics</h2>
        <FeedbackChart />
      </div>

      {/* Customer Satisfaction */}
      <div>
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Customer Satisfaction Metrics</h2>
        <CustomerSatisfactionChart />
      </div>

      {/* Escalation Metrics */}
      <div>
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Escalation Metrics</h2>
        <EscalationChart />
      </div>

      {/* Response Quality Trends */}
      <div>
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Response Quality Trends</h2>
        <ResponseQualityChart />
      </div>
    </div>
  );
}

