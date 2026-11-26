export interface FormState {
  dirty: boolean;
  busy: boolean;
}

export interface AuthFormProps {
  onDone: () => void;
  onState?: (state: FormState) => void;
  autoFocus?: boolean;
}

export interface RegisterFormProps extends AuthFormProps {
  /** Akun sudah dibuat tetapi masuk otomatis gagal. */
  onNeedLogin: () => void;
}
