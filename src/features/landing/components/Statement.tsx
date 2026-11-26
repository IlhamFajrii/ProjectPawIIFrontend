import { cssVars } from '../../../lib/cssVars';

const WORDS = 'Setelah kamu membayar, dana ditandai ditahan sampai kamu memeriksa hasilnya dan mengonfirmasi.'.split(' ');

// Rentang scroll (persen "cover") tempat kata-kata menyala satu per satu.
const START = 18;
const SPAN = 30;
const STEP = SPAN / WORDS.length;

/** Satu kalimat besar yang menyala kata demi kata mengikuti scroll (MO-13). */
export function Statement() {
  return (
    <section aria-label="Rekber dalam satu kalimat" className="py-section">
      <p className="statement mx-auto w-full max-w-4xl px-4 text-h1 md:px-6">
        {WORDS.map((word, index) => (
          <span key={index}>
            <span
              className="statement-word"
              style={cssVars({ '--from': START + index * STEP, '--to': START + index * STEP + 8 })}
            >
              {word}
            </span>{' '}
          </span>
        ))}
      </p>
    </section>
  );
}
