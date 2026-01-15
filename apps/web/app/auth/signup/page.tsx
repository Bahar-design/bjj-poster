'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { AlertCircle, Sparkles } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

import { AuthForm } from '@/components/auth/auth-form';
import type { SignupFormData } from '@/lib/validations/auth';
import { easings } from '@/lib/animations';

export default function SignupPage(): JSX.Element {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (data: SignupFormData): Promise<void> => {
    setError(null);
    try {
      // Mock delay to simulate API call
      await new Promise((resolve) => setTimeout(resolve, 1500));

      // TODO: Implement actual signup logic
      void data; // Suppress unused variable warning until real implementation

      router.push('/builder');
    } catch (err) {
      setError('Signup failed. Please try again later.');
      if (process.env.NODE_ENV === 'development') {
        console.error('Signup error:', err instanceof Error ? err.message : 'Unknown error');
      }
    }
  };

  return (
    <>
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: easings.easeOut }}
        className="mb-8 text-center"
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.4, delay: 0.1, ease: easings.elastic }}
          className="mb-4 inline-flex items-center gap-2 rounded-full border border-gold-500/30 bg-gold-500/10 px-3 py-1"
        >
          <motion.div
            animate={{ rotate: [0, 15, -15, 0] }}
            transition={{ duration: 2, repeat: Infinity, repeatDelay: 3 }}
          >
            <Sparkles className="h-3.5 w-3.5 text-gold-500" />
          </motion.div>
          <span className="text-xs font-medium text-gold-400">Free to start</span>
        </motion.div>

        <h1 className="font-display text-3xl tracking-wide text-white">
          CREATE ACCOUNT
        </h1>
        <p className="mt-2 text-surface-400">
          Start creating championship posters
        </p>
      </motion.div>

      <AnimatePresence mode="wait">
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -10, height: 0 }}
            animate={{ opacity: 1, y: 0, height: 'auto' }}
            exit={{ opacity: 0, y: -10, height: 0 }}
            transition={{ duration: 0.3, ease: easings.easeOut }}
            className="mb-6 flex items-center gap-3 rounded-lg border border-red-500/20 bg-red-500/10 p-4 text-sm text-red-400"
          >
            <AlertCircle className="h-5 w-5 shrink-0" />
            {error}
          </motion.div>
        )}
      </AnimatePresence>

      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.15, ease: easings.easeOut }}
      >
        <AuthForm mode="signup" onSubmit={handleSubmit} />
      </motion.div>
    </>
  );
}
