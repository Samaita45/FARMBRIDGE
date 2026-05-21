import { create } from 'zustand';

import { MOCK_POSTS, MOCK_REPLIES } from '@/constants/community-data';
import { cachePosts, getCachedPosts, getUserPosts, saveUserPosts } from '@/services/communityDb';
import type { CommunityPost, CommunityReply, FeedFilter, PostCategory } from '@/types/community';

export interface CommunityState {
  posts: CommunityPost[];
  likedPostIds: string[];
  isHydrated: boolean;
  hydrate: () => Promise<void>;
  addPost: (post: Omit<CommunityPost, 'id' | 'likes' | 'commentCount' | 'createdAt' | 'replies' | 'isExpertAnswer'>) => Promise<CommunityPost>;
  addReply: (postId: string, reply: Omit<CommunityReply, 'id' | 'postId' | 'upvotes' | 'downvotes' | 'createdAt'>) => void;
  toggleLike: (postId: string) => void;
  markSolved: (postId: string) => void;
  upvoteReply: (postId: string, replyId: string) => void;
  getPostById: (id: string) => CommunityPost | undefined;
  filterPosts: (filter: FeedFilter, search: string) => CommunityPost[];
}

function attachReplies(posts: CommunityPost[]): CommunityPost[] {
  return posts.map((p) => ({
    ...p,
    replies: MOCK_REPLIES.filter((r) => r.postId === p.id),
    commentCount: p.commentCount || MOCK_REPLIES.filter((r) => r.postId === p.id).length,
  }));
}

function mapFilterToCategory(filter: FeedFilter): PostCategory | null {
  switch (filter) {
    case 'Questions':
      return 'question';
    case 'Tips':
      return 'tip';
    case 'Success Stories':
      return 'success';
    case 'Market Talk':
      return 'market';
    case 'Weather':
      return 'weather';
    default:
      return null;
  }
}

function sortPosts(posts: CommunityPost[]): CommunityPost[] {
  return [...posts].sort((a, b) => {
    if (a.isPinned !== b.isPinned) return a.isPinned ? -1 : 1;
    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
  });
}

export const useCommunityStore = create<CommunityState>((set, get) => ({
  posts: [],
  likedPostIds: [],
  isHydrated: false,

  hydrate: async () => {
    const userPosts = await getUserPosts();
    let cached = await getCachedPosts();
    if (!cached) {
      cached = attachReplies(MOCK_POSTS);
      await cachePosts(cached);
    } else {
      cached = attachReplies(cached);
    }
    const merged = sortPosts([
      ...userPosts.map((p) => ({
        ...p,
        replies: p.replies ?? MOCK_REPLIES.filter((r) => r.postId === p.id),
      })),
      ...cached.filter((c) => !userPosts.some((u) => u.id === c.id)),
    ]);
    set({ posts: merged, isHydrated: true });
  },

  addPost: async (partial) => {
    const post: CommunityPost = {
      ...partial,
      id: `post_${Date.now()}`,
      likes: 0,
      commentCount: 0,
      isExpertAnswer: false,
      createdAt: new Date().toISOString(),
      replies: [],
    };
    const userPosts = [post, ...(await getUserPosts())];
    await saveUserPosts(userPosts);
    set((state) => ({ posts: sortPosts([post, ...state.posts]) }));
    return post;
  },

  addReply: (postId, partial) => {
    const reply: CommunityReply = {
      ...partial,
      id: `reply_${Date.now()}`,
      postId,
      upvotes: 0,
      downvotes: 0,
      createdAt: new Date().toISOString(),
    };
    set((state) => ({
      posts: state.posts.map((p) =>
        p.id === postId
          ? {
              ...p,
              commentCount: p.commentCount + 1,
              replies: [...(p.replies ?? []), reply],
            }
          : p
      ),
    }));
  },

  toggleLike: (postId) => {
    set((state) => {
      const liked = state.likedPostIds.includes(postId);
      return {
        likedPostIds: liked
          ? state.likedPostIds.filter((id) => id !== postId)
          : [...state.likedPostIds, postId],
        posts: state.posts.map((p) =>
          p.id === postId ? { ...p, likes: p.likes + (liked ? -1 : 1) } : p
        ),
      };
    });
  },

  markSolved: (postId) => {
    set((state) => ({
      posts: state.posts.map((p) => (p.id === postId ? { ...p, isSolved: true } : p)),
    }));
  },

  upvoteReply: (postId, replyId) => {
    set((state) => ({
      posts: state.posts.map((p) =>
        p.id === postId
          ? {
              ...p,
              replies: p.replies?.map((r) =>
                r.id === replyId ? { ...r, upvotes: r.upvotes + 1 } : r
              ),
            }
          : p
      ),
    }));
  },

  getPostById: (id) => get().posts.find((p) => p.id === id),

  filterPosts: (filter, search) => {
    let list = get().posts;
    const cat = mapFilterToCategory(filter);
    if (cat) list = list.filter((p) => p.category === cat);
    const q = search.trim().toLowerCase();
    if (q) {
      list = list.filter(
        (p) =>
          p.title.toLowerCase().includes(q) ||
          p.body.toLowerCase().includes(q) ||
          p.tags.some((t) => t.includes(q))
      );
    }
    return list;
  },
}));
