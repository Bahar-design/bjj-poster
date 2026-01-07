'use client';

import { RefreshCw } from 'lucide-react';
import { useTemplates } from '@/lib/hooks';
import { usePosterBuilderStore } from '@/lib/stores/poster-builder-store';
import { Button } from '@/components/ui/button';
import { TemplateSkeleton } from './template-skeleton';
import { TemplateCard } from './template-card';
import { TemplateGrid } from './template-grid';

export function TemplateSelector(): JSX.Element {
  const { data: templates, isLoading, isError, refetch } = useTemplates();
  const { selectedTemplateId, setTemplate } = usePosterBuilderStore();

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div>
          <h3 className="mb-4 text-lg font-semibold text-white">
            Recommended for you
          </h3>
          <TemplateGrid>
            <TemplateSkeleton count={3} />
          </TemplateGrid>
        </div>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <p className="mb-4 text-gray-400">Failed to load templates</p>
        <Button variant="outline" onClick={() => refetch()}>
          <RefreshCw className="mr-2 h-4 w-4" />
          Retry
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <p>Templates loaded</p>
    </div>
  );
}
