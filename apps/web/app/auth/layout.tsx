'use client';

import Link from 'next/link';
import { Trophy } from 'lucide-react';
import type { JSX } from 'react';
import { motion } from 'framer-motion';
import { easings } from '@/lib/animations';

export default function AuthLayout({ children }: { children: React.ReactNode }): JSX.Element {
  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center bg-surface-950 px-4 py-12">
      {/* Background effects */}
      <div className="pointer-events-none absolute inset-0 bg-hero-glow opacity-50" />
      <div className="pointer-events-none absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIzMDAiIGhlaWdodD0iMzAwIj48ZmlsdGVyIGlkPSJhIiB4PSIwIiB5PSIwIj48ZmVUdXJidWxlbmNlIGJhc2VGcmVxdWVuY3k9Ii43NSIgc3RpdGNoVGlsZXM9InN0aXRjaCIgdHlwZT0iZnJhY3RhbE5vaXNlIi8+PC9maWx0ZXI+PHJlY3Qgd2lkdGg9IjMwMCIgaGVpZ2h0PSIzMDAiIGZpbHRlcj0idXJsKCNhKSIgb3BhY2l0eT0iMC4wNCIvPjwvc3ZnPg==')] opacity-60" />

      {/* Animated mat red corner glow */}
      <motion.div
        animate={{
          opacity: [0.03, 0.06, 0.03],
        }}
        transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut' }}
        className="pointer-events-none absolute -bottom-20 -left-20 h-[400px] w-[400px] rounded-full bg-mat-500/10 blur-[100px]"
      />

      {/* Animated gold spotlight */}
      <motion.div
        animate={{
          scale: [1, 1.1, 1],
          opacity: [0.05, 0.08, 0.05],
        }}
        transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut' }}
        className="pointer-events-none absolute left-1/4 top-1/4 h-96 w-96 rounded-full bg-gold-500/5 blur-[120px]"
      />
      <motion.div
        animate={{
          scale: [1, 1.15, 1],
          opacity: [0.05, 0.1, 0.05],
        }}
        transition={{ duration: 10, repeat: Infinity, ease: 'easeInOut', delay: 2 }}
        className="pointer-events-none absolute bottom-1/4 right-1/4 h-64 w-64 rounded-full bg-gold-500/5 blur-[100px]"
      />

      {/* Decorative diagonal belt stripe - subtle */}
      <motion.div
        initial={{ opacity: 0, x: 100 }}
        animate={{ opacity: 0.15, x: 0 }}
        transition={{ duration: 1.5, delay: 0.5 }}
        className="pointer-events-none absolute -right-10 top-1/3 h-[200px] w-[600px] -rotate-45 bg-gradient-to-r from-transparent via-surface-800 to-transparent"
      />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: easings.easeOut }}
        className="relative z-10 w-full max-w-md"
      >
        {/* Logo */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5, delay: 0.1, ease: easings.elastic }}
          className="mb-8 text-center"
        >
          <Link href="/" className="inline-flex items-center gap-3 transition-opacity hover:opacity-80">
            <motion.div
              whileHover={{ scale: 1.05, rotate: 5 }}
              whileTap={{ scale: 0.95 }}
              className="flex h-12 w-12 items-center justify-center rounded-xl bg-gold-500 shadow-lg shadow-gold-500/20"
            >
              <Trophy className="h-6 w-6 text-surface-950" />
            </motion.div>
            <span className="font-display text-3xl tracking-wider text-white">
              BJJ POSTER
            </span>
          </Link>
        </motion.div>

        {/* Card */}
        <motion.div
          initial={{ opacity: 0, y: 30, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.6, delay: 0.2, ease: easings.easeOut }}
          className="overflow-hidden rounded-2xl border border-surface-800 bg-surface-900/80 p-8 shadow-2xl shadow-black/40 backdrop-blur-xl"
        >
          {/* Gold accent line */}
          <motion.div
            initial={{ scaleX: 0 }}
            animate={{ scaleX: 1 }}
            transition={{ duration: 0.8, delay: 0.4, ease: easings.easeOut }}
            className="absolute left-0 right-0 top-0 h-px origin-left bg-gradient-to-r from-transparent via-gold-500/50 to-transparent"
          />
          {children}
        </motion.div>

        {/* Footer text */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.5 }}
          className="mt-8 text-center text-sm text-surface-500"
        >
          By continuing, you agree to our{' '}
          <Link href="#" className="text-gold-500 transition-colors hover:text-gold-400">
            Terms of Service
          </Link>{' '}
          and{' '}
          <Link href="#" className="text-gold-500 transition-colors hover:text-gold-400">
            Privacy Policy
          </Link>
        </motion.p>
      </motion.div>
    </div>
  );
}
