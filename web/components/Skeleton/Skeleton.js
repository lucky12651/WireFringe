function Bone({ className = '', style }) {
  return (
    <div
      className={`block rounded-sm bg-[linear-gradient(90deg,var(--bg-secondary)_0%,var(--bg-elevated)_40%,var(--border)_50%,var(--bg-elevated)_60%,var(--bg-secondary)_100%)] bg-[length:200%_100%] animate-shimmer motion-reduce:animate-none motion-reduce:bg-bg-elevated ${className}`.trim()}
      style={style}
    />
  );
}

export function HomeSkeleton() {
  return (
    <div
      className="grid grid-cols-1 min-[1001px]:grid-cols-[minmax(0,1fr)_var(--stream-width,380px)] gap-0 min-h-[70vh] pt-6 pb-12 relative"
      aria-busy="true"
      aria-label="Loading homepage"
    >
      <div
        className="hidden min-[1001px]:block absolute top-0 bottom-0 right-[var(--stream-width,380px)] border-l border-dotted border-line pointer-events-none"
        aria-hidden="true"
      />
      <div className="min-w-0 pr-0 min-[1001px]:pr-9">
        <Bone className="w-full aspect-video mb-5 rounded-md" />
        <Bone className="h-7 w-[72%] mb-3" />
        <Bone className="h-[18px] w-[48%] mb-7" />
        <div className="grid grid-cols-1 max-md:grid-cols-1 md:grid-cols-2 gap-[18px] mb-9">
          {[0, 1, 2, 3].map((i) => (
            <div key={i} className="grid grid-cols-[100px_1fr] gap-3.5 items-start">
              <Bone className="w-[100px] h-[74px] rounded-sm" />
              <div>
                <Bone className="h-3.5 mb-2.5" style={{ width: '90%' }} />
                <Bone className="h-3 w-[60%] mb-2" />
                <Bone className="h-3 w-[40%] mb-2" />
              </div>
            </div>
          ))}
        </div>
        <Bone className="mb-5" style={{ width: '30%', height: 20 }} />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-[18px] mb-9">
          <Bone style={{ height: 220, borderRadius: 6 }} />
          <div>
            {[0, 1, 2].map((i) => (
              <div key={i} className="grid grid-cols-[1fr_72px] gap-3.5 items-start mb-4">
                <div className="flex-1">
                  <Bone className="h-3.5 mb-2.5" />
                  <Bone className="h-3 w-[60%] mb-2" />
                </div>
                <Bone className="w-[72px] h-[72px] rounded-sm" />
              </div>
            ))}
          </div>
        </div>
      </div>
      <div className="pl-0 mt-7 min-[1001px]:pl-[22px] min-[1001px]:mt-0">
        <Bone className="w-[180px] h-9 rounded-pill mx-auto mb-5" />
        {[0, 1, 2, 3, 4].map((i) => (
          <div
            key={i}
            className="grid grid-cols-[1fr_72px] gap-3 py-4 border-b border-dotted border-line"
          >
            <div>
              <Bone className="h-3 mb-3" style={{ width: '35%' }} />
              <Bone className="h-3.5 mb-2.5" />
              <Bone className="h-3" style={{ width: '80%' }} />
            </div>
            <Bone className="w-[72px] h-[72px] rounded-sm" />
          </div>
        ))}
      </div>
    </div>
  );
}

export function PostSkeleton() {
  return (
    <div className="max-w-[1120px] mx-auto pt-9 pb-16" aria-busy="true" aria-label="Loading article">
      <div className="max-w-[720px] mb-7">
        <Bone className="h-3 w-[40%] mb-[18px]" />
        <Bone className="h-[42px] w-[90%] mb-3" />
        <Bone className="h-[42px] w-[65%] mb-6" />
        <Bone className="h-10 w-[200px] rounded-pill mb-7" />
      </div>
      <div className="grid grid-cols-1 min-[1001px]:grid-cols-[minmax(0,1fr)_300px] gap-10">
        <div>
          <Bone className="w-full aspect-video mb-7 rounded-md" />
          {[92, 100, 88, 96, 70, 100, 85, 60].map((w, i) => (
            <Bone key={i} className="h-4 mb-3.5 max-w-[680px]" style={{ width: `${w}%` }} />
          ))}
        </div>
        <aside>
          <Bone className="h-[250px] mb-5 rounded-md" />
          <Bone className="h-[280px] rounded-md" />
        </aside>
      </div>
    </div>
  );
}

export default function Skeleton({ variant = 'home' }) {
  if (variant === 'post') return <PostSkeleton />;
  return <HomeSkeleton />;
}
