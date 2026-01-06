import Link from 'next/link';

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-primary-900 px-4 py-12">
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <Link
            href="/"
            className="font-display text-2xl text-white hover:text-primary-200"
          >
            BJJ Poster
          </Link>
        </div>
        <div className="rounded-xl bg-primary-800 p-8 shadow-lg">{children}</div>
      </div>
    </div>
  );
}
