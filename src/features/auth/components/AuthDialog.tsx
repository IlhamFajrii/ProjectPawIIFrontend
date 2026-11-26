import { useCallback, useState } from 'react';
import { Dialog } from '../../../components/ui/Dialog';
import { useSession } from '../../../lib/session';
import type { FormState } from './authFormProps';
import { AuthPanel } from './AuthPanel';

/** PU-01. Dimuat lazy saat pertama kali dibuka. */
export default function AuthDialog() {
  const { authMode, openAuth, closeAuth } = useSession();
  const [state, setState] = useState<FormState>({ dirty: false, busy: false });
  const [lastMode, setLastMode] = useState(authMode ?? 'login');
  const update = useCallback((next: FormState) => setState(next), []);
  const open = authMode !== null;
  // Judul dan form tetap sama selama animasi keluar.
  if (authMode && authMode !== lastMode) setLastMode(authMode);

  return (
    <Dialog
      open={open}
      onClose={() => {
        setState({ dirty: false, busy: false });
        closeAuth();
      }}
      title={lastMode === 'login' ? 'Masuk' : 'Daftar'}
      lightDismiss
      dirty={open && state.dirty}
      busy={open && state.busy}
    >
      <AuthPanel mode={lastMode} onModeChange={openAuth} onDone={closeAuth} onState={update} autoFocus />
    </Dialog>
  );
}
