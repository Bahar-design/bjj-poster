'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { AlertCircle } from 'lucide-react';

import { AuthForm } from '@/components/auth/auth-form';
import type { LoginFormData } from '@/lib/validations/auth';

export default function LoginPage(): JSX.Element {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (data: LoginFormData): Promise<void> => {
    setError(null);
    try {
      // Mock delay to simulate API call
      await new Promise((resolve) => setTimeout(resolve, 1500));

      // TODO: Implement actual login logic
      void data; // Suppress unused variable warning until real implementation

      router.push('/builder');
    } catch (err) {
      setError('Login failed. Please check your credentials and try again.');
      if (process.env.NODE_ENV === 'development') {
        console.error('Login error:', err instanceof Error ? err.message : 'Unknown error');
      }
    }
  };

  return (
    <>
      <div className="mb-8 text-center">
        <h1 className="font-display text-3xl tracking-wide text-white">
          WELCOME BACK
        </h1>
        <p className="mt-2 text-surface-400">
          Sign in to continue creating
        </p>
      </div>

      {error && (
        <div className="mb-6 flex items-center gap-3 rounded-lg border border-red-500/20 bg-red-500/10 p-4 text-sm text-red-400">
          <AlertCircle className="h-5 w-5 shrink-0" />
          {error}
        </div>
      )}

      <AuthForm mode="login" onSubmit={handleSubmit} />
    </>
  );
}
