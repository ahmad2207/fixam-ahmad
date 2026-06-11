/* Receipts page loading skeleton */
export default function ReceiptsLoading() {
  return (
    <div className="animate-pulse">
      <div className="flex items-center justify-between mb-6">
        <div className="h-7 w-24 bg-gray-200 rounded-full" />
        <div className="h-9 w-32 bg-gray-200 rounded-lg" />
      </div>

      {/* Toolbar */}
      <div className="flex gap-3 mb-4">
        <div className="flex-1 h-9 bg-gray-200 rounded-lg" />
        <div className="flex gap-1.5">
          {[48, 56, 48, 48].map((w, i) => (
            <div key={i} className="h-9 bg-gray-200 rounded-lg" style={{ width: w }} />
          ))}
        </div>
        <div className="w-28 h-9 bg-gray-200 rounded-lg" />
      </div>

      {/* Table */}
      <div className="bg-white border rounded-xl overflow-hidden">
        <div className="bg-gray-50 border-b px-4 py-3 flex gap-4">
          {[100, 160, 60, 40, 80, 60, 80, 40].map((w, i) => (
            <div key={i} className="h-3 bg-gray-200 rounded-full" style={{ width: w }} />
          ))}
        </div>
        <div className="divide-y">
          {Array.from({ length: 10 }).map((_, i) => (
            <div key={i} className="flex items-center gap-4 px-4 py-3">
              <div className="h-3 w-24 bg-gray-200 rounded-full font-mono" />
              <div className="h-3 w-36 bg-gray-100 rounded-full" />
              <div className="h-5 w-14 bg-gray-100 rounded-full" />
              <div className="h-3 w-6 bg-gray-100 rounded-full" />
              <div className="h-3 w-20 bg-gray-200 rounded-full" />
              <div className="h-5 w-14 bg-gray-100 rounded-full" />
              <div className="h-3 w-20 bg-gray-100 rounded-full" />
              <div className="h-3 w-8 bg-gray-200 rounded-full" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
