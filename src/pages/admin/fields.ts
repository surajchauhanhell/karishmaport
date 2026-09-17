import { productCategories } from '../../data/defaults';
import type { TableName } from '../../types';
export interface Field {
  key: string;
  label: string;
  type?:
    | 'text'
    | 'textarea'
    | 'number'
    | 'checkbox'
    | 'date'
    | 'datetime-local'
    | 'url'
    | 'email'
    | 'select'
    | 'image'
    | 'pdf'
    | 'products'
    | 'portfolio';
  required?: boolean;
  options?: string[];
  bucket?: string;
  help?: string;
}
const f = (
  key: string,
  label: string,
  type: Field['type'] = 'text',
  extra: Partial<Field> = {},
): Field => ({ key, label, type, ...extra });
const slug = f('slug', 'URL slug', 'text', {
  required: true,
  help: 'Lowercase letters, numbers and hyphens.',
});
const featured = f('featured', 'Featured', 'checkbox');
const published = f('published', 'Published', 'checkbox');
const title = f('title', 'Title', 'text', { required: true });
const description = f('description', 'Description', 'textarea');
const reel = f('reel_url', 'Reel URL', 'url');
const image = (key: string, bucket: string) => f(key, 'Image URL / upload', 'image', { bucket });
export const editors: Partial<Record<TableName, Field[]>> = {
  products: [
    f('name', 'Product name', 'text', { required: true }),
    f('affiliate_url', 'Affiliate link', 'url', {
      help: 'Paste your full affiliate URL, including its tracking code. Buyers check out on the retailer website.',
    }),
    f('brand', 'Brand'),
    f('category', 'Product category', 'select', {
      required: true,
      options: productCategories.slice(1),
    }),
    description,
    f('personal_review', 'Personal recommendation', 'textarea', {
      help: 'Only add verified opinions or actual experience.',
    }),
    f('best_for', 'Best for', 'textarea'),
    f('how_to_use', 'How I use it', 'textarea'),
    image('image_url', 'product-images'),
    f('price', 'Price (optional)', 'number'),
    f('currency', 'Currency'),
    f('badge', 'Badge'),
    reel,
    featured,
    f('active', 'Active', 'checkbox'),
    f('is_demo', 'Demo product', 'checkbox'),
    f('sort_order', 'Sort order', 'number'),
  ],
  portfolio_items: [
    title,
    slug,
    description,
    image('thumbnail_url', 'portfolio-images'),
    f('content_url', 'Content URL', 'url'),
    f('platform', 'Platform', 'select', { options: ['Instagram', 'YouTube'] }),
    f('category', 'Category', 'select', {
      options: ['Beauty', 'Fashion', 'Traditional', 'Lifestyle', 'GRWM', 'UGC', 'Brand Work'],
    }),
    f('views', 'Public views (optional)', 'number'),
    f('likes', 'Public likes (optional)', 'number'),
    featured,
    f('brand_name', 'Brand name (if applicable)'),
    f('published_date', 'Published date', 'date'),
    published,
  ],
  blog_posts: [
    title,
    slug,
    f('excerpt', 'Excerpt', 'textarea'),
    f('content', 'Article (Markdown)', 'textarea', {
      help: 'Markdown is supported. Raw HTML is not rendered.',
    }),
    image('featured_image', 'blog-images'),
    f('category', 'Category', 'select', {
      options: [
        'Beauty',
        'Makeup',
        'Fashion',
        'Traditional Looks',
        'Hair',
        'Product Reviews',
        'Lifestyle',
      ],
    }),
    f('author', 'Author'),
    f('seo_title', 'SEO title'),
    f('seo_description', 'SEO description', 'textarea'),
    f('keywords', 'Keywords'),
    f('status', 'Status', 'select', { options: ['draft', 'published'] }),
    featured,
    f('published_at', 'Publication date', 'datetime-local'),
    f('product_ids', 'Related products', 'products'),
    f('portfolio_ids', 'Related content', 'portfolio'),
  ],
  looks: [
    title,
    f('affiliate_url', 'Affiliate link', 'url', {
      help: 'Optional direct Buy now link beside Watch Reel. Leave empty to shop the assigned products.',
    }),
    f('category', 'Product category', 'select', {
      required: true,
      options: productCategories.slice(1),
    }),
    description,
    image('image_url', 'creator-images'),
    reel,
    featured,
    published,
  ],
  smart_links: [
    f('keyword', 'Keyword', 'text', { required: true, help: 'For example: LOOK or LIPSTICK.' }),
    title,
    f('destination_url', 'Destination', 'text', {
      required: true,
      help: 'A /shop or /looks/path on this site, or a full https URL.',
    }),
    f('active', 'Active', 'checkbox'),
  ],
  creator_settings: [
    f('name', 'Creator name', 'text', { required: true }),
    f('bio', 'Bio', 'textarea'),
    f('instagram_url', 'Instagram URL', 'url'),
    f('youtube_url', 'YouTube URL (optional)', 'url'),
    f('email', 'Contact email', 'email', { required: true }),
    f('location', 'Location'),
    f('followers', 'Follower count', 'number'),
    f('posts', 'Post count', 'number'),
    f('stats_updated_at', 'Statistics updated', 'date', {
      help: 'Social statistics are manually updated, not synced with Instagram.',
    }),
    f('headline', 'Headline'),
    f('intro', 'Homepage introduction', 'textarea'),
    image('profile_image', 'creator-images'),
    image('traditional_image', 'creator-images'),
    f('beauty_image', 'Beauty category image', 'image', { bucket: 'creator-images' }),
    f('fashion_image', 'Fashion category image', 'image', { bucket: 'creator-images' }),
    f('lifestyle_image', 'Lifestyle category image', 'image', { bucket: 'creator-images' }),
    f('media_kit_url', 'Media kit PDF', 'pdf', { bucket: 'media-kit' }),
    f('seo_title', 'Default SEO title'),
    f('seo_description', 'Default SEO description', 'textarea'),
    image('og_image', 'creator-images'),
    f('social_cta', 'Instagram CTA'),
    f('audience_stats', 'Verified audience insights (optional)', 'textarea', {
      help: 'Leave empty unless you have real, dated audience data.',
    }),
  ],
  testimonials: [
    f('name', 'Person name', 'text', { required: true }),
    f('quote', 'Testimonial', 'textarea', { required: true }),
    f('company', 'Company'),
    published,
  ],
  brand_collaborations: [
    f('name', 'Brand name', 'text', { required: true }),
    image('logo_url', 'creator-images'),
    f('website', 'Website', 'url'),
    published,
  ],
  collaboration_inquiries: [
    f('status', 'Status', 'select', {
      options: ['new', 'contacted', 'negotiating', 'confirmed', 'completed', 'declined'],
    }),
  ],
  contact_messages: [
    f('status', 'Status', 'select', { options: ['new', 'read', 'replied', 'archived'] }),
  ],
};
export const sections = [
  ['', 'Dashboard'],
  ['products', 'Products'],
  ['portfolio_items', 'Portfolio'],
  ['blog_posts', 'Blog'],
  ['looks', 'Shop the Look'],
  ['smart_links', 'Smart links'],
  ['collaboration_inquiries', 'Work with me enquiries'],
  ['contact_messages', 'Contact messages'],
  ['analytics', 'Analytics'],
  ['creator_settings', 'Settings'],
  ['testimonials', 'Testimonials'],
  ['brand_collaborations', 'Brands'],
];
