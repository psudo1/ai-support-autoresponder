import { getTicketStats, getAllTickets } from '@/lib/ticketService';
import { getAllKnowledgeEntries } from '@/lib/knowledgeBaseService';

export default async function DashboardPage() {
  let stats, recentTickets, knowledgeCount;
  
  try {
    [stats, recentTickets, knowledgeCount] = await Promise.all([
      getTicketStats(),
      getAllTickets({ limit: 5 }),
      getAllKnowledgeEntries().then(entries => entries.length),
    ]);
  } catch (error) {
    // Fallback values if there's an error
    stats = { total: 0, byStatus: {}, byPriority: {} };
    recentTickets = [];
    knowledgeCount = 0;
  }

  return (
    <div>
      <h1 className="text-3xl font-bold text-gray-900 mb-8">Dashboard</h1>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="text-sm text-gray-500 mb-1">Total Tickets</div>
          <div className="text-3xl font-bold text-gray-900">{stats.total}</div>
        </div>
        
        <div className="bg-white rounded-lg shadow p-6">
          <div className="text-sm text-gray-500 mb-1">New Tickets</div>
          <div className="text-3xl font-bold text-blue-600">
            {stats.byStatus.new || 0}
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow p-6">
          <div className="text-sm text-gray-500 mb-1">Resolved</div>
          <div className="text-3xl font-bold text-green-600">
            {stats.byStatus.resolved || 0}
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow p-6">
          <div className="text-sm text-gray-500 mb-1">Knowledge Base</div>
          <div className="text-3xl font-bold text-purple-600">{knowledgeCount}</div>
        </div>
      </div>

      {/* Recent Tickets */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-bold text-gray-900 mb-4">Recent Tickets</h2>
        {recentTickets.length === 0 ? (
          <p className="text-gray-500">No tickets yet</p>
        ) : (
          <div className="space-y-3">
            {recentTickets.map((ticket) => (
              <div
                key={ticket.id}
                className="flex justify-between items-center p-3 border border-gray-200 rounded-lg hover:bg-gray-50"
              >
                <div>
                  <div className="font-medium text-gray-900">{ticket.subject}</div>
                  <div className="text-sm text-gray-500">{ticket.customer_email}</div>
                </div>
                <div className="text-sm text-gray-500">
                  {new Date(ticket.created_at).toLocaleDateString()}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

