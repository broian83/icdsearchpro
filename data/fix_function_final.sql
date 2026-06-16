-- Fix: parameter names + chapter filter
DROP FUNCTION IF EXISTS public.search_icd(text, text, text);

CREATE OR REPLACE FUNCTION public.search_icd(
    search_term text,
    search_category text default 'icd10',
    search_chapter text default 'all'
)
RETURNS SETOF icd_codes
LANGUAGE sql
STABLE
AS $$
    SELECT * FROM public.icd_codes
    WHERE icd_version = search_category
      AND (search_chapter = 'all' OR chapter = search_chapter)
      AND (
          code ILIKE '%' || search_term || '%'
          OR title ILIKE '%' || search_term || '%'
          OR "desc" ILIKE '%' || search_term || '%'
      )
    LIMIT 100;
$$;
