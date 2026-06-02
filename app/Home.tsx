"use client";

import { useEffect, useRef, useState } from "react";

import { useRouter } from "next/navigation"; // remove if using react-router
import { createClient } from "./lib/supabase/client";
// ── env vars (Next.js style) ──────────────────────────────────────────────────
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_ANON = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

const sb = createClient()

// ── types ─────────────────────────────────────────────────────────────────────
type AuthView = "login" | "signup";

interface MsgState {
  text: string;
  type: "error" | "success" | null;
}
interface User{
  email : string
}

// ── sub-components ────────────────────────────────────────────────────────────
function LogoDot() {
  return (
    <span
      style={{
        display: "inline-block",
        width: 7,
        height: 7,
        borderRadius: "50%",
        background: "currentColor",
        animation: "pulse 2.4s ease-in-out infinite",
      }}
    />
  );
}

function Ticker() {
  const ITEMS = [
    "Genomics","Climate modelling","Quantum computing","Neuroscience",
    "Materials science","Epidemiology","Astrophysics","Bioinformatics",
  ];
  const doubled = [...ITEMS, ...ITEMS];
  return (
    <div style={{ overflow: "hidden", padding: "12px 0", borderTop: "1px solid var(--line)", borderBottom: "1px solid var(--line)" }}>
      <div style={{ display: "inline-flex", gap: 64, animation: "ticker 28s linear infinite", whiteSpace: "nowrap", fontSize: 11, letterSpacing: ".10em", textTransform: "uppercase", color: "var(--ink3)" }}>
        {doubled.map((t, i) => (
          <span key={i} style={{ display: "inline-flex", gap: 8, alignItems: "center" }}>
            <span style={{ opacity: .5 }}>◦</span>{t}
          </span>
        ))}
      </div>
    </div>
  );
}

const CARDS = [
  { tag: "Search",    title: "Semantic paper search",   body: "Surface relevant literature across 50+ databases with meaning-aware retrieval — not just keywords." },
  { tag: "Synthesis", title: "Cross-paper reasoning",   body: "Identify contradictions, consensus, and open questions spanning thousands of studies at once." },
  { tag: "Chat",      title: "Conversational depth",    body: "Ask follow-ups, request simplifications, or go deeper — Lumen holds the full context of your session." },
  { tag: "Export",    title: "Cited summaries",         body: "Every generated paragraph includes traceable citations, ready for academic or professional use." },
];

// ── modal ─────────────────────────────────────────────────────────────────────
interface ModalProps {
  open: boolean;
  view: AuthView;
  onClose: () => void;
  onSwitch: (v: AuthView) => void;
  onSuccess: () => void;
}

function AuthModal({ open, view, onClose, onSwitch, onSuccess }: ModalProps) {
  const [email, setEmail] = useState("");
  const [pass, setPass]   = useState("");
  const [msg, setMsg]     = useState<MsgState>({ text: "", type: null });
  const [busy, setBusy]   = useState(false);

  const reset = () => { setEmail(""); setPass(""); setMsg({ text: "", type: null }); };

  useEffect(() => { if (open) reset(); }, [open, view]);

  async function handleLogin() {
    if (!email || !pass) { setMsg({ text: "Please fill in all fields.", type: "error" }); return; }
    setBusy(true);
    const { error } = await sb.auth.signInWithPassword({ email, password: pass });
    setBusy(false);
    if (error) { setMsg({ text: error.message, type: "error" }); return; }
    onSuccess();
  }

  async function handleSignup() {
    if (!email || !pass) { setMsg({ text: "Please fill in all fields.", type: "error" }); return; }
    if (pass.length < 8)  { setMsg({ text: "Password must be at least 8 characters.", type: "error" }); return; }
    setBusy(true);
    const { error } = await sb.auth.signUp({ email, password: pass });
    setBusy(false);
    if (error) { setMsg({ text: error.message, type: "error" }); return; }
    setMsg({ text: "Check your email to confirm your account.", type: "success" });
  }

  const submit = view === "login" ? handleLogin : handleSignup;

  return (
    <>
      {/* backdrop */}
      <div
        onClick={onClose}
        style={{
          position: "fixed", inset: 0, zIndex: 200,
          background: "rgba(26,24,20,.5)",
          backdropFilter: "blur(6px)",
          opacity: open ? 1 : 0,
          pointerEvents: open ? "all" : "none",
          transition: "opacity .25s ease",
        }}
      />
      {/* panel */}
      <div
        style={{
          position: "fixed", inset: 0, zIndex: 201,
          display: "flex", alignItems: "center", justifyContent: "center",
          pointerEvents: open ? "all" : "none",
        }}
      >
        <div
          style={{
            background: "#fff",
            border: "1px solid var(--line)",
            padding: 40,
            width: "100%",
            maxWidth: 380,
            position: "relative",
            transform: open ? "translateY(0)" : "translateY(18px)",
            opacity: open ? 1 : 0,
            transition: "transform .25s ease, opacity .25s ease",
          }}
        >
          <button
            onClick={onClose}
            aria-label="Close"
            style={{ position: "absolute", top: 14, right: 18, background: "none", border: "none", fontSize: 20, cursor: "pointer", color: "var(--ink3)", lineHeight: 1 }}
          >
            ×
          </button>

          <h2 style={{ fontFamily: "var(--serif)", fontSize: 24, marginBottom: 6 }}>
            {view === "login" ? "Welcome back" : "Get started"}
          </h2>
          <p style={{ fontSize: 12, color: "var(--ink2)", marginBottom: 28 }}>
            {view === "login" ? "Sign in to your research workspace." : "Create your free research account."}
          </p>

          {(["Email", "Password"] as const).map((label) => {
            const isPass = label === "Password";
            return (
              <div key={label} style={{ marginBottom: 16 }}>
                <label style={{ display: "block", fontSize: 11, letterSpacing: ".08em", textTransform: "uppercase", color: "var(--ink2)", marginBottom: 6 }}>{label}</label>
                <input
                  type={isPass ? "password" : "email"}
                  value={isPass ? pass : email}
                  onChange={e => isPass ? setPass(e.target.value) : setEmail(e.target.value)}
                  placeholder={isPass ? "min. 8 characters" : "you@example.com"}
                  onKeyDown={e => e.key === "Enter" && submit()}
                  style={{
                    width: "100%", padding: "10px 12px",
                    border: "1px solid var(--line)", background: "var(--bg)",
                    fontFamily: "var(--mono)", fontSize: 13, color: "var(--ink)",
                    borderRadius: 3, outline: "none",
                  }}
                />
              </div>
            );
          })}

          <button
            onClick={submit}
            disabled={busy}
            style={{
              marginTop: 24, width: "100%", padding: "11px",
              background: "var(--ink)", color: "var(--bg)",
              fontFamily: "var(--mono)", fontSize: 13,
              border: "none", borderRadius: 4, cursor: busy ? "not-allowed" : "pointer",
              opacity: busy ? .6 : 1, transition: "opacity .2s ease",
            }}
          >
            {busy ? "…" : view === "login" ? "Sign in" : "Create account"}
          </button>

          {msg.type && (
            <div
              style={{
                marginTop: 12, fontSize: 12, padding: "10px 12px", borderRadius: 3,
                background: msg.type === "error" ? "#fdf0ee" : "#eef5ee",
                color: msg.type === "error" ? "#c0392b" : "#27ae60",
                border: `1px solid ${msg.type === "error" ? "#e8c4c0" : "#c4e0c4"}`,
              }}
            >
              {msg.text}
            </div>
          )}

          <p style={{ fontSize: 12, color: "var(--ink2)", textAlign: "center", marginTop: 18 }}>
            {view === "login" ? "No account? " : "Already have one? "}
            <button
              onClick={() => onSwitch(view === "login" ? "signup" : "login")}
              style={{ background: "none", border: "none", cursor: "pointer", color: "var(--ink)", fontSize: 12, textDecoration: "underline", fontFamily: "var(--mono)" }}
            >
              {view === "login" ? "Create one →" : "Sign in →"}
            </button>
          </p>
        </div>
      </div>
    </>
  );
}

// ── main page ─────────────────────────────────────────────────────────────────
export default function LandingPage() {
  const router = useRouter();

  const [user, setUser]         = useState<User | null>(null);
  const [loading, setLoading]   = useState(true);
  const [modal, setModal]       = useState(false);
  const [view, setView]         = useState<AuthView>("login");

  // init: check session → redirect if logged in
  useEffect(() => {
    sb.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        // router.push("/chat");
        setLoading(false)
      } else {
        setUser(null);
        setLoading(false);
      }
    });

    const { data: { subscription } } = sb.auth.onAuthStateChange((_e, session) => {
      if (session?.user) {
        setUser(session.user);
        // router.push("/chat");
      } else {
        setUser(null);
        router.push("/auth")
      }
    });

    return () => subscription.unsubscribe();
  }, [router]);

  async function handleLogout() {
    await sb.auth.signOut();
    setUser(null);
  }

  function openModal(v: AuthView) { setView(v); setModal(true); }

  if (loading) {
    return (
      <div style={{ position: "fixed", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", background: "#f5f3ee" }}>
        <div style={{ width: 24, height: 24, borderRadius: "50%", border: "2px solid #dedad4", borderTopColor: "#1a1814", animation: "spin .8s linear infinite" }} />
        <Style />
      </div>
    );
  }

  return (
    <>
      <Style />

      {/* NAV */}
      <nav style={{
        position: "fixed", top: 0, left: 0, right: 0, zIndex: 100,
        display: "flex", alignItems: "center", justifyContent: "space-between",
        padding: "20px 40px",
        background: "rgba(245,243,238,.88)", backdropFilter: "blur(12px)",
        borderBottom: "1px solid var(--line)",
        animation: "fadeDown .6s ease both",
      }}>
        <div style={{ fontFamily: "var(--serif)", fontSize: 20, display: "flex", alignItems: "center", gap: 8 }}>
          <LogoDot /> Lumen
        </div>
        <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
          {user ? (
            <>
              <span style={{ fontSize: 12, color: "var(--ink2)", maxWidth: 200, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{user.email}</span>
              <button className="btn-danger" onClick={handleLogout}>sign out</button>
            </>
          ) : (
            <>
              <button className="btn-ghost" onClick={() => openModal("login")}>sign in</button>
              <button className="btn-solid" onClick={() => openModal("signup")}>get started</button>
            </>
          )}
        </div>
      </nav>

      {/* HERO */}
      <main>
        <section style={{ minHeight: "100vh", display: "flex", flexDirection: "column", justifyContent: "center", alignItems: "flex-start", padding: "120px 40px 80px", maxWidth: 900, margin: "0 auto" }}>
          <p style={{ fontSize: 11, letterSpacing: ".15em", textTransform: "uppercase", color: "var(--ink3)", marginBottom: 32, display: "flex", alignItems: "center", gap: 12, animation: "fadeUp .7s .1s ease both" }}>
            <span style={{ display: "inline-block", width: 28, height: 1, background: "var(--ink3)" }} />
            AI Research Interface
          </p>

          <h1 style={{ fontFamily: "var(--serif)", fontSize: "clamp(44px,7vw,80px)", lineHeight: 1.08, letterSpacing: "-.03em", maxWidth: 700, animation: "fadeUp .7s .2s ease both" }}>
            Research at the<br />speed of <em style={{ color: "var(--ink2)" }}>thought</em>
          </h1>

          <p style={{ marginTop: 28, fontSize: 14, lineHeight: 1.8, color: "var(--ink2)", maxWidth: 440, animation: "fadeUp .7s .3s ease both" }}>
            Ask anything. Explore deeply. Lumen synthesises research, surfaces insights, and thinks alongside you in real time.
          </p>

          <div style={{ marginTop: 44, display: "flex", gap: 12, flexWrap: "wrap", animation: "fadeUp .7s .4s ease both" }}>
            <button className="btn-hero-primary" onClick={() => user ? router.push("/chat") : openModal("signup")}>
              Start researching →
            </button>
            <button className="btn-hero-secondary">See a demo</button>
          </div>

          <div style={{ marginTop: 72, display: "flex", gap: 48, flexWrap: "wrap", animation: "fadeUp .7s .5s ease both" }}>
            {[["12M+","Papers indexed"],["0.4s","Avg response"],["97%","Citation accuracy"]].map(([n, l]) => (
              <div key={l} style={{ borderTop: "1px solid var(--line)", paddingTop: 16, minWidth: 100 }}>
                <div style={{ fontFamily: "var(--serif)", fontSize: 28 }}>{n}</div>
                <div style={{ fontSize: 11, color: "var(--ink3)", letterSpacing: ".06em", textTransform: "uppercase", marginTop: 4 }}>{l}</div>
              </div>
            ))}
          </div>
        </section>

        <Ticker />

        {/* CARDS */}
        <section style={{ maxWidth: 900, margin: "0 auto", padding: "80px 40px", borderTop: "1px solid var(--line)" }}>
          <p style={{ fontSize: 11, letterSpacing: ".14em", textTransform: "uppercase", color: "var(--ink3)", marginBottom: 40 }}>Core capabilities</p>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(220px,1fr))", gap: 1, background: "var(--line)", border: "1px solid var(--line)" }}>
            {CARDS.map(({ tag, title, body }) => (
              <div key={tag} className="card">
                <span style={{ display: "inline-block", fontSize: 10, letterSpacing: ".1em", textTransform: "uppercase", background: "#ede9e3", color: "var(--ink2)", padding: "3px 8px", borderRadius: 2, marginBottom: 16 }}>{tag}</span>
                <h3 style={{ fontFamily: "var(--serif)", fontSize: 17, lineHeight: 1.3, marginBottom: 10 }}>{title}</h3>
                <p style={{ fontSize: 12, color: "var(--ink2)", lineHeight: 1.7 }}>{body}</p>
              </div>
            ))}
          </div>
        </section>
      </main>

      <footer style={{ maxWidth: 900, margin: "0 auto", padding: "32px 40px", borderTop: "1px solid var(--line)", display: "flex", justifyContent: "space-between", flexWrap: "wrap", gap: 12, fontSize: 11, color: "var(--ink3)", letterSpacing: ".04em" }}>
        <span>© 2026 Lumen Research</span>
        <span>privacy · terms · docs</span>
      </footer>

      <AuthModal
        open={modal}
        view={view}
        onClose={() => setModal(false)}
        onSwitch={setView}
        onSuccess={() => setModal(false)}
      />
    </>
  );
}

// ── styles (scoped via className + CSS vars) ──────────────────────────────────
function Style() {
  return (
    <style>{`
      :root {
        --bg: #f5f3ee;
        --ink: #1a1814;
        --ink2: #6b6760;
        --ink3: #b5b2ad;
        --line: #dedad4;
        --serif: 'DM Serif Display', serif;
        --mono: 'DM Mono', monospace;
      }
      @import url('https://fonts.googleapis.com/css2?family=DM+Serif+Display:ital@0;1&family=DM+Mono:wght@300;400&display=swap');

      *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
      body { background: var(--bg); color: var(--ink); font-family: var(--mono); font-size: 13px; line-height: 1.6; }

      .btn-ghost {
        font-family: var(--mono); font-size: 12px; cursor: pointer;
        background: transparent; color: var(--ink2);
        border: 1px solid var(--line); border-radius: 4px; padding: 8px 18px;
        transition: border-color .2s, color .2s;
      }
      .btn-ghost:hover { border-color: var(--ink2); color: var(--ink); }

      .btn-solid {
        font-family: var(--mono); font-size: 12px; cursor: pointer;
        background: var(--ink); color: var(--bg);
        border: none; border-radius: 4px; padding: 8px 18px;
        transition: opacity .2s, transform .2s;
      }
      .btn-solid:hover { opacity: .82; transform: translateY(-1px); }

      .btn-danger {
        font-family: var(--mono); font-size: 12px; cursor: pointer;
        background: transparent; color: #c0392b;
        border: 1px solid #e8c4c0; border-radius: 4px; padding: 6px 14px;
        transition: background .2s;
      }
      .btn-danger:hover { background: #fdf0ee; }

      .btn-hero-primary {
        font-family: var(--mono); font-size: 13px; padding: 12px 28px;
        background: var(--ink); color: var(--bg);
        border: none; border-radius: 4px; cursor: pointer;
        transition: opacity .22s, transform .22s;
      }
      .btn-hero-primary:hover { opacity: .8; transform: translateY(-2px); }

      .btn-hero-secondary {
        font-family: var(--mono); font-size: 13px; padding: 12px 28px;
        background: transparent; color: var(--ink2);
        border: 1px solid var(--line); border-radius: 4px; cursor: pointer;
        transition: border-color .22s, color .22s;
      }
      .btn-hero-secondary:hover { border-color: var(--ink2); color: var(--ink); }

      .card {
        background: #ffffff; padding: 28px 24px;
        transition: background .2s; cursor: default;
      }
      .card:hover { background: var(--bg); }

      @keyframes fadeDown { from { opacity:0; transform:translateY(-12px) } to { opacity:1; transform:none } }
      @keyframes fadeUp   { from { opacity:0; transform:translateY(16px)  } to { opacity:1; transform:none } }
      @keyframes pulse    { 0%,100%{transform:scale(1);opacity:1} 50%{transform:scale(1.5);opacity:.5} }
      @keyframes ticker   { from{transform:translateX(0)} to{transform:translateX(-50%)} }
      @keyframes spin     { to{transform:rotate(360deg)} }

      @media(max-width:600px){
        nav { padding: 16px 20px !important; }
        section { padding: 60px 20px !important; }
        footer  { padding: 24px 20px !important; }
      }
    `}</style>
  );
}