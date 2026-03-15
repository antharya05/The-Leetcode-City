-- Run this in your Supabase SQL Editor to create the XP Redeem Codes tables

CREATE TABLE IF NOT EXISTS public.xp_redeem_codes (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    code text UNIQUE NOT NULL,
    xp_amount integer NOT NULL DEFAULT 500,
    max_uses integer NOT NULL DEFAULT 1,
    used_count integer NOT NULL DEFAULT 0,
    expires_at timestamp with time zone,
    note text,
    created_at timestamp with time zone DEFAULT now()
);

-- Ensure RLS is enabled but policies allow service_role everything
ALTER TABLE public.xp_redeem_codes ENABLE ROW LEVEL SECURITY;

CREATE TABLE IF NOT EXISTS public.xp_code_usages (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    code_id uuid NOT NULL REFERENCES public.xp_redeem_codes(id) ON DELETE CASCADE,
    developer_id bigint NOT NULL REFERENCES public.developers(id) ON DELETE CASCADE,
    redeemed_at timestamp with time zone DEFAULT now(),
    UNIQUE(code_id, developer_id)
);

ALTER TABLE public.xp_code_usages ENABLE ROW LEVEL SECURITY;

-- Optional: Add policies if needed for client access (though server handles via service_role)
-- CREATE POLICY "Enable read access for all users" ON public.xp_redeem_codes FOR SELECT USING (true);
