bash

cat > /mnt/user-data/outputs/README.md << 'EOF'
# Purplexity

A full-stack AI-powered search and chat application. Ask anything — it searches the web in real time, streams a structured AI answer, and persists the full conversation so you can return to any thread later.

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | Next.js  (App Router), TypeScript, Tailwind CSS |
| Backend | Express.js, TypeScript |
| AI | Google Gemini 2.5 Flash via Vercel AI SDK |
| Web Search | Tavily API |
| Auth | Supabase Auth (JWT / Bearer tokens) |
| Database | PostgreSQL via Prisma ORM |

---

## Project Structure

```
├── Perplexity/                  # Next.js frontend
│   └── app/
│       ├── page.tsx    
|        ├── auth/
|        |   └──chat/  
|        |       └── page.tsx # Root chat UI (all components live here)
│        └── lib/
│            └── supabase/
│                └── client.ts
│
├── server/                  # Express backend
│   ├── server.ts            # All routes + helpers
│   ├── middleware.ts        # Supabase JWT validation + user upsert
│   ├── db.ts                # Prisma client singleton
│   ├── prompts.ts           # PROMPT_TEMPLATE + SYSTEM_PROMT
│   └── prisma/
│       └── schema.prisma    # Database schema
│
└── README.md
```

---

## Environment Variables

### Backend (`server/.env`)

```env
PORT=4000
DATABASE_URL=postgresql://user:password@localhost:6543/purplexity
GOOGLE_GENERATIVE_AI_API_KEY=your_google_ai_key
TAVILY_API_KEY=your_tavily_key
```

### Frontend (`client/.env.local`)

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

---

## Getting Started

### 1. Clone and install

```bash
# Install backend dependencies
cd server && npm install

# Install frontend dependencies
cd client && npm install
```

### 2. Set up the database

```bash
cd server

# Apply migrations and generate Prisma client
npx prisma migrate dev --name init

# (Optional) Browse data in the browser
npx prisma studio
```

### 3. Run in development

```bash
# Terminal 1 — backend
cd server && npm run dev     # starts on port 4000

# Terminal 2 — frontend
cd client && npm run dev     # starts on port 3000
```

---

## API Routes

All routes require an `Authorization: Bearer <supabase_jwt>` header. The middleware validates the token with Supabase and upserts the user into the local DB on every request.

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/conversation` | List all conversations for the current user |
| `GET` | `/conversation/:id` | Fetch one conversation with full message history |
| `POST` | `/conversation/new` | Create a blank conversation |
| `POST` | `/purplexity_ask` | First question in a new thread — web search → AI stream |
| `POST` | `/purplexity/follow_up` | Follow-up question in an existing thread |

### Streaming protocol

Both `/purplexity_ask` and `/purplexity/follow_up` use **plain HTTP streaming** (SSE-compatible). The response format is:

```
<streamed AI text chunks...>
\n<SOURCE>\n                    ← delimiter (singular for first ask)
[{"url":"...","title":"..."}]   ← JSON array of sources

\n<SOURCES>\n                   ← delimiter (plural for follow-ups)
[{"url":"...","title":"..."}]
```

The conversation ID of a newly created thread is sent in the `X-Conversation-Id` response header.

---

## Database Schema

```
User
 ├── id          (cuid, PK)
 ├── supabaseId  (unique — used for JWT lookup)
 ├── email
 ├── name
 ├── provider    (Google | Github)
 └── conversations → Conversation[]

Conversation
 ├── id          (cuid, PK)
 ├── title       (first 80 chars of query)
 ├── slug        (slugified query, unique)
 ├── userId      → User
 └── messages    → Message[]

Message
 ├── id             (cuid, PK)
 ├── role           (User | Assistant)
 ├── content        (Text — stores JSON envelope for assistant messages)
 └── conversationId → Conversation
```

### Assistant message envelope

Every assistant message is stored as a JSON string so that sources and follow-up suggestions survive a page reload:

```json
{
  "answer":   "The full answer text…",
  "followUps": ["Related question 1?", "Related question 2?"],
  "sources":  [{ "url": "https://…", "title": "Page title" }]
}
```

---

## Authentication Flow

```
Browser → sends Supabase JWT in Authorization header
  ↓
middleware.ts → validates JWT with supabase.auth.getUser()
  ↓
middleware.ts → upserts user into local DB (one query, not two)
  ↓
middleware.ts → attaches req.userId (Supabase UUID)
              → attaches req.dbUserId (internal Prisma ID)
  ↓
Route handler → uses req.dbUserId for all DB queries (no extra lookup)
```

---

## Key Design Decisions

**Sources stored inside message content** — Rather than adding a separate `sources` DB table, sources are embedded in the JSON envelope stored in `Message.content`. This avoids a schema change while keeping sources fully recoverable from history.

**Single `streamQuery` utility** — Both the first ask and follow-up requests go through one shared streaming function on the client, parameterised by endpoint and delimiter string. No duplicated `ReadableStream` logic.

**Middleware upserts the DB user** — The middleware uses `prisma.user.upsert` instead of `findFirst` + conditional `create`. One round-trip instead of two, atomic, and the result is attached directly to the request so routes never need to look up the user themselves.

**`Output.object` schema on first ask** — The first query uses Vercel AI SDK's `Output.object` to force Gemini to respond with `{ answer, followUps }` JSON. Follow-up responses are plain text. `buildStoredContent` wraps both into the same envelope shape before saving so the client's `parseStoredContent` never needs to branch on route type.
EOF
echo "README done"