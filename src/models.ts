export type PostStatus = "draft" | "published" | "scheduled";

export interface Post {
  id: string;
  userId: string;
  title: string;
  slug: string;
  content: string;
  excerpt?: string;
  status: PostStatus;
  tags: string[];
  seo?: SeoSettings;
  scheduledAt?: string;
  publishedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface SeoSettings {
  metaTitle?: string;
  metaDescription?: string;
  canonicalUrl?: string;
  noIndex?: boolean;
}

export interface Analytics {
  postId: string;
  views: number;
  uniqueVisitors: number;
  publishedAt?: string;
  period: { from?: string; to?: string };
}

export interface PostInput {
  title: string;
  slug?: string;
  content: string;
  excerpt?: string;
  tags?: string[];
  seo?: SeoSettings;
}
