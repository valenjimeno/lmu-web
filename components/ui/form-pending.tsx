'use client';

import type { ReactNode } from 'react';
import { useFormStatus } from 'react-dom';

type FormPendingProps = {
  children: (pending: boolean) => ReactNode;
};

export function FormPending({ children }: FormPendingProps) {
  const { pending } = useFormStatus();

  return children(pending);
}
