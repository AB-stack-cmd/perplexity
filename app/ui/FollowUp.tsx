"use client";

import { useState, useRef } from "react";
import { ArrowUp } from "lucide-react";
import { cn } from "@/lib/utils";

interface FollowUpsProps {
  onSearch?: (q: string) => void;
}

export function FollowUps({ onSearch }: FollowUpsProps) {
  const [value, setValue] = useState("");
  const ref = useRef<HTMLTextAreaElement>(null);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!value.trim()) return;
    onSearch?.(value.trim());
    setValue("");
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e as unknown as React.FormEvent);
    }
  }

  return (
    <div className="sticky bottom-6 pt-4">
      <form
        onSubmit={handleSubmit}
        className={cn(
          "flex items-end gap-2 rounded-2xl border border-zinc-200 dark:border-zinc-800",
          "bg-white dark:bg-zinc-900 px-4 py-3 shadow-sm",
          "focus-within:border-zinc-300 dark:focus-within:border-zinc-700 transition-colors"
        )}
      >
        <textarea
          ref={ref}
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Ask a follow-up…"
          rows={1}
          className={cn(
            "flex-1 resize-none bg-transparent text-sm text-zinc-900 dark:text-zinc-100",
            "placeholder:text-zinc-400 focus:outline-none leading-relaxed",
            "max-h-40 overflow-y-auto"
          )}
          style={{ fieldSizing: "content" } as React.CSSProperties}
        />
        <button
          type="submit"
          disabled={!value.trim()}
          className={cn(
            "flex-shrink-0 w-7 h-7 rounded-lg flex items-center justify-center transition-colors",
            value.trim()
              ? "bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 hover:bg-zinc-700 dark:hover:bg-zinc-300"
              : "bg-zinc-100 dark:bg-zinc-800 text-zinc-400 cursor-not-allowed"
          )}
        >
          <ArrowUp className="w-4 h-4" />
        </button>
      </form>
    </div>
  );
}