/**
 * Migration Script: XP Codes Tables
 */

import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const sb = createClient(SUPABASE_URL, SUPABASE_KEY, { auth: { persistSession: false } });

async function main() {
    console.log("Creating XP code tables...");
    
    // Create xp_redeem_codes table
    const { error: err1 } = await sb.rpc('exec_sql', {
        query: `
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
        `
    });
    
    // Create xp_code_usages table
    const { error: err2 } = await sb.rpc('exec_sql', {
        query: `
        CREATE TABLE IF NOT EXISTS public.xp_code_usages (
            id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
            code_id uuid NOT NULL,
            developer_id bigint NOT NULL,
            redeemed_at timestamp with time zone DEFAULT now(),
            UNIQUE(code_id, developer_id)
        );
        `
    });

    if (err1) console.error("Error creating xp_redeem_codes:", err1);
    else console.log("Created xp_redeem_codes table (or already exists)");

    if (err2) console.error("Error creating xp_code_usages:", err2);
    else console.log("Created xp_code_usages table (or already exists)");
    
    if (err1 && err1.message.includes("Could not find the function")) {
        console.log("\n❌ exec_sql function not found in Supabase! You must run the SQL manually in the Supabase Dashboard SQL Editor:\n");
        console.log(`
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

CREATE TABLE IF NOT EXISTS public.xp_code_usages (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    code_id uuid NOT NULL,
    developer_id bigint NOT NULL,
    redeemed_at timestamp with time zone DEFAULT now(),
    UNIQUE(code_id, developer_id)
);
        `);
    }
}

main().catch(console.error);
