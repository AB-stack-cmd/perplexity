"use client"
import { createClient } from "../lib/supabase/client";
import { useRouter } from "next/navigation";

const supabase = createClient();

export default function Auth() {
  const router = useRouter();

  async function login(provider: "github" | "google") {
    try {
      const { data ,error } = await supabase.auth.signInWithOAuth({
        provider: provider,
        options: {
          redirectTo: "http://localhost:3000/auth/dashboard",
        }
      });
      console.log(data)

      if (error) {
        alert("Error while signing in: " + error.message);
      }
    } catch (error) {
      alert("An unexpected error occurred: " + (error as Error).message);
    }
  }

  return (
    <div className="flex flex-col flex-1 items-center justify-center bg-zinc-50 font-sans dark:bg-black">
      <button onClick={() => login("github")}>GitHub</button>
      <button onClick={() => login("google")}>Google</button>
    </div>
  );
}