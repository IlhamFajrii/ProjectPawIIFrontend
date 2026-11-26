import { CalendarClock, ListChecks, Package, Wrench, type LucideIcon } from 'lucide-react';
import type { ListingType } from '../../lib/api/types';

export const TYPE_ICON: Record<ListingType, LucideIcon> = {
  BARANG: Package,
  SEWA: CalendarClock,
  JASA: Wrench,
  TUGAS: ListChecks,
};
