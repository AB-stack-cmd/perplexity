"use client";

import axios from "axios";
import {
  Search, MessageSquare, Plus, Loader2,
  PanelLeftClose, PanelLeftOpen, Send, Globe,
  Sparkles, ExternalLink, ArrowRight, Zap,
} from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { cn } from "@/lib/utils";
import { createClient } from "../lib/supabase/client";
import { useRouter } from "next/navigation";


const supabase = createClient();
const API = "http://localhost:4000";

interface Conversation { id: string; title: string; slug: string; createdAt: string; }
interface Source { title: string; url: string; }
interface Message { role: "user" | "assistant"; content: string; sources?: Source[]; followUps?: string[]; }

function Favicon({ url }: { url: string }) {
  const host = (() => { try { return new URL(url).hostname; } catch { return ""; } })();
  return (
    <img src={`https://www.google.com/s2/favicons?domain=${host}&sz=16`} alt=""
      className="w-3.5 h-3.5 rounded-sm shrink-0"
      onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }} />
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────
export default function ChatPage() {
  const [userId , setUserId] = useState("")
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loadingConvs, setLoadingConvs] = useState(true);
  const [search, setSearch] = useState("");
  const [active, setActive] = useState<Conversation | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const router = useRouter()
  const fetchConversations = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const res = await axios.get(`${API}/conversation`, {
        headers: { Authorization: `Bearer ${session?.access_token}` },
        withCredentials: true,
      });
      setConversations(res.data.conversations || []);
      setUserId(res.data.userId || "")
      
      if(!session?.access_token){
        router.push("/")
      }
    } catch (e) { console.error(e); }
    finally { setLoadingConvs(false); }
  };

  useEffect(() => { fetchConversations(); }, []);

  const filtered = useMemo(
    () => conversations.filter((c) => c.title.toLowerCase().includes(search.toLowerCase())),
    [conversations, search]
  );

  // Called after purplexity_ask creates a new conversation
  const onNewConversation = (conv: Conversation) => {
    setConversations((prev) => [conv, ...prev]);
    setActive(conv);
  };

  return (
    <div className="flex h-screen w-full overflow-hidden" style={{ background: "#0f0f10", fontFamily: "'DM Sans', sans-serif" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:ital,opsz,wght@0,9..40,300;0,9..40,400;0,9..40,500;0,9..40,600;1,9..40,300&display=swap');
        .thin-scroll::-webkit-scrollbar{width:4px}.thin-scroll::-webkit-scrollbar-track{background:transparent}.thin-scroll::-webkit-scrollbar-thumb{background:#27272a;border-radius:99px}
        @keyframes blink{0%,100%{opacity:1}50%{opacity:0}}.cursor-blink{animation:blink 1s step-end infinite}
        @keyframes fadeUp{from{opacity:0;transform:translateY(6px)}to{opacity:1;transform:translateY(0)}}.fade-up{animation:fadeUp 0.25s ease forwards}
        @keyframes shimmer{0%{background-position:-200% 0}100%{background-position:200% 0}}
        .shimmer{background:linear-gradient(90deg,#1a1a1c 25%,#222224 50%,#1a1a1c 75%);background-size:200% 100%;animation:shimmer 1.6s ease infinite}
        .chip-hover:hover{background:#1e1e20;border-color:#3f3f46}
        .prose-answer p{margin-bottom:.75rem;line-height:1.75}.prose-answer p:last-child{margin-bottom:0}
        .prose-answer strong{color:#e4e4e7;font-weight:600}
        .prose-answer code{background:#1a1a1c;border:1px solid #27272a;border-radius:4px;padding:1px 5px;font-size:.8em;color:#a78bfa}
        .prose-answer ul{list-style:disc;padding-left:1.25rem;margin-bottom:.75rem}
        .prose-answer ul li{margin-bottom:.25rem;color:#a1a1aa}
        .prose-answer h3{font-size:.95rem;font-weight:600;color:#e4e4e7;margin:1rem 0 .4rem}
      `}</style>

      {/* Toggle */}
      <button onClick={() => setSidebarOpen((v) => !v)}
        className="fixed top-4 left-4 z-50 w-8 h-8 rounded-lg flex items-center justify-center text-zinc-500 hover:text-zinc-200 hover:bg-white/5 transition-all">
        {sidebarOpen ? <PanelLeftClose size={15} /> : <PanelLeftOpen size={15} />}
      </button>

      {/* Sidebar */}
      <aside className={cn(
        "fixed top-0 left-0 h-full flex flex-col z-40 transition-all duration-300 border-r bg-[#0c0c0d] border-zinc-800/50",
        sidebarOpen ? "w-[240px] translate-x-0" : "w-[240px] -translate-x-full"
      )}>
        <div className="h-14 px-4 flex items-center gap-2 shrink-0">
          <div className="w-6 h-6 rounded-md bg-violet-600 flex items-center justify-center mt-8">
            <Zap size={12} className="text-white" fill="white" />
          </div>
          <span className="text-white text-[13px] font-semibold tracking-tight mt-8">Purplexity</span>
        </div>

        <div className="px-3 mt-6 shrink-0">
          <button onClick={() => setActive(null)}
            className="w-full flex items-center gap-2 px-3 py-2 rounded-lg border border-zinc-800 text-zinc-400 hover:text-zinc-200 hover:border-zinc-700 hover:bg-white/[0.03] transition text-[12px] font-medium">
            <Plus size={13} />New Thread
          </button>
        </div>

        <div className="px-3 mt-3 shrink-0">
          <div className="relative">
            <Search size={11} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-zinc-600" />
            <input type="text" placeholder="Search threads…" value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-transparent border border-zinc-800/80 rounded-lg pl-7 pr-3 py-1.5 text-[11px] text-zinc-300 outline-none focus:border-zinc-700 placeholder:text-zinc-700 transition" />
          </div>
        </div>

        <div className="mt-3 px-2 shrink-0">
          <p className="text-[10px] text-zinc-600 font-medium uppercase tracking-wider px-2 mb-1.5">Threads</p>
        </div>

        <div className="flex-1 overflow-y-auto px-2 pb-4 thin-scroll">
          {loadingConvs ? (
            <div className="space-y-1.5 px-1">{[...Array(5)].map((_, i) => <div key={i} className="h-8 rounded-lg shimmer" />)}</div>
          ) : filtered.length === 0 ? (
            <div className="flex items-center justify-center h-24"><p className="text-zinc-700 text-[11px]">No threads yet</p></div>
          ) : filtered.map((conv) => (
            <button key={conv.id} onClick={() => setActive(conv)}
              className={cn(
                "w-full flex items-center gap-2 rounded-lg px-2.5 py-2 transition-all text-left group",
                active?.id === conv.id ? "bg-white/[0.06] text-zinc-100" : "text-zinc-500 hover:bg-white/[0.03] hover:text-zinc-300"
              )}>
              <MessageSquare size={12} className="shrink-0 opacity-60" />
              <p className="text-[12px] truncate flex-1">{conv.title}</p>
            </button>
          ))}
        </div>
      </aside>

      {/* Main */}
      <main className={cn("flex-1 flex flex-col h-full transition-all duration-300 min-w-0", sidebarOpen ? "ml-[240px]" : "ml-0")}>
        {active
          ? <FollowUpPanel key={active.id} conversation={active} />
          : <NewThreadPanel onCreated={onNewConversation} />}
      </main>
    </div>
  );
}

// ── New Thread (calls /purplexity_ask) ────────────────────────────────────────
function NewThreadPanel({ onCreated }: { onCreated: (conv: Conversation) => void }) {
  const [query, setQuery] = useState("");
  const [streaming, setStreaming] = useState(false);
  const [answer, setAnswer] = useState("");
  const [sources, setSources] = useState<Source[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [followUps, setFollowUps] = useState<string[]>([]);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: "smooth" }); }, [answer]);
  useEffect(()=> { 
    // const response = axios.get()
  })
  const handleAsk = async (q?: string) => {
    const text = (q ?? query).trim();
    if (!text || streaming) return;
    setQuery("");
    setAnswer("");
    setSources([]);
    setFollowUps([]);
    setError(null);
    setStreaming(true);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      const res = await fetch(`${API}/purplexity_ask`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${session?.access_token}` },
        credentials: "include",
        body: JSON.stringify({ query: text }),
      });

      if (!res.ok) throw new Error(`${res.status}`);

      // Extract conversation id from response header
      const convId = res.headers.get("X-Conversation-Id");
      if (convId) setConversationId(convId);

      const reader = res.body!.getReader();
      const decoder = new TextDecoder();
      let buffer = "";
      let answerText = "";
      let sourcesFound = false;

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });

        // backend sends \n<SOURCE>\n (note: singular SOURCE)
        if (!sourcesFound && buffer.includes("\n<SOURCE>\n")) {
          sourcesFound = true;
          answerText = buffer.split("\n<SOURCE>\n")[0];
        } else if (!sourcesFound) {
          answerText = buffer;
        }
        setAnswer(answerText);
      }

      // Parse sources — backend: webResult.map(result => { url: result.url }) (no title)
      let parsedSources: Source[] = [];
      try {
        const raw = buffer.split("\n<SOURCE>\n")[1]?.trim() || "[]";
        const arr = JSON.parse(raw);
        parsedSources = arr.map((s: { url?: string }) => ({ title: "", url: s.url || "" })).filter((s: Source) => s.url);
      } catch { parsedSources = []; }

      // Parse followUps + clean answer from JSON schema
      let parsedFollowUps: string[] = [];
      try {
        const cleaned = answerText.replace(/```json|```/g, "").trim();
        const obj = JSON.parse(cleaned);
        if (Array.isArray(obj.followUps)) parsedFollowUps = obj.followUps.slice(0, 3);
        if (obj.answer) answerText = obj.answer;
      } catch { /* plain text */ }

      setAnswer(answerText);
      setSources(parsedSources);
      setFollowUps(parsedFollowUps);

      // Notify parent to add conversation to sidebar
      // We need the conv id — fetch it from the latest conversation
      if (convId) {
        onCreated({ id: convId, title: text.slice(0, 80), slug: "", createdAt: new Date().toISOString() });
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong");
    } finally {
      setStreaming(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleAsk(); }
  };
  const handleTextareaChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setQuery(e.target.value);
    const el = textareaRef.current;
    if (el) { el.style.height = "auto"; el.style.height = `${Math.min(el.scrollHeight, 160)}px`; }
  };

  // Show result view after ask
  if (streaming || answer) {
    return (
      <div className="flex h-full overflow-hidden">
        <div className="flex-1 flex flex-col min-w-0">
          <div className="h-12 px-6 border-b border-zinc-800/40 flex items-center shrink-0">
            <p className="text-zinc-500 text-[12px] truncate">{query || "New thread"}</p>
          </div>
          <div className="flex-1 overflow-y-auto thin-scroll">
            <div className="max-w-2xl mx-auto px-6 py-8 space-y-6 fade-up">
              {sources.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {sources.slice(0, 4).map((src, i) => (
                    <a key={i} href={src.url} target="_blank" rel="noopener noreferrer"
                      className="flex items-center gap-1.5 bg-[#1a1a1c] border border-zinc-800/60 rounded-lg px-2.5 py-1.5 hover:border-zinc-700 hover:bg-[#1e1e20] transition group max-w-[180px]">
                      <Favicon url={src.url} />
                      <span className="text-[11px] text-zinc-400 truncate group-hover:text-zinc-200 transition">
                        {(() => { try { return new URL(src.url).hostname.replace("www.", ""); } catch { return src.url; } })()}
                      </span>
                    </a>
                  ))}
                </div>
              )}
              <div className="prose-answer text-[13.5px] text-zinc-300 leading-7">
                {answer}
                {streaming && <span className="inline-block w-[2px] h-[14px] bg-violet-400 ml-0.5 cursor-blink rounded-full align-middle" />}
              </div>
              {followUps.length > 0 && !streaming && (
                <div className="space-y-2 pt-2">
                  <p className="text-[10px] text-zinc-600 uppercase tracking-wider font-medium">Related</p>
                  {followUps.map((fu, i) => (
                    <button key={i} onClick={() => handleAsk(fu)}
                      className="chip-hover w-full flex items-center justify-between gap-3 bg-[#141415] border border-zinc-800/60 rounded-xl px-4 py-2.5 text-left transition group">
                      <span className="text-[12.5px] text-zinc-400 group-hover:text-zinc-200 transition leading-snug">{fu}</span>
                      <ArrowRight size={12} className="text-zinc-700 group-hover:text-zinc-400 shrink-0 transition" />
                    </button>
                  ))}
                </div>
              )}
              <div ref={bottomRef} />
            </div>
          </div>
          {error && <p className="text-[12px] text-red-400 px-6 py-3">{error}</p>}
          <div className="shrink-0 px-6 py-4 border-t border-zinc-800/40">
            <div className="max-w-2xl mx-auto relative flex items-end gap-2 bg-[#141415] border border-zinc-800/60 rounded-2xl px-4 py-3 focus-within:border-zinc-700 transition-colors">
              <textarea ref={textareaRef} rows={1} value={query} onChange={handleTextareaChange} onKeyDown={handleKeyDown}
                placeholder="Ask a follow-up…" disabled={streaming}
                className="flex-1 bg-transparent text-[13px] text-zinc-100 placeholder:text-zinc-700 outline-none resize-none leading-relaxed disabled:opacity-40"
                style={{ minHeight: "22px", maxHeight: "160px" }} />
              <button onClick={() => handleAsk()} disabled={!query.trim() || streaming}
                className="shrink-0 w-7 h-7 rounded-lg bg-violet-600 flex items-center justify-center text-white hover:bg-violet-500 transition disabled:opacity-25 disabled:cursor-not-allowed">
                {streaming ? <Loader2 size={12} className="animate-spin" /> : <Send size={12} />}
              </button>
            </div>
          </div>
        </div>
        <SourceBar sources={sources} streaming={streaming} />
      </div>
    );
  }

  // Empty state with search bar
  return (
    <div className="flex flex-col items-center justify-center h-full gap-6 px-6">
      <div className="text-center space-y-2">
        <div className="w-10 h-10 rounded-xl bg-violet-600/20 border border-violet-500/20 flex items-center justify-center mx-auto">
          <Sparkles size={18} className="text-violet-400" />
        </div>
        <p className="text-zinc-200 text-[15px] font-medium mt-3">What do you want to know?</p>
        <p className="text-zinc-600 text-[12px]">Search anything — powered by the web</p>
      </div>
      <div className="w-full max-w-xl">
        <div className="relative flex items-end gap-2 bg-[#141415] border border-zinc-800/60 rounded-2xl px-4 py-3 focus-within:border-zinc-700 transition-colors shadow-xl shadow-black/30">
          <textarea ref={textareaRef} rows={1} value={query} onChange={handleTextareaChange} onKeyDown={handleKeyDown}
            placeholder="Ask anything…" disabled={streaming} autoFocus
            className="flex-1 bg-transparent text-[13.5px] text-zinc-100 placeholder:text-zinc-600 outline-none resize-none leading-relaxed disabled:opacity-40"
            style={{ minHeight: "24px", maxHeight: "160px" }} />
          <button onClick={() => handleAsk()} disabled={!query.trim() || streaming}
            className="shrink-0 w-7 h-7 rounded-lg bg-violet-600 flex items-center justify-center text-white hover:bg-violet-500 transition disabled:opacity-25 disabled:cursor-not-allowed">
            {streaming ? <Loader2 size={12} className="animate-spin" /> : <Send size={12} />}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Follow-up Panel (calls /purplexity/follow_up) ─────────────────────────────
function FollowUpPanel({ conversation }: { conversation: Conversation }) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [query, setQuery] = useState("");
  const [streaming, setStreaming] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [latestSources, setLatestSources] = useState<Source[]>([]);
  const [followUps, setFollowUps] = useState<string[]>([]);
  const bottomRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages]);

  const sendQuery = async (text: string) => {
    const trimmed = text.trim();
    if (!trimmed || streaming) return;
    setQuery("");
    if (textareaRef.current) textareaRef.current.style.height = "auto";
    setError(null);
    setFollowUps([]);

    setMessages((prev) => [...prev,
      { role: "user", content: trimmed },
      { role: "assistant", content: "", sources: [] },
    ]);
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

      let parsedFollowUps: string[] = [];
      try {
        const cleaned = answerText.replace(/```json|```/g, "").trim();
        const obj = JSON.parse(cleaned);
        if (Array.isArray(obj.followUps)) parsedFollowUps = obj.followUps.slice(0, 3);
        if (obj.answer) answerText = obj.answer;
      } catch { /* plain text */ }

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
      <div className="flex-1 flex flex-col min-w-0">
        <div className="h-12 px-6 border-b border-zinc-800/40 flex items-center shrink-0">
          <p className="text-zinc-400 text-[12px] truncate">{conversation.title}</p>
        </div>

        <div className="flex-1 overflow-y-auto thin-scroll">
          <div className="max-w-2xl mx-auto px-6 py-8 space-y-10">
            {messages.length === 0 && (
              <div className="flex items-center justify-center h-32">
                <p className="text-zinc-700 text-[13px]">Ask a follow-up…</p>
              </div>
            )}
            {messages.map((msg, i) => (
              <div key={i} className="fade-up">
                {msg.role === "user" ? (
                  <div className="flex justify-end">
                    <div className="max-w-[78%] bg-[#1a1a1c] border border-zinc-800/60 rounded-2xl rounded-tr-sm px-4 py-3 text-[13.5px] text-zinc-100 leading-relaxed">
                      {msg.content}
                    </div>
                  </div>
                ) : (
                  <div className="space-y-5">
                    {msg.sources && msg.sources.length > 0 && (
                      <div className="flex flex-wrap gap-2">
                        {msg.sources.slice(0, 4).map((src, si) => (
                          <a key={si} href={src.url} target="_blank" rel="noopener noreferrer"
                            className="flex items-center gap-1.5 bg-[#1a1a1c] border border-zinc-800/60 rounded-lg px-2.5 py-1.5 hover:border-zinc-700 hover:bg-[#1e1e20] transition group max-w-[180px]">
                            <Favicon url={src.url} />
                            <span className="text-[11px] text-zinc-400 truncate group-hover:text-zinc-200 transition">
                              {(() => { try { return new URL(src.url).hostname.replace("www.", ""); } catch { return src.url; } })()}
                            </span>
                          </a>
                        ))}
                        {msg.sources.length > 4 && <span className="text-[11px] text-zinc-600 px-2">+{msg.sources.length - 4} more</span>}
                      </div>
                    )}
                    <div className="prose-answer text-[13.5px] text-zinc-300 leading-7">
                      {msg.content}
                      {streaming && i === messages.length - 1 && (
                        <span className="inline-block w-[2px] h-[14px] bg-violet-400 ml-0.5 cursor-blink rounded-full align-middle" />
                      )}
                    </div>
                    {msg.followUps && msg.followUps.length > 0 && !streaming && (
                      <div className="space-y-2 pt-1">
                        <p className="text-[10px] text-zinc-600 uppercase tracking-wider font-medium">Related</p>
                        {msg.followUps.map((fu, fi) => (
                          <button key={fi} onClick={() => sendQuery(fu)}
                            className="chip-hover w-full flex items-center justify-between gap-3 bg-[#141415] border border-zinc-800/60 rounded-xl px-4 py-2.5 text-left transition group">
                            <span className="text-[12.5px] text-zinc-400 group-hover:text-zinc-200 transition leading-snug">{fu}</span>
                            <ArrowRight size={12} className="text-zinc-700 group-hover:text-zinc-400 shrink-0 transition" />
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))}
            {error && <p className="text-[12px] text-red-400 bg-red-950/20 border border-red-900/30 rounded-xl px-4 py-3">{error}</p>}
            <div ref={bottomRef} />
          </div>
        </div>

        <div className="shrink-0 px-6 py-4 border-t border-zinc-800/40">
          <div className="max-w-2xl mx-auto">
            {followUps.length > 0 && !streaming && (
              <div className="flex flex-wrap gap-1.5 mb-3">
                {followUps.map((fu, i) => (
                  <button key={i} onClick={() => sendQuery(fu)}
                    className="chip-hover flex items-center gap-1.5 bg-[#141415] border border-zinc-800/60 rounded-full px-3 py-1 text-[11.5px] text-zinc-500 hover:text-zinc-200 transition">
                    <Sparkles size={10} className="text-violet-500" />
                    {fu.length > 50 ? fu.slice(0, 50) + "…" : fu}
                  </button>
                ))}
              </div>
            )}
            <div className="relative flex items-end gap-2 bg-[#141415] border border-zinc-800/60 rounded-2xl px-4 py-3 focus-within:border-zinc-700 transition-colors">
              <textarea ref={textareaRef} rows={1} value={query} onChange={handleTextareaChange} onKeyDown={handleKeyDown}
                placeholder="Ask a follow-up…" disabled={streaming}
                className="flex-1 bg-transparent text-[13px] text-zinc-100 placeholder:text-zinc-700 outline-none resize-none leading-relaxed disabled:opacity-40"
                style={{ minHeight: "22px", maxHeight: "160px" }} />
              <button onClick={handleSubmit} disabled={!query.trim() || streaming}
                className="shrink-0 w-7 h-7 rounded-lg bg-violet-600 flex items-center justify-center text-white hover:bg-violet-500 transition disabled:opacity-25 disabled:cursor-not-allowed">
                {streaming ? <Loader2 size={12} className="animate-spin" /> : <Send size={12} />}
              </button>
            </div>
          </div>
        </div>
      </div>
      <SourceBar sources={latestSources} streaming={streaming} />
    </div>
  );
}

// ── Source bar ────────────────────────────────────────────────────────────────
function SourceBar({ sources, streaming }: { sources: Source[]; streaming: boolean }) {
  return (
    <aside className="w-[220px] shrink-0 border-l border-zinc-800/40 flex flex-col bg-[#0c0c0d] overflow-hidden">
      <div className="h-12 px-4 border-b border-zinc-800/40 flex items-center gap-2 shrink-0">
        <Globe size={12} className="text-zinc-600" />
        <p className="text-zinc-500 text-[11px] font-medium">Sources</p>
        {streaming
          ? <Loader2 size={10} className="animate-spin text-violet-500 ml-auto" />
          : sources.length > 0 && <span className="ml-auto text-[10px] text-zinc-700">{sources.length}</span>}
      </div>
      <div className="flex-1 overflow-y-auto thin-scroll px-2.5 py-3 space-y-1.5">
        {sources.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-28 text-center px-3">
            <Globe size={16} className="text-zinc-800 mb-2" />
            <p className="text-zinc-700 text-[10px] leading-relaxed">Sources appear after a response</p>
          </div>
        ) : sources.map((src, i) => {
          const host = (() => { try { return new URL(src.url).hostname.replace("www.", ""); } catch { return src.url; } })();
          return (
            <a key={i} href={src.url} target="_blank" rel="noopener noreferrer"
              className="flex flex-col gap-1.5 bg-[#111112] border border-zinc-800/50 rounded-xl px-3 py-2.5 hover:border-zinc-700/70 hover:bg-[#161617] transition group fade-up">
              <div className="flex items-start gap-2">
                <Favicon url={src.url} />
                <p className="text-[11px] text-zinc-300 leading-4 line-clamp-2 group-hover:text-white transition flex-1">
                  {src.title || host}
                </p>
              </div>
              <div className="flex items-center justify-between">
                <p className="text-[10px] text-zinc-700 truncate">{host}</p>
                <ExternalLink size={9} className="text-zinc-800 group-hover:text-zinc-500 transition shrink-0" />
              </div>
            </a>
          );
        })}
      </div>
    </aside>
  );
}
