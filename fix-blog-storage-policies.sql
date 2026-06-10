-- =====================================================
-- RUN THIS IN YOUR SUPABASE SQL EDITOR
-- =====================================================
-- This will fix the RLS policies for blog-media bucket
-- so you can upload images
-- =====================================================

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Admin can upload blog images" ON storage.objects;
DROP POLICY IF EXISTS "Admin can update blog images" ON storage.objects;
DROP POLICY IF EXISTS "Admin can delete blog images" ON storage.objects;
DROP POLICY IF EXISTS "Public can view blog images" ON storage.objects;

-- Allow admin user to upload images to blog-media bucket
CREATE POLICY "Admin can upload blog images"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'blog-media'
  AND auth.jwt() ->> 'email' = 'rfv@datago.net'
);

-- Allow admin user to update images
CREATE POLICY "Admin can update blog images"
ON storage.objects
FOR UPDATE
TO authenticated
USING (
  bucket_id = 'blog-media'
  AND auth.jwt() ->> 'email' = 'rfv@datago.net'
)
WITH CHECK (
  bucket_id = 'blog-media'
  AND auth.jwt() ->> 'email' = 'rfv@datago.net'
);

-- Allow admin user to delete images
CREATE POLICY "Admin can delete blog images"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'blog-media'
  AND auth.jwt() ->> 'email' = 'rfv@datago.net'
);

-- Allow everyone to view blog images (public bucket)
CREATE POLICY "Public can view blog images"
ON storage.objects
FOR SELECT
TO public
USING (bucket_id = 'blog-media');
