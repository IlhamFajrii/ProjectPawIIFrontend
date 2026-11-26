import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import type { z } from 'zod';
import { Button } from '../../../components/ui/Button';
import { TextField } from '../../../components/ui/Field';
import { FormSummary } from '../../../components/ui/FormSummary';
import { login } from '../../../lib/api/auth';
import { applyServerErrors, flattenErrors } from '../../../lib/formErrors';
import { useSession } from '../../../lib/session';
import { useToast } from '../../../lib/toast';
import { zodResolver } from '../../../lib/zodResolver';
import { loginSchema } from '../schemas';
import type { AuthFormProps } from './authFormProps';

const LABELS = { identifier: 'Nomor HP atau email', password: 'Password' };

export function LoginForm({ onDone, onState, autoFocus }: AuthFormProps) {
  const { signIn } = useSession();
  const toast = useToast();
  const [message, setMessage] = useState<string>();
  const {
    register,
    handleSubmit,
    setError,
    setFocus,
    formState: { errors, isDirty, isSubmitting },
  } = useForm<z.input<typeof loginSchema>>({
    resolver: zodResolver(loginSchema),
    defaultValues: { identifier: '', password: '' },
  });

  useEffect(() => onState?.({ dirty: isDirty, busy: isSubmitting }), [onState, isDirty, isSubmitting]);

  const submit = handleSubmit(async (values) => {
    setMessage(undefined);
    try {
      const { token, user } = await login(values);
      signIn(token, user);
      toast.success(`Selamat datang, ${user.name}.`);
      onDone();
    } catch (error) {
      setMessage(applyServerErrors(error, setError, Object.keys(LABELS)));
    }
  });

  return (
    <form noValidate onSubmit={submit} className="grid gap-4">
      <FormSummary message={message} errors={flattenErrors(errors)} labels={LABELS} onSelect={(name) => setFocus(name as 'identifier')} />
      <TextField
        {...register('identifier')}
        label={LABELS.identifier}
        autoComplete="username"
        autoCapitalize="none"
        data-autofocus={autoFocus ? '' : undefined}
        error={errors.identifier?.message}
      />
      <TextField
        {...register('password')}
        label={LABELS.password}
        type="password"
        autoComplete="current-password"
        error={errors.password?.message}
      />
      <Button type="submit" loading={isSubmitting}>
        Masuk
      </Button>
    </form>
  );
}
