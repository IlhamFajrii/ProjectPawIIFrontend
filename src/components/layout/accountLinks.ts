import { LayoutList, MessageCircle, ReceiptText, Scale, Users, type LucideIcon } from 'lucide-react';
import type { User } from '../../lib/api/types';

export function accountLinks(user: User): { to: string; label: string; icon: LucideIcon }[] {
  return [
    { to: '/pesanan', label: 'Pesanan', icon: ReceiptText },
    { to: '/pesan', label: 'Pesan', icon: MessageCircle },
    { to: '/saya/listing', label: 'Listing saya', icon: LayoutList },
    { to: '/circle', label: 'Circle', icon: Users },
    { to: '/sengketa', label: user.role === 'admin' ? 'Panel sengketa' : 'Sengketa', icon: Scale },
  ];
}
