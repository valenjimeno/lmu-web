import type { InputHTMLAttributes } from 'react';
import { cn } from '@/lib/utils/cn';

type InputProps = InputHTMLAttributes<HTMLInputElement>;

export function Input({ className, ...props }: InputProps) {
  return (
    <input
      className={cn(
        'w-full rounded-2xl border border-border bg-white px-4 py-3 text-sm text-foreground outline-none transition-colors placeholder:text-muted focus:border-accent',
        className,
      )}
      {...props}
    />
  );
}
