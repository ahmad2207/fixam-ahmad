/* Inventory product detail loading skeleton */
export default function InventoryProductLoading() {
  return (
    <div className="animate-pulse">
      {/* Back link */}
      <div className="h-4 w-32 bg-gray-200 rounded-full mb-6" />

      {/* Product header */}
      <div className="bg-white border rounded-xl p-5 mb-6 flex items-center gap-4">
        <div className="w-16 h-16 rounded-xl bg-gray-200 flex-shrink-0" />
        <div className="flex-1">
          <div className="h-5 w-48 bg-gray-200 rounded-full mb-2" />
          <div className="h-3 w-32 bg-gray-100 rounded-full" />
        </div>
        <div className="text-right">
          <div className="h-4 w-20 bg-gray-200 rounded-full mb-1" />
          <div className="h-7 w-12 bg-gray-200 rounded-full" />
        </div>
      </div>

      {/* Add batch form placeholder */}
      <div className="bg-white border rounded-xl p-5 mb-6">
        <div className="h-4 w-28 bg-gray-200 rounded-full mb-4" />
        <div className="grid sm:grid-cols-3 gap-4 mb-4">
          {[1, 2, 3].map((i) => (
            <div key={i}>
              <div className="h-3 w-20 bg-gray-200 rounded-full mb-2" />
              <div className="h-9 bg-gray-200 rounded-lg" />
            </div>
          ))}
        </div>
        <div className="h-9 w-28 bg-gray-200 rounded-lg" />
      </div>

      {/* Batch history table */}
      <div className="bg-white border rounded-xl overflow-hidden">
        <div className="px-4 py-3 border-b">
          <div className="h-4 w-32 bg-gray-200 rounded-full" />
        </div>
        <div className="divide-y">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="flex items-center gap-4 px-4 py-3">
              <div className="h-3 w-8 bg-gray-200 rounded-full" />
              <div className="h-3 w-20 bg-gray-100 rounded-full" />
              <div className="h-3 w-24 bg-gray-100 rounded-full" />
              <div className="flex-1" />
              <div className="h-3 w-16 bg-gray-100 rounded-full" />
              <div className="h-5 w-20 bg-gray-100 rounded-full" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
