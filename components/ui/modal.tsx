import type { ReactNode } from 'react';
import { cn } from '@/lib/utils/cn';

type ModalProps = {
  children: ReactNode;
  className?: string;
  title: string;
};

export function Modal({ children, className, title }: ModalProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 p-4">
      <div className={cn('w-full max-w-lg rounded-[2rem] bg-surface p-6 shadow-2xl', className)}>
        <h2 className="text-xl font-semibold">{title}</h2>
        <div className="mt-4">{children}</div>
      </div>
    </div>
  );
}
