import { useNavigate } from 'react-router';
import { useSession } from './session';
import { useToast } from './toast';

export function useSignOut() {
  const navigate = useNavigate();
  const { signOut } = useSession();
  const toast = useToast();

  return async () => {
    // Pindah dulu, agar penjaga rute tidak membuka popup masuk saat keluar.
    await navigate('/');
    signOut();
    toast.success('Kamu sudah keluar.');
  };
}
