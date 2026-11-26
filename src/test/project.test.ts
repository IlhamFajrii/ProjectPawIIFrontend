// Aturan proyek yang bisa diperiksa otomatis.
import { describe, expect, it } from 'vitest';
import html from '../../index.html?raw';
import vercel from '../../vercel.json?raw';

const modules = import.meta.glob('../**/*.ts', { query: '?raw', import: 'default', eager: true }) as Record<
  string,
  string
>;
const sources = import.meta.glob('../**/*.tsx', { query: '?raw', import: 'default', eager: true }) as Record<
  string,
  string
>;

describe('aturan proyek', () => {
  it('CSP memuat hash skrip tema di index.html', async () => {
    const script = html.replace(/\r\n/g, '\n').match(/<script>([\s\S]*?)<\/script>/)?.[1] ?? '';
    const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(script));
    const hash = btoa(String.fromCharCode(...new Uint8Array(digest)));
    expect(vercel).toContain(`'sha256-${hash}'`);
  });

  it('komponen tidak menulis nilai warna', () => {
    const offenders = Object.entries(sources)
      .filter(([, code]) => /#[0-9a-fA-F]{3,8}\b|rgba?\(|hsla?\(|oklch\(/.test(code))
      .map(([file]) => file);
    expect(offenders).toEqual([]);
  });

  it('tidak memakai dangerouslySetInnerHTML', () => {
    expect(Object.values(sources).some((code) => code.includes('dangerouslySetInnerHTML'))).toBe(false);
  });

  it('mengambil z dari lib/zod agar JIT (eval) tetap mati', () => {
    // `import type` boleh; impor nilai dari 'zod' hanya di lib/zod.ts.
    const direct = /^import (?!type )[^;]*from 'zod';/m;
    const offenders = Object.entries({ ...modules, ...sources })
      .filter(([, code]) => direct.test(code))
      .map(([file]) => file);
    expect(offenders).toEqual(['../lib/zod.ts']);
  });
});
