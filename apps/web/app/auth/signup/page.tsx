'use client';

import { useRouter } from 'next/navigation';

import { AuthForm } from '@/components/auth/auth-form';
import type { SignupFormData } from '@/lib/validations/auth';

export default function SignupPage() {
  const router = useRouter();

  const handleSubmit = async (data: SignupFormData): Promise<void> => {
    // Mock delay to simulate API call
    await new Promise((resolve) => setTimeout(resolve, 1500));

    // TODO: Implement actual signup logic
    console.log('Signup data:', data);

    router.push('/');
  };

  return (
    <>
      <div className="mb-6 text-center">
        <h1 className="font-display text-2xl text-white">Create your account</h1>
        <p className="mt-2 font-body text-sm text-primary-300">
          Start creating tournament posters
        </p>
      </div>
      <AuthForm mode="signup" onSubmit={handleSubmit} />
    </>
  );
}
