/* Admin dashboard loading skeleton */
export default function AdminDashboardLoading() {
  return (
    <div className="animate-pulse">
      {/* KPI cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="bg-white border rounded-xl p-4">
            <div className="h-3 w-24 bg-gray-200 rounded-full mb-3" />
            <div className="h-7 w-32 bg-gray-200 rounded-full mb-1" />
            <div className="h-3 w-20 bg-gray-100 rounded-full" />
          </div>
        ))}
      </div>

      {/* Mini metrics */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="bg-white border rounded-xl p-3 flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-gray-200 flex-shrink-0" />
            <div className="flex-1">
              <div className="h-3 w-16 bg-gray-200 rounded-full mb-1.5" />
              <div className="h-5 w-10 bg-gray-200 rounded-full" />
            </div>
          </div>
        ))}
      </div>

      {/* Charts row */}
      <div className="grid lg:grid-cols-3 gap-4 mb-6">
        <div className="lg:col-span-2 bg-white border rounded-xl p-4">
          <div className="h-4 w-28 bg-gray-200 rounded-full mb-4" />
          <div className="h-[200px] bg-gray-100 rounded-lg" />
        </div>
        <div className="bg-white border rounded-xl p-4">
          <div className="h-4 w-28 bg-gray-200 rounded-full mb-4" />
          <div className="h-[200px] bg-gray-100 rounded-lg" />
        </div>
      </div>

      {/* Low stock + recent orders */}
      <div className="grid lg:grid-cols-3 gap-4">
        <div className="bg-white border rounded-xl p-4">
          <div className="h-4 w-24 bg-gray-200 rounded-full mb-4" />
          <div className="space-y-3">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gray-200 rounded-lg flex-shrink-0" />
                <div className="flex-1">
                  <div className="h-3 w-32 bg-gray-200 rounded-full mb-1.5" />
                  <div className="h-2.5 w-16 bg-gray-100 rounded-full" />
                </div>
              </div>
            ))}
          </div>
        </div>
        <div className="lg:col-span-2 bg-white border rounded-xl overflow-hidden">
          <div className="px-4 py-3 border-b">
            <div className="h-4 w-28 bg-gray-200 rounded-full" />
          </div>
          <div className="divide-y">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="flex items-center gap-3 px-4 py-3">
                <div className="h-3 w-20 bg-gray-200 rounded-full" />
                <div className="flex-1 h-3 bg-gray-100 rounded-full" />
                <div className="h-3 w-16 bg-gray-200 rounded-full" />
                <div className="h-5 w-16 bg-gray-100 rounded-full" />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
