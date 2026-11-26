export type ListingType = 'BARANG' | 'SEWA' | 'JASA' | 'TUGAS';
export type PriceUnit = 'ITEM' | 'HARI' | 'JAM' | 'KUNJUNGAN' | 'TRIP';
export type ListingStatus = 'ACTIVE' | 'RESERVED' | 'SOLD' | 'INACTIVE';
export type OrderStatus =
  | 'PENDING_PAYMENT'
  | 'HELD_IN_ESCROW'
  | 'IN_PROGRESS'
  | 'DELIVERED'
  | 'COMPLETED'
  | 'CANCELLED'
  | 'DISPUTED'
  | 'REFUNDED';
export type DisputeReason = 'BARANG_TIDAK_SESUAI' | 'BARANG_TIDAK_DIKIRIM' | 'JASA_TIDAK_SELESAI' | 'LAINNYA';
export type DisputeStatus = 'OPEN' | 'RESOLVED';
export type DisputeResolution = 'RELEASE' | 'REFUND';

export interface Paginated<T> {
  items: T[];
  page: number;
  limit: number;
  total: number;
}

export interface User {
  _id: string;
  name: string;
  phone: string;
  email?: string;
  district: string;
  avatarUrl?: string;
  role: 'user' | 'admin';
  createdAt: string;
  updatedAt: string;
}

export interface UserSummary {
  _id: string;
  name: string;
  district?: string;
  avatarUrl?: string;
  createdAt?: string;
}

export interface PublicProfile extends UserSummary {
  vouchCount: number;
}

/** `owner` berupa objek di list publik dan detail; berupa string di mine, create, update, delete. */
export interface Listing {
  _id: string;
  owner: UserSummary | string;
  type: ListingType;
  title: string;
  description: string;
  category: string;
  price: number;
  priceUnit: PriceUnit;
  district: string;
  images: string[];
  status: ListingStatus;
  createdAt: string;
  updatedAt: string;
}

export interface OrderHistoryEntry {
  status: OrderStatus;
  by: string;
  at: string;
}

/** `buyer` dan `seller` berupa objek di GET list dan detail; string di create dan aksi. */
export interface Order {
  _id: string;
  orderCode: string;
  listing: string;
  buyer: UserSummary | string;
  seller: UserSummary | string;
  listingSnapshot: { title: string; type: ListingType; price: number; priceUnit: PriceUnit };
  quantity: number;
  amount: number;
  note?: string;
  status: OrderStatus;
  statusHistory: OrderHistoryEntry[];
  createdAt: string;
  updatedAt: string;
}

/** `order` berupa objek (buyer/seller string) di list dan detail; string di open dan resolve. */
export interface Dispute {
  _id: string;
  order: Order | string;
  openedBy: string;
  reason: DisputeReason;
  description: string;
  evidence: string[];
  status: DisputeStatus;
  resolution?: DisputeResolution;
  adminNote?: string;
  resolvedBy?: string;
  resolvedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Circle {
  _id: string;
  name: string;
  owner: string;
  inviteCode: string;
  members: { user: string; joinedAt: string }[];
}

export interface CircleMember {
  user: UserSummary;
  joinedAt: string;
  vouchCount: number;
}

export interface CircleDetail extends Omit<Circle, 'members'> {
  members: CircleMember[];
}

/** `listing` dan `participants` berupa objek hanya di GET /conversations. */
export interface Conversation {
  _id: string;
  listing: string | { _id: string; title: string; type: ListingType; status: ListingStatus };
  participants: (string | UserSummary)[];
  lastMessage?: string;
  lastMessageAt: string;
}

export interface Message {
  _id: string;
  conversation: string;
  sender: string;
  text: string;
  warning: boolean;
  readAt?: string | null;
  createdAt: string;
}

export interface AiDraft {
  title: string;
  description: string;
  category: string;
}
