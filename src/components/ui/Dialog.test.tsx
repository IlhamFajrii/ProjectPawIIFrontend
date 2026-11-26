import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { Dialog } from './Dialog';

function open(props: { dirty?: boolean; busy?: boolean } = {}) {
  const onClose = vi.fn();
  render(
    <Dialog open onClose={onClose} title="Judul" {...props}>
      <input aria-label="isian" />
    </Dialog>,
  );
  const dialog = screen.getByRole('dialog', { name: 'Judul' });
  // Esc dan back gesture memancarkan `cancel`.
  const cancel = () => fireEvent(dialog, new Event('cancel', { cancelable: true }));
  return { onClose, dialog, cancel };
}

describe('Dialog', () => {
  it('menutup saat diminta bila tidak ada isian', () => {
    const { onClose, cancel } = open();
    cancel();
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('meminta konfirmasi sebelum membuang isian', () => {
    const { onClose, cancel } = open({ dirty: true });
    cancel();
    expect(onClose).not.toHaveBeenCalled();
    expect(document.activeElement).toBe(screen.getByRole('button', { name: 'Lanjutkan mengisi' }));

    fireEvent.click(screen.getByRole('button', { name: 'Buang isian' }));
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('tidak bisa ditutup selagi request berjalan', () => {
    const { onClose, cancel } = open({ busy: true });
    cancel();
    fireEvent.click(screen.getByRole('button', { name: 'Tutup' }));
    expect(onClose).not.toHaveBeenCalled();
  });

  it('mengabaikan cancel dari input file', () => {
    const { onClose } = open();
    fireEvent(screen.getByLabelText('isian'), new Event('cancel', { bubbles: true, cancelable: true }));
    expect(onClose).not.toHaveBeenCalled();
  });

  it('membuka lagi bila browser menutup paksa form berisi', () => {
    const { dialog, onClose } = open({ dirty: true });
    (dialog as HTMLDialogElement).close();
    expect(dialog.hasAttribute('open')).toBe(true);
    expect(onClose).not.toHaveBeenCalled();
  });

  it('tidak memakai atribut ARIA yang sudah disediakan browser', () => {
    const { dialog } = open();
    expect(dialog.getAttribute('role')).toBeNull();
    expect(dialog.getAttribute('aria-modal')).toBeNull();
  });
});
