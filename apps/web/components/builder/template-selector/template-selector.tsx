'use client';

import { useTemplates } from '@/lib/hooks';
import { usePosterBuilderStore } from '@/lib/stores/poster-builder-store';
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

  return (
    <div className="space-y-6">
      <p>Templates loaded</p>
    </div>
  );
}
