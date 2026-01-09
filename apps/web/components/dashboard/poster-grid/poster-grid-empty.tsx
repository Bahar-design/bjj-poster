import Link from 'next/link';
import { FileImage } from 'lucide-react';
import { Button } from '@/components/ui/button';

export function PosterGridEmpty(): JSX.Element {
  return (
    <div className="flex min-h-[400px] flex-col items-center justify-center rounded-xl border-2 border-dashed border-surface-700 bg-surface-900/30 p-8">
      <FileImage
        data-testid="empty-icon"
        className="mb-4 h-16 w-16 text-surface-600"
        aria-hidden="true"
      />

      <h3 className="mb-2 font-display text-xl tracking-wide text-white">
        No posters yet
      </h3>

      <p className="mb-6 text-center text-sm text-surface-500">
        Create your first tournament poster!
      </p>

      <Button asChild>
        <Link href="/builder">Create Poster</Link>
      </Button>
    </div>
  );
}
