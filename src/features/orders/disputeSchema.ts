import { z } from '../../lib/zod';
import { DISPUTE_REASONS } from '../../lib/constants';
import { requiredText, urlItems } from '../../lib/schemas';

export const disputeSchema = z.object({
  reason: z.enum(DISPUTE_REASONS, { error: 'Pilih alasan' }),
  description: requiredText('Penjelasan', 2000),
  evidence: urlItems,
});
