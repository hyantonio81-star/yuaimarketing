/** Skeleton for Tienda list — 6 cards */
export default function TiendaSkeleton() {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
      {[1, 2, 3, 4, 5, 6].map((i) => (
        <div key={i} className="rounded-2xl border border-slate-700 bg-slate-800/50 overflow-hidden animate-pulse">
          <div className="aspect-[4/3] bg-slate-700" />
          <div className="p-4 space-y-2">
            <div className="h-4 bg-slate-600 rounded w-3/4" />
            <div className="h-4 bg-slate-600 rounded w-1/3" />
            <div className="h-3 bg-slate-600/80 rounded w-1/2" />
            <div className="h-3 bg-slate-600/80 rounded w-1/4 mt-2" />
          </div>
        </div>
      ))}
    </div>
  );
}
