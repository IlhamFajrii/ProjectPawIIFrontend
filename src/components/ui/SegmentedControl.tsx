import { useId } from 'react';

interface Props<T extends string> {
  legend: string;
  value: T;
  options: readonly { value: T; label: string }[];
  onChange: (value: T) => void;
}

/** Radio asli, sehingga tombol panah dan pembaca layar bekerja tanpa ARIA tambahan. */
export function SegmentedControl<T extends string>({ legend, value, options, onChange }: Props<T>) {
  const name = useId();
  const active = Math.max(
    options.findIndex((option) => option.value === value),
    0,
  );

  return (
    <fieldset className="min-w-0">
      <legend className="sr-only">{legend}</legend>
      <div className="relative flex rounded-full bg-surface p-1">
        <span
          aria-hidden="true"
          className="segment-thumb absolute inset-y-1 left-1 rounded-full border border-line bg-bg"
          style={{ width: `calc((100% - 0.5rem) / ${options.length})`, translate: `${active * 100}% 0` }}
        />
        {options.map((option) => (
          <label
            key={option.value}
            className="relative flex min-h-11 flex-1 cursor-pointer items-center justify-center rounded-full px-2 text-center text-sm font-medium text-muted has-checked:text-ink has-focus-visible:outline-2 has-focus-visible:outline-accent"
          >
            <input
              type="radio"
              className="sr-only"
              name={name}
              value={option.value}
              checked={option.value === value}
              onChange={() => onChange(option.value)}
            />
            {option.label}
          </label>
        ))}
      </div>
    </fieldset>
  );
}
