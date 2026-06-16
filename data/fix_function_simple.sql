-- Step 1: Drop old function
DROP FUNCTION IF EXISTS public.search_icd(text, text, text);

-- Step 2: Create minimal test function
CREATE OR REPLACE FUNCTION public.search_icd(
    p_search_term text,
    p_search_category text default 'icd10',
    p_search_chapter text default 'all'
)
RETURNS SETOF icd_codes
LANGUAGE sql
STABLE
AS $$
    SELECT * FROM public.icd_codes
    WHERE icd_version = p_search_category
      AND (p_search_chapter = 'all' OR chapter = ANY(string_to_array(p_search_chapter, '|')))
      AND (
          code ILIKE '%' || p_search_term || '%'
          OR title ILIKE '%' || p_search_term || '%'
          OR "desc" ILIKE '%' || p_search_term || '%'
      )
    LIMIT 100;
$$;
