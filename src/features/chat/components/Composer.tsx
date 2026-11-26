import { useMutation, useQueryClient } from '@tanstack/react-query';
import { SendHorizontal } from 'lucide-react';
import { useId, useRef, useState } from 'react';
import { Button } from '../../../components/ui/Button';
import { sendMessage } from '../../../lib/api/conversations';
import { errorMessage } from '../../../lib/formErrors';
import { queryKeys } from '../../../lib/queryKeys';

const MAX = 2000;

export function Composer({ conversationId, onSent }: { conversationId: string; onSent: () => void }) {
  const queryClient = useQueryClient();
  const id = useId();
  const [text, setText] = useState('');
  const field = useRef<HTMLTextAreaElement>(null);
  const sending = useRef(false);

  const send = useMutation({
    mutationFn: (value: string) => sendMessage(conversationId, value),
    onSuccess: () => {
      setText('');
      onSent();
      // Pesan diambil lewat polling biasa agar kursor `after` tidak melompati pesan lawan.
      void queryClient.invalidateQueries({ queryKey: queryKeys.messages(conversationId) });
      void queryClient.invalidateQueries({ queryKey: queryKeys.conversations() });
      field.current?.focus();
    },
    onSettled: () => {
      sending.current = false;
    },
  });

  const submit = () => {
    const value = text.trim();
    if (!value || sending.current) return;
    sending.current = true;
    send.mutate(value);
  };

  return (
    <form
      className="grid gap-2 border-t border-line pt-3"
      onSubmit={(event) => {
        event.preventDefault();
        submit();
      }}
    >
      {send.isError && (
        <p role="alert" id={`${id}-error`} className="text-sm font-medium text-danger">
          Pesan belum terkirim. {errorMessage(send.error)} Isian masih ada: tekan Kirim ulang.
        </p>
      )}
      <div className="flex items-end gap-2">
        <label htmlFor={id} className="sr-only">
          Tulis pesan
        </label>
        <textarea
          id={id}
          ref={field}
          rows={2}
          maxLength={MAX}
          value={text}
          // Tetap bisa difokus selagi mengirim.
          readOnly={send.isPending}
          placeholder="Tulis pesan"
          aria-describedby={`${id}-hint`}
          className="min-w-0 flex-1 resize-none rounded-input border border-control bg-bg px-3 py-2 read-only:bg-surface"
          onChange={(event) => {
            setText(event.target.value);
            if (send.isError) send.reset();
          }}
          onKeyDown={(event) => {
            if (event.key !== 'Enter' || event.shiftKey || event.nativeEvent.isComposing) return;
            event.preventDefault();
            submit();
          }}
        />
        <Button type="submit" loading={send.isPending} disabled={!text.trim()}>
          {!send.isPending && <SendHorizontal className="size-5" aria-hidden="true" />}
          {send.isError ? 'Kirim ulang' : 'Kirim'}
        </Button>
      </div>
      <p id={`${id}-hint`} className="text-xs text-muted">
        Enter untuk mengirim, Shift+Enter untuk baris baru. {text.length > MAX - 200 && `${text.length}/${MAX}`}
      </p>
    </form>
  );
}
