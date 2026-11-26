import { useId, type ReactNode } from 'react';

interface Props {
  label: string;
  trigger: ReactNode;
  triggerClass: string;
  children: ReactNode;
}

/**
 * Popover asli: Tab menjangkau isinya, Esc dan klik luar menutup.
 * Isinya tautan dan tombol biasa, jadi sengaja tanpa role="menu".
 */
export function Menu({ label, trigger, triggerClass, children }: Props) {
  const id = useId();
  return (
    <>
      <button type="button" popoverTarget={id} aria-label={label} className={triggerClass}>
        {trigger}
      </button>
      <div
        id={id}
        popover="auto"
        aria-label={label}
        className="menu"
        onClick={(event) => {
          if ((event.target as Element).closest('a, button')) event.currentTarget.hidePopover();
        }}
      >
        {children}
      </div>
    </>
  );
}
