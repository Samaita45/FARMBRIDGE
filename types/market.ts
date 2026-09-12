export type OrderStatus = 'pending' | 'confirmed' | 'shipped' | 'delivered' | 'cancelled';

export interface OrderItem {
  productId: string;
  productName: string;
  quantity: number;
  priceUSD: number;
  priceZWG: number;
}

export interface MarketOrder {
  id: string;
  userId: string;
  items: OrderItem[];
  subtotalUSD: number;
  subtotalZWG: number;
  deliveryAddress: string;
  deliveryMethod: 'pickup' | 'delivery';
  paymentMethod: string;
  status: OrderStatus;
  createdAt: string;
}

/**
 * A written review.
 *
 * NOTHING PRODUCES THESE YET. The shape is kept for when reviews are actually
 * collected. It previously had one producer — `getMockReviews`, which returned
 * the same three invented testimonials for every product in the catalogue —
 * and that has been deleted. Do not reintroduce a fixture here: a fabricated
 * review is read as a real person's experience.
 */
export interface ProductReview {
  id: string;
  author: string;
  rating: number;
  comment: string;
  date: string;
}
