import { BuilderHeader } from '@/components/builder';

interface BuilderLayoutProps {
  children: React.ReactNode;
}

export default function BuilderLayout({
  children,
}: BuilderLayoutProps): JSX.Element {
  return (
    <div className="relative min-h-screen bg-surface-950">
      {/* Subtle background gradient */}
      <div className="pointer-events-none fixed inset-0 bg-gradient-to-br from-gold-500/[0.02] via-transparent to-transparent" />

      {/* Grain texture */}
      <div className="grain pointer-events-none fixed inset-0" />

      <BuilderHeader />
      <main className="relative w-full">{children}</main>
    </div>
  );
}
