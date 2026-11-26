import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { TextField } from './Field';

describe('tombol mata password', () => {
  it('menampilkan, menyembunyikan, dan tersembunyi lagi saat form dikirim', () => {
    render(
      <form aria-label="uji" onSubmit={(event) => event.preventDefault()}>
        <TextField label="Password" type="password" />
      </form>,
    );
    const input = screen.getByLabelText('Password') as HTMLInputElement;
    const eye = screen.getByRole('button', { name: 'Tampilkan password' });
    expect(input.type).toBe('password');
    expect(eye.getAttribute('type')).toBe('button');

    fireEvent.click(eye);
    expect(input.type).toBe('text');
    expect(eye.getAttribute('aria-pressed')).toBe('true');
    fireEvent.click(eye);
    expect(input.type).toBe('password');

    fireEvent.click(eye);
    fireEvent.submit(screen.getByRole('form', { name: 'uji' }));
    expect(input.type).toBe('password');
  });
});
