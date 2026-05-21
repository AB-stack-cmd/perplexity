"use client";

import axios from "axios";
import {
  Search, MessageSquare, Plus, Loader2,
  PanelLeftClose, PanelLeftOpen, Send, Globe,
  Sparkles, ExternalLink,
} from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { cn } from "@/lib/utils";
import { createClient } from "../lib/supabase/client";

const supabase = createClient();
const API = "http://localhost:4000";

interface Conversation { id: string; title: string; slug: string; createdAt: string; }
interface Source { title: string; url: string; }
interface Message { role: "user" | "assistant"; content: string; sources?: Source[]; followUps?: string[]; }

// ── Page ──────────────────────────────────────────────────────────────────────
export default function ChatPage() {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loadingConvs, setLoadingConvs] = useState(true);
  const [search, setSearch] = useState("");
  const [active, setActive] = useState<Conversation | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        const res = await axios.get(`${API}/conversation`, {
          headers: { Authorization: `Bearer ${session?.access_token}` },
          withCredentials: true,
        });
        // backend returns { conversations: [...], userId }
        setConversations(res.data.conversations || []);
      } catch (e) {
        console.error(e);
      } finally {
        setLoadingConvs(false);
      }
    })();
  }, []);

  const filtered = useMemo(
    () => conversations.filter((c) => c.title.toLowerCase().includes(search.toLowerCase())),
    [conversations, search]
  );

  return (
    <div className="flex h-screen w-full bg-[#0a0a0a] overflow-hidden">

      {/* Sidebar toggle */}
      <button
        onClick={() => setSidebarOpen((v) => !v)}
        className="fixed top-4 left-4 z-50 w-9 h-9 rounded-xl bg-zinc-900 border border-zinc-800 flex items-center justify-center text-zinc-400 hover:text-white hover:bg-zinc-800 transition-all"
      >
        {sidebarOpen ? <PanelLeftClose size={16} /> : <PanelLeftOpen size={16} />}
      </button>

      {/* Sidebar */}
      <aside className={cn(
        "fixed top-0 left-0 h-full bg-[#0d0d0d] border-r border-zinc-800/60 flex flex-col z-40 transition-all duration-300",
        sidebarOpen ? "w-64 translate-x-0" : "w-64 -translate-x-full"
      )}>
        <div className="h-[60px] mt-14 px-4 border-b border-zinc-800/60 flex items-center justify-between shrink-0">
          <div>
            <p className="text-white text-[13px] font-semibold">History</p>
            <p className="text-zinc-600 text-[10px] mt-0.5">Your conversations</p>
          </div>
          <button onClick={() => setActive(null)}
            className="w-7 h-7 rounded-lg bg-zinc-900 border border-zinc-800 text-zinc-400 flex items-center justify-center hover:text-white hover:bg-zinc-800 transition">
            <Plus size={13} />
          </button>
        </div>

        <div className="px-3 py-2.5 border-b border-zinc-800/60 shrink-0">
          <div className="relative">
            <Search size={12} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-600" />
            <input type="text" placeholder="Search…" value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-zinc-900/80 border border-zinc-800 rounded-lg pl-8 pr-3 py-1.5 text-[11px] text-zinc-200 outline-none focus:border-zinc-600 placeholder:text-zinc-700 transition" />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto px-2 py-2 space-y-0.5 scrollbar-thin scrollbar-thumb-zinc-800">
          {loadingConvs ? (
            <div className="flex items-center justify-center h-32">
              <Loader2 size={16} className="animate-spin text-zinc-600" />
            </div>
          ) : filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-32 text-center px-4">
              <MessageSquare size={22} className="text-zinc-800 mb-2" />
              <p className="text-zinc-600 text-[11px]">No conversations yet</p>
            </div>
          ) : filtered.map((conv) => (
            <button key={conv.id} onClick={() => setActive(conv)}
              className={cn(
                "w-full flex items-start gap-2.5 rounded-xl px-3 py-2.5 transition-all text-left group border",
                active?.id === conv.id
                  ? "bg-zinc-800/70 border-zinc-700/60"
                  : "border-transparent hover:bg-zinc-900/60 hover:border-zinc-800/60"
              )}>
              <MessageSquare size={13} className="text-zinc-600 mt-0.5 shrink-0 group-hover:text-zinc-400 transition" />
              <div className="min-w-0 flex-1">
                <p className="text-[12px] text-zinc-200 truncate leading-5 group-hover:text-white transition">{conv.title}</p>
                <p className="text-[10px] text-zinc-700 mt-0.5">{new Date(conv.createdAt).toLocaleDateString()}</p>
              </div>
            </button>
          ))}
        </div>
      </aside>

      {/* Main */}
      <main className={cn("flex-1 flex flex-col h-full transition-all duration-300", sidebarOpen ? "ml-64" : "ml-0")}>
        {active
          ? <FollowUpPanel conversation={active} />
          : <EmptyState />}
      </main>
    </div>
  );
}

// ── Empty ─────────────────────────────────────────────────────────────────────
function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center h-full gap-3">
      <div className="w-12 h-12 rounded-2xl bg-zinc-900 border border-zinc-800 flex items-center justify-center">
        <Sparkles size={20} className="text-zinc-500" />
      </div>
      <p className="text-zinc-300 text-sm font-medium">Select a conversation</p>
      <p className="text-zinc-700 text-xs">Choose one from the sidebar to continue</p>
    </div>
  );
}

// ── Follow-up panel ───────────────────────────────────────────────────────────
function FollowUpPanel({ conversation }: { conversation: Conversation }) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [query, setQuery] = useState("");
  const [streaming, setStreaming] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [latestSources, setLatestSources] = useState<Source[]>([]);
  const [followUps, setFollowUps] = useState<string[]>([]);
  const bottomRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => { setMessages([]); setLatestSources([]); setFollowUps([]); setError(null); }, [conversation.id]);
  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages]);

  const sendQuery = async (text: string) => {
    const trimmed = text.trim();
    if (!trimmed || streaming) return;
    setQuery("");
    if (textareaRef.current) textareaRef.current.style.height = "auto";
    setError(null);
    setFollowUps([]);

    setMessages((prev) => [...prev, { role: "user", content: trimmed }, { role: "assistant", content: "", sources: [] }]);
    setStreaming(true);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      const res = await fetch(`${API}/purplexity/follow_up`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${session?.access_token}` },
        credentials: "include",
        body: JSON.stringify({ conversationId: conversation.id, query: trimmed }),
      });

      if (!res.ok) throw new Error(`${res.status}`);
      const reader = res.body!.getReader();
      const decoder = new TextDecoder();
      let buffer = "";
      let answerText = "";
      let sourcesFound = false;

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });

        if (!sourcesFound && buffer.includes("\n<SOURCES>\n")) {
          sourcesFound = true;
          answerText = buffer.split("\n<SOURCES>\n")[0];
        } else if (!sourcesFound) {
          answerText = buffer;
        }

        setMessages((prev) => {
          const u = [...prev];
          u[u.length - 1] = { ...u[u.length - 1], content: answerText };
          return u;
        });
      }

      let sources: Source[] = [];
      try { sources = JSON.parse(buffer.split("\n<SOURCES>\n")[1]?.trim() || "[]"); } catch { sources = []; }

      // Try parse followUps from JSON answer (purplexity_ask schema)
      let parsedFollowUps: string[] = [];
      try {
        const cleaned = answerText.replace(/```json|```/g, "").trim();
        const obj = JSON.parse(cleaned);
        if (Array.isArray(obj.followUps)) parsedFollowUps = obj.followUps.slice(0, 3);
        if (obj.answer) answerText = obj.answer;
      } catch { /* plain text response, no followUps */ }

      setMessages((prev) => {
        const u = [...prev];
        u[u.length - 1] = { role: "assistant", content: answerText, sources, followUps: parsedFollowUps };
        return u;
      });
      setLatestSources(sources);
      setFollowUps(parsedFollowUps);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong");
      setMessages((prev) => prev.slice(0, -1));
    } finally {
      setStreaming(false);
    }
  };

  const handleSubmit = () => sendQuery(query);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSubmit(); }
  };

  const handleTextareaChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setQuery(e.target.value);
    const el = textareaRef.current;
    if (el) { el.style.height = "auto"; el.style.height = `${Math.min(el.scrollHeight, 160)}px`; }
  };

  return (
    <div className="flex h-full overflow-hidden">

      {/* Chat area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Title bar */}
        <div className="h-14 px-6 border-b border-zinc-800/60 flex items-center shrink-0">
          <p className="text-zinc-300 text-sm font-medium truncate">{conversation.title}</p>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto px-6 py-6 space-y-5 scrollbar-thin scrollbar-thumb-zinc-800">
          {messages.length === 0 && (
            <div className="flex items-center justify-center h-full">
              <p className="text-zinc-700 text-sm">Ask a follow-up question…</p>
            </div>
          )}
          {messages.map((msg, i) => (
            <div key={i} className={cn("flex", msg.role === "user" ? "justify-end" : "justify-start")}>
              {msg.role === "user" ? (
                <div className="max-w-[72%] bg-zinc-900 border border-zinc-800 rounded-2xl rounded-tr-sm px-4 py-3 text-[13px] text-zinc-100 leading-relaxed">
                  {msg.content}
                </div>
              ) : (
                <div className="max-w-[80%] text-[13px] text-zinc-200 leading-relaxed whitespace-pre-wrap">
                  {msg.content}
                  {streaming && i === messages.length - 1 && (
                    <span className="inline-block w-[3px] h-[14px] bg-zinc-500 ml-1 animate-pulse rounded-sm align-middle" />
                  )}
                </div>
              )}
            </div>
          ))}
          {error && <p className="text-xs text-red-400 bg-red-950/20 border border-red-900/30 rounded-xl px-4 py-3">{error}</p>}
          <div ref={bottomRef} />
        </div>

        {/* Input */}
        <div className="px-6 py-4 border-t border-zinc-800/60 shrink-0">
          <div className="relative flex items-end gap-2 bg-zinc-900/80 border border-zinc-800 rounded-2xl px-4 py-3 focus-within:border-zinc-600 transition-colors">
            <textarea ref={textareaRef} rows={1} value={query}
              onChange={handleTextareaChange} onKeyDown={handleKeyDown}
              placeholder="Ask a follow-up…" disabled={streaming}
              className="flex-1 bg-transparent text-[13px] text-zinc-100 placeholder:text-zinc-700 outline-none resize-none leading-relaxed disabled:opacity-40"
              style={{ minHeight: "22px", maxHeight: "160px" }} />
            <button onClick={handleSubmit} disabled={!query.trim() || streaming}
              className="shrink-0 w-8 h-8 rounded-xl bg-zinc-100 flex items-center justify-center text-zinc-900 hover:bg-white transition disabled:opacity-20 disabled:cursor-not-allowed">
              {streaming ? <Loader2 size={13} className="animate-spin" /> : <Send size={13} />}
            </button>
          </div>
          <p className="text-[10px] text-zinc-800 text-center mt-2">Enter · send &nbsp;·&nbsp; Shift+Enter · new line</p>
        </div>
      </div>

      {/* Source bar */}
      <SourceBar sources={latestSources} streaming={streaming} />
    </div>
  );
}

// ── Source bar ────────────────────────────────────────────────────────────────
function SourceBar({ sources, streaming  }: { sources: Source[]; streaming: boolean }) {
  return (
    <aside className="w-64 shrink-0 border-l border-zinc-800/60 flex flex-col bg-[#0d0d0d] overflow-hidden">
      <div className="h-14 px-4 border-b border-zinc-800/60 flex items-center gap-2 shrink-0">
        <Globe size={13} className="text-zinc-500" />
        <p className="text-zinc-300 text-[12px] font-medium">Sources</p>
        {streaming && <Loader2 size={11} className="animate-spin text-zinc-600 ml-auto" />}
      </div>

      <div className="flex-1 overflow-y-auto px-3 py-3 space-y-2 scrollbar-thin scrollbar-thumb-zinc-800">
        {sources.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-32 text-center px-2">
            <Globe size={20} className="text-zinc-800 mb-2" />
            <p className="text-zinc-700 text-[11px]">Sources will appear here after a response</p>
          </div>
        ) : sources.map((src, i) => (
          <a key={i} href={src.url} target="_blank" rel="noopener noreferrer"
            className="flex flex-col gap-1 bg-zinc-900/60 border border-zinc-800 rounded-xl px-3 py-2.5 hover:border-zinc-700 transition group">
            <div className="flex items-start justify-between gap-1">
              <p className="text-[11px] text-zinc-300 leading-4 line-clamp-2 group-hover:text-white transition">
                {src.title || src.url}
              </p>
              <ExternalLink size={10} className="text-zinc-700 shrink-0 mt-0.5 group-hover:text-zinc-400 transition" />
            </div>
            <p className="text-[10px] text-zinc-700 truncate">{new URL(src.url).hostname}</p>
          </a>
        ))}
      </div>
    </aside>
  );
}