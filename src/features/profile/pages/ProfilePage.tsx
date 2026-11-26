import { useMutation, useQueryClient } from '@tanstack/react-query';
import { ChevronRight, ImagePlus, LogOut, Trash2 } from 'lucide-react';
import { useRef, useState } from 'react';
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
import { uploadPhoto } from '../../../lib/uploadPhoto';
import { useSignOut } from '../../../lib/useSignOut';
import { zodResolver } from '../../../lib/zodResolver';
import { profileSchema } from '../schema';

type Input = z.input<typeof profileSchema>;

const LABELS: Record<keyof Input, string> = {
  name: 'Nama',
  district: 'Kecamatan',
  email: 'Email',
  avatarUrl: 'Tautan foto profil',
};

export default function ProfilePage() {
  const user = useCurrentUser();
  const toast = useToast();
  const signOut = useSignOut();
  const theme = useThemePreference();
  const queryClient = useQueryClient();
  const [message, setMessage] = useState<string>();
  const fileInput = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [photoError, setPhotoError] = useState<string>();
  const [showLink, setShowLink] = useState(false);
  const {
    register,
    handleSubmit,
    setError,
    setFocus,
    setValue,
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

  const setPhoto = (url: string) => setValue('avatarUrl', url, { shouldDirty: true, shouldValidate: true });

  const pickPhoto = async (file: File) => {
    setPhotoError(undefined);
    setUploading(true);
    try {
      setPhoto(await uploadPhoto(file, user._id, 'avatars'));
    } catch (cause) {
      setPhotoError(cause instanceof Error ? cause.message : 'Foto gagal diunggah. Coba lagi.');
    } finally {
      setUploading(false);
    }
  };

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
          <div className="grid min-w-0 gap-2">
            <div className="flex flex-wrap gap-2">
              <Button variant="secondary" loading={uploading} onClick={() => fileInput.current?.click()}>
                <ImagePlus className="size-5" aria-hidden="true" />
                Pilih foto
              </Button>
              {avatarUrl && (
                <Button variant="text" disabled={uploading} onClick={() => setPhoto('')}>
                  <Trash2 className="size-5" aria-hidden="true" />
                  Hapus foto
                </Button>
              )}
            </div>
            <p role="status" className="text-sm text-muted">
              {uploading
                ? 'Mengunggah foto…'
                : avatarUrl !== (user.avatarUrl ?? '')
                  ? 'Tekan "Simpan perubahan" untuk memakai foto ini.'
                  : 'Dari galeri atau kamera. Foto profil bisa dilihat siapa saja.'}
            </p>
            {photoError && (
              <p role="alert" className="text-sm font-medium text-danger">
                {photoError}
              </p>
            )}
          </div>
          <input
            ref={fileInput}
            type="file"
            accept="image/*"
            hidden
            onChange={(event) => {
              const file = event.target.files?.[0];
              // Dikosongkan agar foto yang sama bisa dipilih lagi.
              event.target.value = '';
              if (file) void pickPhoto(file);
            }}
          />
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
        <details
          open={showLink || Boolean(errors.avatarUrl)}
          onToggle={(event) => setShowLink(event.currentTarget.open)}
        >
          <summary className="min-h-11 content-center text-sm font-medium">Atau tempel tautan foto</summary>
          <TextField
            {...register('avatarUrl')}
            label={LABELS.avatarUrl}
            type="url"
            inputMode="url"
            placeholder="https://"
            autoComplete="off"
            error={errors.avatarUrl?.message}
          />
        </details>
        <div className="flex flex-wrap items-center gap-3">
          <Button type="submit" loading={save.isPending} disabled={!isDirty || uploading}>
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
