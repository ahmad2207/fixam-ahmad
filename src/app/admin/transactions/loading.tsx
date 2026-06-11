/* Transactions page loading skeleton */
export default function TransactionsLoading() {
  return (
    <div className="animate-pulse">
      <div className="h-7 w-36 bg-gray-200 rounded-full mb-6" />

      {/* Toolbar */}
      <div className="flex gap-3 mb-4">
        <div className="flex-1 h-9 bg-gray-200 rounded-lg" />
        <div className="w-28 h-9 bg-gray-200 rounded-lg" />
        <div className="w-28 h-9 bg-gray-200 rounded-lg" />
      </div>

      {/* Table */}
      <div className="bg-white border rounded-xl overflow-hidden">
        <div className="bg-gray-50 border-b px-4 py-3 flex gap-4">
          {[120, 180, 80, 80, 80, 80].map((w, i) => (
            <div key={i} className="h-3 bg-gray-200 rounded-full" style={{ width: w }} />
          ))}
        </div>
        <div className="divide-y">
          {Array.from({ length: 12 }).map((_, i) => (
            <div key={i} className="flex items-center gap-4 px-4 py-3.5">
              <div className="h-3 w-28 bg-gray-200 rounded-full" />
              <div className="h-3 w-44 bg-gray-100 rounded-full" />
              <div className="h-3 w-20 bg-gray-100 rounded-full" />
              <div className="h-3 w-16 bg-gray-200 rounded-full" />
              <div className="h-5 w-16 bg-gray-100 rounded-full" />
              <div className="h-3 w-20 bg-gray-100 rounded-full" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
