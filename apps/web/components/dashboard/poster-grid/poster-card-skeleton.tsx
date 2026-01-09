import { Card, CardContent } from '@/components/ui/card';

export function PosterCardSkeleton(): JSX.Element {
  return (
    <Card
      data-testid="poster-card-skeleton"
      className="animate-pulse overflow-hidden"
    >
      {/* Thumbnail skeleton */}
      <div
        data-testid="skeleton-thumbnail"
        className="aspect-[3/4] bg-surface-800"
      />

      <CardContent className="p-4">
        {/* Title skeleton */}
        <div
          data-testid="skeleton-title"
          className="mb-2 h-6 w-3/4 rounded bg-surface-800"
        />

        {/* Subtitle skeleton */}
        <div
          data-testid="skeleton-subtitle"
          className="mb-3 h-4 w-1/2 rounded bg-surface-800"
        />

        {/* Action buttons skeleton */}
        <div data-testid="skeleton-actions" className="flex gap-2">
          <div className="h-8 w-8 rounded bg-surface-800" />
          <div className="h-8 w-8 rounded bg-surface-800" />
          <div className="h-8 w-8 rounded bg-surface-800" />
        </div>
      </CardContent>
    </Card>
  );
}
