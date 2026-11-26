import {
  CircleCheck,
  CircleX,
  Clock,
  Hammer,
  ShieldCheck,
  TriangleAlert,
  Truck,
  Undo2,
  type LucideIcon,
} from 'lucide-react';
import type { OrderStatus } from '../../lib/api/types';

export const STATUS_STYLE: Record<OrderStatus, { icon: LucideIcon; tone: string }> = {
  PENDING_PAYMENT: { icon: Clock, tone: 'text-warning' },
  HELD_IN_ESCROW: { icon: ShieldCheck, tone: 'text-accent' },
  IN_PROGRESS: { icon: Hammer, tone: 'text-accent' },
  DELIVERED: { icon: Truck, tone: 'text-accent' },
  COMPLETED: { icon: CircleCheck, tone: 'text-success' },
  CANCELLED: { icon: CircleX, tone: 'text-muted' },
  DISPUTED: { icon: TriangleAlert, tone: 'text-warning' },
  REFUNDED: { icon: Undo2, tone: 'text-muted' },
};
