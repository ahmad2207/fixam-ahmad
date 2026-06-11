/* Homepage loading skeleton */
export default function HomeLoading() {
  return (
    <div className="min-h-screen bg-gray-100 animate-pulse">

      {/* Hero carousel placeholder */}
      <section className="py-3">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 lg:grid-cols-[1fr_210px] gap-3">
            <div className="h-[260px] sm:h-[340px] lg:h-[360px] bg-gray-200 rounded-2xl" />
            <div className="hidden lg:flex flex-col gap-3">
              <div className="flex-1 bg-gray-200 rounded-2xl" />
              <div className="flex-1 bg-gray-200 rounded-2xl" />
            </div>
          </div>
        </div>
      </section>

      {/* Category strip */}
      <section className="bg-white shadow-sm mt-3 py-5">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between mb-4">
            <div className="h-5 w-40 bg-gray-200 rounded-full" />
            <div className="h-4 w-20 bg-gray-200 rounded-full" />
          </div>
          <div className="grid grid-cols-4 sm:flex sm:flex-wrap gap-2 sm:gap-3 justify-center">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="flex flex-col overflow-hidden rounded-xl border-2 border-gray-100 sm:w-[110px]">
                <div className="bg-gray-200" style={{ height: '76px' }} />
                <div className="bg-white px-2 py-2.5"><div className="h-3 bg-gray-200 rounded-full mx-auto w-3/4" /></div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Flash deals */}
      <section className="bg-white shadow-sm mt-3 py-4">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between mb-4 pb-3 border-b border-gray-100">
            <div className="h-5 w-32 bg-gray-200 rounded-full" />
            <div className="h-4 w-16 bg-gray-200 rounded-full" />
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="bg-white rounded-xl overflow-hidden border border-gray-100">
                <div className="h-36 sm:h-44 bg-gray-200" />
                <div className="p-3 space-y-2">
                  <div className="h-3 bg-gray-200 rounded-full" />
                  <div className="h-3 bg-gray-200 rounded-full w-2/3" />
                  <div className="h-4 bg-gray-200 rounded-full w-1/2" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Promo banners */}
      <section className="mt-3">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-[170px] sm:h-[190px] bg-gray-200 rounded-2xl" />
            ))}
          </div>
        </div>
      </section>

    </div>
  );
}
