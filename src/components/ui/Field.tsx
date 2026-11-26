import { useId, type ComponentProps, type ReactNode } from 'react';
import { PasswordInput } from './PasswordInput';

interface FieldMeta {
  label: string;
  hint?: ReactNode;
  error?: string;
}

const CONTROL =
  'w-full min-w-0 rounded-input border border-control bg-bg px-3 text-ink placeholder:text-muted ' +
  'read-only:bg-surface disabled:opacity-60 aria-invalid:border-danger aria-invalid:border-2';

interface Wiring {
  id: string;
  'aria-invalid'?: true;
  'aria-describedby'?: string;
}

function Field({ label, hint, error, children }: FieldMeta & { children: (wiring: Wiring) => ReactNode }) {
  const id = useId();
  const hintId = `${id}-hint`;
  const errorId = `${id}-error`;
  const describedBy = [hint ? hintId : '', error ? errorId : ''].filter(Boolean).join(' ');

  return (
    <div className="grid gap-1.5">
      <label htmlFor={id} className="text-sm font-medium">
        {label}
      </label>
      {children({ id, 'aria-invalid': error ? true : undefined, 'aria-describedby': describedBy || undefined })}
      {hint && (
        <div id={hintId} className="text-sm text-muted">
          {hint}
        </div>
      )}
      {error && (
        <p id={errorId} className="text-sm font-medium text-danger">
          {error}
        </p>
      )}
    </div>
  );
}

export function TextField({ label, hint, error, className = '', ...props }: FieldMeta & ComponentProps<'input'>) {
  const Input = props.type === 'password' ? PasswordInput : 'input';
  return (
    <Field label={label} hint={hint} error={error}>
      {(wiring) => <Input {...props} {...wiring} className={`${CONTROL} min-h-11 ${className}`} />}
    </Field>
  );
}

export function TextareaField({ label, hint, error, rows = 4, ...props }: FieldMeta & ComponentProps<'textarea'>) {
  return (
    <Field label={label} hint={hint} error={error}>
      {(wiring) => <textarea {...props} {...wiring} rows={rows} className={`${CONTROL} py-2.5`} />}
    </Field>
  );
}

interface SelectProps extends FieldMeta, ComponentProps<'select'> {
  options: readonly { value: string; label: string }[];
  placeholder?: string;
}

export function SelectField({ label, hint, error, options, placeholder, ...props }: SelectProps) {
  return (
    <Field label={label} hint={hint} error={error}>
      {(wiring) => (
        <select {...props} {...wiring} className={`${CONTROL} min-h-11`}>
          {placeholder !== undefined && <option value="">{placeholder}</option>}
          {options.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      )}
    </Field>
  );
}
