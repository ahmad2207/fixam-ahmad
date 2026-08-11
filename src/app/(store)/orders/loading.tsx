/* Orders list loading skeleton */
export default function OrdersLoading() {
  return (
    <div className="min-h-screen bg-gray-100 animate-pulse">
      <div className="bg-white border-b border-gray-200">
        <div className="container mx-auto px-4 lg:px-12 py-2.5 flex gap-2">
          <div className="h-3 w-12 bg-gray-200 rounded-full" />
          <div className="h-3 w-2 bg-gray-200 rounded-full" />
          <div className="h-3 w-20 bg-gray-200 rounded-full" />
        </div>
      </div>

      <div className="container mx-auto px-4 lg:px-12 py-4 max-w-3xl">
        <div className="h-6 w-32 bg-gray-200 rounded-full mb-4" />
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="bg-white rounded-2xl shadow-sm overflow-hidden">
              <div className="flex items-center justify-between px-4 py-3 bg-gray-50 border-b border-gray-100">
                <div className="space-y-1.5">
                  <div className="h-4 w-32 bg-gray-200 rounded-full" />
                  <div className="h-3 w-24 bg-gray-200 rounded-full" />
                </div>
                <div className="flex gap-2">
                  <div className="h-6 w-20 bg-gray-200 rounded-full" />
                  <div className="h-6 w-20 bg-gray-200 rounded-full" />
                </div>
              </div>
              <div className="flex items-center gap-4 px-4 py-3">
                <div className="flex -space-x-2">
                  {[1, 2, 3].map((j) => (
                    <div key={j} className="w-11 h-11 rounded-xl bg-gray-200 border-2 border-white" />
                  ))}
                </div>
                <div className="flex-1 space-y-1.5">
                  <div className="h-3 w-16 bg-gray-200 rounded-full" />
                  <div className="h-5 w-28 bg-gray-200 rounded-full" />
                </div>
                <div className="w-5 h-5 bg-gray-200 rounded-full" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
