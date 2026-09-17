export interface Row {
  id: string;
  created_at: string;
  [key: string]: unknown;
}
export interface Product extends Row {
  name: string;
  slug: string;
  brand: string;
  category: string;
  description: string;
  personal_review: string;
  best_for: string;
  how_to_use: string;
  image_url: string;
  affiliate_url: string;
  price: number | null;
  currency: string;
  badge: string;
  reel_url: string;
  featured: boolean;
  active: boolean;
  is_demo: boolean;
  sort_order: number;
  updated_at: string;
}
export interface PortfolioItem extends Row {
  title: string;
  slug: string;
  description: string;
  thumbnail_url: string;
  content_url: string;
  platform: string;
  category: string;
  views: number | null;
  likes: number | null;
  featured: boolean;
  brand_name: string;
  published_date: string;
  published: boolean;
}
export interface BlogPost extends Row {
  title: string;
  slug: string;
  excerpt: string;
  content: string;
  featured_image: string;
  category: string;
  author: string;
  seo_title: string;
  seo_description: string;
  keywords: string;
  status: 'draft' | 'published';
  featured: boolean;
  published_at: string | null;
  updated_at: string;
  product_ids: string[];
  portfolio_ids: string[];
}
export interface CreatorSettings extends Row {
  name: string;
  bio: string;
  instagram_url: string;
  youtube_url: string;
  email: string;
  location: string;
  followers: number;
  posts: number;
  stats_updated_at: string;
  headline: string;
  intro: string;
  profile_image: string;
  traditional_image: string;
  beauty_image: string;
  fashion_image: string;
  lifestyle_image: string;
  media_kit_url: string;
  seo_title: string;
  seo_description: string;
  og_image: string;
  social_cta: string;
  audience_stats: string;
}
export interface CollaborationInquiry extends Row {
  brand_name: string;
  contact_name: string;
  email: string;
  phone: string;
  website: string;
  campaign_type: string;
  product: string;
  budget_range: string;
  deliverables: string;
  target_date: string | null;
  message: string;
  status: string;
  consent: boolean;
}
export interface ContactMessage extends Row {
  name: string;
  email: string;
  subject: string;
  message: string;
  status: string;
  consent: boolean;
}
export interface AffiliateClick extends Row {
  product_id: string;
  source_page: string;
  utm_source: string;
  utm_medium: string;
  utm_campaign: string;
  referrer: string;
}
export interface SmartLink extends Row {
  keyword: string;
  title: string;
  destination_url: string;
  active: boolean;
  click_count: number;
}
export interface Look extends Row {
  affiliate_url: string;
  category: string;
  title: string;
  slug: string;
  description: string;
  image_url: string;
  reel_url: string;
  featured: boolean;
  published: boolean;
}
export interface LookProduct extends Row {
  look_id: string;
  product_id: string;
  sort_order: number;
}
export interface AnalyticsEvent extends Row {
  event_name: string;
  entity_id: string | null;
  source_page: string;
  utm_source: string;
  utm_medium: string;
  utm_campaign: string;
}
export interface Testimonial extends Row {
  name: string;
  quote: string;
  company: string;
  published: boolean;
}
export interface BrandCollaboration extends Row {
  name: string;
  logo_url: string;
  website: string;
  published: boolean;
}
export interface Tables {
  products: Product;
  portfolio_items: PortfolioItem;
  blog_posts: BlogPost;
  creator_settings: CreatorSettings;
  collaboration_inquiries: CollaborationInquiry;
  contact_messages: ContactMessage;
  affiliate_clicks: AffiliateClick;
  smart_links: SmartLink;
  looks: Look;
  look_products: LookProduct;
  analytics_events: AnalyticsEvent;
  testimonials: Testimonial;
  brand_collaborations: BrandCollaboration;
}
export type TableName = keyof Tables;
