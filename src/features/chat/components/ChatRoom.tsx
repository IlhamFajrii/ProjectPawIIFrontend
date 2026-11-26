import { useQuery, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, TriangleAlert } from 'lucide-react';
import { useLayoutEffect, useRef, useState } from 'react';
import { Link } from 'react-router';
import { Avatar } from '../../../components/ui/Avatar';
import { iconButtonClass } from '../../../components/ui/buttonClass';
import { LoadingBlock } from '../../../components/ui/Skeleton';
import { LoadError } from '../../../components/ui/States';
import { findConversation, getMessages } from '../../../lib/api/conversations';
import type { Message } from '../../../lib/api/types';
import { formatChatTime, formatDateTime } from '../../../lib/format';
import { useTitle } from '../../../lib/hooks';
import { queryKeys } from '../../../lib/queryKeys';
import { PAGE_SIZE, pollMessages } from '../messages';
import { describeConversation } from '../partner';
import { Composer } from './Composer';

const POLL_MS = 4000;
const NEAR_BOTTOM = 80;

function Header({ conversationId, userId }: { conversationId: string; userId: string }) {
  const conversation = useQuery({
    queryKey: queryKeys.conversation(conversationId),
    queryFn: ({ signal }) => findConversation(conversationId, signal),
  });
  const info = conversation.data ? describeConversation(conversation.data, userId) : undefined;
  const name = info?.other?.name;
  useTitle(name ? `Chat dengan ${name}` : 'Chat');

  return (
    <header className="flex items-center gap-2 border-b border-line pb-3">
      <Link to="/pesan" className={`${iconButtonClass} md:hidden`} aria-label="Kembali ke daftar percakapan">
        <ArrowLeft className="size-5" aria-hidden="true" />
      </Link>
      {info?.other && <Avatar name={info.other.name} src={info.other.avatarUrl} />}
      <div className="min-w-0">
        <h2 className="truncate text-h3">
          {info?.other ? (
            <Link to={`/pengguna/${info.other._id}`}>{info.other.name}</Link>
          ) : (
            'Percakapan'
          )}
        </h2>
        {info?.listing &&
          (info.listing.status === 'INACTIVE' ? (
            <p className="truncate text-sm text-muted">{info.listing.title} (nonaktif)</p>
          ) : (
            <Link to={`/listing/${info.listing._id}`} className="block truncate text-sm leading-6 text-muted underline">
              {info.listing.title}
            </Link>
          ))}
      </div>
    </header>
  );
}

function Bubble({ message, own, fresh }: { message: Message; own: boolean; fresh: boolean }) {
  return (
    <li
      className={`grid gap-1 ${own ? 'justify-items-end' : 'justify-items-start'} ${fresh ? (own ? 'bubble-new bubble-own' : 'bubble-new') : ''}`}
    >
      <p
        className={`max-w-[85%] rounded-card px-4 py-2 break-words whitespace-pre-wrap ${own ? 'bg-accent text-on-accent' : 'bg-surface'}`}
      >
        <span className="sr-only">{own ? 'Kamu: ' : 'Lawan bicara: '}</span>
        {message.text}
      </p>
      {message.warning && (
        <p className="flex max-w-[85%] items-start gap-1.5 text-sm font-medium text-warning">
          <TriangleAlert className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
          Hati-hati: tetap bertransaksi lewat Rekber.
        </p>
      )}
      <time dateTime={message.createdAt} title={formatDateTime(message.createdAt)} className="text-xs text-muted">
        {formatChatTime(message.createdAt)}
      </time>
    </li>
  );
}

export function ChatRoom({ conversationId, userId }: { conversationId: string; userId: string }) {
  const queryClient = useQueryClient();
  const scroller = useRef<HTMLDivElement>(null);
  const stick = useRef(true);
  const queryKey = queryKeys.messages(conversationId);

  // Mengambil pesan menandainya dibaca, jadi hanya ruang yang dibuka yang diambil.
  const messages = useQuery({
    queryKey,
    queryFn: ({ signal }) =>
      pollMessages(queryClient.getQueryData<Message[]>(queryKey) ?? [], (after) =>
        getMessages(conversationId, after, signal),
      ),
    staleTime: 0,
    refetchInterval: POLL_MS,
    // Polling berhenti saat tab tersembunyi (FR-C3).
    refetchIntervalInBackground: false,
  });
  const count = messages.data?.length ?? 0;
  // Hanya pesan yang datang setelah ruang tampil yang dianimasikan.
  const [initial, setInitial] = useState<Set<string>>();
  if (messages.data && !initial) setInitial(new Set(messages.data.map((message) => message._id)));

  // Hanya ikut ke bawah bila pengguna memang sedang di bawah.
  useLayoutEffect(() => {
    const element = scroller.current;
    if (element && stick.current) element.scrollTop = element.scrollHeight;
  }, [count]);

  return (
    <section aria-label="Ruang chat" className="flex h-full min-h-0 flex-col gap-3">
      <Header conversationId={conversationId} userId={userId} />
      {messages.isPending ? (
        <div className="flex-1">
          <LoadingBlock label="Memuat pesan" />
        </div>
      ) : !messages.data ? (
        <div className="flex-1 overflow-y-auto">
          <LoadError error={messages.error} onRetry={() => void messages.refetch()} notFound="Percakapan tidak ditemukan" />
        </div>
      ) : (
        <>
          <div
            ref={scroller}
            tabIndex={0}
            role="log"
            aria-label="Pesan"
            // relative: teks sr-only tidak boleh ikut memanjangkan halaman.
            className="relative min-h-0 flex-1 overflow-y-auto overscroll-contain px-1"
            onScroll={(event) => {
              const element = event.currentTarget;
              stick.current = element.scrollHeight - element.scrollTop - element.clientHeight < NEAR_BOTTOM;
            }}
          >
            {count >= PAGE_SIZE && (
              <p className="pb-3 text-center text-sm text-muted">Hanya pesan terbaru yang ditampilkan.</p>
            )}
            {count === 0 ? (
              <p className="py-10 text-center text-muted">Belum ada pesan. Mulai dengan menyapa.</p>
            ) : (
              <ol className="grid gap-3">
                {messages.data.map((message) => (
                  <Bubble
                    key={message._id}
                    message={message}
                    own={message.sender === userId}
                    fresh={initial !== undefined && !initial.has(message._id)}
                  />
                ))}
              </ol>
            )}
          </div>
          {messages.isError && (
            <p role="status" className="text-sm text-warning">
              Tidak bisa mengambil pesan baru. Dicoba lagi otomatis.
            </p>
          )}
          <Composer
            conversationId={conversationId}
            onSent={() => {
              stick.current = true;
            }}
          />
        </>
      )}
    </section>
  );
}
