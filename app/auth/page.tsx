"use client";

import { createClient } from "../lib/supabase/client";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { GitHubIcon } from "../icons/gitHubIcon";
import { GoogleIcon } from "../icons/googleIcon";
const supabase = createClient();

export default function Auth() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState<"github" | "google" | "email" | null>(null);

  async function loginWithOAuth(provider: "github" | "google") {
    try {
      setLoading(provider);
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider,
        options: {
          redirectTo: "http://localhost:3000/auth/dashboard",
        },
      });
      console.log(data);
      if (error) alert("Error while signing in: " + error.message);
    } catch (error) {
      alert("An unexpected error occurred: " + (error as Error).message);
    } finally {
      setLoading(null);
    }
  }

  async function loginWithEmail(e: React.FormEvent) {
    e.preventDefault();
    if (!email) return;
    try {
      setLoading("email");
      const { error } = await supabase.auth.signInWithOtp({
        email,
        options: { emailRedirectTo: "http://localhost:3000/auth/dashboard" },
      });
      if (error) alert("Error: " + error.message);
      else alert("Check your email for a magic link!");
    } catch (error) {
      alert("An unexpected error occurred: " + (error as Error).message);
    } finally {
      setLoading(null);
    }
  }

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-zinc-50 dark:bg-zinc-950">
      <div className="flex flex-col items-center w-full max-w-sm px-6 py-10">

        {/* Logo */}
        <div className="w-10 h-10 rounded-xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 flex items-center justify-center mb-7 shadow-sm">
          <svg className="w-5 h-5 text-zinc-400" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904 9 18.75l-.813-2.846a4.5 4.5 0 0 0-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 0 0 3.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 0 0 3.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 0 0-3.09 3.09Z" />
          </svg>
        </div>

        {/* Heading */}
        <h1 className="text-xl font-medium text-zinc-900 dark:text-zinc-50 mb-2">
          Welcome back
        </h1>
        <p className="text-sm text-zinc-500 dark:text-zinc-400 mb-8 text-center">
          Sign in to continue to your dashboard
        </p>

        {/* OAuth buttons */}
        <div className="w-full flex flex-col gap-2.5">
          <button
            onClick={() => loginWithOAuth("github")}
            disabled={!!loading}
            className="w-full flex items-center gap-3 px-4 py-2.5 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg text-sm text-zinc-800 dark:text-zinc-200 hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <GitHubIcon />
            <span className="flex-1 text-left">
              {loading === "github" ? "Redirecting…" : "Continue with GitHub"}
            </span>
          </button>

          <button
            onClick={() => loginWithOAuth("google")}
            disabled={!!loading}
            className="w-full flex items-center gap-3 px-4 py-2.5 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg text-sm text-zinc-800 dark:text-zinc-200 hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <GoogleIcon />
            <span className="flex-1 text-left">
              {loading === "google" ? "Redirecting…" : "Continue with Google"}
            </span>
          </button>
        </div>

        {/* Divider */}
        <div className="w-full flex items-center gap-3 my-6">
          <div className="flex-1 h-px bg-zinc-200 dark:bg-zinc-800" />
          <span className="text-xs text-zinc-400">or</span>
          <div className="flex-1 h-px bg-zinc-200 dark:bg-zinc-800" />
        </div>

        {/* Email */}
        <form onSubmit={loginWithEmail} className="w-full flex flex-col gap-2.5">
          <input
            type="email"
            placeholder="Email address"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="w-full px-4 py-2.5 text-sm rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-zinc-300 dark:focus:ring-zinc-700 transition"
          />
          <button
            type="submit"
            disabled={!!loading}
            className="w-full px-4 py-2.5 bg-zinc-900 dark:bg-zinc-50 text-white dark:text-zinc-900 text-sm font-medium rounded-lg hover:bg-zinc-700 dark:hover:bg-zinc-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading === "email" ? "Sending…" : "Continue with email"}
          </button>
        </form>

        {/* Footer */}
        <p className="text-xs text-zinc-400 mt-7 text-center leading-relaxed">
          By continuing, you agree to our{" "}
          <a href="#" className="text-zinc-500 underline underline-offset-2 hover:text-zinc-700 dark:hover:text-zinc-300">
            Terms
          </a>{" "}
          &amp;{" "}
          <a href="#" className="text-zinc-500 underline underline-offset-2 hover:text-zinc-700 dark:hover:text-zinc-300">
            Privacy Policy
          </a>
        </p>
      </div>
    </div>
  );
}



