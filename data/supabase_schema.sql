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
