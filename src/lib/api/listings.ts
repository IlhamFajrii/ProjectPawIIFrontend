import { api, type QueryParams } from './client';
import { findAcrossPages, MAX_LIMIT } from './pages';
import type { Listing, ListingType, Paginated, PriceUnit } from './types';

export interface ListingFilters {
  q?: string;
  type?: ListingType;
  district?: string;
  category?: string;
  minPrice?: number;
  maxPrice?: number;
  page?: number;
  limit?: number;
}

export interface ListingInput {
  title: string;
  description: string;
  category: string;
  price: number;
  priceUnit: PriceUnit;
  district: string;
  images: string[];
}

const path = (id: string) => `/listings/${encodeURIComponent(id)}`;

export const getListings = (filters: ListingFilters, signal?: AbortSignal) =>
  api<Paginated<Listing>>('/listings', { query: filters as QueryParams, signal });

export const getListing = (id: string, signal?: AbortSignal) => api<Listing>(path(id), { signal });

export const getMyListings = (page: number, limit = 12, signal?: AbortSignal) =>
  api<Paginated<Listing>>('/listings/mine', { query: { page, limit }, signal });

/** Detail publik menjawab 404 untuk listing INACTIVE, jadi pemilik mengambilnya dari `mine`. */
export const findMyListing = (id: string, signal?: AbortSignal) =>
  findAcrossPages(
    (page) => getMyListings(page, MAX_LIMIT, signal),
    (listing) => listing._id === id,
  );

export const createListing = (body: ListingInput & { type: ListingType }) =>
  api<Listing>('/listings', { method: 'POST', body });

/** `type` sengaja tidak ada: backend tidak menerimanya saat ubah. */
export const updateListing = (id: string, body: ListingInput) => api<Listing>(path(id), { method: 'PUT', body });

export const deactivateListing = (id: string) => api<Listing>(path(id), { method: 'DELETE' });
