import { useMutation, useQueryClient } from '@tanstack/react-query';
import type { ReactNode } from 'react';
import { useNavigate } from 'react-router';
import { Page } from '../../../components/ui/Page';
import { createListing } from '../../../lib/api/listings';
import { queryKeys } from '../../../lib/queryKeys';
import { useCurrentUser } from '../../../lib/session';
import { useToast } from '../../../lib/toast';
import type { AssistantProps } from '../components/assistant';
import { ListingForm } from '../components/ListingForm';
import { formValues, toPayload, type ListingFormOutput } from '../listingSchema';

export default function CreateListingPage({ assistant }: { assistant?: (props: AssistantProps) => ReactNode }) {
  const user = useCurrentUser();
  const navigate = useNavigate();
  const toast = useToast();
  const queryClient = useQueryClient();

  const create = useMutation({
    mutationFn: (values: ListingFormOutput) => createListing({ ...toPayload(values), type: values.type }),
    onSuccess: async (listing) => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.listings() });
      void queryClient.invalidateQueries({ queryKey: queryKeys.myListings() });
      toast.success('Listing sudah tayang.');
      // Ditunggu agar tombol tidak aktif lagi selagi halaman tujuan diunduh.
      await navigate(`/listing/${listing._id}`);
    },
  });

  return (
    <Page title="Pasang listing" width="narrow">
      <ListingForm
        defaultValues={formValues(undefined, user.district)}
        submitLabel="Pasang listing"
        pending={create.isPending}
        onSubmit={(values) => create.mutateAsync(values)}
        assistant={assistant}
      />
    </Page>
  );
}
