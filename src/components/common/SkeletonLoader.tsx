import React from 'react';

interface SkeletonProps {
  className?: string;
}

export const Skeleton: React.FC<SkeletonProps> = ({ className }) => {
  return (
    <div className={`animate-pulse bg-gray-200 rounded-md ${className}`}></div>
  );
};

export const ProductCardSkeleton: React.FC = () => {
  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden flex flex-col h-full animate-pulse">
      <Skeleton className="w-full aspect-[4/5] rounded-none" />
      <div className="p-4 flex flex-col gap-2 flex-grow">
        <Skeleton className="h-4 w-1/3 mb-1" />
        <Skeleton className="h-5 w-3/4 mb-1" />
        <div className="flex items-center justify-between mt-auto pt-2">
          <Skeleton className="h-6 w-1/4" />
          <Skeleton className="h-8 w-8 rounded-full" />
        </div>
      </div>
    </div>
  );
};

export const OrderCardSkeleton: React.FC = () => {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 mb-4 animate-pulse">
      <div className="flex justify-between items-center mb-4 pb-4 border-b border-gray-100">
        <div>
          <Skeleton className="h-4 w-24 mb-2" />
          <Skeleton className="h-3 w-32" />
        </div>
        <Skeleton className="h-6 w-20 rounded-full" />
      </div>
      <div className="flex items-center gap-4">
        <Skeleton className="h-20 w-20 rounded-md" />
        <div className="flex-1">
          <Skeleton className="h-5 w-1/2 mb-2" />
          <Skeleton className="h-4 w-1/4 mb-1" />
          <Skeleton className="h-4 w-1/3" />
        </div>
      </div>
    </div>
  );
};

export const ProfileSkeleton: React.FC = () => {
  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 animate-pulse">
      <div className="flex items-center gap-6 mb-8">
        <Skeleton className="h-24 w-24 rounded-full" />
        <div>
          <Skeleton className="h-8 w-48 mb-2" />
          <Skeleton className="h-4 w-32" />
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {[1, 2, 3, 4].map((i) => (
          <div key={i}>
            <Skeleton className="h-4 w-24 mb-2" />
            <Skeleton className="h-10 w-full rounded-lg" />
          </div>
        ))}
      </div>
    </div>
  );
};

export const ProductGridSkeleton: React.FC<{ count?: number }> = ({ count = 8 }) => {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
      {Array.from({ length: count }).map((_, i) => (
        <ProductCardSkeleton key={i} />
      ))}
    </div>
  );
};
