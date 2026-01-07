'use client';

import { useRouter } from 'next/navigation';

import { AuthForm } from '@/components/auth/auth-form';
import type { LoginFormData } from '@/lib/validations/auth';

export default function LoginPage() {
  const router = useRouter();

  const handleSubmit = async (data: LoginFormData): Promise<void> => {
    try {
      // Mock delay to simulate API call
      await new Promise((resolve) => setTimeout(resolve, 1500));

      // TODO: Implement actual login logic
      console.log('Login attempt for:', data.email);

      router.push('/');
    } catch (error) {
      // TODO: Display error message to user
      console.error('Login failed:', error);
    }
  };

  return (
    <>
      <div className="mb-6 text-center">
        <h1 className="font-display text-2xl text-white">Welcome back</h1>
        <p className="mt-2 font-body text-sm text-primary-300">
          Sign in to your account
        </p>
      </div>
      <AuthForm mode="login" onSubmit={handleSubmit} />
    </>
  );
}
