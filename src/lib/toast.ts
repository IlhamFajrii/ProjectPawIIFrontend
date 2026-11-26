import { createContext, useContext } from 'react';

export interface ToastApi {
  success: (message: string) => void;
  error: (message: string) => void;
}

export const ToastContext = createContext<ToastApi | null>(null);

export function useToast() {
  const toast = useContext(ToastContext);
  if (!toast) throw new Error('useToast harus dipakai di dalam ToastProvider');
  return toast;
}
