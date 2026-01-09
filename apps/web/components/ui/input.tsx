import * as React from 'react';

import { cn } from '@/lib/utils';

export interface InputProps extends React.ComponentProps<'input'> {
  error?: boolean;
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, error, ...props }, ref) => {
    return (
      <input
        type={type}
        className={cn(
          // Base styles
          'flex h-11 w-full rounded-lg px-4 py-2',
          'text-base text-white placeholder:text-surface-500',
          'bg-surface-900/50 backdrop-blur-sm',
          'border border-surface-700/50',
          // Transition
          'transition-all duration-300 ease-out-expo',
          // Hover state
          'hover:border-surface-600 hover:bg-surface-900/70',
          // Focus state
          'focus:outline-none focus:border-gold-500/50 focus:ring-2 focus:ring-gold-500/20',
          'focus:bg-surface-900/80',
          // Error state
          error && 'border-red-500/50 focus:border-red-500/50 focus:ring-red-500/20',
          // File input
          'file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-gold-500',
          // Disabled
          'disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:border-surface-700/50',
          // Size adjustment for mobile
          'md:text-sm',
          className
        )}
        ref={ref}
        {...props}
      />
    );
  }
);
Input.displayName = 'Input';

export { Input };
