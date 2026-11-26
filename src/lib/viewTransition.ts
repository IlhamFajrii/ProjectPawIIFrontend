/** React Router hanya diminta bertransisi bila browser mendukungnya, agar tidak memberi peringatan. */
export const supportsViewTransition = () => typeof document !== 'undefined' && 'startViewTransition' in document;
