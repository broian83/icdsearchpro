-- Schema for ICD Search Pro

-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- Table for Bookmarks
create table if not exists public.bookmarks (
    id uuid default uuid_generate_v4() primary key,
    user_id uuid references auth.users(id) on delete cascade not null,
    code text not null,
    title text not null,
    desc_text text,
    icd_version text not null check (icd_version in ('icd10', 'icd9')),
    created_at timestamp with time zone default timezone('utc'::text, now()) not null,
    unique(user_id, code, icd_version)
);

-- Table for Cloud History (Case Consultation)
create table if not exists public.case_history (
    id uuid default uuid_generate_v4() primary key,
    user_id uuid references auth.users(id) on delete cascade not null,
    resume text not null,
    ai_response text not null,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Setup Row Level Security (RLS)
alter table public.bookmarks enable row level security;
alter table public.case_history enable row level security;

-- Policies for Bookmarks
create policy "Users can view their own bookmarks."
    on public.bookmarks for select
    using ( auth.uid() = user_id );

create policy "Users can insert their own bookmarks."
    on public.bookmarks for insert
    with check ( auth.uid() = user_id );

create policy "Users can delete their own bookmarks."
    on public.bookmarks for delete
    using ( auth.uid() = user_id );

-- Policies for Case History
create policy "Users can view their own case history."
    on public.case_history for select
    using ( auth.uid() = user_id );

create policy "Users can insert their own case history."
    on public.case_history for insert
    with check ( auth.uid() = user_id );

create policy "Users can delete their own case history."
    on public.case_history for delete
    using ( auth.uid() = user_id );

-- ============================================================
-- ICD Codes Table + Full-Text Search RPC (Phase 3)
-- ============================================================

-- Enable pg_trgm for fuzzy matching (typo tolerance)
create extension if not exists pg_trgm;

-- Table to store ICD codes in Supabase (for search_icd RPC)
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

-- GIN index for full-text search (6x faster than ILIKE, per Zenn case study)
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
            -- Code prefix match (strongest signal)
            case when ic.code ilike search_term || '%' then 10.0
                 when ic.code ilike '%' || search_term || '%' then 5.0
                 else 0.0 end
            +
            -- Full-text search on title (uses GIN index)
            case when websearch_to_tsquery('simple', search_term) @@
                     to_tsvector('simple', coalesce(ic.title, '')) then 3.0
                 else 0.0 end
            +
            -- Full-text search on desc (uses GIN index)
            case when websearch_to_tsquery('simple', search_term) @@
                     to_tsvector('simple', coalesce(ic."desc", '')) then 3.0
                 else 0.0 end
            +
            -- Trigram fuzzy match on title (uses GIN trigram index)
            case when ic.title % search_term then 2.0
                 else 0.0 end
            +
            -- Trigram fuzzy match on desc (uses GIN trigram index)
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
