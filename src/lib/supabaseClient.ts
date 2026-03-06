import { createClient } from "@supabase/supabase-js";
const supabaseUrl = import.meta.env.VITE_https://thsjjuqkqpgrivcfxrkc.supabase.com as string;
const supabaseAnonKey = import.meta.env.VITE_sb_secret_k6Tl87BLRZW1fLAX_xiLxw_ENIxGbB5 as string;
export const supabase = createClient(supabaseUrl, supabaseAnonKey);
