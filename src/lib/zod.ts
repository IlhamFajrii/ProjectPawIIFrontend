import { z } from 'zod';

// Zod 4 mencoba `new Function` untuk mempercepat parsing. CSP production melarang eval,
// jadi JIT dimatikan. Semua skema mengimpor `z` dari sini.
z.config({ jitless: true });

export { z };
