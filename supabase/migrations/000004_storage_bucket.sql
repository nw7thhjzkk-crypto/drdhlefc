-- Insert the storage bucket if it doesn't exist
INSERT INTO storage.buckets (id, name, public)
VALUES ('member-photos', 'member-photos', true)
ON CONFLICT (id) DO NOTHING;

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
WITH CHECK (bucket_id = 'member-photos');

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
