import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="text-center py-12">
      <h2 className="text-2xl font-bold text-gray-900 mb-4">Ticket Not Found</h2>
      <p className="text-gray-600 mb-6">
        The ticket you're looking for doesn't exist or has been deleted.
      </p>
      <Link
        href="/dashboard/tickets"
        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
      >
        Back to Tickets
      </Link>
    </div>
  );
}

