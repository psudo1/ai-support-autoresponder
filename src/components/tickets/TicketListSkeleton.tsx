import Skeleton from '../ui/Skeleton';

export default function TicketListSkeleton() {
  return (
    <div className="space-y-3">
      {Array.from({ length: 5 }).map((_, i) => (
        <div key={i} className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="flex items-start justify-between">
            <div className="flex-1 space-y-3">
              <div className="flex items-center gap-3">
                <Skeleton variant="text" width="120px" height="20px" />
                <Skeleton variant="circular" width={20} height={20} />
                <Skeleton variant="text" width="80px" height="20px" />
              </div>
              <Skeleton variant="text" width="100%" height="16px" lines={2} />
              <div className="flex items-center gap-4">
                <Skeleton variant="text" width="100px" height="14px" />
                <Skeleton variant="text" width="80px" height="14px" />
              </div>
            </div>
            <Skeleton variant="text" width="80px" height="14px" />
          </div>
        </div>
      ))}
    </div>
  );
}

