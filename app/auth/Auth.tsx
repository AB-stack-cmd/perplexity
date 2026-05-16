"use client"
import { createClient } from "../lib/supabase/client";
import { useRouter } from "next/navigation";

const supabase = createClient();

export default function Auth() {
  const router = useRouter();

  async function login(provider: "github" | "google") {
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: provider,
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
        },
      });

      if (error) {
        alert("Error while signing in: " + error.message);
      }
    } catch (error) {
      alert("An unexpected error occurred: " + (error as Error).message);
    }
  }

  return (
    <div>
      <button onClick={() => login("github")}>GitHub</button>
      <br />
      <button onClick={() => login("google")}>Google</button>
    </div>
  );
}