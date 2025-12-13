import ReviewDetail from '@/components/review/ReviewDetail';

interface ReviewDetailPageProps {
  params: Promise<{ id: string }>;
}

export default async function ReviewDetailPage({ params }: ReviewDetailPageProps) {
  const { id } = await params;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Review Response</h1>
        <p className="mt-1 text-sm text-gray-500">
          Review and approve this AI-generated response
        </p>
      </div>

      <ReviewDetail responseId={id} />
    </div>
  );
}

