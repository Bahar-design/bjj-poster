'use client';

import Image from 'next/image';
import type { Template } from '@/lib/types/api';

interface TemplateCardProps {
  template: Template;
  isSelected: boolean;
  onSelect: (templateId: string) => void;
}

export function TemplateCard({
  template,
  isSelected,
  onSelect,
}: TemplateCardProps): JSX.Element {
  return (
    <button
      type="button"
      onClick={() => onSelect(template.id)}
      className="group w-full text-left"
    >
      <div className="relative aspect-[3/4] w-full overflow-hidden rounded-t-lg bg-gray-700">
        <Image
          src={template.thumbnailUrl}
          alt={template.name}
          fill
          className="object-cover"
        />
      </div>
      <div className="rounded-b-lg bg-gray-800 p-3">
        <p className="text-sm font-medium text-white">{template.name}</p>
      </div>
    </button>
  );
}
