import Skeleton from '../ui/Skeleton';

export default function TicketDetailSkeleton() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="space-y-2">
        <Skeleton variant="text" width="60%" height="32px" />
        <Skeleton variant="text" width="40%" height="16px" />
      </div>

      {/* Ticket Info */}
      <div className="bg-white rounded-lg border border-gray-200 p-6 space-y-4">
        <Skeleton variant="text" width="30%" height="20px" />
        <Skeleton variant="text" width="100%" height="16px" lines={3} />
        <div className="flex gap-4">
          <Skeleton variant="text" width="100px" height="20px" />
          <Skeleton variant="text" width="100px" height="20px" />
        </div>
      </div>

      {/* Conversations */}
      <div className="bg-white rounded-lg border border-gray-200 p-6 space-y-4">
        <Skeleton variant="text" width="40%" height="24px" />
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="space-y-2">
            <Skeleton variant="text" width="20%" height="14px" />
            <Skeleton variant="text" width="100%" height="16px" lines={2} />
          </div>
        ))}
      </div>
    </div>
  );
}

