import { useQuery } from '@tanstack/react-query';
import { CalendarDays, MapPin, ThumbsUp } from 'lucide-react';
import { useParams } from 'react-router';
import { Avatar } from '../../../components/ui/Avatar';
import { Card } from '../../../components/ui/Card';
import { Page } from '../../../components/ui/Page';
import { LoadingBlock } from '../../../components/ui/Skeleton';
import { LoadError } from '../../../components/ui/States';
import { getPublicProfile } from '../../../lib/api/users';
import { formatDate } from '../../../lib/format';
import { queryKeys } from '../../../lib/queryKeys';

export default function PublicProfilePage() {
  const { id = '' } = useParams();
  const profile = useQuery({
    queryKey: queryKeys.profile(id),
    queryFn: ({ signal }) => getPublicProfile(id, signal),
  });

  return (
    <Page title={profile.data?.name ?? 'Profil pengguna'} width="narrow">
      {profile.isPending ? (
        <LoadingBlock label="Memuat profil" rows={2} />
      ) : !profile.data ? (
        <LoadError error={profile.error} onRetry={() => void profile.refetch()} notFound="Pengguna tidak ditemukan" />
      ) : (
        <Card className="grid gap-4">
          <Avatar name={profile.data.name} src={profile.data.avatarUrl} size="lg" />
          <ul className="grid gap-2">
            {profile.data.district && (
              <li className="flex items-center gap-2">
                <MapPin className="size-5 text-muted" aria-hidden="true" />
                {profile.data.district}
              </li>
            )}
            <li className="flex items-center gap-2">
              <CalendarDays className="size-5 text-muted" aria-hidden="true" />
              Bergabung sejak {formatDate(profile.data.createdAt)}
            </li>
            <li className="flex items-center gap-2">
              <ThumbsUp className="size-5 text-muted" aria-hidden="true" />
              <span className="tabular-nums">{profile.data.vouchCount} total vouch</span>
            </li>
          </ul>
        </Card>
      )}
    </Page>
  );
}
