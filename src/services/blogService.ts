import { supabase } from './supabaseClient';
import { BlogPost, BlogPostFormData } from '../types/blog';

export async function getAllPublishedBlogPosts(): Promise<BlogPost[]> {
  const { data, error } = await supabase
    .from('blog_posts')
    .select('*')
    .eq('is_published', true)
    .order('published_at', { ascending: false });

  if (error) {
    console.error('Error fetching published blog posts:', error);
    throw error;
  }

  return data || [];
}

export async function getBlogPostBySlug(slug: string): Promise<BlogPost | null> {
  const { data, error } = await supabase
    .from('blog_posts')
    .select('*')
    .eq('slug', slug)
    .maybeSingle();

  if (error) {
    console.error('Error fetching blog post by slug:', error);
    throw error;
  }

  return data;
}

export async function getAllBlogPostsAdmin(): Promise<BlogPost[]> {
  const { data, error } = await supabase
    .from('blog_posts')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching all blog posts:', error);
    throw error;
  }

  return data || [];
}

export async function getBlogPostById(id: string): Promise<BlogPost | null> {
  const { data, error } = await supabase
    .from('blog_posts')
    .select('*')
    .eq('id', id)
    .maybeSingle();

  if (error) {
    console.error('Error fetching blog post by id:', error);
    throw error;
  }

  return data;
}

export async function createBlogPost(postData: BlogPostFormData): Promise<BlogPost> {
  const { content_type, ...dataWithoutContentType } = postData;

  const dataToInsert = {
    ...dataWithoutContentType,
    published_at: postData.is_published ? new Date().toISOString() : null,
  };

  const { data, error } = await supabase
    .from('blog_posts')
    .insert([dataToInsert])
    .select()
    .single();

  if (error) {
    console.error('Error creating blog post:', error);
    throw error;
  }

  return data;
}

export async function updateBlogPost(id: string, postData: Partial<BlogPostFormData>): Promise<BlogPost> {
  const { content_type, ...dataWithoutContentType } = postData;
  const dataToUpdate: any = { ...dataWithoutContentType };

  if (postData.is_published !== undefined) {
    if (postData.is_published && !dataToUpdate.published_at) {
      dataToUpdate.published_at = new Date().toISOString();
    }
  }

  const { data, error } = await supabase
    .from('blog_posts')
    .update(dataToUpdate)
    .eq('id', id)
    .select()
    .single();

  if (error) {
    console.error('Error updating blog post:', error);
    throw error;
  }

  return data;
}

export async function deleteBlogPost(id: string): Promise<void> {
  const { error } = await supabase
    .from('blog_posts')
    .delete()
    .eq('id', id);

  if (error) {
    console.error('Error deleting blog post:', error);
    throw error;
  }
}

export async function uploadBlogImage(file: File): Promise<string> {
  const fileExt = file.name.split('.').pop();
  const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
  const filePath = `images/${fileName}`;

  const { error } = await supabase.storage
    .from('blog-media')
    .upload(filePath, file);

  if (error) {
    console.error('Error uploading image:', error);
    throw error;
  }

  const { data } = supabase.storage
    .from('blog-media')
    .getPublicUrl(filePath);

  return data.publicUrl;
}
