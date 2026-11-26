import { useCallback, useEffect, useState } from 'react';
import { SegmentedControl } from '../../../components/ui/SegmentedControl';
import type { AuthMode } from '../../../lib/session';
import type { FormState } from './authFormProps';
import { LoginForm } from './LoginForm';
import { RegisterForm } from './RegisterForm';

const OPTIONS = [
  { value: 'login', label: 'Masuk' },
  { value: 'register', label: 'Daftar' },
] as const;

interface Props {
  mode: AuthMode;
  onModeChange: (mode: AuthMode) => void;
  onDone: () => void;
  onState?: (state: FormState) => void;
  autoFocus?: boolean;
}

const IDLE: FormState = { dirty: false, busy: false };

export function AuthPanel({ mode, onModeChange, onDone, onState, autoFocus }: Props) {
  const [login, setLogin] = useState(IDLE);
  const [register, setRegister] = useState(IDLE);
  const dirty = login.dirty || register.dirty;
  const busy = login.busy || register.busy;

  useEffect(() => onState?.({ dirty, busy }), [onState, dirty, busy]);

  const updateLogin = useCallback((state: FormState) => setLogin(state), []);
  const updateRegister = useCallback((state: FormState) => setRegister(state), []);

  return (
    <div className="grid gap-5">
      <SegmentedControl legend="Pilih masuk atau daftar" value={mode} options={OPTIONS} onChange={onModeChange} />
      {/* Keduanya tetap terpasang agar isian tidak hilang saat berpindah. */}
      <div hidden={mode !== 'login'}>
        <LoginForm onDone={onDone} onState={updateLogin} autoFocus={autoFocus && mode === 'login'} />
      </div>
      <div hidden={mode !== 'register'}>
        <RegisterForm
          onDone={onDone}
          onState={updateRegister}
          onNeedLogin={() => onModeChange('login')}
          autoFocus={autoFocus && mode === 'register'}
        />
      </div>
    </div>
  );
}
