import { Navigate, useLocation, useNavigate, useSearchParams } from 'react-router';
import { Page } from '../../../components/ui/Page';
import { useSession } from '../../../lib/session';
import { safeNextPath } from '../../../lib/url';
import { AuthPanel } from '../components/AuthPanel';

export default function AuthPage() {
  const { status } = useSession();
  const { pathname, search } = useLocation();
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const next = safeNextPath(params.get('next'));
  const mode = pathname === '/daftar' ? 'register' : 'login';

  if (status === 'authed') return <Navigate to={next} replace />;

  return (
    <Page title={mode === 'login' ? 'Masuk' : 'Daftar'} width="narrow">
      <AuthPanel
        mode={mode}
        onModeChange={(value) => navigate(`${value === 'login' ? '/masuk' : '/daftar'}${search}`, { replace: true })}
        // Setelah sesi aktif, komponen ini dirender ulang dan mengarahkan ke tujuan.
        onDone={() => {}}
      />
    </Page>
  );
}
