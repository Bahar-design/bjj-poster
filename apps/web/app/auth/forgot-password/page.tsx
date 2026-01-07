import Link from 'next/link';
import type { JSX } from 'react';

export default function ForgotPasswordPage(): JSX.Element {
  return (
    <>
      <div className="mb-6 text-center">
        <h1 className="font-display text-2xl text-white">Reset password</h1>
        <p className="mt-2 font-body text-sm text-primary-300">
          This feature is coming soon
        </p>
      </div>
      <p className="text-center font-body text-sm text-primary-300">
        <Link href="/auth/login" className="text-white hover:underline">
          Back to sign in
        </Link>
      </p>
    </>
  );
}
