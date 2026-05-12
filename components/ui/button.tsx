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
  primary: 'bg-accent text-accent-foreground hover:bg-accent/90',
  secondary: 'bg-surface-strong text-foreground hover:bg-surface-strong/80',
  ghost: 'bg-transparent text-foreground hover:bg-surface-strong/60',
};

export function Button(props: ButtonProps) {
  const className = cn(
    'inline-flex items-center justify-center rounded-full px-5 py-3 text-sm font-medium transition-colors',
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
