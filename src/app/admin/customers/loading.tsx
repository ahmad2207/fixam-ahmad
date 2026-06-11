/* Customers page loading skeleton */
export default function CustomersLoading() {
  return (
    <div className="animate-pulse">
      <div className="h-7 w-32 bg-gray-200 rounded-full mb-6" />

      {/* Stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="bg-white border rounded-xl p-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-gray-200 flex-shrink-0" />
            <div>
              <div className="h-3 w-24 bg-gray-200 rounded-full mb-2" />
              <div className="h-6 w-16 bg-gray-200 rounded-full" />
            </div>
          </div>
        ))}
      </div>

      {/* Toolbar */}
      <div className="flex gap-3 mb-4">
        <div className="flex-1 h-9 bg-gray-200 rounded-lg" />
        <div className="w-28 h-9 bg-gray-200 rounded-lg" />
      </div>

      {/* Table */}
      <div className="bg-white border rounded-xl overflow-hidden">
        <div className="bg-gray-50 border-b px-4 py-3 flex gap-4">
          {[140, 100, 80, 80, 80, 60].map((w, i) => (
            <div key={i} className={`h-3 bg-gray-200 rounded-full`} style={{ width: w }} />
          ))}
        </div>
        <div className="divide-y">
          {Array.from({ length: 10 }).map((_, i) => (
            <div key={i} className="flex items-center gap-4 px-4 py-3">
              <div className="h-3 w-36 bg-gray-200 rounded-full" />
              <div className="h-3 w-24 bg-gray-100 rounded-full" />
              <div className="h-3 w-20 bg-gray-100 rounded-full" />
              <div className="h-3 w-8 bg-gray-100 rounded-full" />
              <div className="h-3 w-20 bg-gray-200 rounded-full" />
              <div className="h-3 w-16 bg-gray-100 rounded-full" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
