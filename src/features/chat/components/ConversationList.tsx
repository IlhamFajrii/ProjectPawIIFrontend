import { keepPreviousData, useQuery } from '@tanstack/react-query';
import { useState } from 'react';
import { Link, NavLink } from 'react-router';
import { Avatar } from '../../../components/ui/Avatar';
import { buttonClass } from '../../../components/ui/buttonClass';
import { Pagination } from '../../../components/ui/Pagination';
import { LoadingBlock } from '../../../components/ui/Skeleton';
import { EmptyState, ErrorState } from '../../../components/ui/States';
import { getConversations } from '../../../lib/api/conversations';
import { formatChatTime } from '../../../lib/format';
import { queryKeys } from '../../../lib/queryKeys';
import { describeConversation } from '../partner';

export function ConversationList({ userId }: { userId: string }) {
  const [page, setPage] = useState(1);
  const conversations = useQuery({
    queryKey: queryKeys.conversations(page),
    queryFn: ({ signal }) => getConversations(page, 20, signal),
    // Diperbarui hanya saat tab terlihat (FR-C2).
    refetchInterval: 15_000,
    refetchIntervalInBackground: false,
    placeholderData: keepPreviousData,
  });

  if (conversations.isPending) return <LoadingBlock label="Memuat percakapan" />;
  if (conversations.isError && !conversations.data) {
    return <ErrorState error={conversations.error} onRetry={() => void conversations.refetch()} />;
  }
  const data = conversations.data;
  if (!data || data.items.length === 0) {
    return (
      <EmptyState
        title="Belum ada percakapan"
        action={
          <Link to="/jelajah" className={buttonClass()}>
            Jelajahi listing
          </Link>
        }
      >
        Tekan Chat di halaman listing untuk bertanya ke penjual.
      </EmptyState>
    );
  }

  return (
    <>
      {conversations.isError && (
        <p role="status" className="text-sm text-warning">
          Daftar belum diperbarui. Akan dicoba lagi.
        </p>
      )}
      <ul className="grid gap-1">
        {data.items.map((conversation) => {
          const { other, listing } = describeConversation(conversation, userId);
          return (
            <li key={conversation._id}>
              <NavLink
                to={`/pesan/${conversation._id}`}
                className="pressable flex min-h-18 items-start gap-3 rounded-card p-3 hover:bg-surface aria-[current=page]:bg-surface"
              >
                <Avatar name={other?.name ?? 'Pengguna'} src={other?.avatarUrl} />
                <span className="min-w-0 flex-1">
                  <span className="flex items-baseline justify-between gap-2">
                    <span className="truncate font-semibold">{other?.name ?? 'Pengguna'}</span>
                    <time dateTime={conversation.lastMessageAt} className="shrink-0 text-xs text-muted">
                      {formatChatTime(conversation.lastMessageAt)}
                    </time>
                  </span>
                  <span className="block truncate text-sm text-muted">{listing?.title}</span>
                  <span className="block truncate text-sm">
                    {conversation.lastMessage ?? <span className="text-muted italic">Belum ada pesan</span>}
                  </span>
                </span>
              </NavLink>
            </li>
          );
        })}
      </ul>
      <Pagination page={data.page} limit={data.limit} total={data.total} onChange={setPage} />
    </>
  );
}
