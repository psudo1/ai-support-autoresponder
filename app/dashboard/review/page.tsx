import ReviewQueue from '@/components/review/ReviewQueue';

export default function ReviewQueuePage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Review Queue</h1>
        <p className="mt-1 text-sm text-gray-500">
          Review and approve AI-generated responses before sending to customers
        </p>
      </div>

      <ReviewQueue />
    </div>
  );
}

