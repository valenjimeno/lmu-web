import Link from 'next/link';
import type { ButtonHTMLAttributes, ReactNode } from 'react';
import { cn } from '@/lib/utils/cn';

type ButtonVariant = 'primary' | 'secondary' | 'ghost';

type BaseProps = {
  children: ReactNode;
  className?: string;
  variant?: ButtonVariant;
};

type ButtonAsButtonProps = BaseProps &
  ButtonHTMLAttributes<HTMLButtonElement> & {
    asChild?: false;
    href?: never;
  };

type ButtonAsLinkProps = BaseProps & {
  asChild: true;
  href: string;
};

type ButtonProps = ButtonAsButtonProps | ButtonAsLinkProps;

const variants: Record<ButtonVariant, string> = {
  primary:
    'border border-white/10 bg-[var(--gradient-accent)] text-accent-foreground shadow-[0_16px_34px_rgba(255,100,31,0.32)] hover:brightness-110',
  secondary:
    'border border-white/10 bg-white/6 text-foreground shadow-[inset_0_1px_0_rgba(255,255,255,0.04)] hover:bg-white/10',
  ghost:
    'border border-transparent bg-transparent text-muted hover:bg-white/6 hover:text-foreground',
};

export function Button(props: ButtonProps) {
  const className = cn(
    'inline-flex min-h-12 items-center justify-center rounded-full px-5 py-3 text-sm font-semibold tracking-[0.01em] transition duration-200',
    variants[props.variant ?? 'primary'],
    props.className,
  );

  if (props.asChild) {
    return (
      <Link href={props.href} className={className}>
        {props.children}
      </Link>
    );
  }

  const {
    children,
    className: _className,
    variant: _variant,
    asChild: _asChild,
    ...buttonProps
  } = props;

  return (
    <button className={className} {...buttonProps}>
      {children}
    </button>
  );
}
