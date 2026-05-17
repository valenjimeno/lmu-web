import type { InputHTMLAttributes } from 'react';
import { cn } from '@/lib/utils/cn';

type InputProps = InputHTMLAttributes<HTMLInputElement>;

export function Input({ className, ...props }: InputProps) {
  return (
    <input
      className={cn(
        'input-surface w-full rounded-[1.25rem] px-4 py-3.5 text-sm text-foreground outline-none transition placeholder:text-muted focus:border-[rgba(241,196,135,0.28)] focus:ring-2 focus:ring-[rgba(241,196,135,0.16)]',
        className,
      )}
      {...props}
    />
  );
}
