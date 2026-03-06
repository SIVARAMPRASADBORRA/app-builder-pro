const SkeletonLoader = () => {
  return (
    <div className="space-y-6 animate-fade-in">
      <div className="text-center mb-8">
        <p className="text-lg font-medium text-muted-foreground animate-pulse-soft">
          ✨ Crafting your itinerary…
        </p>
      </div>
      {[1, 2, 3].map((i) => (
        <div
          key={i}
          className="rounded-2xl border bg-card p-6 space-y-4 animate-slide-up"
          style={{ animationDelay: `${i * 150}ms`, animationFillMode: "both" }}
        >
          <div className="h-5 w-40 rounded-md bg-muted animate-pulse" />
          <div className="space-y-3">
            {[1, 2, 3].map((j) => (
              <div key={j} className="flex gap-4">
                <div className="h-4 w-16 rounded bg-muted animate-pulse" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 w-3/4 rounded bg-muted animate-pulse" />
                  <div className="h-3 w-1/2 rounded bg-muted animate-pulse" />
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
};

export default SkeletonLoader;
