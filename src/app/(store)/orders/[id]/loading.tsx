/* Order detail loading skeleton */
export default function OrderDetailLoading() {
  return (
    <div className="min-h-screen bg-gray-100 pb-8 animate-pulse">
      <div className="bg-white border-b border-gray-200">
        <div className="container mx-auto px-4 py-2.5 flex gap-2">
          {[40, 8, 60, 8, 80].map((w, i) => (
            <div key={i} className={`h-3 bg-gray-200 rounded-full`} style={{ width: w }} />
          ))}
        </div>
      </div>

      <div className="container mx-auto px-4 py-4 max-w-2xl space-y-3">

        {/* Status hero */}
        <div className="h-[160px] bg-white rounded-2xl shadow-sm" />

        {/* Order info + progress */}
        <div className="bg-white rounded-2xl shadow-sm p-5 space-y-5">
          <div className="flex items-start justify-between">
            <div className="space-y-2">
              <div className="h-3 w-24 bg-gray-200 rounded-full" />
              <div className="h-6 w-40 bg-gray-200 rounded-full" />
              <div className="h-3 w-32 bg-gray-200 rounded-full" />
            </div>
            <div className="flex flex-col gap-2 items-end">
              <div className="h-6 w-24 bg-gray-200 rounded-full" />
              <div className="h-6 w-28 bg-gray-200 rounded-full" />
            </div>
          </div>
          {/* Progress track */}
          <div className="flex items-start justify-between pt-2">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="flex flex-col items-center gap-2 flex-1">
                <div className="w-7 h-7 rounded-full bg-gray-200" />
                <div className="h-2 w-10 bg-gray-200 rounded-full" />
              </div>
            ))}
          </div>
        </div>

        {/* Items */}
        <div className="bg-white rounded-2xl shadow-sm p-5">
          <div className="h-5 w-24 bg-gray-200 rounded-full mb-4" />
          <div className="space-y-4">
            {[1, 2].map((i) => (
              <div key={i} className="flex gap-3">
                <div className="w-16 h-16 bg-gray-200 rounded-xl flex-shrink-0" />
                <div className="flex-1 space-y-2">
                  <div className="h-3 bg-gray-200 rounded-full w-4/5" />
                  <div className="h-3 bg-gray-200 rounded-full w-1/2" />
                  <div className="h-3 bg-gray-200 rounded-full w-1/4" />
                </div>
                <div className="h-4 w-20 bg-gray-200 rounded-full flex-shrink-0" />
              </div>
            ))}
          </div>
          <div className="mt-5 pt-4 border-t border-gray-100 space-y-2">
            {[1, 2].map((i) => (
              <div key={i} className="flex justify-between">
                <div className="h-3 w-20 bg-gray-200 rounded-full" />
                <div className="h-3 w-24 bg-gray-200 rounded-full" />
              </div>
            ))}
            <div className="flex justify-between pt-2 border-t border-gray-100">
              <div className="h-5 w-12 bg-gray-200 rounded-full" />
              <div className="h-7 w-32 bg-gray-200 rounded-full" />
            </div>
          </div>
        </div>

        {/* Address */}
        <div className="bg-white rounded-2xl shadow-sm p-5 space-y-3">
          <div className="h-5 w-36 bg-gray-200 rounded-full" />
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-3 bg-gray-200 rounded-full" style={{ width: `${60 - i * 8}%` }} />
          ))}
        </div>

      </div>
    </div>
  );
}
