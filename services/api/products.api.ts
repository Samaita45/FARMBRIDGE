import { api } from '@/services/api/client';
import { IS_API_ENABLED } from '@/services/api/config';

export type ProductStatus = 'DRAFT' | 'ACTIVE' | 'SOLD_OUT' | 'SUSPENDED';

export interface ProductDto {
  id: string;
  sellerId: string;
  /** Who is selling. A shelf of anonymous listings is not a marketplace. */
  sellerName: string;
  name: string;
  description?: string | null;
  category: string;
  /** Minor units. Divide by 100 to display, never to calculate. */
  priceUsdCents: number;
  unit: string;
  quantity: number;
  province?: string | null;
  imageUrls: string[];
  status: ProductStatus;
  createdAt: string;
  updatedAt: string;
}

export interface CreateProductInput {
  name: string;
  description?: string;
  category: string;
  priceUsdCents: number;
  unit?: string;
  quantity: number;
  province?: string;
  imageUrls?: string[];
  /** A seller may save a draft; everything else is the server's decision. */
  status?: 'DRAFT' | 'ACTIVE';
}

export interface ListProductsQuery {
  category?: string;
  province?: string;
  search?: string;
  limit?: number;
  cursor?: string;
}

function queryString(query: ListProductsQuery): string {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(query)) {
    if (value !== undefined && value !== null && `${value}`.length > 0) {
      params.set(key, String(value));
    }
  }
  const s = params.toString();
  return s ? `?${s}` : '';
}

/**
 * Marketplace listings.
 *
 * Unlike the farm tools, this cannot fall back to the device: a shelf is other
 * people's produce. Every call returns an empty result rather than throwing
 * when the API is off, and the screens say plainly that listings need a
 * connection instead of showing an empty shelf that looks like no stock.
 */
export const productsApi = {
  async list(query: ListProductsQuery = {}): Promise<{ products: ProductDto[]; nextCursor: string | null }> {
    if (!IS_API_ENABLED) return { products: [], nextCursor: null };
    const data = await api.get<{ products: ProductDto[]; nextCursor: string | null }>(
      `/products${queryString(query)}`
    );
    return { products: data.products ?? [], nextCursor: data.nextCursor ?? null };
  },

  /** Everything this seller has, drafts included. */
  async listMine(): Promise<ProductDto[]> {
    if (!IS_API_ENABLED) return [];
    const data = await api.get<{ products: ProductDto[] }>('/products/mine');
    return data.products ?? [];
  },

  async get(id: string): Promise<ProductDto | null> {
    if (!IS_API_ENABLED) return null;
    try {
      const data = await api.get<{ product: ProductDto }>(`/products/${id}`);
      return data.product ?? null;
    } catch {
      return null;
    }
  },

  /**
   * Throws rather than returning null when the API is off.
   *
   * Every other call here degrades quietly because a missing shelf is
   * survivable. Silently discarding something a farmer typed out and pressed
   * save on is not — the screen needs to know it failed so it can say so.
   */
  async create(input: CreateProductInput): Promise<ProductDto> {
    const data = await api.post<{ product: ProductDto }>('/products', input);
    return data.product;
  },

  async update(id: string, input: Partial<CreateProductInput> & { status?: ProductStatus }): Promise<ProductDto> {
    const data = await api.patch<{ product: ProductDto }>(`/products/${id}`, input);
    return data.product;
  },

  async remove(id: string): Promise<void> {
    await api.delete(`/products/${id}`);
  },
};
