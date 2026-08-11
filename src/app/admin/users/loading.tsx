/* User Roles page loading skeleton */
export default function UsersLoading() {
  return (
    <div className="animate-pulse">
      <div className="h-7 w-28 bg-gray-200 rounded-full mb-6" />

      {/* Add admin row */}
      <div className="bg-white border rounded-xl p-4 mb-4">
        <div className="h-3 w-32 bg-gray-200 rounded-full mb-3" />
        <div className="flex gap-2">
          <div className="flex-1 h-9 bg-gray-200 rounded-lg" />
          <div className="w-28 h-9 bg-gray-200 rounded-lg" />
        </div>
      </div>

      {/* Search */}
      <div className="h-9 bg-gray-200 rounded-lg w-64 mb-4" />

      {/* Table */}
      <div className="bg-white border rounded-xl overflow-hidden">
        <div className="bg-gray-50 border-b px-4 py-3 flex gap-4">
          {[160, 200, 80, 80].map((w, i) => (
            <div key={i} className="h-3 bg-gray-200 rounded-full" style={{ width: w }} />
          ))}
        </div>
        <div className="divide-y">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="flex items-center gap-4 px-4 py-3">
              <div className="h-3 w-36 bg-gray-200 rounded-full" />
              <div className="h-3 w-44 bg-gray-100 rounded-full" />
              <div className="h-5 w-16 bg-gray-100 rounded-full" />
              <div className="h-7 w-24 bg-gray-200 rounded-lg" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
