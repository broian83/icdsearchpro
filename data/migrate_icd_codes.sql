-- Migration: Drop old icd_codes table and recreate with new schema
-- Run this in Supabase SQL Editor BEFORE running seed_icd.mjs

-- Drop old table and its indexes
DROP TABLE IF EXISTS public.icd_codes CASCADE;

-- Enable pg_trgm for fuzzy matching (typo tolerance)
create extension if not exists pg_trgm;

-- Recreate with new schema ("desc" is a reserved keyword, needs quoting)
create table if not exists public.icd_codes (
    id uuid default uuid_generate_v4() primary key,
    code text not null,
    title text not null,
    "desc" text not null,
    icd_version text not null check (icd_version in ('icd10', 'icd9')),
    chapter text,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null,
    unique(code, icd_version)
);

-- Basic indexes for filtering
create index if not exists idx_icd_codes_code on public.icd_codes(code);
create index if not exists idx_icd_codes_version on public.icd_codes(icd_version);
create index if not exists idx_icd_codes_chapter on public.icd_codes(chapter);

-- GIN index for full-text search (6x faster than ILIKE)
create index if not exists idx_icd_codes_title_fts on public.icd_codes
    using gin(to_tsvector('simple', title));
create index if not exists idx_icd_codes_desc_fts on public.icd_codes
    using gin(to_tsvector('simple', "desc"));

-- GIN index for trigram fuzzy matching (typo tolerance)
create index if not exists idx_icd_codes_title_trgm on public.icd_codes
    using gin(title gin_trgm_ops);
create index if not exists idx_icd_codes_desc_trgm on public.icd_codes
    using gin("desc" gin_trgm_ops);

-- RLS for icd_codes (public read, no auth required)
alter table public.icd_codes enable row level security;
create policy "Anyone can read ICD codes"
    on public.icd_codes for select
    using ( true );

-- RPC function for ICD search (called by frontend)
drop function if exists public.search_icd(text, text, text);
create or replace function public.search_icd(
    search_term text,
    search_category text default 'icd10',
    search_chapter text default 'all'
)
returns table (
    code text,
    title text,
    "desc" text,
    icd_version text,
    score real
)
language plpgsql
stable
as $$
begin
    return query
    select ic.code, ic.title, ic."desc", ic.icd_version,
        (
            case when ic.code ilike search_term || '%' then 10.0
                 when ic.code ilike '%' || search_term || '%' then 5.0
                 else 0.0 end
            +
            case when websearch_to_tsquery('simple', search_term) @@
                     to_tsvector('simple', coalesce(ic.title, '')) then 3.0
                 else 0.0 end
            +
            case when websearch_to_tsquery('simple', search_term) @@
                     to_tsvector('simple', coalesce(ic."desc", '')) then 3.0
                 else 0.0 end
            +
            case when ic.title % search_term then 2.0
                 else 0.0 end
            +
            case when ic."desc" % search_term then 2.0
                 else 0.0 end
        )::real as score
    from public.icd_codes ic
    where ic.icd_version = search_category
        and (search_chapter = 'all'
             or ic.chapter = any(string_to_array(search_chapter, '|')))
        and (
            ic.code ilike '%' || search_term || '%'
            or ic.title ilike '%' || search_term || '%'
            or ic."desc" ilike '%' || search_term || '%'
            or websearch_to_tsquery('simple', search_term) @@
                to_tsvector('simple', coalesce(ic.title, ''))
            or websearch_to_tsquery('simple', search_term) @@
                to_tsvector('simple', coalesce(ic."desc", ''))
            or ic.title % search_term
            or ic."desc" % search_term
        )
    order by score desc
    limit 100;
end;
$$;
