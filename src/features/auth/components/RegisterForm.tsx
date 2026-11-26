import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import type { z } from 'zod';
import { Button } from '../../../components/ui/Button';
import { SelectField, TextField } from '../../../components/ui/Field';
import { FormSummary } from '../../../components/ui/FormSummary';
import { login, register as registerAccount } from '../../../lib/api/auth';
import { ApiError } from '../../../lib/api/client';
import { DISTRICTS } from '../../../lib/constants';
import { applyServerErrors, flattenErrors } from '../../../lib/formErrors';
import { useSession } from '../../../lib/session';
import { useToast } from '../../../lib/toast';
import { zodResolver } from '../../../lib/zodResolver';
import { registerSchema } from '../schemas';
import type { RegisterFormProps } from './authFormProps';

type Input = z.input<typeof registerSchema>;

const LABELS: Record<keyof Input, string> = {
  name: 'Nama',
  phone: 'Nomor HP',
  email: 'Email',
  password: 'Password',
  district: 'Kecamatan',
};

const districtOptions = DISTRICTS.map((value) => ({ value, label: value }));

/** Pesan server tanpa daftar field, misalnya 409 "Email sudah terdaftar". */
function guessField(message: string): keyof Input | undefined {
  if (/nomor hp/i.test(message)) return 'phone';
  if (/email/i.test(message)) return 'email';
  if (/password/i.test(message)) return 'password';
  return undefined;
}

export function RegisterForm({ onDone, onState, onNeedLogin, autoFocus }: RegisterFormProps) {
  const { signIn } = useSession();
  const toast = useToast();
  const [message, setMessage] = useState<string>();
  const {
    register,
    handleSubmit,
    setError,
    setFocus,
    formState: { errors, isDirty, isSubmitting },
  } = useForm<Input, unknown, z.output<typeof registerSchema>>({
    resolver: zodResolver(registerSchema),
    defaultValues: { name: '', phone: '', email: '', password: '', district: '' as Input['district'] },
  });

  useEffect(() => onState?.({ dirty: isDirty, busy: isSubmitting }), [onState, isDirty, isSubmitting]);

  const submit = handleSubmit(async ({ email, ...values }) => {
    setMessage(undefined);
    try {
      await registerAccount({ ...values, ...(email ? { email } : {}) });
    } catch (error) {
      setMessage(applyServerErrors<Input>(error, setError, Object.keys(LABELS), guessField));
      return;
    }
    // Register tidak mengembalikan token, jadi langsung masuk (FR-A2).
    try {
      const { token, user } = await login({ identifier: values.phone, password: values.password });
      signIn(token, user);
      toast.success(`Akun dibuat. Selamat datang, ${user.name}.`);
      onDone();
    } catch (error) {
      const reason = error instanceof ApiError ? ` ${error.message}` : '';
      toast.error(`Akun sudah dibuat, tetapi gagal masuk otomatis. Silakan masuk.${reason}`);
      onNeedLogin();
    }
  });

  return (
    <form noValidate onSubmit={submit} className="grid gap-4">
      <FormSummary message={message} errors={flattenErrors(errors)} labels={LABELS} onSelect={(name) => setFocus(name as keyof Input)} />
      <TextField
        {...register('name')}
        label={LABELS.name}
        autoComplete="name"
        maxLength={80}
        data-autofocus={autoFocus ? '' : undefined}
        error={errors.name?.message}
      />
      <TextField
        {...register('phone')}
        label={LABELS.phone}
        type="tel"
        autoComplete="tel"
        placeholder="081234567890"
        error={errors.phone?.message}
      />
      <TextField
        {...register('email')}
        label="Email (opsional)"
        type="email"
        autoComplete="email"
        maxLength={120}
        error={errors.email?.message}
      />
      <TextField
        {...register('password')}
        label={LABELS.password}
        type="password"
        autoComplete="new-password"
        hint="Minimal 8 karakter."
        error={errors.password?.message}
      />
      <SelectField
        {...register('district')}
        label={LABELS.district}
        placeholder="Pilih kecamatan"
        options={districtOptions}
        error={errors.district?.message}
      />
      <Button type="submit" loading={isSubmitting}>
        Daftar
      </Button>
    </form>
  );
}
