// Pratinjau komponen untuk development. Rutenya tidak ada di build production.
import { useState } from 'react';
import { ListingCard } from '../../components/listing/ListingCard';
import { OrderSummaryCard } from '../../components/order/OrderSummaryCard';
import { OrderTimeline } from '../../components/order/OrderTimeline';
import { StatusBadge } from '../../components/order/StatusBadge';
import { Avatar } from '../../components/ui/Avatar';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { Chip } from '../../components/ui/Chip';
import { ConfirmDialog } from '../../components/ui/ConfirmDialog';
import { Dialog } from '../../components/ui/Dialog';
import { SelectField, TextareaField, TextField } from '../../components/ui/Field';
import { FormSummary } from '../../components/ui/FormSummary';
import { Page } from '../../components/ui/Page';
import { Pagination } from '../../components/ui/Pagination';
import { SegmentedControl } from '../../components/ui/SegmentedControl';
import { LoadingBlock } from '../../components/ui/Skeleton';
import { EmptyState, ErrorState } from '../../components/ui/States';
import { ApiError } from '../../lib/api/client';
import type { Listing } from '../../lib/api/types';
import { ORDER_STATUSES } from '../../lib/constants';
import { useToast } from '../../lib/toast';

const listing: Listing = {
  _id: 'pratinjau',
  owner: 'x',
  type: 'SEWA',
  title: 'Contoh listing tanpa foto dengan judul yang cukup panjang untuk dua baris',
  description: 'Contoh',
  category: 'contoh',
  price: 75000,
  priceUnit: 'HARI',
  district: 'Ilir Barat I',
  images: [],
  status: 'ACTIVE',
  createdAt: '',
  updatedAt: '',
};

export default function PreviewPage() {
  const toast = useToast();
  const [segment, setSegment] = useState<'a' | 'b' | 'c'>('a');
  const [page, setPage] = useState(1);
  const [dialog, setDialog] = useState<'form' | 'confirm' | null>(null);
  const [text, setText] = useState('');
  const [count, setCount] = useState(1);
  const history = ORDER_STATUSES.slice(0, count).map((status) => ({ status, by: 'b', at: new Date().toISOString() }));

  return (
    <Page title="Pratinjau komponen" intro="Hanya untuk development." width="narrow">
      <div className="flex flex-wrap gap-3">
        <Button>Utama</Button>
        <Button variant="secondary">Sekunder</Button>
        <Button variant="text">Teks</Button>
        <Button variant="danger">Bahaya</Button>
        <Button loading>Memuat</Button>
        <Button disabled>Nonaktif</Button>
      </div>
      <TextField label="Field" hint="Petunjuk" />
      <TextField label="Field dengan error" error="Wajib diisi" />
      <TextareaField label="Textarea" />
      <SelectField label="Select" placeholder="Pilih" options={[{ value: '1', label: 'Satu' }]} />
      <SegmentedControl
        legend="Segmented control"
        value={segment}
        onChange={setSegment}
        options={[
          { value: 'a', label: 'Sistem' },
          { value: 'b', label: 'Terang' },
          { value: 'c', label: 'Gelap' },
        ]}
      />
      <div className="flex flex-wrap items-center gap-3">
        <Chip label="Filter aktif" onRemove={() => {}} />
        <Avatar name="Contoh" />
        <Avatar name="Contoh" size="lg" />
      </div>
      <Card>Kartu</Card>
      <FormSummary errors={[{ name: 'title', message: 'Judul wajib diisi' }]} labels={{ title: 'Judul' }} />
      <Pagination page={page} limit={10} total={30} onChange={setPage} />
      <LoadingBlock rows={1} />
      <EmptyState title="Kosong" action={<Button>Langkah berikutnya</Button>}>
        Penjelasan keadaan kosong.
      </EmptyState>
      <ErrorState error={new ApiError(500, 'Contoh pesan gagal')} onRetry={() => toast.success('Mencoba lagi')} />
      <div className="max-w-xs">
        <ListingCard listing={listing} />
      </div>
      <div className="flex flex-wrap gap-2">
        {ORDER_STATUSES.map((status) => (
          <StatusBadge key={status} status={status} />
        ))}
      </div>
      <OrderSummaryCard
        order={{
          orderCode: 'PNY-CONTOH',
          listingSnapshot: { title: 'Contoh pesanan', type: 'SEWA', price: 75000, priceUnit: 'HARI' },
          quantity: 2,
          amount: 150000,
          status: 'HELD_IN_ESCROW',
        }}
      />
      <Button variant="secondary" onClick={() => setCount((value) => (value % 5) + 1)}>
        Tambah tahap timeline
      </Button>
      <OrderTimeline history={history} buyerId="b" sellerId="s" />

      <div className="flex flex-wrap gap-3">
        <Button onClick={() => setDialog('form')}>Dialog berisian</Button>
        <Button variant="secondary" onClick={() => setDialog('confirm')}>
          Dialog konfirmasi
        </Button>
        <Button variant="secondary" onClick={() => toast.success('Toast sukses')}>
          Toast sukses
        </Button>
        <Button variant="secondary" onClick={() => toast.error('Toast gagal, bertahan sampai ditutup')}>
          Toast gagal
        </Button>
      </div>
      <Dialog
        open={dialog === 'form'}
        onClose={() => {
          setText('');
          setDialog(null);
        }}
        title="Dialog berisian"
        lightDismiss
        dirty={text !== ''}
      >
        <TextField label="Ketik lalu coba tutup" data-autofocus="" value={text} onChange={(event) => setText(event.target.value)} />
      </Dialog>
      <ConfirmDialog
        open={dialog === 'confirm'}
        title="Hapus contoh?"
        confirmLabel="Hapus"
        destructive
        onConfirm={() => setDialog(null)}
        onClose={() => setDialog(null)}
      >
        <p>Fokus awal ada di tombol Batal.</p>
      </ConfirmDialog>
    </Page>
  );
}
