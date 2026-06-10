export interface BlogPost {
  id: string;
  title: string;
  slug: string;
  excerpt: string | null;
  content: string;
  content_type?: 'markdown' | 'html'; // Type of content stored
  featured_image_url: string | null;
  is_published: boolean;
  published_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface BlogPostFormData {
  title: string;
  slug: string;
  excerpt: string;
  content: string;
  content_type?: 'markdown' | 'html'; // Type of content being edited
  featured_image_url: string;
  is_published: boolean;
}
