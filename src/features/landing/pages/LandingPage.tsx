import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router';
import { buttonClass } from '../../../components/ui/buttonClass';
import { getListings } from '../../../lib/api/listings';
import { ESCROW_NOTICE } from '../../../lib/constants';
import { useTitle } from '../../../lib/hooks';
import { queryKeys } from '../../../lib/queryKeys';
import { AiSection } from '../components/AiSection';
import { CircleSection } from '../components/CircleSection';
import { FinalCta } from '../components/FinalCta';
import { LatestRail } from '../components/LatestRail';
import { RiverStory } from '../components/RiverStory';
import { Statement } from '../components/Statement';
import { TypeList } from '../components/TypeList';
import { useParallax } from '../hooks/useParallax';
import '../landing.css';

function Footer() {
  return (
    <footer className="border-t border-line py-10">
      <div className="mx-auto flex w-full max-w-page flex-wrap items-center justify-between gap-4 px-4 text-sm text-muted md:px-6 lg:px-8">
        <p className="max-w-prose">PUNYA, marketplace lokal Palembang. {ESCROW_NOTICE}</p>
        <nav aria-label="Kaki halaman" className="flex flex-wrap gap-2">
          <Link to="/jelajah" className={buttonClass('text', 'text-sm')}>
            Jelajah
          </Link>
          <Link to="/jual" className={buttonClass('text', 'text-sm')}>
            Pasang listing
          </Link>
          <Link to="/circle" className={buttonClass('text', 'text-sm')}>
            Circle
          </Link>
        </nav>
      </div>
    </footer>
  );
}

export default function LandingPage() {
  useTitle();
  const parallax = useParallax();
  const filters = { limit: 8 };
  const latest = useQuery({
    queryKey: queryKeys.listings(filters),
    queryFn: ({ signal }) => getListings(filters, signal),
  });

  return (
    <div ref={parallax} data-landing="">
      <RiverStory />
      <Statement />
      <TypeList />
      <LatestRail latest={latest} />
      <CircleSection />
      <AiSection />
      <FinalCta />
      <Footer />
    </div>
  );
}
