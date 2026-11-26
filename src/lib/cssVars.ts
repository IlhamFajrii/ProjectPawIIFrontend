import type { CSSProperties } from 'react';

/** Custom property untuk dipakai keyframes di stylesheet. */
export const cssVars = (values: Record<`--${string}`, string | number>) => values as CSSProperties;
