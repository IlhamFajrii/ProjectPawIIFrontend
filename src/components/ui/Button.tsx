import { LoaderCircle } from 'lucide-react';
import type { ComponentProps } from 'react';
import { buttonClass, type ButtonVariant } from './buttonClass';

interface ButtonProps extends ComponentProps<'button'> {
  variant?: ButtonVariant;
  loading?: boolean;
}

export function Button({ variant, loading, disabled, className, children, type = 'button', ...props }: ButtonProps) {
  return (
    <button
      {...props}
      type={type}
      className={buttonClass(variant, className)}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
    >
      {loading && <LoaderCircle className="spin size-5" aria-hidden="true" />}
      {children}
    </button>
  );
}
