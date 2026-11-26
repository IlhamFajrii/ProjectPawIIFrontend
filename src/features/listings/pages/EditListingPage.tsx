import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Lock } from 'lucide-react';
import { Link, useNavigate, useParams } from 'react-router';
import { buttonClass } from '../../../components/ui/buttonClass';
import { Page } from '../../../components/ui/Page';
import { LoadingBlock } from '../../../components/ui/Skeleton';
import { EmptyState, ErrorState, NotFoundState } from '../../../components/ui/States';
import { findMyListing, updateListing } from '../../../lib/api/listings';
import { queryKeys } from '../../../lib/queryKeys';
import { useCurrentUser } from '../../../lib/session';
import { useToast } from '../../../lib/toast';
import { ListingForm } from '../components/ListingForm';
import { formValues, toPayload, type ListingFormOutput } from '../listingSchema';

const mine = (
  <Link to="/saya/listing" className={buttonClass()}>
    Ke listing saya
  </Link>
);

export default function EditListingPage() {
  const { id = '' } = useParams();
  const user = useCurrentUser();
  const navigate = useNavigate();
  const toast = useToast();
  const queryClient = useQueryClient();
  // Diambil dari `mine`, sehingga hanya pemilik yang bisa membuka form ini (G-05).
  const listing = useQuery({
    queryKey: queryKeys.myListing(id),
    queryFn: ({ signal }) => findMyListing(id, signal),
    // Form tidak boleh ditimpa pengambilan ulang saat sedang diisi.
    refetchOnWindowFocus: false,
    gcTime: 0,
  });

  const update = useMutation({
    mutationFn: (values: ListingFormOutput) => updateListing(id, toPayload(values)),
    onSuccess: async () => {
      for (const queryKey of [queryKeys.listings(), queryKeys.listing(id), ['my-listings']]) {
        void queryClient.invalidateQueries({ queryKey });
      }
      toast.success('Perubahan disimpan.');
      await navigate(`/listing/${id}`);
    },
  });

  return (
    <Page title="Ubah listing" width="narrow">
      {listing.isPending ? (
        <LoadingBlock label="Memuat listing" />
      ) : listing.data === undefined ? (
        <ErrorState error={listing.error} onRetry={() => void listing.refetch()} />
      ) : listing.data === null ? (
        <NotFoundState title="Listing tidak ada di akunmu" action={mine} />
      ) : listing.data.status === 'INACTIVE' ? (
        <EmptyState icon={Lock} title="Listing ini sudah dinonaktifkan" action={mine}>
          Listing nonaktif tidak bisa diaktifkan lagi. Buat listing baru kalau ingin menawarkannya kembali.
        </EmptyState>
      ) : (
        <ListingForm
          key={listing.data._id}
          defaultValues={formValues(listing.data, user.district)}
          lockType
          submitLabel="Simpan perubahan"
          pending={update.isPending}
          onSubmit={(values) => update.mutateAsync(values)}
        />
      )}
    </Page>
  );
}
