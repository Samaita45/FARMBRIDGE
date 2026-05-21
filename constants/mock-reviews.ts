import type { ProductReview } from '@/types/market';

export function getMockReviews(productId: string): ProductReview[] {
  return [
    {
      id: `${productId}-r1`,
      author: 'Tendai M.',
      rating: 5,
      comment: 'Great quality, fast delivery to Harare. Will buy again.',
      date: '2026-04-12',
    },
    {
      id: `${productId}-r2`,
      author: 'Grace C.',
      rating: 4,
      comment: 'Good product, fair price. Seller was responsive on WhatsApp.',
      date: '2026-04-05',
    },
    {
      id: `${productId}-r3`,
      author: 'Farai N.',
      rating: 5,
      comment: 'Exactly as described. EcoCash payment was smooth.',
      date: '2026-03-28',
    },
  ];
}
