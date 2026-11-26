import { Link } from 'react-router';
import { Button } from '../../../components/ui/Button';
import { buttonClass } from '../../../components/ui/buttonClass';
import { useSession } from '../../../lib/session';

/** Judul membesar saat mendekat (MO-19). */
export function FinalCta() {
  const { status, openAuth } = useSession();

  return (
    <section aria-labelledby="mulai" className="overflow-clip bg-surface py-section">
      <div className="mx-auto grid w-full max-w-page justify-items-center gap-10 px-4 text-center md:px-6">
        <h2 id="mulai" className="grow-in max-w-[13ch] text-display">
          Mulai dari kecamatanmu
        </h2>
        {status === 'guest' ? (
          <Button className="min-h-14 px-10 text-h3" onClick={() => openAuth('register')}>
            Daftar
          </Button>
        ) : (
          <Link to="/jual" className={buttonClass('primary', 'min-h-14 px-10 text-h3')}>
            Pasang listing
          </Link>
        )}
      </div>
    </section>
  );
}
