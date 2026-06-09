interface SkeletonCardProps {
  count?: number;
}

export function SkeletonCard({ count = 6 }: SkeletonCardProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className="bg-white rounded-xl shadow-sm border border-orange-50 p-4 animate-pulse"
        >
          <div className="flex items-center justify-between mb-3">
            <div className="h-5 w-16 bg-orange-100 rounded-full" />
            <div className="h-5 w-10 bg-gray-100 rounded-full" />
          </div>
          <div className="h-4 bg-gray-100 rounded mb-2 w-3/4" />
          <div className="h-4 bg-gray-100 rounded mb-3 w-1/2" />
          <div className="h-6 bg-orange-100 rounded mb-3 w-20" />
          <div className="h-3 bg-gray-100 rounded mb-2 w-2/3" />
          <div className="flex items-center gap-2 pt-2 border-t border-orange-50">
            <div className="w-6 h-6 bg-gray-100 rounded-full" />
            <div className="h-3 bg-gray-100 rounded w-16" />
          </div>
        </div>
      ))}
    </div>
  );
}

export function SkeletonList({ count = 5 }: SkeletonCardProps) {
  return (
    <div className="space-y-3">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="animate-pulse">
          <div className="h-4 bg-gray-100 rounded w-3/4 mb-2" />
          <div className="h-3 bg-gray-100 rounded w-1/2 mb-2" />
          <div className="h-3 bg-orange-100 rounded w-1/4" />
        </div>
      ))}
    </div>
  );
}

export function SkeletonDetail() {
  return (
    <div className="space-y-6 animate-pulse">
      <div className="bg-white rounded-xl shadow-sm border border-orange-50 p-6">
        <div className="h-7 bg-gray-200 rounded w-2/3 mb-4" />
        <div className="grid grid-cols-2 gap-4 mb-4">
          <div className="h-6 bg-orange-100 rounded-full w-20" />
          <div className="h-7 bg-orange-100 rounded w-24" />
        </div>
        <div className="flex flex-wrap gap-4 mb-4">
          <div className="h-4 bg-gray-100 rounded w-32" />
          <div className="h-4 bg-gray-100 rounded w-40" />
          <div className="h-4 bg-gray-100 rounded w-36" />
        </div>
        <div className="border-t border-orange-50 pt-4 space-y-2">
          <div className="h-4 bg-gray-100 rounded w-full" />
          <div className="h-4 bg-gray-100 rounded w-11/12" />
          <div className="h-4 bg-gray-100 rounded w-5/6" />
          <div className="h-4 bg-gray-100 rounded w-3/4" />
        </div>
      </div>
      <div className="bg-white rounded-xl shadow-sm border border-orange-50 p-6">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-orange-100 rounded-full" />
          <div className="flex-1 min-w-0 space-y-2">
            <div className="h-5 bg-gray-200 rounded w-1/3" />
            <div className="h-4 bg-gray-100 rounded w-1/4" />
          </div>
        </div>
      </div>
    </div>
  );
}
