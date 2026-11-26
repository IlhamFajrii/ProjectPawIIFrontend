import { Skeleton } from '../ui/Skeleton';

export function ListingGridSkeleton({ count = 6, className }: { count?: number; className: string }) {
  return (
    <div role="status" className={className}>
      <span className="sr-only">Memuat listing</span>
      {Array.from({ length: count }, (_, index) => (
        <div key={index} className="grid content-start gap-3">
          <Skeleton className="aspect-4/3 rounded-card" />
          <Skeleton className="h-4 w-1/3" />
          <Skeleton className="h-5" />
          <Skeleton className="h-5 w-2/3" />
        </div>
      ))}
    </div>
  );
}
