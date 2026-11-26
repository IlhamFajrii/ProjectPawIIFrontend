import { Link } from 'react-router';
import { buttonClass } from '../../../components/ui/buttonClass';

const STEPS = [
  { title: 'Buat atau gabung', body: 'Untuk RT, kampus, atau komunitasmu.' },
  { title: 'Bagikan kode', body: 'Hanya yang punya kode undangan bisa masuk.' },
  { title: 'Beri vouch', body: 'Tandai orang yang kamu kenal. Total vouch tampil di profil.' },
];

export function CircleSection() {
  return (
    <section data-scene="" aria-labelledby="circle" className="section-contrast overflow-clip py-section">
      <div className="mx-auto grid w-full max-w-page items-start gap-16 px-4 md:px-6 lg:grid-cols-2 lg:px-8">
        <div className="reveal grid justify-items-start gap-6">
          <h2 id="circle" className="max-w-[12ch] text-display">
            Kumpulkan orang yang kamu kenal
          </h2>
          <p className="max-w-[44ch] text-h3 font-normal text-muted">
            Circle mengumpulkan orang yang saling kenal. Anggotanya saling memberi vouch sebagai tanda percaya.
          </p>
          <Link to="/circle" className={buttonClass('primary')}>
            Buka Circle
          </Link>
        </div>
        {/* Bergerak sedikit lebih cepat dari judul di sebelahnya. */}
        <ol data-depth={50} className="grid lg:pt-32">
          {STEPS.map(({ title, body }) => (
            <li key={title} className="grid gap-2 border-t border-line py-8">
              <h3 className="text-h2">{title}</h3>
              <p className="text-muted">{body}</p>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
