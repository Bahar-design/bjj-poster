'use client';

import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { ArrowRight } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { PasswordInput } from './password-input';
import {
  loginSchema,
  signupSchema,
  type LoginFormData,
  type SignupFormData,
} from '@/lib/validations/auth';

type AuthFormProps =
  | { mode: 'login'; onSubmit: (data: LoginFormData) => Promise<void> }
  | { mode: 'signup'; onSubmit: (data: SignupFormData) => Promise<void> };

export function AuthForm({ mode, onSubmit }: AuthFormProps) {
  const schema = mode === 'login' ? loginSchema : signupSchema;
  type FormData = LoginFormData | SignupFormData;

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
  });

  const submitHandler = handleSubmit(async (data) => {
    await onSubmit(data);
  });

  return (
    <form onSubmit={submitHandler} className="space-y-5" role="form">
      <div className="space-y-2">
        <label
          htmlFor="email"
          className="block text-sm font-medium text-surface-300"
        >
          Email
        </label>
        <Input
          id="email"
          type="email"
          autoComplete="email"
          placeholder="you@example.com"
          error={!!errors.email}
          {...register('email')}
        />
        {errors.email?.message && (
          <p className="text-sm text-red-400">{errors.email.message}</p>
        )}
      </div>

      <div className="space-y-2">
        <label
          htmlFor="password"
          className="block text-sm font-medium text-surface-300"
        >
          Password
        </label>
        <PasswordInput
          id="password"
          autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
          placeholder="Enter your password"
          error={!!errors.password}
          {...register('password')}
        />
        {errors.password?.message && (
          <p className="text-sm text-red-400">{errors.password.message}</p>
        )}
      </div>

      {mode === 'login' && (
        <div className="text-right">
          <Link
            href="/auth/forgot-password"
            className="text-sm text-surface-400 transition-colors hover:text-gold-400"
          >
            Forgot password?
          </Link>
        </div>
      )}

      <Button
        type="submit"
        className="group w-full"
        size="lg"
        isLoading={isSubmitting}
      >
        {!isSubmitting && (
          <>
            {mode === 'login' ? 'Sign in' : 'Create account'}
            <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
          </>
        )}
      </Button>

      {/* Divider */}
      <div className="relative py-2">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-surface-800" />
        </div>
        <div className="relative flex justify-center">
          <span className="bg-surface-900 px-4 text-xs text-surface-500">or</span>
        </div>
      </div>

      <p className="text-center text-sm text-surface-400">
        {mode === 'login' ? (
          <>
            Don&apos;t have an account?{' '}
            <Link
              href="/auth/signup"
              className="font-medium text-gold-500 transition-colors hover:text-gold-400"
            >
              Sign up
            </Link>
          </>
        ) : (
          <>
            Already have an account?{' '}
            <Link
              href="/auth/login"
              className="font-medium text-gold-500 transition-colors hover:text-gold-400"
            >
              Sign in
            </Link>
          </>
        )}
      </p>
    </form>
  );
}
