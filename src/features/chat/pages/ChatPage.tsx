import { MessageCircle } from 'lucide-react';
import { useParams } from 'react-router';
import { useTitle } from '../../../lib/hooks';
import { useCurrentUser } from '../../../lib/session';
import { ChatRoom } from '../components/ChatRoom';
import { ConversationList } from '../components/ConversationList';

/** Desktop dua kolom, mobile satu: daftar atau ruang. */
export default function ChatPage() {
  const { id } = useParams();
  const user = useCurrentUser();
  // Di dalam ruang, judul diatur ChatRoom agar memuat nama lawan bicara.
  useTitle(id ? null : 'Pesan');

  return (
    <div className="mx-auto grid h-[calc(100dvh-var(--spacing-nav)-var(--spacing-tabbar))] w-full max-w-page grid-cols-1 grid-rows-[minmax(0,1fr)] gap-6 px-4 py-4 md:h-[calc(100dvh-var(--spacing-nav))] md:grid-cols-[20rem_minmax(0,1fr)] md:px-6 lg:px-8">
      {/* Di layar sempit daftar disembunyikan, jadi ruang chat butuh judulnya sendiri. */}
      {id && <h1 className="sr-only md:hidden">Chat</h1>}
      <div className={`relative min-h-0 overflow-y-auto ${id ? 'hidden md:block' : ''}`}>
        <h1 className="pb-4 text-h2">Pesan</h1>
        <ConversationList userId={user._id} />
      </div>
      {id ? (
        // key memastikan ruang lain tidak mewarisi isian dan posisi scroll.
        <ChatRoom key={id} conversationId={id} userId={user._id} />
      ) : (
        <div className="hidden place-content-center justify-items-center gap-3 rounded-tile bg-surface text-muted md:grid">
          <MessageCircle className="size-10" aria-hidden="true" />
          <p>Pilih percakapan untuk membacanya.</p>
        </div>
      )}
    </div>
  );
}
