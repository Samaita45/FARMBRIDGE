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

export interface ProductReview {
  id: string;
  author: string;
  rating: number;
  comment: string;
  date: string;
}
