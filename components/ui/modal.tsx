import type { ReactNode } from 'react';
import { cn } from '@/lib/utils/cn';

type ModalProps = {
  children: ReactNode;
  className?: string;
  title?: string;
};

export function Modal({ children, className, title }: ModalProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/55 p-4 backdrop-blur-sm">
      <div
        className={cn(
          'app-shell-card w-full max-w-lg rounded-[2rem] p-6 shadow-[0_40px_100px_rgba(0,0,0,0.46)]',
          className,
        )}
      >
        {title ? <h2 className="text-xl font-semibold text-foreground">{title}</h2> : null}
        <div className={title ? 'mt-4' : ''}>{children}</div>
      </div>
    </div>
  );
}
