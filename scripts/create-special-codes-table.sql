-- Run this in your Supabase SQL Editor

CREATE TABLE IF NOT EXISTS public.special_codes (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    code text UNIQUE NOT NULL,
    type text NOT NULL DEFAULT 'all_items',
    max_uses integer NOT NULL DEFAULT 1,
    used_count integer NOT NULL DEFAULT 0,
    expires_at timestamp with time zone,
    note text,
    created_at timestamp with time zone DEFAULT now()
);

ALTER TABLE public.special_codes ENABLE ROW LEVEL SECURITY;

CREATE TABLE IF NOT EXISTS public.special_code_usages (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    code_id uuid NOT NULL REFERENCES public.special_codes(id) ON DELETE CASCADE,
    developer_id bigint NOT NULL REFERENCES public.developers(id) ON DELETE CASCADE,
    redeemed_at timestamp with time zone DEFAULT now(),
    UNIQUE(code_id, developer_id)
);

ALTER TABLE public.special_code_usages ENABLE ROW LEVEL SECURITY;
