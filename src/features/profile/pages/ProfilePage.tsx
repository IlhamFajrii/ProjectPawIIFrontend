import { useMutation, useQueryClient } from '@tanstack/react-query';
import { ChevronRight, LogOut } from 'lucide-react';
import { useState } from 'react';
import { useForm, useWatch } from 'react-hook-form';
import { Link } from 'react-router';
import type { z } from 'zod';
import { accountLinks } from '../../../components/layout/accountLinks';
import { THEME_OPTIONS } from '../../../components/layout/themeOptions';
import { Avatar } from '../../../components/ui/Avatar';
import { Button } from '../../../components/ui/Button';
import { buttonClass } from '../../../components/ui/buttonClass';
import { Card } from '../../../components/ui/Card';
import { SelectField, TextField } from '../../../components/ui/Field';
import { FormSummary } from '../../../components/ui/FormSummary';
import { Page } from '../../../components/ui/Page';
import { SegmentedControl } from '../../../components/ui/SegmentedControl';
import { updateProfile } from '../../../lib/api/users';
import { DISTRICTS } from '../../../lib/constants';
import { applyServerErrors, flattenErrors } from '../../../lib/formErrors';
import { queryKeys } from '../../../lib/queryKeys';
import { useCurrentUser } from '../../../lib/session';
import { setThemeWithReveal, useThemePreference } from '../../../lib/theme';
import { useToast } from '../../../lib/toast';
import { useSignOut } from '../../../lib/useSignOut';
import { zodResolver } from '../../../lib/zodResolver';
import { profileSchema } from '../schema';

type Input = z.input<typeof profileSchema>;

const LABELS: Record<keyof Input, string> = {
  name: 'Nama',
  district: 'Kecamatan',
  email: 'Email',
  avatarUrl: 'URL foto profil',
};

export default function ProfilePage() {
  const user = useCurrentUser();
  const toast = useToast();
  const signOut = useSignOut();
  const theme = useThemePreference();
  const queryClient = useQueryClient();
  const [message, setMessage] = useState<string>();
  const {
    register,
    handleSubmit,
    setError,
    setFocus,
    control,
    formState: { errors, isDirty },
  } = useForm<Input, unknown, z.output<typeof profileSchema>>({
    resolver: zodResolver(profileSchema),
    // `values` menyelaraskan form dengan data server setelah tersimpan.
    values: {
      name: user.name,
      district: user.district as Input['district'],
      email: user.email ?? '',
      avatarUrl: user.avatarUrl ?? '',
    },
  });
  const [name, avatarUrl] = useWatch({ control, name: ['name', 'avatarUrl'] });

  const save = useMutation({
    mutationFn: updateProfile,
    onSuccess: (updated) => {
      queryClient.setQueryData(queryKeys.me, updated);
      void queryClient.invalidateQueries({ queryKey: queryKeys.profile(updated._id) });
      toast.success('Profil disimpan.');
    },
    onError: (error) =>
      setMessage(
        applyServerErrors<Input>(error, setError, Object.keys(LABELS), (text) =>
          /email/i.test(text) ? 'email' : undefined,
        ),
      ),
  });

  return (
    <Page title="Profil" width="narrow">
      <form
        noValidate
        className="grid gap-4"
        onSubmit={handleSubmit((values) => {
          setMessage(undefined);
          save.mutate(values);
        })}
      >
        <FormSummary message={message} errors={flattenErrors(errors)} labels={LABELS} onSelect={(field) => setFocus(field as keyof Input)} />
        <div className="flex items-center gap-4">
          <Avatar name={name || user.name} src={avatarUrl} size="lg" />
          <p className="text-sm text-muted">Pratinjau foto profil. Kalau tautannya rusak, yang tampil huruf awal namamu.</p>
        </div>
        <TextField {...register('name')} label={LABELS.name} maxLength={80} autoComplete="name" error={errors.name?.message} />
        <TextField label="Nomor HP" value={user.phone} readOnly hint="Nomor HP belum bisa diubah." />
        <TextField
          {...register('email')}
          label="Email (boleh dikosongkan)"
          type="email"
          autoComplete="email"
          maxLength={120}
          error={errors.email?.message}
        />
        <SelectField
          {...register('district')}
          label={LABELS.district}
          options={DISTRICTS.map((value) => ({ value, label: value }))}
          error={errors.district?.message}
        />
        <TextField
          {...register('avatarUrl')}
          label={LABELS.avatarUrl}
          type="url"
          inputMode="url"
          placeholder="https://"
          autoComplete="off"
          error={errors.avatarUrl?.message}
        />
        <div className="flex flex-wrap items-center gap-3">
          <Button type="submit" loading={save.isPending} disabled={!isDirty}>
            Simpan perubahan
          </Button>
          <Link to={`/pengguna/${user._id}`} className={buttonClass('text')}>
            Lihat profil publik
          </Link>
        </div>
      </form>

      <section aria-labelledby="akun" className="grid gap-3">
        <h2 id="akun" className="text-h2">
          Akun
        </h2>
        <Card className="p-2">
          <ul>
            {accountLinks(user).map(({ to, label, icon: Icon }) => (
              <li key={to}>
                <Link to={to} className="pressable flex min-h-12 items-center gap-3 rounded-input px-3 hover:bg-bg">
                  <Icon className="size-5 text-muted" aria-hidden="true" />
                  <span className="flex-1">{label}</span>
                  <ChevronRight className="size-5 text-muted" aria-hidden="true" />
                </Link>
              </li>
            ))}
          </ul>
        </Card>
      </section>

      <section aria-labelledby="tema" className="grid gap-3">
        <h2 id="tema" className="text-h2">
          Tema
        </h2>
        <SegmentedControl
          legend="Tema"
          value={theme}
          options={THEME_OPTIONS}
          onChange={(value) => setThemeWithReveal(value, document.activeElement?.closest('label'))}
        />
      </section>

      <Button variant="secondary" className="justify-self-start" onClick={() => void signOut()}>
        <LogOut className="size-5" aria-hidden="true" />
        Keluar
      </Button>
    </Page>
  );
}
