import { useSyncExternalStore } from 'react';
import type { ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { cn } from '@/lib/utils/cn';

type ModalProps = {
  children: ReactNode;
  className?: string;
  title?: string;
};

export function Modal({ children, className, title }: ModalProps) {
  const isMounted = useSyncExternalStore(
    () => () => {},
    () => true,
    () => false,
  );

  if (!isMounted) {
    return null;
  }

  return createPortal(
    <div className="fixed inset-0 z-[90] overflow-y-auto bg-black/68 p-4 pt-6 backdrop-blur-md sm:pt-10">
      <div className="flex min-h-full items-start justify-center">
        <div
          className={cn(
            'app-panel-strong w-full max-w-lg rounded-[2rem] p-6 shadow-[0_40px_100px_rgba(0,0,0,0.52)]',
            className,
          )}
        >
          {title ? <h2 className="text-xl font-semibold text-foreground">{title}</h2> : null}
          <div className={title ? 'mt-4' : ''}>{children}</div>
        </div>
      </div>
    </div>,
    document.body,
  );
}
