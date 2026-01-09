import Link from 'next/link';
import { Trophy } from 'lucide-react';
import type { JSX } from 'react';

export default function AuthLayout({ children }: { children: React.ReactNode }): JSX.Element {
  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center bg-surface-950 px-4 py-12">
      {/* Background effects */}
      <div className="pointer-events-none absolute inset-0 bg-hero-glow opacity-50" />
      <div className="grain pointer-events-none absolute inset-0" />

      {/* Decorative elements */}
      <div className="pointer-events-none absolute left-1/4 top-1/4 h-96 w-96 rounded-full bg-gold-500/5 blur-[120px]" />
      <div className="pointer-events-none absolute bottom-1/4 right-1/4 h-64 w-64 rounded-full bg-gold-500/5 blur-[100px]" />

      <div className="relative z-10 w-full max-w-md">
        {/* Logo */}
        <div className="mb-8 text-center">
          <Link href="/" className="inline-flex items-center gap-3 transition-opacity hover:opacity-80">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gold-500 shadow-lg shadow-gold-500/20">
              <Trophy className="h-6 w-6 text-surface-950" />
            </div>
            <span className="font-display text-3xl tracking-wider text-white">
              BJJ POSTER
            </span>
          </Link>
        </div>

        {/* Card */}
        <div className="overflow-hidden rounded-2xl border border-surface-800 bg-surface-900/80 p-8 shadow-2xl shadow-black/40 backdrop-blur-xl">
          {/* Gold accent line */}
          <div className="absolute left-0 right-0 top-0 h-px bg-gradient-to-r from-transparent via-gold-500/50 to-transparent" />
          {children}
        </div>

        {/* Footer text */}
        <p className="mt-8 text-center text-sm text-surface-500">
          By continuing, you agree to our{' '}
          <Link href="#" className="text-gold-500 transition-colors hover:text-gold-400">
            Terms of Service
          </Link>{' '}
          and{' '}
          <Link href="#" className="text-gold-500 transition-colors hover:text-gold-400">
            Privacy Policy
          </Link>
        </p>
      </div>
    </div>
  );
}
