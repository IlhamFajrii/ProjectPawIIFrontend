import { useId, useState } from 'react';
import { Button } from '../../../components/ui/Button';
import { SelectField, TextField } from '../../../components/ui/Field';
import { DISTRICTS, LISTING_TYPE_LABEL, LISTING_TYPES } from '../../../lib/constants';
import { emptyDraft, type FilterDraft } from '../filters';

interface Props {
  initial: FilterDraft;
  /** Saran dari hasil yang sedang tampil, karena backend tidak punya daftar kategori (G-03). */
  categories: string[];
  onApply: (draft: FilterDraft) => void;
}

const digits = (value: string) => value.replace(/\D/g, '').slice(0, 10);

export function FilterFields({ initial, categories, onApply }: Props) {
  const [draft, setDraft] = useState(initial);
  const listId = useId();
  const set = (name: keyof FilterDraft, value: string) => setDraft((current) => ({ ...current, [name]: value }));
  const inverted = draft.minPrice !== '' && draft.maxPrice !== '' && Number(draft.minPrice) > Number(draft.maxPrice);

  return (
    <form
      className="grid gap-4"
      onSubmit={(event) => {
        event.preventDefault();
        if (!inverted) onApply(draft);
      }}
    >
      <SelectField
        label="Tipe"
        placeholder="Semua tipe"
        value={draft.type}
        onChange={(event) => set('type', event.target.value)}
        options={LISTING_TYPES.map((value) => ({ value, label: LISTING_TYPE_LABEL[value] }))}
      />
      <SelectField
        label="Kecamatan"
        placeholder="Semua kecamatan"
        value={draft.district}
        onChange={(event) => set('district', event.target.value)}
        options={DISTRICTS.map((value) => ({ value, label: value }))}
      />
      <TextField
        label="Kategori"
        list={listId}
        maxLength={60}
        autoComplete="off"
        value={draft.category}
        onChange={(event) => set('category', event.target.value)}
      />
      <datalist id={listId}>
        {categories.map((category) => (
          <option key={category} value={category} />
        ))}
      </datalist>
      <div className="grid grid-cols-2 gap-3">
        <TextField
          label="Harga min (Rp)"
          inputMode="numeric"
          value={draft.minPrice}
          onChange={(event) => set('minPrice', digits(event.target.value))}
        />
        <TextField
          label="Harga maks (Rp)"
          inputMode="numeric"
          value={draft.maxPrice}
          onChange={(event) => set('maxPrice', digits(event.target.value))}
          error={inverted ? 'Lebih kecil dari harga min' : undefined}
        />
      </div>
      <div className="flex flex-wrap gap-2">
        <Button type="submit">Terapkan</Button>
        <Button
          variant="text"
          onClick={() => {
            setDraft(emptyDraft());
            onApply(emptyDraft());
          }}
        >
          Reset
        </Button>
      </div>
    </form>
  );
}
