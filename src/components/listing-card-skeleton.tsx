export default function ListingCardSkeleton() {
  return (
    <div className="bg-card rounded-2xl border border-border overflow-hidden shadow-sm">
      <div className="h-52 skeleton" />
      <div className="p-4 space-y-3">
        <div className="h-3 w-16 skeleton rounded-full" />
        <div className="h-5 w-full skeleton rounded-lg" />
        <div className="h-4 w-3/4 skeleton rounded-lg" />
        <div className="flex gap-4">
          <div className="h-3 w-14 skeleton rounded-full" />
          <div className="h-3 w-14 skeleton rounded-full" />
          <div className="h-3 w-14 skeleton rounded-full" />
        </div>
        <div className="h-10 w-full skeleton rounded-xl" />
      </div>
    </div>
  );
}

export function ListingGridSkeleton({ count = 6 }: { count?: number }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
      {Array.from({ length: count }).map((_, i) => (
        <ListingCardSkeleton key={i} />
      ))}
    </div>
  );
}
