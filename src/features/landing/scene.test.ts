import { describe, expect, it } from 'vitest';
import { LAST, poseAt } from './scene';

const positions = Array.from({ length: LAST * 100 + 1 }, (_, index) => index / 100);

describe('cerita Rekber di scene', () => {
  it('dana tidak menyeberang saat bentang terangkat', () => {
    const offenders = positions.filter((c) => {
      const { lift, token } = poseAt(c);
      return lift > 0.001 && Math.abs(token) > 0.001;
    });
    expect(offenders).toEqual([]);
  });

  it('jembatan terbuka selama dana ditahan dan tersambung setelah dikonfirmasi', () => {
    expect([1, 2, 3, 4, 5].map((c) => poseAt(c).lift)).toEqual([0, 1, 1, 1, 0]);
    expect(poseAt(5).token).toBeGreaterThan(0);
    expect(poseAt(1).token).toBeLessThan(0);
  });

  it('posisi di luar rentang dijepit', () => {
    expect(poseAt(-3)).toEqual(poseAt(0));
    expect(poseAt(99)).toEqual(poseAt(LAST));
  });
});
