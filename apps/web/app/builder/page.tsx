import { Sparkles } from 'lucide-react';
import { PosterBuilderForm } from '@/components/builder';

export default function BuilderPage(): JSX.Element {
  return (
    <div className="px-4 py-8 md:px-8 md:py-12">
      {/* Page Header */}
      <div className="mb-10 max-w-2xl">
        <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-gold-500/30 bg-gold-500/10 px-3 py-1">
          <Sparkles className="h-3.5 w-3.5 text-gold-500" />
          <span className="text-xs font-medium text-gold-400">Poster Builder</span>
        </div>

        <h1 className="font-display text-4xl tracking-wide text-white md:text-5xl">
          CREATE YOUR POSTER
        </h1>
        <p className="mt-3 text-lg text-surface-400">
          Fill in your details, choose a template, and generate a professional tournament poster.
        </p>
      </div>

      {/* Form Container */}
      <div className="relative">
        <PosterBuilderForm />
      </div>
    </div>
  );
}
