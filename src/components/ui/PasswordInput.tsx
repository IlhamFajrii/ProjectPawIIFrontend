import { useEffect, useRef, useState, type ComponentProps } from 'react';

/** Input password dengan tombol mata: terpejam saat tersembunyi, membuka dan melirik pointer saat terlihat. */
export function PasswordInput({ className = '', ...props }: ComponentProps<'input'>) {
  const [shown, setShown] = useState(false);
  const button = useRef<HTMLButtonElement>(null);

  // Disembunyikan lagi saat dikirim, agar tidak tertinggal terbaca dan pengelola password mengenalinya.
  useEffect(() => {
    const form = button.current?.form;
    const hide = () => setShown(false);
    form?.addEventListener('submit', hide);
    return () => form?.removeEventListener('submit', hide);
  }, []);

  useEffect(() => {
    const eye = button.current;
    if (!shown || !eye) return;
    const look = ({ clientX, clientY }: PointerEvent) => {
      const box = eye.getBoundingClientRect();
      const x = clientX - box.left - box.width / 2;
      const y = clientY - box.top - box.height / 2;
      // Pupil bergeser paling jauh 2,5 satuan, penuh saat pointer berjarak 60px atau lebih.
      const reach = 2.5 / Math.max(Math.hypot(x, y), 60);
      eye.style.setProperty('--look-x', `${x * reach}px`);
      eye.style.setProperty('--look-y', `${y * reach}px`);
    };
    window.addEventListener('pointermove', look, { passive: true });
    window.addEventListener('pointerdown', look, { passive: true });
    return () => {
      window.removeEventListener('pointermove', look);
      window.removeEventListener('pointerdown', look);
    };
  }, [shown]);

  return (
    <div className="relative">
      <input
        {...props}
        type={shown ? 'text' : 'password'}
        // Saat terlihat, isinya tidak boleh dikoreksi atau dikirim ke pemeriksa ejaan.
        spellCheck={false}
        autoCapitalize="none"
        autoCorrect="off"
        className={`password-input ${className} pr-12`}
      />
      <button
        ref={button}
        type="button"
        aria-label="Tampilkan password"
        aria-pressed={shown}
        aria-controls={props.id}
        // Fokus dan keyboard ponsel tetap di input.
        onMouseDown={(event) => event.preventDefault()}
        onClick={() => setShown((value) => !value)}
        className="eye pressable absolute inset-y-0 right-0 grid w-11 place-items-center rounded-input text-muted hover:text-ink aria-pressed:text-accent"
      >
        <svg
          viewBox="0 0 24 24"
          className="size-6"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.75"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <g className="eye-open">
            <path d="M2 12s3.5-6.5 10-6.5S22 12 22 12s-3.5 6.5-10 6.5S2 12 2 12Z" />
            <g className="eye-pupil">
              <circle cx="12" cy="12" r="3.25" fill="currentColor" stroke="none" />
              <circle cx="13.1" cy="10.9" r="1" className="fill-bg" stroke="none" />
            </g>
          </g>
          <path className="eye-shut" d="M2 10c2.5 3.5 6 5.5 10 5.5s7.500-2 10-5.5M5 13.200 3.500 16M9.500 15.300 9 18.200M14.500 15.300l.5 2.900M19 13.200 20.500 16" />
        </svg>
      </button>
    </div>
  );
}
