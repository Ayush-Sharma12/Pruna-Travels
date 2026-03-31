ALTER TABLE public.packages
ADD COLUMN IF NOT EXISTS destination_id UUID REFERENCES public.destinations(id) ON DELETE RESTRICT;

ALTER TABLE public.blog_posts
ADD COLUMN IF NOT EXISTS destination_id UUID REFERENCES public.destinations(id) ON DELETE SET NULL;

ALTER TABLE public.enquiries
ADD COLUMN IF NOT EXISTS destination_id UUID REFERENCES public.destinations(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS packages_destination_id_idx ON public.packages(destination_id);
CREATE INDEX IF NOT EXISTS blog_posts_destination_id_idx ON public.blog_posts(destination_id);
CREATE INDEX IF NOT EXISTS enquiries_destination_id_idx ON public.enquiries(destination_id);

UPDATE public.packages AS pkg
SET
  destination_id = dest.id,
  destination = dest.name
FROM public.destinations AS dest
WHERE pkg.destination_id IS NULL
  AND pkg.destination = dest.name;

UPDATE public.blog_posts AS post
SET
  destination_id = dest.id,
  destination = dest.name
FROM public.destinations AS dest
WHERE post.destination_id IS NULL
  AND post.destination = dest.name;

UPDATE public.enquiries AS enq
SET
  destination_id = dest.id,
  destination = dest.name
FROM public.destinations AS dest
WHERE enq.destination_id IS NULL
  AND enq.destination = dest.name;

CREATE OR REPLACE FUNCTION public.sync_destination_reference()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
DECLARE
  matched_destination public.destinations%ROWTYPE;
  is_required BOOLEAN := COALESCE(TG_ARGV[0], 'optional') = 'required';
  normalized_destination TEXT := NULLIF(btrim(NEW.destination), '');
BEGIN
  IF NEW.destination_id IS NOT NULL THEN
    SELECT *
    INTO matched_destination
    FROM public.destinations
    WHERE id = NEW.destination_id;

    IF NOT FOUND THEN
      RAISE EXCEPTION 'Destination % does not exist', NEW.destination_id;
    END IF;

    NEW.destination := matched_destination.name;
    RETURN NEW;
  END IF;

  IF normalized_destination IS NOT NULL THEN
    SELECT *
    INTO matched_destination
    FROM public.destinations
    WHERE name = normalized_destination;

    IF FOUND THEN
      NEW.destination_id := matched_destination.id;
      NEW.destination := matched_destination.name;
    ELSE
      NEW.destination := normalized_destination;
    END IF;

    RETURN NEW;
  END IF;

  IF is_required THEN
    RAISE EXCEPTION 'A destination is required for %', TG_TABLE_NAME;
  END IF;

  NEW.destination := NULL;
  NEW.destination_id := NULL;
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.sync_destination_name_change()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  IF NEW.name IS DISTINCT FROM OLD.name THEN
    UPDATE public.packages
    SET destination = NEW.name
    WHERE destination_id = NEW.id;

    UPDATE public.blog_posts
    SET destination = NEW.name
    WHERE destination_id = NEW.id;

    UPDATE public.enquiries
    SET destination = NEW.name
    WHERE destination_id = NEW.id;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS sync_package_destination_reference ON public.packages;
CREATE TRIGGER sync_package_destination_reference
  BEFORE INSERT OR UPDATE ON public.packages
  FOR EACH ROW
  EXECUTE FUNCTION public.sync_destination_reference('required');

DROP TRIGGER IF EXISTS sync_blog_destination_reference ON public.blog_posts;
CREATE TRIGGER sync_blog_destination_reference
  BEFORE INSERT OR UPDATE ON public.blog_posts
  FOR EACH ROW
  EXECUTE FUNCTION public.sync_destination_reference('optional');

DROP TRIGGER IF EXISTS sync_enquiry_destination_reference ON public.enquiries;
CREATE TRIGGER sync_enquiry_destination_reference
  BEFORE INSERT OR UPDATE ON public.enquiries
  FOR EACH ROW
  EXECUTE FUNCTION public.sync_destination_reference('optional');

DROP TRIGGER IF EXISTS sync_destination_name_change ON public.destinations;
CREATE TRIGGER sync_destination_name_change
  AFTER UPDATE OF name ON public.destinations
  FOR EACH ROW
  EXECUTE FUNCTION public.sync_destination_name_change();
