export default function Skeleton({ className = '', variant = 'rect', count = 1 }) {
  const base = 'skeleton';

  const shapes = {
    rect: 'w-full h-4',
    circle: 'w-12 h-12 rounded-full',
    card: 'w-full h-48 rounded-2xl',
    avatar: 'w-10 h-10 rounded-full',
    title: 'w-3/4 h-6',
    text: 'w-full h-4',
    image: 'w-full aspect-square rounded-xl',
    button: 'w-24 h-10 rounded-xl',
  };

  return (
    <>
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className={`${base} ${shapes[variant]} ${className}`}
        />
      ))}
    </>
  );
}

// Pre-built skeleton layouts
export function ItemCardSkeleton() {
  return (
    <div className="glass-card p-4 space-y-4 animate-fade-in">
      <Skeleton variant="image" />
      <div className="space-y-2">
        <Skeleton variant="title" />
        <Skeleton variant="text" className="w-1/2" />
      </div>
      <div className="flex gap-2">
        <Skeleton variant="button" />
        <Skeleton variant="button" />
      </div>
    </div>
  );
}

export function ItemGridSkeleton({ count = 6 }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {Array.from({ length: count }).map((_, i) => (
        <ItemCardSkeleton key={i} />
      ))}
    </div>
  );
}

export function ProfileSkeleton() {
  return (
    <div className="glass-card p-8 space-y-6">
      <div className="flex items-center gap-4">
        <Skeleton variant="circle" className="w-20 h-20" />
        <div className="space-y-2 flex-1">
          <Skeleton variant="title" />
          <Skeleton variant="text" className="w-1/3" />
        </div>
      </div>
      <div className="grid grid-cols-3 gap-4">
        <Skeleton variant="card" className="h-24" />
        <Skeleton variant="card" className="h-24" />
        <Skeleton variant="card" className="h-24" />
      </div>
    </div>
  );
}
