-- ============================================================
-- MIGRATION 031: FULL-TEXT SEARCH
-- Adds tsvector columns + GIN indexes to expenses, materials, site_photos
-- Updates RPC functions to accept search parameter
-- ============================================================

-- ============================================================
-- 1. EXPENSES - full-text search
-- ============================================================

ALTER TABLE public.expenses ADD COLUMN IF NOT EXISTS search_vector tsvector;

CREATE INDEX IF NOT EXISTS idx_expenses_search ON public.expenses USING GIN(search_vector);

UPDATE public.expenses SET search_vector = 
  to_tsvector('english', coalesce(description,'') || ' ' || coalesce(vendor,'') || ' ' || coalesce(category,''));

CREATE OR REPLACE FUNCTION expenses_search_trigger() RETURNS trigger AS $$
BEGIN
  NEW.search_vector := to_tsvector('english', 
    coalesce(NEW.description,'') || ' ' || coalesce(NEW.vendor,'') || ' ' || coalesce(NEW.category,''));
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_expenses_search ON public.expenses;
CREATE TRIGGER trg_expenses_search BEFORE INSERT OR UPDATE ON public.expenses
  FOR EACH ROW EXECUTE FUNCTION expenses_search_trigger();

-- Update get_all_expenses with search
CREATE OR REPLACE FUNCTION get_all_expenses(p_org_id UUID, p_search TEXT DEFAULT NULL)
RETURNS SETOF expenses
LANGUAGE sql SECURITY DEFINER STABLE
AS $$
  SELECT * FROM public.expenses 
  WHERE org_id = p_org_id AND deleted_at IS NULL
    AND (p_search IS NULL OR p_search = '' OR search_vector @@ plainto_tsquery('english', p_search))
  ORDER BY date DESC;
$$;

-- ============================================================
-- 2. MATERIALS - full-text search
-- ============================================================

ALTER TABLE public.materials ADD COLUMN IF NOT EXISTS search_vector tsvector;

CREATE INDEX IF NOT EXISTS idx_materials_search ON public.materials USING GIN(search_vector);

UPDATE public.materials SET search_vector = 
  to_tsvector('english', coalesce(name,'') || ' ' || coalesce(vendor,'') || ' ' || coalesce(category,''));

CREATE OR REPLACE FUNCTION materials_search_trigger() RETURNS trigger AS $$
BEGIN
  NEW.search_vector := to_tsvector('english', 
    coalesce(NEW.name,'') || ' ' || coalesce(NEW.vendor,'') || ' ' || coalesce(NEW.category,''));
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_materials_search ON public.materials;
CREATE TRIGGER trg_materials_search BEFORE INSERT OR UPDATE ON public.materials
  FOR EACH ROW EXECUTE FUNCTION materials_search_trigger();

-- Update get_all_materials with search
CREATE OR REPLACE FUNCTION get_all_materials(p_org_id UUID, p_search TEXT DEFAULT NULL)
RETURNS SETOF materials
LANGUAGE sql SECURITY DEFINER STABLE
AS $$
  SELECT * FROM public.materials 
  WHERE org_id = p_org_id AND deleted_at IS NULL
    AND (p_search IS NULL OR p_search = '' OR search_vector @@ plainto_tsquery('english', p_search))
  ORDER BY name;
$$;

-- ============================================================
-- 3. SITE PHOTOS - full-text search
-- ============================================================

ALTER TABLE public.site_photos ADD COLUMN IF NOT EXISTS search_vector tsvector;

CREATE INDEX IF NOT EXISTS idx_site_photos_search ON public.site_photos USING GIN(search_vector);

UPDATE public.site_photos SET search_vector = 
  to_tsvector('english', coalesce(notes,'') || ' ' || coalesce(category,''));

CREATE OR REPLACE FUNCTION site_photos_search_trigger() RETURNS trigger AS $$
BEGIN
  NEW.search_vector := to_tsvector('english', 
    coalesce(NEW.notes,'') || ' ' || coalesce(NEW.category,''));
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_site_photos_search ON public.site_photos;
CREATE TRIGGER trg_site_photos_search BEFORE INSERT OR UPDATE ON public.site_photos
  FOR EACH ROW EXECUTE FUNCTION site_photos_search_trigger();

-- Update get_all_photos with search
CREATE OR REPLACE FUNCTION get_all_photos(p_org_id UUID, p_search TEXT DEFAULT NULL)
RETURNS SETOF site_photos
LANGUAGE sql SECURITY DEFINER STABLE
AS $$
  SELECT sp.*
  FROM site_photos sp
  WHERE sp.org_id = get_current_user_org_id() AND sp.deleted_at IS NULL
    AND (p_search IS NULL OR p_search = '' OR sp.search_vector @@ plainto_tsquery('english', p_search))
  ORDER BY sp.created_at DESC;
$$;

-- Update get_project_photos with search
CREATE OR REPLACE FUNCTION get_project_photos(p_project_id UUID, p_search TEXT DEFAULT NULL)
RETURNS SETOF site_photos
LANGUAGE sql SECURITY DEFINER STABLE
AS $$
  SELECT * FROM public.site_photos 
  WHERE project_id = p_project_id AND deleted_at IS NULL
    AND (p_search IS NULL OR p_search = '' OR search_vector @@ plainto_tsquery('english', p_search))
  ORDER BY created_at DESC;
$$;

-- ============================================================
-- 4. THUMBNAIL UPDATE FUNCTION
-- ============================================================

CREATE OR REPLACE FUNCTION update_photo_thumbnail(p_id UUID, p_thumbnail_url TEXT)
RETURNS SETOF site_photos
LANGUAGE sql SECURITY DEFINER
AS $$
  UPDATE public.site_photos SET thumbnail_url = p_thumbnail_url
  WHERE id = p_id RETURNING *;
$$;
