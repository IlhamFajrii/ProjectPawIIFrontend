// Menghitung modal yang terbuka. Toast ditunda selama ada modal karena area di luarnya inert.
let open = 0;
const listeners = new Set<() => void>();
const emit = () => listeners.forEach((listener) => listener());

export function trackModal() {
  open += 1;
  emit();
  return () => {
    open -= 1;
    emit();
  };
}

export const modalCount = () => open;

export function subscribeModals(listener: () => void) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}
