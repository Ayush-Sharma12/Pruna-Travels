CREATE TABLE IF NOT EXISTS public.destinations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT UNIQUE NOT NULL,
  name TEXT UNIQUE NOT NULL,
  tagline TEXT NOT NULL DEFAULT '',
  short_description TEXT NOT NULL DEFAULT '',
  description TEXT NOT NULL DEFAULT '',
  hero_image_url TEXT,
  hero_video_url TEXT,
  card_image_url TEXT,
  published BOOLEAN NOT NULL DEFAULT true,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.destinations ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'destinations' AND policyname = 'Anyone can view published destinations'
  ) THEN
    CREATE POLICY "Anyone can view published destinations"
      ON public.destinations
      FOR SELECT
      USING (published = true OR (auth.uid() IS NOT NULL AND public.has_role(auth.uid(), 'admin')));
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'destinations' AND policyname = 'Admins can insert destinations'
  ) THEN
    CREATE POLICY "Admins can insert destinations"
      ON public.destinations
      FOR INSERT
      TO authenticated
      WITH CHECK (public.has_role(auth.uid(), 'admin'));
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'destinations' AND policyname = 'Admins can update destinations'
  ) THEN
    CREATE POLICY "Admins can update destinations"
      ON public.destinations
      FOR UPDATE
      TO authenticated
      USING (public.has_role(auth.uid(), 'admin'));
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'destinations' AND policyname = 'Admins can delete destinations'
  ) THEN
    CREATE POLICY "Admins can delete destinations"
      ON public.destinations
      FOR DELETE
      TO authenticated
      USING (public.has_role(auth.uid(), 'admin'));
  END IF;
END $$;

CREATE TABLE IF NOT EXISTS public.blog_media (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  blog_post_id UUID REFERENCES public.blog_posts(id) ON DELETE CASCADE NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('image', 'video')),
  url TEXT NOT NULL,
  caption TEXT NOT NULL DEFAULT '',
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.blog_media ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'blog_media' AND policyname = 'Anyone can view blog media'
  ) THEN
    CREATE POLICY "Anyone can view blog media"
      ON public.blog_media
      FOR SELECT
      USING (true);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'blog_media' AND policyname = 'Admins can insert blog media'
  ) THEN
    CREATE POLICY "Admins can insert blog media"
      ON public.blog_media
      FOR INSERT
      TO authenticated
      WITH CHECK (public.has_role(auth.uid(), 'admin'));
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'blog_media' AND policyname = 'Admins can update blog media'
  ) THEN
    CREATE POLICY "Admins can update blog media"
      ON public.blog_media
      FOR UPDATE
      TO authenticated
      USING (public.has_role(auth.uid(), 'admin'));
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'blog_media' AND policyname = 'Admins can delete blog media'
  ) THEN
    CREATE POLICY "Admins can delete blog media"
      ON public.blog_media
      FOR DELETE
      TO authenticated
      USING (public.has_role(auth.uid(), 'admin'));
  END IF;
END $$;

CREATE TRIGGER update_destinations_updated_at
  BEFORE UPDATE ON public.destinations
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

INSERT INTO storage.buckets (id, name, public)
VALUES ('blog-media', 'blog-media', true)
ON CONFLICT (id) DO NOTHING;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'storage' AND tablename = 'objects' AND policyname = 'Anyone can view blog media files'
  ) THEN
    CREATE POLICY "Anyone can view blog media files"
      ON storage.objects
      FOR SELECT
      USING (bucket_id = 'blog-media');
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'storage' AND tablename = 'objects' AND policyname = 'Admins can upload blog media'
  ) THEN
    CREATE POLICY "Admins can upload blog media"
      ON storage.objects
      FOR INSERT
      TO authenticated
      WITH CHECK (bucket_id = 'blog-media' AND public.has_role(auth.uid(), 'admin'));
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'storage' AND tablename = 'objects' AND policyname = 'Admins can update blog media files'
  ) THEN
    CREATE POLICY "Admins can update blog media files"
      ON storage.objects
      FOR UPDATE
      TO authenticated
      USING (bucket_id = 'blog-media' AND public.has_role(auth.uid(), 'admin'))
      WITH CHECK (bucket_id = 'blog-media' AND public.has_role(auth.uid(), 'admin'));
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'storage' AND tablename = 'objects' AND policyname = 'Admins can delete blog media'
  ) THEN
    CREATE POLICY "Admins can delete blog media"
      ON storage.objects
      FOR DELETE
      TO authenticated
      USING (bucket_id = 'blog-media' AND public.has_role(auth.uid(), 'admin'));
  END IF;
END $$;

INSERT INTO public.destinations (
  slug,
  name,
  tagline,
  short_description,
  description,
  hero_image_url,
  card_image_url,
  sort_order
)
VALUES
  (
    'kashmir',
    'Kashmir',
    'Paradise on Earth',
    'Snow peaks, lakes, gardens, and unforgettable mountain escapes.',
    'Kashmir blends serene lakes, pine valleys, alpine meadows, and rich local culture into one of India''s most memorable travel experiences.',
    '/images/kashmir.webp',
    '/images/kashmir.jpg',
    1
  ),
  (
    'andaman',
    'Andaman',
    'Tropical Island Escape',
    'Crystal waters, coral reefs, ferries, and calm beach stays.',
    'The Andaman Islands offer turquoise water, island-hopping adventures, marine activities, and laid-back beach holidays for couples, families, and groups.',
    '/images/andaman.webp',
    '/images/andaman.jpg',
    2
  )
ON CONFLICT (slug) DO NOTHING;
