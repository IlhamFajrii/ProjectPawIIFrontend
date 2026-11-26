import { useState, type ReactNode } from 'react';
import { useFieldArray, useForm, useWatch } from 'react-hook-form';
import { Button } from '../../../components/ui/Button';
import { SelectField, TextareaField, TextField } from '../../../components/ui/Field';
import { FormSummary } from '../../../components/ui/FormSummary';
import { PhotoPicker } from '../../../components/ui/PhotoPicker';
import { SegmentedControl } from '../../../components/ui/SegmentedControl';
import { UrlListFields } from '../../../components/ui/UrlListFields';
import type { ListingType } from '../../../lib/api/types';
import { DISTRICTS, LISTING_TYPE_LABEL, LISTING_TYPES, PRICE_UNIT_LABEL, PRICE_UNITS } from '../../../lib/constants';
import { formatPrice } from '../../../lib/format';
import { applyServerErrors, flattenErrors } from '../../../lib/formErrors';
import { zodResolver } from '../../../lib/zodResolver';
import { listingSchema, MAX_PRICE, type ListingFormInput, type ListingFormOutput } from '../listingSchema';
import type { AssistantProps } from './assistant';

const LABELS: Record<keyof ListingFormInput, string> = {
  type: 'Tipe',
  title: 'Judul',
  description: 'Deskripsi',
  category: 'Kategori',
  price: 'Harga',
  priceUnit: 'Satuan harga',
  district: 'Kecamatan',
  images: 'Foto',
};

interface Props {
  defaultValues: ListingFormInput;
  /** Tipe tidak bisa diubah setelah listing dibuat (FR-L6). */
  lockType?: boolean;
  submitLabel: string;
  pending: boolean;
  onSubmit: (values: ListingFormOutput) => Promise<unknown>;
  assistant?: (props: AssistantProps) => ReactNode;
}

export function ListingForm({ defaultValues, lockType, submitLabel, pending, onSubmit, assistant }: Props) {
  const [message, setMessage] = useState<string>();
  const [uploading, setUploading] = useState(false);
  const [showLinks, setShowLinks] = useState(false);
  const {
    register,
    handleSubmit,
    setError,
    setFocus,
    setValue,
    control,
    formState: { errors, isSubmitting },
  } = useForm<ListingFormInput, unknown, ListingFormOutput>({
    resolver: zodResolver(listingSchema),
    defaultValues,
  });
  const images = useFieldArray({ control, name: 'images' });
  const [type, title, description, category, price, priceUnit, urls] = useWatch({
    control,
    name: ['type', 'title', 'description', 'category', 'price', 'priceUnit', 'images'],
  });
  const priceNumber = /^\d+$/.test(price) ? Number(price) : 0;

  const submit = handleSubmit(async (values) => {
    setMessage(undefined);
    try {
      await onSubmit(values);
    } catch (error) {
      setMessage(applyServerErrors<ListingFormInput>(error, setError, Object.keys(LABELS)));
    }
  });

  return (
    <div className="grid grid-cols-1 gap-5">
      {/* Di luar <form>, karena pembantu punya form sendiri. */}
      {assistant?.({
        current: { title, description, category },
        apply: (values) => {
          for (const [name, value] of Object.entries(values)) {
            setValue(name as 'title' | 'description' | 'category', value, { shouldDirty: true, shouldValidate: true });
          }
        },
      })}
    <form noValidate onSubmit={submit} className="grid grid-cols-1 gap-5">
      <FormSummary
        message={message}
        errors={flattenErrors(errors)}
        labels={LABELS}
        onSelect={(name) => setFocus(name as 'title')}
      />

      {lockType ? (
        <TextField
          label={LABELS.type}
          value={LISTING_TYPE_LABEL[type]}
          readOnly
          hint="Tipe tidak bisa diubah setelah listing dibuat."
        />
      ) : (
        <div className="grid gap-1.5">
          <p className="text-sm font-medium" aria-hidden="true">
            {LABELS.type}
          </p>
          <SegmentedControl<ListingType>
            legend={LABELS.type}
            value={type}
            options={LISTING_TYPES.map((value) => ({ value, label: LISTING_TYPE_LABEL[value] }))}
            onChange={(value) => setValue('type', value, { shouldDirty: true })}
          />
        </div>
      )}

      <TextField {...register('title')} label={LABELS.title} maxLength={120} error={errors.title?.message} />
      <TextareaField
        {...register('description')}
        label={LABELS.description}
        maxLength={3000}
        rows={6}
        hint={<span className="tabular-nums">{description.length}/3000</span>}
        error={errors.description?.message}
      />
      <TextField
        {...register('category')}
        label={LABELS.category}
        maxLength={60}
        autoCapitalize="none"
        hint="Satu atau dua kata, misalnya elektronik."
        error={errors.category?.message}
      />
      <div className="grid gap-5 sm:grid-cols-2">
        <TextField
          {...register('price')}
          label="Harga (Rp)"
          inputMode="numeric"
          autoComplete="off"
          maxLength={String(MAX_PRICE).length}
          hint={priceNumber > 0 ? formatPrice(priceNumber, priceUnit) : 'Angka saja, tanpa titik.'}
          error={errors.price?.message}
        />
        <SelectField
          {...register('priceUnit')}
          label={LABELS.priceUnit}
          options={PRICE_UNITS.map((value) => ({ value, label: `Per ${PRICE_UNIT_LABEL[value]}` }))}
          error={errors.priceUnit?.message}
        />
      </div>
      <SelectField
        {...register('district')}
        label={LABELS.district}
        placeholder="Pilih kecamatan"
        options={DISTRICTS.map((value) => ({ value, label: value }))}
        error={errors.district?.message}
      />

      <PhotoPicker
        legend="Foto (opsional)"
        hint="Pakai fotomu sendiri, maksimal 8. Foto pertama menjadi sampul. Foto bisa dilihat siapa saja."
        urls={urls.map((item) => item.url)}
        type={type}
        onAdd={(url) => images.append({ url }, { shouldFocus: false })}
        onRemove={images.remove}
        onBusyChange={setUploading}
      />
      {/* Terbuka sendiri bila ada tautan yang salah, agar pesan errornya terlihat. */}
      <details open={showLinks || Boolean(errors.images)} onToggle={(event) => setShowLinks(event.currentTarget.open)}>
        <summary className="min-h-11 content-center text-sm font-medium">Atau tempel tautan foto</summary>
        <UrlListFields
          legend="Tautan foto"
          hint="Tautan harus diawali https://. Foto yang diunggah juga tercantum di sini."
          rows={images.fields}
          inputProps={(index) => register(`images.${index}.url`)}
          error={(index) => errors.images?.[index]?.url?.message}
          listError={errors.images?.message ?? errors.images?.root?.message}
          onAdd={() => images.append({ url: '' })}
          onRemove={images.remove}
        />
      </details>

      {/* Menunggu unggahan selesai, agar foto tidak tertinggal saat disimpan. */}
      <Button type="submit" loading={pending || isSubmitting} disabled={uploading} className="justify-self-start">
        {submitLabel}
      </Button>
    </form>
    </div>
  );
}
