import { SkeletonLoader } from '@/components/ui/skeleton-loader';

export const AulasListSkeleton = () => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      <SkeletonLoader variant="card" count={6} />
    </div>
  );
};
