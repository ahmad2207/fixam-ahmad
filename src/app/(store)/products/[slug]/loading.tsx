/* Product detail loading skeleton */
export default function ProductDetailLoading() {
  return (
    <div className="min-h-screen bg-gray-100 pb-8 animate-pulse">

      {/* Breadcrumb */}
      <div className="bg-white border-b border-gray-200">
        <div className="container mx-auto px-4 lg:px-12 py-2.5 flex items-center gap-2">
          {[80, 60, 120].map((w, i) => (
            <div key={i} className="flex items-center gap-2">
              {i > 0 && <div className="w-1 h-1 rounded-full bg-gray-200" />}
              <div className="h-3 bg-gray-200 rounded-full" style={{ width: w }} />
            </div>
          ))}
        </div>
      </div>

      <div className="container mx-auto px-4 lg:px-12 py-4">
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_460px] xl:grid-cols-[1fr_500px] gap-4">

          {/* Image gallery */}
          <div className="bg-white rounded-2xl p-4 space-y-3">
            <div className="aspect-square bg-gray-200 rounded-xl" />
            <div className="flex gap-2">
              {[1, 2, 3].map((i) => (
                <div key={i} className="w-16 h-16 bg-gray-200 rounded-lg flex-shrink-0" />
              ))}
            </div>
          </div>

          {/* Product info */}
          <div className="space-y-3">
            <div className="bg-white rounded-2xl p-5 space-y-3">
              <div className="h-4 bg-gray-200 rounded-full w-24" />
              <div className="h-7 bg-gray-200 rounded-full" />
              <div className="h-7 bg-gray-200 rounded-full w-4/5" />
              <div className="h-px bg-gray-100 my-2" />
              <div className="h-10 bg-gray-200 rounded-full w-2/5" />
              <div className="h-4 bg-gray-200 rounded-full w-32" />
            </div>
            <div className="bg-white rounded-2xl p-5 space-y-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-gray-200 rounded-lg flex-shrink-0" />
                  <div className="flex-1 space-y-1.5">
                    <div className="h-3 bg-gray-200 rounded-full w-32" />
                    <div className="h-3 bg-gray-200 rounded-full w-48" />
                  </div>
                </div>
              ))}
            </div>
            <div className="bg-white rounded-2xl p-5 space-y-4">
              <div className="flex items-center justify-between">
                <div className="h-8 w-28 bg-gray-200 rounded-xl" />
                <div className="h-8 w-32 bg-gray-200 rounded-xl" />
              </div>
              <div className="h-12 bg-gray-200 rounded-xl" />
              <div className="h-12 bg-gray-200 rounded-xl" />
            </div>
          </div>
        </div>

        {/* Tabs skeleton */}
        <div className="bg-white rounded-2xl shadow-sm mt-4 overflow-hidden">
          <div className="flex gap-1 px-5 py-4 border-b border-gray-100">
            {[100, 120, 140].map((w, i) => (
              <div key={i} className="h-4 bg-gray-200 rounded-full mr-4" style={{ width: w }} />
            ))}
          </div>
          <div className="p-5 space-y-3">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-3 bg-gray-200 rounded-full" style={{ width: `${100 - i * 8}%` }} />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
