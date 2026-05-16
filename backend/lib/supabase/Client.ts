import { createClient } from "@supabase/supabase-js";

export function createSupabseClient(){
    return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_API_SECRET !
    )
}