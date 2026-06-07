'use client';

import type { ButtonHTMLAttributes, ReactNode } from 'react';
import { useFormStatus } from 'react-dom';
import { Button, type ButtonVariant } from '@/components/ui/button';

type SubmitButtonProps = Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'children' | 'type'> & {
  children: ReactNode;
  pendingLabel?: ReactNode;
  variant?: ButtonVariant;
};

export function SubmitButton({
  children,
  disabled,
  pendingLabel,
  variant,
  ...props
}: SubmitButtonProps) {
  const { pending } = useFormStatus();

  return (
    <Button
      type="submit"
      variant={variant}
      disabled={disabled || pending}
      isLoading={pending}
      loadingLabel={pendingLabel ?? children}
      {...props}
    >
      {children}
    </Button>
  );
}
