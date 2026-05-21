"use client";

import { useState, useRef, useEffect } from "react";
import { Send, Loader2, Globe, ChevronDown, ChevronUp } from "lucide-react";
import { cn } from "@/lib/utils";
import { createClient } from "../lib/supabase/client";

const supabase = createClient();

interface Source {
  title: string;
  url: string;
}

interface Message {
  role: "user" | "assistant";
  content: string;
  sources?: Source[];
}

interface FollowUpProps {
  conversationId: string;
}

export default function FollowUp({ conversationId }: FollowUpProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [query, setQuery] = useState("");
  const [streaming, setStreaming] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSubmit = async () => {
    const trimmed = query.trim();
    if (!trimmed || streaming) return;

    setQuery("");
    setError(null);

    // Add user message
    setMessages((prev) => [...prev, { role: "user", content: trimmed }]);

    // Add empty assistant message to stream into
    setMessages((prev) => [...prev, { role: "assistant", content: "", sources: [] }]);
    setStreaming(true);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      const jwt = session?.access_token;

      const response = await fetch("http://localhost:4000/purplexity/follow_up", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${jwt}`,
        },
        credentials: "include",
        body: JSON.stringify({ conversationId, query: trimmed }),
      });

      if (!response.ok) throw new Error(`Server error: ${response.status}`);

      const reader = response.body?.getReader();
      if (!reader) throw new Error("No response body");

      const decoder = new TextDecoder();
      let buffer = "";
      let answerText = "";
      let sourcesSection = false;
      let rawSources = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });

        // Check for source delimiter
        if (buffer.includes("\n<SOURCES>\n")) {
          const [before, after] = buffer.split("\n<SOURCES>\n");
          answerText = before;
          rawSources = after || "";
          sourcesSection = true;

          setMessages((prev) => {
            const updated = [...prev];
            updated[updated.length - 1] = {
              role: "assistant",
              content: answerText,
              sources: [],
            };
            return updated;
          });
        } else if (!sourcesSection) {
          answerText = buffer;
          setMessages((prev) => {
            const updated = [...prev];
            updated[updated.length - 1] = {
              ...updated[updated.length - 1],
              content: answerText,
            };
            return updated;
          });
        } else {
          rawSources = buffer.split("\n<SOURCES>\n")[1] || "";
        }
      }

      // Parse sources
      let sources: Source[] = [];
      try {
        sources = JSON.parse(rawSources.trim());
      } catch {
        sources = [];
      }

      setMessages((prev) => {
        const updated = [...prev];
        updated[updated.length - 1] = {
          role: "assistant",
          content: answerText,
          sources,
        };
        return updated;
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
      // Remove empty assistant message on error
      setMessages((prev) => prev.slice(0, -1));
    } finally {
      setStreaming(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  // Auto-resize textarea
  const handleTextareaChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setQuery(e.target.value);
    const el = textareaRef.current;
    if (el) {
      el.style.height = "auto";
      el.style.height = `${Math.min(el.scrollHeight, 160)}px`;
    }
  };

  return (
    <div className="flex flex-col h-full bg-[#0b0b0b]">
      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-6 space-y-6 scrollbar-thin scrollbar-thumb-zinc-800">
        {messages.length === 0 && (
          <div className="flex items-center justify-center h-full text-zinc-600 text-sm">
            Ask a follow-up question…
          </div>
        )}

        {messages.map((msg, i) => (
          <div key={i} className={cn("flex flex-col gap-2", msg.role === "user" ? "items-end" : "items-start")}>
            {msg.role === "user" ? (
              <div className="max-w-[75%] bg-zinc-900 border border-zinc-800 rounded-2xl rounded-tr-sm px-4 py-3 text-sm text-zinc-100 leading-relaxed">
                {msg.content}
              </div>
            ) : (
              <AssistantMessage message={msg} isStreaming={streaming && i === messages.length - 1} />
            )}
          </div>
        ))}

        {error && (
          <div className="text-xs text-red-400 bg-red-950/30 border border-red-900/40 rounded-xl px-4 py-3">
            {error}
          </div>
        )}

        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="border-t border-zinc-800 p-4">
        <div className="relative flex items-end gap-2 bg-zinc-900 border border-zinc-800 rounded-2xl px-4 py-3 focus-within:border-zinc-600 transition-colors">
          <textarea
            ref={textareaRef}
            rows={1}
            value={query}
            onChange={handleTextareaChange}
            onKeyDown={handleKeyDown}
            placeholder="Ask a follow-up…"
            disabled={streaming}
            className="flex-1 bg-transparent text-sm text-zinc-100 placeholder:text-zinc-600 outline-none resize-none leading-relaxed disabled:opacity-50"
            style={{ minHeight: "24px", maxHeight: "160px" }}
          />
          <button
            onClick={handleSubmit}
            disabled={!query.trim() || streaming}
            className="shrink-0 w-8 h-8 rounded-xl bg-white flex items-center justify-center text-black hover:bg-zinc-200 transition disabled:opacity-30 disabled:cursor-not-allowed"
          >
            {streaming ? (
              <Loader2 size={14} className="animate-spin" />
            ) : (
              <Send size={14} />
            )}
          </button>
        </div>
        <p className="text-[10px] text-zinc-700 text-center mt-2">
          Enter to send · Shift+Enter for new line
        </p>
      </div>
    </div>
  );
}

function AssistantMessage({ message, isStreaming }: { message: Message; isStreaming: boolean }) {
  const [showSources, setShowSources] = useState(false);
  const hasSources = message.sources && message.sources.length > 0;

  return (
    <div className="max-w-[85%] flex flex-col gap-3">
      {/* Answer */}
      <div className="text-sm text-zinc-200 leading-relaxed whitespace-pre-wrap">
        {message.content}
        {isStreaming && (
          <span className="inline-block w-1 h-4 bg-zinc-400 ml-1 animate-pulse rounded-sm align-middle" />
        )}
      </div>

      {/* Sources */}
      {hasSources && (
        <div className="flex flex-col gap-2">
          <button
            onClick={() => setShowSources((v) => !v)}
            className="flex items-center gap-1.5 text-[11px] text-zinc-500 hover:text-zinc-300 transition w-fit"
          >
            <Globe size={11} />
            {message.sources!.length} source{message.sources!.length !== 1 ? "s" : ""}
            {showSources ? <ChevronUp size={11} /> : <ChevronDown size={11} />}
          </button>

          {showSources && (
            <div className="flex flex-col gap-1.5">
              {message.sources!.map((src, i) => (
                <a
                  key={i}
                  href={src.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-start gap-2 bg-zinc-900 border border-zinc-800 rounded-xl px-3 py-2 hover:border-zinc-700 transition group"
                >
                  <Globe size={11} className="text-zinc-600 mt-0.5 shrink-0 group-hover:text-zinc-400 transition" />
                  <div className="min-w-0">
                    <p className="text-[11px] text-zinc-300 truncate group-hover:text-white transition">
                      {src.title || src.url}
                    </p>
                    <p className="text-[10px] text-zinc-600 truncate">{src.url}</p>
                  </div>
                </a>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}