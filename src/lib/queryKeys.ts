// Awalan yang sama dipakai untuk invalidasi, misalnya semua ['orders', ...].
export const queryKeys = {
  me: ['me'] as const,
  listings: (filters?: object) => (filters ? (['listings', filters] as const) : (['listings'] as const)),
  listing: (id: string) => ['listing', id] as const,
  myListings: (page?: number) => (page ? (['my-listings', page] as const) : (['my-listings'] as const)),
  myListing: (id: string) => ['my-listings', 'one', id] as const,
  profile: (id: string) => ['profile', id] as const,
  orders: (filters?: object) => (filters ? (['orders', filters] as const) : (['orders'] as const)),
  order: (id: string) => ['order', id] as const,
  disputes: (filters?: object) => (filters ? (['disputes', filters] as const) : (['disputes'] as const)),
  dispute: (id: string) => ['dispute', id] as const,
  circles: ['circles'] as const,
  circle: (id: string) => ['circle', id] as const,
  vouched: (circleId: string) => ['vouched', circleId] as const,
  conversations: (page?: number) => (page ? (['conversations', page] as const) : (['conversations'] as const)),
  conversation: (id: string) => ['conversation', id] as const,
  messages: (id: string) => ['messages', id] as const,
};
