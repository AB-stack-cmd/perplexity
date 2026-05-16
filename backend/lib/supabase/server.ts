import { createServerClient } from "@supabase/ssr"
import { cookies } from "next/headers"
import { error } from "node:console"
import { threadCpuUsage } from "node:process"

export async function createClient() {

  const cookieStore = await cookies()

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        // returning all the get cookies
        getAll() {
          return cookieStore.getAll()
        },
        // set all the cookies
        setAll(cookiesToSet) {

          try {

            cookiesToSet.forEach(
              ({ name, value, options }) =>
                cookieStore.set(name, value, options)
            )

          } catch {
             throw error("No cookies found")
          }
        },
      },
    }
  )
}