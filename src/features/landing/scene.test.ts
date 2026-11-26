import { describe, expect, it } from 'vitest';
import { clockAngles } from './ampera';
import { LAST, nextDraw, poseAt, sharpRatio } from './scene';

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

describe('resolusi render', () => {
  it('tajam di layar biasa, dibatasi di layar besar', () => {
    expect(sharpRatio(1, 1440, 900)).toBe(1.5);
    expect(sharpRatio(3, 390, 844)).toBe(2);
    const huge = sharpRatio(1, 3840, 2160);
    expect(huge).toBeGreaterThanOrEqual(1);
    expect(3840 * 2160 * huge ** 2).toBeLessThanOrEqual(8_300_000);
  });
});

describe('pembatas frame', () => {
  it.each([60, 90, 120, 165])('menjaga sekitar 60 gambar per detik di layar %i Hz', (hz) => {
    let last = 0;
    let count = 0;
    for (let tick = 1; tick <= hz * 10; tick += 1) {
      const due = nextDraw((tick * 1000) / hz, last, 60);
      if (due === null) continue;
      last = due;
      count += 1;
    }
    expect(count / 10).toBeGreaterThanOrEqual(55);
    expect(count / 10).toBeLessThanOrEqual(61);
  });
});

describe('jam menara', () => {
  it('menunjukkan waktu Palembang (UTC+7)', () => {
    expect(clockAngles(new Date('2026-11-26T00:00:00Z'))).toEqual({ hour: (7 / 12) * Math.PI * 2, minute: 0 });
    // 17.30 UTC sudah 00.30 hari berikutnya di Palembang.
    const night = clockAngles(new Date('2026-11-26T17:30:00Z'));
    expect(night.hour).toBeCloseTo((0.5 / 12) * Math.PI * 2);
    expect(night.minute).toBeCloseTo(Math.PI);
  });
});
