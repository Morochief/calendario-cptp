-- SQL script to create the storage bucket for event images and configure RLS

-- 1. Create the bucket
INSERT INTO storage.buckets (id, name, public)
VALUES ('event-images', 'event-images', true)
ON CONFLICT (id) DO NOTHING;

-- 2. Allow public access to view images
CREATE POLICY "Public Access to event-images"
ON storage.objects FOR SELECT
USING ( bucket_id = 'event-images' );

-- 3. Allow authenticated users to upload images
-- Depending on your exact auth setup, you might want to restrict this further (e.g. only admins).
-- This policy allows any authenticated user to insert.
CREATE POLICY "Authenticated users can upload images"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK ( bucket_id = 'event-images' );

-- 4. Allow authenticated users to update their own images
CREATE POLICY "Authenticated users can update images"
ON storage.objects FOR UPDATE
TO authenticated
USING ( auth.uid() = owner )
WITH CHECK ( bucket_id = 'event-images' );

-- 5. Allow authenticated users to delete their own images
CREATE POLICY "Authenticated users can delete images"
ON storage.objects FOR DELETE
TO authenticated
USING ( auth.uid() = owner );
