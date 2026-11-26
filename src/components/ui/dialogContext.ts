import { createContext, useContext } from 'react';

/** Tombol "Batal" di dalam dialog memakai ini agar perlindungan isian ikut berlaku. */
export const DialogContext = createContext<() => void>(() => {});

export const useRequestClose = () => useContext(DialogContext);
