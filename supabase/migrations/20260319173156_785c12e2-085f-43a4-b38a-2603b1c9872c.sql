-- Add missing UPDATE policy for storage objects (package-media bucket)
CREATE POLICY "Admins can update package media"
ON storage.objects
FOR UPDATE
USING ((bucket_id = 'package-media'::text) AND has_role(auth.uid(), 'admin'::app_role))
WITH CHECK ((bucket_id = 'package-media'::text) AND has_role(auth.uid(), 'admin'::app_role));