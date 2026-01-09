import * as React from 'react';
import { Slot } from '@radix-ui/react-slot';
import { cva, type VariantProps } from 'class-variance-authority';
import { Loader2 } from 'lucide-react';

import { cn } from '@/lib/utils';

const buttonVariants = cva(
  [
    'group relative inline-flex items-center justify-center gap-2 whitespace-nowrap',
    'text-sm font-medium tracking-wide',
    'rounded-lg overflow-hidden',
    'transition-all duration-300 ease-out-expo',
    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold-500/50 focus-visible:ring-offset-2 focus-visible:ring-offset-surface-950',
    'disabled:pointer-events-none disabled:opacity-50',
    '[&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0',
  ],
  {
    variants: {
      variant: {
        default: [
          'bg-gradient-to-r from-gold-500 to-gold-600 text-surface-950',
          'shadow-lg shadow-gold-500/20',
          'hover:shadow-xl hover:shadow-gold-500/30 hover:scale-[1.02]',
          'active:scale-[0.98]',
          'before:absolute before:inset-0',
          'before:bg-gradient-to-r before:from-transparent before:via-white/20 before:to-transparent',
          'before:translate-x-[-200%] hover:before:translate-x-[200%]',
          'before:transition-transform before:duration-700 before:ease-out',
        ],
        destructive: [
          'bg-gradient-to-r from-red-600 to-red-700 text-white',
          'shadow-lg shadow-red-500/20',
          'hover:shadow-xl hover:shadow-red-500/30 hover:scale-[1.02]',
          'active:scale-[0.98]',
        ],
        outline: [
          'border border-surface-700 bg-transparent text-white',
          'hover:border-gold-500/50 hover:bg-gold-500/5 hover:text-gold-400',
          'active:scale-[0.98]',
        ],
        secondary: [
          'bg-surface-800 text-white border border-surface-700',
          'hover:bg-surface-700 hover:border-surface-600',
          'active:scale-[0.98]',
        ],
        ghost: [
          'text-surface-300 hover:text-white hover:bg-surface-800/50',
          'active:scale-[0.98]',
        ],
        link: [
          'text-gold-500 underline-offset-4',
          'hover:text-gold-400 hover:underline',
        ],
        premium: [
          'bg-surface-900 text-white border border-gold-500/30',
          'shadow-[0_0_20px_rgba(233,196,106,0.15)]',
          'hover:border-gold-500/60 hover:shadow-[0_0_30px_rgba(233,196,106,0.25)]',
          'hover:scale-[1.02]',
          'active:scale-[0.98]',
          'before:absolute before:inset-0',
          'before:bg-gradient-to-r before:from-gold-500/0 before:via-gold-500/10 before:to-gold-500/0',
          'before:translate-x-[-200%] hover:before:translate-x-[200%]',
          'before:transition-transform before:duration-700 before:ease-out',
        ],
      },
      size: {
        default: 'h-10 px-5 py-2',
        sm: 'h-8 px-3 text-xs',
        lg: 'h-12 px-8 text-base',
        xl: 'h-14 px-10 text-lg',
        icon: 'h-10 w-10',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
  isLoading?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, isLoading, children, disabled, ...props }, ref) => {
    const Comp = asChild ? Slot : 'button';
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        disabled={disabled || isLoading}
        {...props}
      >
        {isLoading ? (
          <>
            <Loader2 className="animate-spin" />
            <span>Loading...</span>
          </>
        ) : (
          children
        )}
      </Comp>
    );
  }
);
Button.displayName = 'Button';

export { Button, buttonVariants };
