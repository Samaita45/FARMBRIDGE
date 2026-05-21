export type PostCategory =
  | 'question'
  | 'tip'
  | 'success'
  | 'market'
  | 'weather'
  | 'general';

export type UserRoleBadge = 'farmer' | 'buyer' | 'expert' | 'both';

export interface TrendingTopic {
  id: string;
  tag: string;
  label: string;
  postCount: number;
}

export interface SuccessStory {
  id: string;
  name: string;
  crop: string;
  earningsUSD: number;
  province: string;
  quote: string;
}

export interface ExpertProfile {
  id: string;
  name: string;
  title: string;
  organization: string;
  specialties: string[];
  province: string;
  available: boolean;
}

export interface CommunityReply {
  id: string;
  postId: string;
  authorId: string;
  authorName: string;
  authorRole: UserRoleBadge;
  province?: string;
  body: string;
  likes?: number;
  upvotes: number;
  downvotes: number;
  isExpert: boolean;
  createdAt: string;
}

/** @deprecated Use CommunityReply */
export type PostReply = CommunityReply;

export interface CommunityPost {
  id: string;
  authorId: string;
  authorName: string;
  authorRole: UserRoleBadge;
  province: string;
  title: string;
  body: string;
  category: PostCategory;
  tags: string[];
  likes: number;
  commentCount: number;
  isPinned: boolean;
  isExpertAnswer: boolean;
  isSolved: boolean;
  isAnonymous: boolean;
  createdAt: string;
  replies?: CommunityReply[];
}

export const POST_CATEGORY_LABELS: Record<PostCategory, string> = {
  question: 'Questions',
  tip: 'Tips',
  success: 'Success Stories',
  market: 'Market Talk',
  weather: 'Weather',
  general: 'General',
};

export const FEED_FILTERS = [
  'All',
  'Questions',
  'Tips',
  'Success Stories',
  'Market Talk',
  'Weather',
] as const;

export type FeedFilter = (typeof FEED_FILTERS)[number];
