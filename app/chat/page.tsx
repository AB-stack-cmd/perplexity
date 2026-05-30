"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  Search, MessageSquare, Plus, Loader2,
  PanelLeftClose, PanelLeftOpen, Send, Globe,
  Sparkles, ExternalLink, ArrowRight, Zap,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { createClient } from "../lib/supabase/client";
import { useRouter } from "next/navigation";

// ─── Config ───────────────────────────────────────────────────────────────────

const supabase = createClient();
const API = process.env.PORT; // env port

// ─── Types ────────────────────────────────────────────────────────────────────

interface Conversation { id: string; title: string; slug: string; createdAt: string; }
interface Source      { title: string; url: string; }
interface Message     { role: "user" | "assistant"; content: string; sources?: Source[]; followUps?: string[]; }
interface StreamResult{ text: string; sources: Source[]; followUps: string[]; conversationId: string | null; }

// ─── Auth ─────────────────────────────────────────────────────────────────────

async function getToken(): Promise<string> {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session?.access_token) throw new Error("Not authenticated");
  return session.access_token;
}

// ─── Stream Utility ───────────────────────────────────────────────────────────
// Single shared function for both /purplexity_ask and /purplexity/follow_up

async function streamQuery(
  endpoint: string,
  body: object,
  token: string,
  delimiter: string,
  onChunk: (text: string) => void,
): Promise<StreamResult> {
  const res = await fetch(`${API}${endpoint}`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
    credentials: "include",
    body: JSON.stringify(body),
  });

  if (!res.ok) throw new Error(`Server error ${res.status}`);

  const conversationId = res.headers.get("X-Conversation-Id");
  const reader = res.body!.getReader();
  const decoder = new TextDecoder();
  let buffer = "";
  let answerText = "";
  let sourcesFound = false;

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });

    if (!sourcesFound && buffer.includes(delimiter)) {
      [answerText] = buffer.split(delimiter);
      sourcesFound = true;
    } else if (!sourcesFound) {
      answerText = buffer;
    }
    onChunk(answerText);
  }

  // Parse sources
  let sources: Source[] = [];
  try {
    const raw = buffer.split(delimiter)[1]?.trim() ?? "[]";
    sources = JSON.parse(raw);
  } catch { /* empty — leave as [] */ }

  // Unwrap structured JSON output { answer, followUps }
  let followUps: string[] = [];
  try {
    const cleaned = answerText.replace(/```json\n?|```/g, "").trim();
    const obj = JSON.parse(cleaned);
    if (Array.isArray(obj.followUps)) followUps = obj.followUps.slice(0, 3);
    if (typeof obj.answer === "string") answerText = obj.answer;
  } catch { /* plain text — fine */ }

  return { text: answerText, sources, followUps, conversationId };
}

// ─── Small Utilities ──────────────────────────────────────────────────────────

function getHostname(url: string): string {
  try { return new URL(url).hostname.replace("www.", ""); }
  catch { return url; }
}

// ─── Favicon ──────────────────────────────────────────────────────────────────

function Favicon({ url }: { url: string }) {
  const host = (() => { try { return new URL(url).hostname; } catch { return ""; } })();
  return (
    <img
      src={`https://www.google.com/s2/favicons?domain=${host}&sz=16`}
      alt=""
      className="w-3.5 h-3.5 rounded-sm shrink-0"
      onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
    />
  );
}

// ─── Source Bar ───────────────────────────────────────────────────────────────

function SourceBar({ sources, streaming }: { sources: Source[]; streaming: boolean }) {
  return (
    <aside className="w-[220px] shrink-0 border-l border-zinc-800/40 flex flex-col bg-[#0c0c0d]">
      <div className="h-12 px-4 border-b border-zinc-800/40 flex items-center gap-2 shrink-0">
        <Globe size={12} className="text-zinc-600" />
        <p className="text-zinc-500 text-[11px] font-medium">Sources</p>
        {streaming ? (
          <Loader2 size={10} className="animate-spin text-violet-500 ml-auto" />
        ) : sources.length > 0 ? (
          <span className="ml-auto text-[10px] bg-zinc-900 border border-zinc-800 text-zinc-500 px-1.5 py-0.5 rounded-full tabular-nums">
            {sources.length}
          </span>
        ) : null}
      </div>

      <div className="flex-1 overflow-y-auto thin-scroll px-2.5 py-3 space-y-1.5">
        {sources.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-32 text-center px-3 gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-zinc-900 border border-zinc-800/60 flex items-center justify-center">
              <Globe size={14} className="text-zinc-700" />
            </div>
            <p className="text-zinc-700 text-[10px] leading-relaxed">
              Sources appear after a response
            </p>
          </div>
        ) : (
          sources.map((src, i) => {
            const host = getHostname(src.url);
            return (
              <a
                key={i}
                href={src.url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex flex-col gap-1.5 bg-[#111112] border border-zinc-800/50 rounded-xl px-3 py-2.5 hover:border-zinc-700/70 hover:bg-[#161617] transition-all group fade-up"
              >
                <div className="flex items-start gap-1.5">
                  <span className="text-[9px] text-zinc-700 font-medium tabular-nums mt-0.5 w-3 shrink-0">{i + 1}</span>
                  <Favicon url={src.url} />
                  <p className="text-[11px] text-zinc-300 leading-[1.35] line-clamp-2 group-hover:text-white transition-colors flex-1">
                    {src.title || host}
                  </p>
                </div>
                <div className="flex items-center justify-between pl-5">
                  <p className="text-[10px] text-zinc-700 truncate">{host}</p>
                  <ExternalLink size={9} className="text-zinc-800 group-hover:text-zinc-500 transition-colors shrink-0" />
                </div>
              </a>
            );
          })
        )}
      </div>
    </aside>
  );
}

// ─── Query Input ──────────────────────────────────────────────────────────────

interface QueryInputProps {
  value: string;
  onChange: (v: string) => void;
  onSubmit: () => void;
  streaming: boolean;
  placeholder?: string;
  autoFocus?: boolean;
  className?: string;
}

function QueryInput({
  value, onChange, onSubmit, streaming,
  placeholder = "Ask anything…", autoFocus, className,
}: QueryInputProps) {
  const ref = useRef<HTMLTextAreaElement>(null);

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    onChange(e.target.value);
    const el = ref.current;
    if (el) { el.style.height = "auto"; el.style.height = `${Math.min(el.scrollHeight, 160)}px`; }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); onSubmit(); }
  };

  return (
    <div className={cn(
      "flex items-end gap-2 bg-[#141415] border border-zinc-800/60 rounded-2xl px-4 py-3",
      "focus-within:border-zinc-700/80 focus-within:bg-[#161617] transition-all",
      className,
    )}>
      <textarea
        ref={ref}
        rows={1}
        value={value}
        onChange={handleChange}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        disabled={streaming}
        autoFocus={autoFocus}
        className="flex-1 bg-transparent text-[13.5px] text-zinc-100 placeholder:text-zinc-600 outline-none resize-none leading-relaxed disabled:opacity-40"
        style={{ minHeight: "22px", maxHeight: "160px" }}
      />
      <button
        onClick={onSubmit}
        disabled={!value.trim() || streaming}
        className="shrink-0 w-7 h-7 rounded-lg bg-violet-600 flex items-center justify-center text-white hover:bg-violet-500 active:scale-95 transition-all disabled:opacity-25 disabled:cursor-not-allowed"
      >
        {streaming ? <Loader2 size={12} className="animate-spin" /> : <Send size={12} />}
      </button>
    </div>
  );
}

// ─── Message Bubble ───────────────────────────────────────────────────────────

function MessageBubble({
  msg, isLast, streaming, onFollowUp,
}: {
  msg: Message;
  isLast: boolean;
  streaming: boolean;
  onFollowUp: (text: string) => void;
}) {
  if (msg.role === "user") {
    return (
      <div className="flex justify-end">
        <div className="max-w-[78%] bg-[#1a1a1c] border border-zinc-800/60 rounded-2xl rounded-tr-sm px-4 py-3 text-[13.5px] text-zinc-100 leading-relaxed">
          {msg.content}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Inline source chips */}
      {msg.sources && msg.sources.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {msg.sources.slice(0, 4).map((src, i) => (
            <a
              key={i}
              href={src.url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 bg-[#1a1a1c] border border-zinc-800/60 rounded-lg px-2.5 py-1.5 hover:border-zinc-700 hover:bg-[#1e1e20] transition-all group max-w-[180px]"
            >
              <Favicon url={src.url} />
              <span className="text-[11px] text-zinc-400 truncate group-hover:text-zinc-200 transition-colors">
                {getHostname(src.url)}
              </span>
            </a>
          ))}
          {msg.sources.length > 4 && (
            <span className="text-[11px] text-zinc-600 self-center px-1">
              +{msg.sources.length - 4} more
            </span>
          )}
        </div>
      )}

      {/* Answer */}
      <div className="prose-answer text-[13.5px] text-zinc-300 leading-7">
        {!msg.content && isLast && streaming ? (
          <span className="flex items-center gap-2 text-zinc-600 text-[12px]">
            <Loader2 size={11} className="animate-spin" />
            Searching the web…
          </span>
        ) : (
          <>
            {msg.content}
            {isLast && streaming && (
              <span className="inline-block w-[2px] h-[14px] bg-violet-400 ml-0.5 rounded-full align-middle cursor-blink" />
            )}
          </>
        )}
      </div>

      {/* Follow-up suggestions */}
      {msg.followUps && msg.followUps.length > 0 && !streaming && (
        <div className="space-y-2 pt-1">
          <p className="text-[10px] text-zinc-600 uppercase tracking-widest font-medium">Related</p>
          {msg.followUps.map((fu, i) => (
            <button
              key={i}
              onClick={() => onFollowUp(fu)}
              className="chip-hover w-full flex items-center justify-between gap-3 bg-[#141415] border border-zinc-800/60 rounded-xl px-4 py-2.5 text-left group transition-all"
            >
              <span className="text-[12.5px] text-zinc-400 group-hover:text-zinc-200 transition-colors leading-snug">{fu}</span>
              <ArrowRight size={12} className="text-zinc-700 group-hover:text-zinc-400 shrink-0 transition-colors" />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Thread View ──────────────────────────────────────────────────────────────
// Shared layout for both NewThreadPanel (result mode) and ConversationPanel.

interface ThreadViewProps {
  title: string;
  messages: Message[];
  query: string;
  streaming: boolean;
  error: string | null;
  sources: Source[];
  followUps: string[];
  onQuery: (text: string) => void;
  onChangeQuery: (v: string) => void;
}

function ThreadView({
  title, messages, query, streaming, error, sources, followUps, onQuery, onChangeQuery,
}: ThreadViewProps) {
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  return (
    <div className="flex h-full overflow-hidden">
      {/* Messages + input */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Header */}
        <div className="h-12 px-6 border-b border-zinc-800/40 flex items-center shrink-0">
          <p className="text-zinc-400 text-[12px] truncate">{title || "New thread"}</p>
        </div>

        {/* Scroll area */}
        <div className="flex-1 overflow-y-auto thin-scroll">
          <div className="max-w-2xl mx-auto px-6 py-8 space-y-10">
            {messages.map((msg, i) => (
              <div key={i} className="fade-up">
                <MessageBubble
                  msg={msg}
                  isLast={i === messages.length - 1}
                  streaming={streaming}
                  onFollowUp={onQuery}
                />
              </div>
            ))}
            {error && (
              <p className="text-[12px] text-red-400 bg-red-950/20 border border-red-900/30 rounded-xl px-4 py-3">
                {error}
              </p>
            )}
            <div ref={bottomRef} />
          </div>
        </div>

        {/* Input bar */}
        <div className="shrink-0 px-6 py-4 border-t border-zinc-800/40">
          <div className="max-w-2xl mx-auto">
            {/* Follow-up chips */}
            {followUps.length > 0 && !streaming && (
              <div className="flex flex-wrap gap-1.5 mb-3">
                {followUps.map((fu, i) => (
                  <button
                    key={i}
                    onClick={() => onQuery(fu)}
                    className="chip-hover flex items-center gap-1.5 bg-[#141415] border border-zinc-800/60 rounded-full px-3 py-1 text-[11.5px] text-zinc-500 hover:text-zinc-200 transition-all"
                  >
                    <Sparkles size={10} className="text-violet-500 shrink-0" />
                    <span className="truncate max-w-[200px]">{fu}</span>
                  </button>
                ))}
              </div>
            )}
            <QueryInput
              value={query}
              onChange={onChangeQuery}
              onSubmit={() => onQuery(query)}
              streaming={streaming}
              placeholder="Ask a follow-up…"
            />
          </div>
        </div>
      </div>

      <SourceBar sources={sources} streaming={streaming} />
    </div>
  );
}

// ─── New Thread Panel ─────────────────────────────────────────────────────────
// Handles the very first ask (/purplexity_ask) and all follow-ups within the
// same session (/purplexity/follow_up). Never calls /purplexity_ask twice.

function NewThreadPanel({ onCreated }: { onCreated: (conv: Conversation) => void }) {
  const [query, setQuery]           = useState("");
  const [messages, setMessages]     = useState<Message[]>([]);
  const [streaming, setStreaming]   = useState(false);
  const [error, setError]           = useState<string | null>(null);
  const [sources, setSources]       = useState<Source[]>([]);
  const [followUps, setFollowUps]   = useState<string[]>([]);
  // Tracks the conversation created by the first ask
  const [conversationId, setConversationId] = useState<string | null>(null);

  const handleQuery = async (text: string) => {
    const trimmed = text.trim();
    if (!trimmed || streaming) return;
    setQuery("");
    setError(null);
    setSources([]);
    setFollowUps([]);

    // ✅ First ask → /purplexity_ask ; subsequent → /purplexity/follow_up
    const isFirst    = conversationId === null;
    const endpoint   = isFirst ? "/purplexity_ask"       : "/purplexity/follow_up";
    const body       = isFirst ? { query: trimmed }       : { conversationId, query: trimmed };
    const delimiter  = isFirst ? "\n<SOURCE>\n"           : "\n<SOURCES>\n";

    setMessages((prev) => [
      ...prev,
      { role: "user", content: trimmed },
      { role: "assistant", content: "", sources: [] },
    ]);
    setStreaming(true);

    try {
      const token  = await getToken();
      const result = await streamQuery(endpoint, body, token, delimiter, (chunk) => {
        setMessages((prev) => {
          const u = [...prev];
          u[u.length - 1] = { ...u[u.length - 1], content: chunk };
          return u;
        });
      });

      // Finalise assistant message
      setMessages((prev) => {
        const u = [...prev];
        u[u.length - 1] = {
          role: "assistant",
          content: result.text,
          sources: result.sources,
          followUps: result.followUps,
        };
        return u;
      });
      setSources(result.sources);
      setFollowUps(result.followUps);

      // After first ask: store conv ID + notify sidebar
      if (isFirst && result.conversationId) {
        setConversationId(result.conversationId);
        onCreated({
          id: result.conversationId,
          title: trimmed.slice(0, 80),
          slug: "",
          createdAt: new Date().toISOString(),
        });
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong");
      setMessages((prev) => prev.slice(0, -2)); // remove optimistic pair
    } finally {
      setStreaming(false);
    }
  };

  // ── Empty state ──
  if (messages.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-7 px-6">
        <div className="text-center space-y-3">
          <div className="w-12 h-12 rounded-2xl bg-violet-600/15 border border-violet-500/20 flex items-center justify-center mx-auto">
            <Sparkles size={20} className="text-violet-400" />
          </div>
          <div>
            <p className="text-zinc-200 text-[15px] font-medium">What do you want to know?</p>
            <p className="text-zinc-600 text-[12px] mt-1">Search anything — powered by the web</p>
          </div>
        </div>
        <div className="w-full max-w-xl">
          <QueryInput
            value={query}
            onChange={setQuery}
            onSubmit={() => handleQuery(query)}
            streaming={streaming}
            placeholder="Ask anything…"
            autoFocus
            className="shadow-xl shadow-black/30"
          />
        </div>
      </div>
    );
  }

  return (
    <ThreadView
      title={messages[0]?.content ?? "New thread"}
      messages={messages}
      query={query}
      streaming={streaming}
      error={error}
      sources={sources}
      followUps={followUps}
      onQuery={handleQuery}
      onChangeQuery={setQuery}
    />
  );
}

// ─── Conversation Panel ───────────────────────────────────────────────────────
// Shown when clicking an existing thread. Loads history from the server, then
// handles follow-up messages via /purplexity/follow_up.

// ── Stored content parser ─────────────────────────────────────────────────────
// /purplexity_ask uses Output.object so the DB stores raw JSON like:
//   {"answer":"The actual text…","followUps":["Q1?","Q2?","Q3?"]}
// /purplexity/follow_up stores plain text.
// This helper handles both cases transparently.
function parseStoredContent(
  role: string,
  raw: string
): { content: string; followUps: string[]; sources: Source[] } {
  if (role.toLowerCase() !== "assistant") {
    return { content: raw, followUps: [], sources: [] };
  }
  try {
    const cleaned = raw.replace(/```json\n?|```/g, "").trim();
    const obj = JSON.parse(cleaned);
    return {
      content:   typeof obj.answer    === "string" ? obj.answer                : raw,
      followUps: Array.isArray(obj.followUps)      ? obj.followUps.slice(0, 3) : [],
      sources:   Array.isArray(obj.sources)         ? obj.sources               : [],
    };
  } catch {
    return { content: raw, followUps: [], sources: [] }; // plain text — use as-is
  }
}

function ConversationPanel({ conversation }: { conversation: Conversation }) {
  const [messages, setMessages]   = useState<Message[]>([]);
  const [query, setQuery]         = useState("");
  const [streaming, setStreaming] = useState(false);
  const [loading, setLoading]     = useState(true);
  const [error, setError]         = useState<string | null>(null);
  const [sources, setSources]     = useState<Source[]>([]);
  const [followUps, setFollowUps] = useState<string[]>([]);

  // Load full message history when the panel mounts or conversation changes
  useEffect(() => {
    let cancelled = false;

    // Reset all state for the incoming conversation
    setLoading(true);
    setMessages([]);
    setSources([]);
    setFollowUps([]);
    setError(null);   // ← clears stale errors from previous threads
    setQuery("");

    (async () => {
      try {
        const token = await getToken();
        const res   = await fetch(`${API}/conversation/${conversation.id}`, {
          headers: { Authorization: `Bearer ${token}` },
          credentials: "include",
        });
        if (!res.ok) throw new Error(`Server returned ${res.status}`);
        const data = await res.json();
        if (cancelled) return;

        // DB stores role as "User" / "Assistant" — normalise + parse content + sources
        const mapped: Message[] = (data.conversation?.messages ?? []).map(
          (m: { role: string; content: string }) => {
            const { content, followUps, sources } = parseStoredContent(m.role, m.content);
            return {
              role: m.role.toLowerCase() as "user" | "assistant",
              content,
              sources,
              followUps,
            };
          }
        );
        setMessages(mapped);

        // Pre-populate the source bar with sources from the last assistant message
        // so the right panel isn't empty when revisiting a thread.
        const lastAssistant = [...mapped].reverse().find((m) => m.role === "assistant");
        if (lastAssistant?.sources?.length) {
          setSources(lastAssistant.sources);
        }
      } catch (e) {
        if (!cancelled) {
          setError(e instanceof Error ? e.message : "Failed to load conversation");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => { cancelled = true; };
  }, [conversation.id]);

  const sendQuery = async (text: string) => {
    const trimmed = text.trim();
    if (!trimmed || streaming) return;
    setQuery("");
    setError(null);
    setFollowUps([]);
    setSources([]);

    setMessages((prev) => [
      ...prev,
      { role: "user", content: trimmed },
      { role: "assistant", content: "", sources: [] },
    ]);
    setStreaming(true);

    try {
      const token  = await getToken();
      const result = await streamQuery(
        "/purplexity/follow_up",
        { conversationId: conversation.id, query: trimmed },
        token,
        "\n<SOURCES>\n",
        (chunk) => {
          setMessages((prev) => {
            const u = [...prev];
            u[u.length - 1] = { ...u[u.length - 1], content: chunk };
            return u;
          });
        }
      );

      setMessages((prev) => {
        const u = [...prev];
        u[u.length - 1] = {
          role: "assistant",
          content: result.text,
          sources: result.sources,
          followUps: result.followUps,
        };
        return u;
      });
      setSources(result.sources);
      setFollowUps(result.followUps);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong");
      setMessages((prev) => prev.slice(0, -2));
    } finally {
      setStreaming(false);
    }
  };

  if (loading) {
    return (
      <div className="flex h-full overflow-hidden">
        <div className="flex-1 flex flex-col min-w-0">
          <div className="h-12 px-6 border-b border-zinc-800/40 flex items-center shrink-0">
            <p className="text-zinc-400 text-[12px] truncate">{conversation.title}</p>
          </div>
          {/* Shimmer skeleton — mirrors the real message layout */}
          <div className="flex-1 overflow-y-auto thin-scroll">
            <div className="max-w-2xl mx-auto px-6 py-8 space-y-10">
              <div className="space-y-3">
                <div className="flex gap-1.5">
                  {[80, 120, 96].map((w, i) => (
                    <div key={i} className="h-6 rounded-lg shimmer" style={{ width: w }} />
                  ))}
                </div>
                <div className="space-y-2">
                  {[100, 85, 95, 70].map((pct, i) => (
                    <div key={i} className="h-3.5 rounded shimmer" style={{ width: `${pct}%` }} />
                  ))}
                </div>
              </div>
              <div className="flex justify-end">
                <div className="h-10 w-48 rounded-2xl shimmer" />
              </div>
              <div className="space-y-2">
                {[100, 88, 76, 55].map((pct, i) => (
                  <div key={i} className="h-3.5 rounded shimmer" style={{ width: `${pct}%` }} />
                ))}
              </div>
            </div>
          </div>
        </div>
        <SourceBar sources={[]} streaming={false} />
      </div>
    );
  }

  // Fetch failed — show inline error
  if (error && messages.length === 0) {
    return (
      <div className="flex flex-col h-full">
        <div className="h-12 px-6 border-b border-zinc-800/40 flex items-center shrink-0">
          <p className="text-zinc-400 text-[12px] truncate">{conversation.title}</p>
        </div>
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center space-y-3">
            <p className="text-zinc-500 text-[13px]">{error}</p>
            <button
              onClick={() => { setError(null); setLoading(true); }}
              className="text-[12px] text-violet-400 hover:text-violet-300 transition-colors underline underline-offset-2"
            >
              Try again
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <ThreadView
      title={conversation.title}
      messages={messages}
      query={query}
      streaming={streaming}
      error={error}
      sources={sources}
      followUps={followUps}
      onQuery={sendQuery}
      onChangeQuery={setQuery}
    />
  );
}

// ─── Chat Page ────────────────────────────────────────────────────────────────

export default function ChatPage() {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loadingConvs, setLoadingConvs]   = useState(true);
  const [search, setSearch]               = useState("");
  const [active, setActive]               = useState<Conversation | null>(null);
  const [sidebarOpen, setSidebarOpen]     = useState(true);
  const router = useRouter();

  // Fetch sidebar conversation list
  useEffect(() => {
    (async () => {
      try {
        const token = await getToken();
        const res   = await fetch(`${API}/conversation`, {
          headers: { Authorization: `Bearer ${token}` },
          credentials: "include",
        });
        if (!res.ok) throw new Error(`${res.status}`);
        const data = await res.json();
        setConversations(data.conversations ?? []);
      } catch {
        // Not authenticated — redirect to login
        router.push("/");
      } finally {
        setLoadingConvs(false);
      }
    })();
  }, []);

  const filtered = useMemo(
    () => conversations.filter((c) =>
      c.title.toLowerCase().includes(search.toLowerCase())
    ),
    [conversations, search]
  );

  // Add newly created conversation to the top of the sidebar list.
  // Does NOT switch active — NewThreadPanel manages its own in-session state.
  const onNewConversation = (conv: Conversation) => {
    setConversations((prev) => [conv, ...prev]);
  };

  return (
    <div className="flex h-screen w-full overflow-hidden bg-[#0f0f10]" style={{ fontFamily: "'DM Sans', sans-serif" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:opsz,wght@9..40,300;9..40,400;9..40,500;9..40,600&display=swap');

        /* Scrollbar */
        .thin-scroll::-webkit-scrollbar{width:4px}
        .thin-scroll::-webkit-scrollbar-track{background:transparent}
        .thin-scroll::-webkit-scrollbar-thumb{background:#27272a;border-radius:99px}
        .thin-scroll::-webkit-scrollbar-thumb:hover{background:#3f3f46}

        /* Animations */
        @keyframes blink{0%,100%{opacity:1}50%{opacity:0}}
        .cursor-blink{animation:blink 1s step-end infinite}

        @keyframes fadeUp{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:translateY(0)}}
        .fade-up{animation:fadeUp 0.3s ease both}

        @keyframes shimmer{0%{background-position:-200% 0}100%{background-position:200% 0}}
        .shimmer{background:linear-gradient(90deg,#1a1a1c 25%,#222224 50%,#1a1a1c 75%);background-size:200% 100%;animation:shimmer 1.6s ease infinite}

        /* Chip hover */
        .chip-hover:hover{background:#1e1e20!important;border-color:#3f3f46!important}

        /* Prose (AI answer) */
        .prose-answer p{margin-bottom:.75rem;line-height:1.75}
        .prose-answer p:last-child{margin-bottom:0}
        .prose-answer strong{color:#e4e4e7;font-weight:600}
        .prose-answer em{color:#a1a1aa}
        .prose-answer code{background:#111112;border:1px solid #27272a;border-radius:4px;padding:1px 6px;font-size:.8em;color:#a78bfa;font-family:ui-monospace,monospace}
        .prose-answer pre{background:#0d0d0e;border:1px solid #27272a;border-radius:10px;padding:14px;margin:10px 0;overflow-x:auto}
        .prose-answer ul,.prose-answer ol{padding-left:1.4rem;margin-bottom:.75rem;display:flex;flex-direction:column;gap:.3rem}
        .prose-answer ul{list-style:disc}
        .prose-answer ol{list-style:decimal}
        .prose-answer li{color:#a1a1aa;line-height:1.65}
        .prose-answer h1,.prose-answer h2{font-size:1rem;font-weight:600;color:#e4e4e7;margin:1.25rem 0 .5rem;padding-bottom:.3rem;border-bottom:1px solid #27272a}
        .prose-answer h3{font-size:.93rem;font-weight:600;color:#d4d4d8;margin:1rem 0 .35rem}
        .prose-answer blockquote{border-left:2px solid #3f3f46;padding-left:.85rem;color:#71717a;margin:.5rem 0;font-style:italic}
        .prose-answer a{color:#a78bfa;text-decoration-color:#7c3aed;text-underline-offset:2px}
        .prose-answer hr{border:none;border-top:1px solid #27272a;margin:1rem 0}
        .prose-answer table{width:100%;border-collapse:collapse;margin:.75rem 0;font-size:.85em}
        .prose-answer th,.prose-answer td{border:1px solid #27272a;padding:.4rem .75rem;text-align:left}
        .prose-answer th{background:#111112;color:#e4e4e7;font-weight:600}
        .prose-answer td{color:#a1a1aa}
      `}</style>

      {/* ── Sidebar toggle ── */}
      <button
        onClick={() => setSidebarOpen((v) => !v)}
        className="fixed top-3.5 left-3.5 z-50 w-8 h-8 rounded-lg flex items-center justify-center text-zinc-500 hover:text-zinc-200 hover:bg-white/[0.06] transition-all"
        title={sidebarOpen ? "Close sidebar" : "Open sidebar"}
      >
        {sidebarOpen ? <PanelLeftClose size={15} /> : <PanelLeftOpen size={15} />}
      </button>

      {/* ── Sidebar ── */}
      <aside className={cn(
        "fixed inset-y-0 left-0 z-40 w-[240px] flex flex-col bg-[#0c0c0d] border-r border-zinc-800/50 transition-transform duration-300",
        sidebarOpen ? "translate-x-0" : "-translate-x-full",
      )}>
        {/* Logo */}
        <div className="h-14 px-4 flex items-center gap-2.5 shrink-0">
          <div className="w-6 h-6 rounded-md bg-violet-600 flex items-center justify-center">
            <Zap size={12} className="text-white" fill="white" />
          </div>
          <span className="text-white text-[13px] font-semibold tracking-tight">Purplexity</span>
        </div>

        {/* New thread */}
        <div className="px-3 shrink-0">
          <button
            onClick={() => setActive(null)}
            className="w-full flex items-center gap-2 px-3 py-2 rounded-lg border border-zinc-800 text-zinc-400 hover:text-zinc-200 hover:border-zinc-700 hover:bg-white/[0.03] transition-all text-[12px] font-medium"
          >
            <Plus size={13} />
            New Thread
          </button>
        </div>

        {/* Search */}
        <div className="px-3 mt-3 shrink-0">
          <div className="relative">
            <Search size={11} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-zinc-600" />
            <input
              type="text"
              placeholder="Search threads…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-transparent border border-zinc-800/80 rounded-lg pl-7 pr-3 py-1.5 text-[11px] text-zinc-300 outline-none focus:border-zinc-700 placeholder:text-zinc-700 transition-colors"
            />
          </div>
        </div>

        {/* Section label */}
        <div className="mt-4 px-2 shrink-0">
          <p className="text-[10px] text-zinc-700 font-medium uppercase tracking-widest px-2 mb-1.5">
            Threads
          </p>
        </div>

        {/* Conversation list */}
        <div className="flex-1 overflow-y-auto px-2 pb-4 thin-scroll space-y-0.5">
          {loadingConvs ? (
            <div className="space-y-1.5 px-1 pt-1">
              {[...Array(6)].map((_, i) => <div key={i} className="h-8 rounded-lg shimmer" />)}
            </div>
          ) : filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-24 gap-2">
              <MessageSquare size={14} className="text-zinc-800" />
              <p className="text-zinc-700 text-[11px]">No threads yet</p>
            </div>
          ) : (
            filtered.map((conv) => (
              <button
                key={conv.id}
                onClick={() => setActive(conv)}
                className={cn(
                  "w-full flex items-center gap-2 rounded-lg px-2.5 py-2 transition-all text-left group",
                  active?.id === conv.id
                    ? "bg-white/[0.07] text-zinc-100"
                    : "text-zinc-500 hover:bg-white/[0.04] hover:text-zinc-300",
                )}
              >
                <MessageSquare size={12} className="shrink-0 opacity-50" />
                <p className="text-[12px] truncate flex-1 leading-tight">{conv.title}</p>
              </button>
            ))
          )}
        </div>
      </aside>

      {/* ── Main ── */}
      <main className={cn(
        "flex-1 flex flex-col h-full min-w-0 transition-all duration-300",
        sidebarOpen ? "ml-[240px]" : "ml-0",
      )}>
        {active
          ? <ConversationPanel key={active.id} conversation={active} />
          : <NewThreadPanel onCreated={onNewConversation} />
        }
      </main>
    </div>
  );
}