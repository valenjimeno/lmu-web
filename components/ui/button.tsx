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
    'border border-[rgba(241,196,135,0.3)] bg-[linear-gradient(135deg,#e1b27a_0%,#b88a58_52%,#7f89a0_100%)] text-[#150f09] shadow-[0_16px_36px_rgba(215,170,109,0.26)] hover:brightness-105',
  secondary:
    'border border-white/10 bg-white/[0.04] text-foreground shadow-[inset_0_1px_0_rgba(255,255,255,0.04)] hover:bg-white/[0.08]',
  ghost:
    'border border-transparent bg-transparent text-muted hover:bg-white/[0.06] hover:text-foreground',
};

export function Button(props: ButtonProps) {
  const className = cn(
    'inline-flex min-h-12 items-center justify-center rounded-full px-5 py-3 text-sm font-semibold tracking-[0.01em] transition duration-200 focus:outline-none focus:ring-2 focus:ring-[rgba(241,196,135,0.28)] focus:ring-offset-0',
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
