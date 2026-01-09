'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { AlertCircle, Sparkles } from 'lucide-react';

import { AuthForm } from '@/components/auth/auth-form';
import type { SignupFormData } from '@/lib/validations/auth';

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
      <div className="mb-8 text-center">
        <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-gold-500/30 bg-gold-500/10 px-3 py-1">
          <Sparkles className="h-3.5 w-3.5 text-gold-500" />
          <span className="text-xs font-medium text-gold-400">Free to start</span>
        </div>

        <h1 className="font-display text-3xl tracking-wide text-white">
          CREATE ACCOUNT
        </h1>
        <p className="mt-2 text-surface-400">
          Start creating championship posters
        </p>
      </div>

      {error && (
        <div className="mb-6 flex items-center gap-3 rounded-lg border border-red-500/20 bg-red-500/10 p-4 text-sm text-red-400">
          <AlertCircle className="h-5 w-5 shrink-0" />
          {error}
        </div>
      )}

      <AuthForm mode="signup" onSubmit={handleSubmit} />
    </>
  );
}
