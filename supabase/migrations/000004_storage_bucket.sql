-- Insert the storage bucket if it doesn't exist
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
    'member-photos',
    'member-photos',
    true,
    5242880,
    ARRAY['image/jpeg', 'image/png', 'image/webp']::text[]
)
ON CONFLICT (id) DO UPDATE SET
    file_size_limit = 5242880,
    allowed_mime_types = ARRAY['image/jpeg', 'image/png', 'image/webp']::text[];

-- Enable RLS on storage.objects
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

-- Allow public read access to the member-photos bucket
CREATE POLICY "Public read member-photos"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'member-photos');

-- Allow authenticated users to upload to the member-photos bucket
CREATE POLICY "Authenticated users can upload member-photos"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
    bucket_id = 'member-photos' AND
    (storage.extension(name) = 'jpg' OR storage.extension(name) = 'jpeg' OR storage.extension(name) = 'png' OR storage.extension(name) = 'webp')
);

-- Allow authenticated users to update their own uploads (optional, but good for owners/trainers)
CREATE POLICY "Authenticated users can update member-photos"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'member-photos');

-- Allow authenticated users to delete from member-photos
CREATE POLICY "Authenticated users can delete member-photos"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'member-photos');
