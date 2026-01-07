# Auth Pages Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Build signup and login pages with form validation, password toggle, and loading states.

**Architecture:** Shared `AuthForm` component used by both pages, with `PasswordInput` for visibility toggle. React Hook Form handles form state, Zod handles validation. Auth layout provides centered card wrapper.

**Tech Stack:** Next.js 14, React Hook Form, Zod, @hookform/resolvers, Tailwind CSS, Lucide icons

---

## Task 1: Install Dependencies

**Files:**
- Modify: `apps/web/package.json`

**Step 1: Install react-hook-form and resolver**

```bash
cd /home/bahar/bjj-poster && pnpm add react-hook-form @hookform/resolvers --filter @bjj-poster/web
```

**Step 2: Verify installation**

```bash
pnpm list react-hook-form @hookform/resolvers --filter @bjj-poster/web
```

Expected: Both packages listed with versions.

**Step 3: Commit**

```bash
git add apps/web/package.json pnpm-lock.yaml
git commit -m "chore(web): add react-hook-form and zod resolver"
```

---

## Task 2: Create Zod Validation Schemas

**Files:**
- Create: `apps/web/lib/validations/auth.ts`
- Test: `apps/web/lib/validations/__tests__/auth.test.ts`

**Step 1: Write failing tests for validation schemas**

Create `apps/web/lib/validations/__tests__/auth.test.ts`:

```typescript
import { describe, expect, it } from 'vitest';
import { loginSchema, signupSchema } from '../auth';

describe('Auth Validation Schemas', () => {
  describe('loginSchema', () => {
    it('accepts valid email and password', () => {
      const result = loginSchema.safeParse({
        email: 'test@example.com',
        password: 'password123',
      });
      expect(result.success).toBe(true);
    });

    it('rejects invalid email format', () => {
      const result = loginSchema.safeParse({
        email: 'invalid-email',
        password: 'password123',
      });
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toBe('Invalid email address');
      }
    });

    it('rejects empty email', () => {
      const result = loginSchema.safeParse({
        email: '',
        password: 'password123',
      });
      expect(result.success).toBe(false);
    });

    it('rejects empty password', () => {
      const result = loginSchema.safeParse({
        email: 'test@example.com',
        password: '',
      });
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toBe('Password is required');
      }
    });
  });

  describe('signupSchema', () => {
    it('accepts valid email and password (8+ chars)', () => {
      const result = signupSchema.safeParse({
        email: 'test@example.com',
        password: 'password123',
      });
      expect(result.success).toBe(true);
    });

    it('rejects password shorter than 8 characters', () => {
      const result = signupSchema.safeParse({
        email: 'test@example.com',
        password: 'short',
      });
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toBe(
          'Password must be at least 8 characters'
        );
      }
    });

    it('rejects invalid email format', () => {
      const result = signupSchema.safeParse({
        email: 'not-an-email',
        password: 'password123',
      });
      expect(result.success).toBe(false);
    });
  });
});
```

**Step 2: Run tests to verify they fail**

```bash
pnpm --filter @bjj-poster/web test -- apps/web/lib/validations/__tests__/auth.test.ts
```

Expected: FAIL - Cannot find module '../auth'

**Step 3: Create validation schemas**

Create `apps/web/lib/validations/auth.ts`:

```typescript
import { z } from 'zod';

export const loginSchema = z.object({
  email: z.string().min(1, 'Email is required').email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
});

export const signupSchema = z.object({
  email: z.string().min(1, 'Email is required').email('Invalid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
});

export type LoginFormData = z.infer<typeof loginSchema>;
export type SignupFormData = z.infer<typeof signupSchema>;
```

**Step 4: Run tests to verify they pass**

```bash
pnpm --filter @bjj-poster/web test -- apps/web/lib/validations/__tests__/auth.test.ts
```

Expected: All tests PASS

**Step 5: Commit**

```bash
git add apps/web/lib/validations/
git commit -m "feat(web): add auth validation schemas with Zod"
```

---

## Task 3: Create PasswordInput Component

**Files:**
- Create: `apps/web/components/auth/password-input.tsx`
- Test: `apps/web/components/auth/__tests__/password-input.test.tsx`

**Step 1: Write failing tests for PasswordInput**

Create `apps/web/components/auth/__tests__/password-input.test.tsx`:

```typescript
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import { PasswordInput } from '../password-input';

describe('PasswordInput', () => {
  it('renders password input with hidden text by default', () => {
    render(<PasswordInput />);
    expect(screen.getByRole('textbox')).toHaveAttribute('type', 'password');
  });

  it('toggles visibility when eye button is clicked', async () => {
    const user = userEvent.setup();
    render(<PasswordInput />);

    const input = screen.getByRole('textbox');
    const toggleButton = screen.getByRole('button', { name: /show password/i });

    expect(input).toHaveAttribute('type', 'password');

    await user.click(toggleButton);

    expect(input).toHaveAttribute('type', 'text');
    expect(
      screen.getByRole('button', { name: /hide password/i })
    ).toBeInTheDocument();
  });

  it('toggles back to hidden when clicked again', async () => {
    const user = userEvent.setup();
    render(<PasswordInput />);

    const toggleButton = screen.getByRole('button', { name: /show password/i });

    await user.click(toggleButton);
    await user.click(screen.getByRole('button', { name: /hide password/i }));

    expect(screen.getByRole('textbox')).toHaveAttribute('type', 'password');
  });

  it('forwards ref to input element', () => {
    const ref = { current: null } as React.RefObject<HTMLInputElement>;
    render(<PasswordInput ref={ref} />);
    expect(ref.current).toBeInstanceOf(HTMLInputElement);
  });

  it('passes through additional props', () => {
    render(<PasswordInput placeholder="Enter password" id="test-password" />);
    const input = screen.getByRole('textbox');
    expect(input).toHaveAttribute('placeholder', 'Enter password');
    expect(input).toHaveAttribute('id', 'test-password');
  });
});
```

**Step 2: Run tests to verify they fail**

```bash
pnpm --filter @bjj-poster/web test -- apps/web/components/auth/__tests__/password-input.test.tsx
```

Expected: FAIL - Cannot find module '../password-input'

**Step 3: Create PasswordInput component**

Create `apps/web/components/auth/password-input.tsx`:

```typescript
'use client';

import * as React from 'react';
import { Eye, EyeOff } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';

export interface PasswordInputProps
  extends Omit<React.ComponentProps<'input'>, 'type'> {}

const PasswordInput = React.forwardRef<HTMLInputElement, PasswordInputProps>(
  ({ className, ...props }, ref) => {
    const [showPassword, setShowPassword] = React.useState(false);

    return (
      <div className="relative">
        <Input
          type={showPassword ? 'text' : 'password'}
          className={cn('pr-10', className)}
          ref={ref}
          role="textbox"
          {...props}
        />
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="absolute right-0 top-0 h-full px-3 hover:bg-transparent"
          onClick={() => setShowPassword(!showPassword)}
          aria-label={showPassword ? 'Hide password' : 'Show password'}
        >
          {showPassword ? (
            <EyeOff className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
          ) : (
            <Eye className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
          )}
        </Button>
      </div>
    );
  }
);
PasswordInput.displayName = 'PasswordInput';

export { PasswordInput };
```

**Step 4: Run tests to verify they pass**

```bash
pnpm --filter @bjj-poster/web test -- apps/web/components/auth/__tests__/password-input.test.tsx
```

Expected: All tests PASS

**Step 5: Commit**

```bash
git add apps/web/components/auth/
git commit -m "feat(web): add PasswordInput component with visibility toggle"
```

---

## Task 4: Create AuthForm Component

**Files:**
- Create: `apps/web/components/auth/auth-form.tsx`
- Test: `apps/web/components/auth/__tests__/auth-form.test.tsx`

**Step 1: Write failing tests for AuthForm**

Create `apps/web/components/auth/__tests__/auth-form.test.tsx`:

```typescript
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { AuthForm } from '../auth-form';

describe('AuthForm', () => {
  describe('Login Mode', () => {
    it('renders email and password fields', () => {
      render(<AuthForm mode="login" onSubmit={vi.fn()} />);
      expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/password/i)).toBeInTheDocument();
    });

    it('renders sign in button', () => {
      render(<AuthForm mode="login" onSubmit={vi.fn()} />);
      expect(screen.getByRole('button', { name: /sign in/i })).toBeInTheDocument();
    });

    it('renders forgot password link', () => {
      render(<AuthForm mode="login" onSubmit={vi.fn()} />);
      expect(screen.getByRole('link', { name: /forgot password/i })).toHaveAttribute(
        'href',
        '/auth/forgot-password'
      );
    });

    it('renders link to signup page', () => {
      render(<AuthForm mode="login" onSubmit={vi.fn()} />);
      expect(screen.getByRole('link', { name: /sign up/i })).toHaveAttribute(
        'href',
        '/auth/signup'
      );
    });

    it('shows error for empty email on submit', async () => {
      const user = userEvent.setup();
      render(<AuthForm mode="login" onSubmit={vi.fn()} />);

      await user.click(screen.getByRole('button', { name: /sign in/i }));

      await waitFor(() => {
        expect(screen.getByText(/email is required/i)).toBeInTheDocument();
      });
    });

    it('shows error for invalid email format', async () => {
      const user = userEvent.setup();
      render(<AuthForm mode="login" onSubmit={vi.fn()} />);

      await user.type(screen.getByLabelText(/email/i), 'invalid-email');
      await user.click(screen.getByRole('button', { name: /sign in/i }));

      await waitFor(() => {
        expect(screen.getByText(/invalid email address/i)).toBeInTheDocument();
      });
    });

    it('shows error for empty password', async () => {
      const user = userEvent.setup();
      render(<AuthForm mode="login" onSubmit={vi.fn()} />);

      await user.type(screen.getByLabelText(/email/i), 'test@example.com');
      await user.click(screen.getByRole('button', { name: /sign in/i }));

      await waitFor(() => {
        expect(screen.getByText(/password is required/i)).toBeInTheDocument();
      });
    });

    it('calls onSubmit with form data when valid', async () => {
      const user = userEvent.setup();
      const onSubmit = vi.fn().mockResolvedValue(undefined);
      render(<AuthForm mode="login" onSubmit={onSubmit} />);

      await user.type(screen.getByLabelText(/email/i), 'test@example.com');
      await user.type(screen.getByLabelText(/password/i), 'password123');
      await user.click(screen.getByRole('button', { name: /sign in/i }));

      await waitFor(() => {
        expect(onSubmit).toHaveBeenCalledWith({
          email: 'test@example.com',
          password: 'password123',
        });
      });
    });
  });

  describe('Signup Mode', () => {
    it('renders create account button', () => {
      render(<AuthForm mode="signup" onSubmit={vi.fn()} />);
      expect(
        screen.getByRole('button', { name: /create account/i })
      ).toBeInTheDocument();
    });

    it('does not render forgot password link', () => {
      render(<AuthForm mode="signup" onSubmit={vi.fn()} />);
      expect(screen.queryByRole('link', { name: /forgot password/i })).not.toBeInTheDocument();
    });

    it('renders link to login page', () => {
      render(<AuthForm mode="signup" onSubmit={vi.fn()} />);
      expect(screen.getByRole('link', { name: /sign in/i })).toHaveAttribute(
        'href',
        '/auth/login'
      );
    });

    it('shows error for password shorter than 8 characters', async () => {
      const user = userEvent.setup();
      render(<AuthForm mode="signup" onSubmit={vi.fn()} />);

      await user.type(screen.getByLabelText(/email/i), 'test@example.com');
      await user.type(screen.getByLabelText(/password/i), 'short');
      await user.click(screen.getByRole('button', { name: /create account/i }));

      await waitFor(() => {
        expect(
          screen.getByText(/password must be at least 8 characters/i)
        ).toBeInTheDocument();
      });
    });
  });

  describe('Loading State', () => {
    it('shows loading spinner when submitting', async () => {
      const user = userEvent.setup();
      const onSubmit = vi.fn().mockImplementation(
        () => new Promise((resolve) => setTimeout(resolve, 1000))
      );
      render(<AuthForm mode="login" onSubmit={onSubmit} />);

      await user.type(screen.getByLabelText(/email/i), 'test@example.com');
      await user.type(screen.getByLabelText(/password/i), 'password123');
      await user.click(screen.getByRole('button', { name: /sign in/i }));

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /signing in/i })).toBeInTheDocument();
      });
    });

    it('disables button while submitting', async () => {
      const user = userEvent.setup();
      const onSubmit = vi.fn().mockImplementation(
        () => new Promise((resolve) => setTimeout(resolve, 1000))
      );
      render(<AuthForm mode="login" onSubmit={onSubmit} />);

      await user.type(screen.getByLabelText(/email/i), 'test@example.com');
      await user.type(screen.getByLabelText(/password/i), 'password123');
      await user.click(screen.getByRole('button', { name: /sign in/i }));

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /signing in/i })).toBeDisabled();
      });
    });
  });

  describe('Accessibility', () => {
    it('has proper form structure', () => {
      render(<AuthForm mode="login" onSubmit={vi.fn()} />);
      expect(screen.getByRole('form')).toBeInTheDocument();
    });

    it('associates labels with inputs', () => {
      render(<AuthForm mode="login" onSubmit={vi.fn()} />);
      expect(screen.getByLabelText(/email/i)).toHaveAttribute('type', 'email');
    });

    it('submits form on Enter key', async () => {
      const user = userEvent.setup();
      const onSubmit = vi.fn().mockResolvedValue(undefined);
      render(<AuthForm mode="login" onSubmit={onSubmit} />);

      await user.type(screen.getByLabelText(/email/i), 'test@example.com');
      await user.type(screen.getByLabelText(/password/i), 'password123{Enter}');

      await waitFor(() => {
        expect(onSubmit).toHaveBeenCalled();
      });
    });
  });
});
```

**Step 2: Run tests to verify they fail**

```bash
pnpm --filter @bjj-poster/web test -- apps/web/components/auth/__tests__/auth-form.test.tsx
```

Expected: FAIL - Cannot find module '../auth-form'

**Step 3: Create AuthForm component**

Create `apps/web/components/auth/auth-form.tsx`:

```typescript
'use client';

import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Loader2 } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { PasswordInput } from './password-input';
import {
  loginSchema,
  signupSchema,
  type LoginFormData,
  type SignupFormData,
} from '@/lib/validations/auth';
import { cn } from '@/lib/utils';

type AuthFormData = LoginFormData | SignupFormData;

interface AuthFormProps {
  mode: 'login' | 'signup';
  onSubmit: (data: AuthFormData) => Promise<void>;
}

export function AuthForm({ mode, onSubmit }: AuthFormProps) {
  const schema = mode === 'login' ? loginSchema : signupSchema;

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<AuthFormData>({
    resolver: zodResolver(schema),
  });

  const submitHandler = handleSubmit(async (data) => {
    await onSubmit(data);
  });

  return (
    <form onSubmit={submitHandler} className="space-y-4" role="form">
      <div className="space-y-2">
        <label
          htmlFor="email"
          className="block font-body text-sm font-medium text-white"
        >
          Email
        </label>
        <Input
          id="email"
          type="email"
          autoComplete="email"
          placeholder="you@example.com"
          className={cn(
            'bg-primary-700 border-primary-600 text-white placeholder:text-primary-400',
            errors.email && 'border-red-500'
          )}
          {...register('email')}
        />
        {errors.email && (
          <p className="text-sm text-red-500">{errors.email.message}</p>
        )}
      </div>

      <div className="space-y-2">
        <label
          htmlFor="password"
          className="block font-body text-sm font-medium text-white"
        >
          Password
        </label>
        <PasswordInput
          id="password"
          autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
          placeholder="Enter your password"
          className={cn(
            'bg-primary-700 border-primary-600 text-white placeholder:text-primary-400',
            errors.password && 'border-red-500'
          )}
          {...register('password')}
        />
        {errors.password && (
          <p className="text-sm text-red-500">{errors.password.message}</p>
        )}
      </div>

      {mode === 'login' && (
        <div className="text-right">
          <Link
            href="/auth/forgot-password"
            className="font-body text-sm text-primary-300 hover:text-white"
          >
            Forgot password?
          </Link>
        </div>
      )}

      <Button type="submit" className="w-full" disabled={isSubmitting}>
        {isSubmitting ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden="true" />
            {mode === 'login' ? 'Signing in...' : 'Creating account...'}
          </>
        ) : mode === 'login' ? (
          'Sign in'
        ) : (
          'Create account'
        )}
      </Button>

      <p className="text-center font-body text-sm text-primary-300">
        {mode === 'login' ? (
          <>
            Don&apos;t have an account?{' '}
            <Link href="/auth/signup" className="text-white hover:underline">
              Sign up
            </Link>
          </>
        ) : (
          <>
            Already have an account?{' '}
            <Link href="/auth/login" className="text-white hover:underline">
              Sign in
            </Link>
          </>
        )}
      </p>
    </form>
  );
}
```

**Step 4: Run tests to verify they pass**

```bash
pnpm --filter @bjj-poster/web test -- apps/web/components/auth/__tests__/auth-form.test.tsx
```

Expected: All tests PASS

**Step 5: Commit**

```bash
git add apps/web/components/auth/auth-form.tsx apps/web/components/auth/__tests__/auth-form.test.tsx
git commit -m "feat(web): add AuthForm component with validation and loading states"
```

---

## Task 5: Create Auth Layout

**Files:**
- Create: `apps/web/app/auth/layout.tsx`

**Step 1: Create auth layout**

Create `apps/web/app/auth/layout.tsx`:

```typescript
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
```

**Step 2: Verify layout renders (visual check)**

```bash
pnpm --filter @bjj-poster/web build
```

Expected: Build succeeds

**Step 3: Commit**

```bash
git add apps/web/app/auth/layout.tsx
git commit -m "feat(web): add centered auth layout"
```

---

## Task 6: Create Signup Page

**Files:**
- Create: `apps/web/app/auth/signup/page.tsx`
- Test: `apps/web/app/auth/signup/__tests__/page.test.tsx`

**Step 1: Write failing tests for signup page**

Create `apps/web/app/auth/signup/__tests__/page.test.tsx`:

```typescript
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import SignupPage from '../page';

// Mock next/navigation
const mockPush = vi.fn();
vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: mockPush,
  }),
}));

describe('Signup Page', () => {
  beforeEach(() => {
    mockPush.mockClear();
  });

  describe('Page Structure', () => {
    it('renders the main heading', () => {
      render(<SignupPage />);
      expect(
        screen.getByRole('heading', { level: 1, name: /create your account/i })
      ).toBeInTheDocument();
    });

    it('renders subheading text', () => {
      render(<SignupPage />);
      expect(screen.getByText(/start creating tournament posters/i)).toBeInTheDocument();
    });

    it('renders the auth form', () => {
      render(<SignupPage />);
      expect(screen.getByRole('form')).toBeInTheDocument();
    });

    it('renders create account button', () => {
      render(<SignupPage />);
      expect(
        screen.getByRole('button', { name: /create account/i })
      ).toBeInTheDocument();
    });
  });

  describe('Form Submission', () => {
    it('redirects to home after successful signup', async () => {
      const user = userEvent.setup();
      render(<SignupPage />);

      await user.type(screen.getByLabelText(/email/i), 'test@example.com');
      await user.type(screen.getByLabelText(/password/i), 'password123');
      await user.click(screen.getByRole('button', { name: /create account/i }));

      await waitFor(
        () => {
          expect(mockPush).toHaveBeenCalledWith('/');
        },
        { timeout: 3000 }
      );
    });

    it('shows loading state during submission', async () => {
      const user = userEvent.setup();
      render(<SignupPage />);

      await user.type(screen.getByLabelText(/email/i), 'test@example.com');
      await user.type(screen.getByLabelText(/password/i), 'password123');
      await user.click(screen.getByRole('button', { name: /create account/i }));

      expect(
        screen.getByRole('button', { name: /creating account/i })
      ).toBeInTheDocument();
    });
  });

  describe('Validation', () => {
    it('shows error for password less than 8 characters', async () => {
      const user = userEvent.setup();
      render(<SignupPage />);

      await user.type(screen.getByLabelText(/email/i), 'test@example.com');
      await user.type(screen.getByLabelText(/password/i), 'short');
      await user.click(screen.getByRole('button', { name: /create account/i }));

      await waitFor(() => {
        expect(
          screen.getByText(/password must be at least 8 characters/i)
        ).toBeInTheDocument();
      });
    });
  });

  describe('Navigation', () => {
    it('has link to login page', () => {
      render(<SignupPage />);
      expect(screen.getByRole('link', { name: /sign in/i })).toHaveAttribute(
        'href',
        '/auth/login'
      );
    });
  });
});
```

**Step 2: Run tests to verify they fail**

```bash
pnpm --filter @bjj-poster/web test -- apps/web/app/auth/signup/__tests__/page.test.tsx
```

Expected: FAIL - Cannot find module '../page'

**Step 3: Create signup page**

Create `apps/web/app/auth/signup/page.tsx`:

```typescript
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
```

**Step 4: Run tests to verify they pass**

```bash
pnpm --filter @bjj-poster/web test -- apps/web/app/auth/signup/__tests__/page.test.tsx
```

Expected: All tests PASS

**Step 5: Commit**

```bash
git add apps/web/app/auth/signup/
git commit -m "feat(web): add signup page with mock submission"
```

---

## Task 7: Create Login Page

**Files:**
- Create: `apps/web/app/auth/login/page.tsx`
- Test: `apps/web/app/auth/login/__tests__/page.test.tsx`

**Step 1: Write failing tests for login page**

Create `apps/web/app/auth/login/__tests__/page.test.tsx`:

```typescript
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import LoginPage from '../page';

// Mock next/navigation
const mockPush = vi.fn();
vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: mockPush,
  }),
}));

describe('Login Page', () => {
  beforeEach(() => {
    mockPush.mockClear();
  });

  describe('Page Structure', () => {
    it('renders the main heading', () => {
      render(<LoginPage />);
      expect(
        screen.getByRole('heading', { level: 1, name: /welcome back/i })
      ).toBeInTheDocument();
    });

    it('renders subheading text', () => {
      render(<LoginPage />);
      expect(screen.getByText(/sign in to your account/i)).toBeInTheDocument();
    });

    it('renders the auth form', () => {
      render(<LoginPage />);
      expect(screen.getByRole('form')).toBeInTheDocument();
    });

    it('renders sign in button', () => {
      render(<LoginPage />);
      expect(screen.getByRole('button', { name: /sign in/i })).toBeInTheDocument();
    });
  });

  describe('Form Submission', () => {
    it('redirects to home after successful login', async () => {
      const user = userEvent.setup();
      render(<LoginPage />);

      await user.type(screen.getByLabelText(/email/i), 'test@example.com');
      await user.type(screen.getByLabelText(/password/i), 'password123');
      await user.click(screen.getByRole('button', { name: /sign in/i }));

      await waitFor(
        () => {
          expect(mockPush).toHaveBeenCalledWith('/');
        },
        { timeout: 3000 }
      );
    });

    it('shows loading state during submission', async () => {
      const user = userEvent.setup();
      render(<LoginPage />);

      await user.type(screen.getByLabelText(/email/i), 'test@example.com');
      await user.type(screen.getByLabelText(/password/i), 'password123');
      await user.click(screen.getByRole('button', { name: /sign in/i }));

      expect(screen.getByRole('button', { name: /signing in/i })).toBeInTheDocument();
    });
  });

  describe('Validation', () => {
    it('shows error for empty password', async () => {
      const user = userEvent.setup();
      render(<LoginPage />);

      await user.type(screen.getByLabelText(/email/i), 'test@example.com');
      await user.click(screen.getByRole('button', { name: /sign in/i }));

      await waitFor(() => {
        expect(screen.getByText(/password is required/i)).toBeInTheDocument();
      });
    });
  });

  describe('Navigation', () => {
    it('has link to signup page', () => {
      render(<LoginPage />);
      expect(screen.getByRole('link', { name: /sign up/i })).toHaveAttribute(
        'href',
        '/auth/signup'
      );
    });

    it('has forgot password link', () => {
      render(<LoginPage />);
      expect(screen.getByRole('link', { name: /forgot password/i })).toHaveAttribute(
        'href',
        '/auth/forgot-password'
      );
    });
  });
});
```

**Step 2: Run tests to verify they fail**

```bash
pnpm --filter @bjj-poster/web test -- apps/web/app/auth/login/__tests__/page.test.tsx
```

Expected: FAIL - Cannot find module '../page'

**Step 3: Create login page**

Create `apps/web/app/auth/login/page.tsx`:

```typescript
'use client';

import { useRouter } from 'next/navigation';

import { AuthForm } from '@/components/auth/auth-form';
import type { LoginFormData } from '@/lib/validations/auth';

export default function LoginPage() {
  const router = useRouter();

  const handleSubmit = async (data: LoginFormData): Promise<void> => {
    // Mock delay to simulate API call
    await new Promise((resolve) => setTimeout(resolve, 1500));

    // TODO: Implement actual login logic
    console.log('Login data:', data);

    router.push('/');
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
```

**Step 4: Run tests to verify they pass**

```bash
pnpm --filter @bjj-poster/web test -- apps/web/app/auth/login/__tests__/page.test.tsx
```

Expected: All tests PASS

**Step 5: Commit**

```bash
git add apps/web/app/auth/login/
git commit -m "feat(web): add login page with mock submission"
```

---

## Task 8: Add Mobile Viewport Tests

**Files:**
- Modify: `apps/web/app/auth/signup/__tests__/page.test.tsx`
- Modify: `apps/web/app/auth/login/__tests__/page.test.tsx`

**Step 1: Add mobile viewport test to signup page tests**

Add to `apps/web/app/auth/signup/__tests__/page.test.tsx`:

```typescript
describe('Mobile Layout', () => {
  it('renders form at 375px viewport', () => {
    // Set viewport width
    Object.defineProperty(window, 'innerWidth', {
      writable: true,
      configurable: true,
      value: 375,
    });
    window.dispatchEvent(new Event('resize'));

    render(<SignupPage />);

    expect(screen.getByRole('form')).toBeInTheDocument();
    expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/password/i)).toBeInTheDocument();
  });
});
```

**Step 2: Add mobile viewport test to login page tests**

Add to `apps/web/app/auth/login/__tests__/page.test.tsx`:

```typescript
describe('Mobile Layout', () => {
  it('renders form at 375px viewport', () => {
    // Set viewport width
    Object.defineProperty(window, 'innerWidth', {
      writable: true,
      configurable: true,
      value: 375,
    });
    window.dispatchEvent(new Event('resize'));

    render(<LoginPage />);

    expect(screen.getByRole('form')).toBeInTheDocument();
    expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/password/i)).toBeInTheDocument();
  });
});
```

**Step 3: Run all auth tests**

```bash
pnpm --filter @bjj-poster/web test -- apps/web/app/auth/
```

Expected: All tests PASS

**Step 4: Commit**

```bash
git add apps/web/app/auth/
git commit -m "test(web): add mobile viewport tests for auth pages"
```

---

## Task 9: Create Component Index Exports

**Files:**
- Create: `apps/web/components/auth/index.ts`
- Create: `apps/web/lib/validations/index.ts`

**Step 1: Create auth components index**

Create `apps/web/components/auth/index.ts`:

```typescript
export { AuthForm } from './auth-form';
export { PasswordInput } from './password-input';
```

**Step 2: Create validations index**

Create `apps/web/lib/validations/index.ts`:

```typescript
export {
  loginSchema,
  signupSchema,
  type LoginFormData,
  type SignupFormData,
} from './auth';
```

**Step 3: Verify build**

```bash
pnpm --filter @bjj-poster/web build
```

Expected: Build succeeds

**Step 4: Commit**

```bash
git add apps/web/components/auth/index.ts apps/web/lib/validations/index.ts
git commit -m "chore(web): add index exports for auth components and validations"
```

---

## Task 10: Final Verification

**Step 1: Run all tests**

```bash
pnpm --filter @bjj-poster/web test
```

Expected: All tests PASS

**Step 2: Run linting**

```bash
pnpm --filter @bjj-poster/web lint
```

Expected: No errors

**Step 3: Run type checking**

```bash
pnpm --filter @bjj-poster/web type-check
```

Expected: No errors

**Step 4: Build**

```bash
pnpm --filter @bjj-poster/web build
```

Expected: Build succeeds

---

## Summary

**Files Created:**
- `apps/web/lib/validations/auth.ts` - Zod schemas
- `apps/web/lib/validations/index.ts` - Exports
- `apps/web/lib/validations/__tests__/auth.test.ts` - Schema tests
- `apps/web/components/auth/password-input.tsx` - Password toggle component
- `apps/web/components/auth/auth-form.tsx` - Shared form component
- `apps/web/components/auth/index.ts` - Exports
- `apps/web/components/auth/__tests__/password-input.test.tsx` - Component tests
- `apps/web/components/auth/__tests__/auth-form.test.tsx` - Component tests
- `apps/web/app/auth/layout.tsx` - Centered card layout
- `apps/web/app/auth/signup/page.tsx` - Signup page
- `apps/web/app/auth/signup/__tests__/page.test.tsx` - Page tests
- `apps/web/app/auth/login/page.tsx` - Login page
- `apps/web/app/auth/login/__tests__/page.test.tsx` - Page tests

**Dependencies Added:**
- `react-hook-form`
- `@hookform/resolvers`
