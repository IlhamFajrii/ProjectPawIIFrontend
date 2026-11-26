import { Sparkles } from 'lucide-react';
import { useState } from 'react';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { AiDraftDialog } from '../features/ai/components/AiDraftDialog';
import type { AssistantProps } from '../features/listings/components/assistant';
import CreateListingPage from '../features/listings/pages/CreateListingPage';

function AiAssistant({ current, apply }: AssistantProps) {
  const [open, setOpen] = useState(false);
  return (
    <Card className="flex flex-wrap items-center justify-between gap-3">
      <p className="min-w-0 flex-1 basis-56">
        <span className="block font-semibold">Mulai dari foto</span>
        <span className="block text-sm text-muted">AI menyarankan judul, deskripsi, dan kategori.</span>
      </p>
      <Button variant="secondary" onClick={() => setOpen(true)}>
        <Sparkles className="size-5" aria-hidden="true" />
        Isi dengan AI
      </Button>
      <AiDraftDialog open={open} onClose={() => setOpen(false)} current={current} onApply={apply} />
    </Card>
  );
}

/** Merakit fitur listing dan AI tanpa membuat keduanya saling mengimpor. */
export default function SellPage() {
  return <CreateListingPage assistant={(props) => <AiAssistant {...props} />} />;
}
