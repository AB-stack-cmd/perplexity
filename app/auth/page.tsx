"use client";

import { createClient } from "../lib/supabase/client";
import { useRouter } from "next/navigation";
import { useState } from "react";

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

function GitHubIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" className="shrink-0">
      <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0 0 24 12c0-6.63-5.37-12-12-12Z" />
    </svg>
  );
}

function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true" className="shrink-0">
      <path fill="#4285F4" d="M23.745 12.27c0-.79-.07-1.54-.19-2.27h-11.3v4.51h6.47c-.29 1.48-1.14 2.73-2.4 3.58v3h3.86c2.26-2.09 3.56-5.17 3.56-8.82Z" />
      <path fill="#34A853" d="M12.255 24c3.24 0 5.95-1.08 7.93-2.91l-3.86-3c-1.08.72-2.45 1.16-4.07 1.16-3.13 0-5.78-2.11-6.73-4.96h-3.98v3.09C3.515 21.3 7.615 24 12.255 24Z" />
      <path fill="#FBBC05" d="M5.525 14.29c-.25-.72-.38-1.49-.38-2.29s.14-1.57.38-2.29V6.62h-3.98a11.86 11.86 0 0 0 0 10.76l3.98-3.09Z" />
      <path fill="#EA4335" d="M12.255 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C18.205 1.19 15.495 0 12.255 0c-4.64 0-8.74 2.7-10.71 6.62l3.98 3.09c.95-2.85 3.6-4.96 6.73-4.96Z" />
    </svg>
  );
}