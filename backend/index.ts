import express, { Request, Response } from "express";
import "dotenv/config";
import { tavily } from "@tavily/core";
import { streamText, Output } from "ai";
import cors from "cors";
import * as z from "zod";
import slugify from "slugify";
import { createGoogleGenerativeAI } from "@ai-sdk/google";

import { PROMPT_TEMPLATE, SYSTEM_PROMT } from "./prompts.ts";
import prisma from "./db.ts";
import Validation from "./middleware.ts";

// ─── Clients ──────────────────────────────────────────────────────────────────

export const google = createGoogleGenerativeAI({
  apiKey: process.env.GOOGLE_GENERATIVE_AI_API_KEY!,
});

const tavilyClient = tavily({ apiKey: process.env.TAVILY_API_KEY! });

// ─── App ──────────────────────────────────────────────────────────────────────

const app = express();
const PORT = process.env.PORT ?? 8080;

app.use(express.json());
app.use(
  cors({
    origin: "http://localhost:3000",
    methods: ["GET", "POST", "PUT", "DELETE"],
    allowedHeaders: ["Content-Type", "Authorization"],
    credentials: true,
  })
);

// ─── Shared Helpers ───────────────────────────────────────────────────────────

/** Sets SSE headers required for streaming responses. */
function setSseHeaders(res: Response): void {
  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("X-Accel-Buffering", "no"); // disables Nginx proxy buffering
}

/** Collects a streaming text response and simultaneously writes it to `res`. */
async function pipeTextStream(
  stream: AsyncIterable<string>,
  res: Response
): Promise<string> {
  let full = "";
  for await (const chunk of stream) {
    full += chunk;
    res.write(chunk);
  }
  return full;
}

/** Serialises web results into a source-list JSON string. */
function formatSources(results: Array<{ url: string; title: string }>): string {
  return JSON.stringify(results.map(({ url, title }) => ({ url, title })));
}

/** Unified 500 handler — hides internals in production. */
function serverError(res: Response, error: unknown): void {
  console.error(error);
  res.status(500).json({
    success: false,
    message: "Internal Server Error",
    ...(process.env.NODE_ENV === "development" && {
      detail: error instanceof Error ? error.message : String(error),
    }),
  });
}

// ─── Routes ──────────────────────────────────────────────────────────────────

/**
 * GET /conversation
 * Returns all conversations for the authenticated user, newest first.
 */
app.get("/conversation", Validation, async (req: Request, res: Response) => {
  try {
    const conversations = await prisma.conversation.findMany({
      where: { userId: req.dbUserId },
      orderBy: { createdAt: "desc" },
      select: { id: true, title: true, slug: true, createdAt: true },
    });

    res.status(200).json({ conversations });
  } catch (error) {
    serverError(res, error);
  }
});

/**
 * GET /conversation/:conversationId
 * Returns a single conversation with its full message history.
 */
app.get(
  "/conversation/:conversationId",
  Validation,
  async (req: Request, res: Response) => {
    const { conversationId } = req.params;

    try {
      const conversation = await prisma.conversation.findFirst({
        where: { id: conversationId, userId: req.dbUserId },
        include: { messages: { orderBy: { createdAt: "asc" } } },
      });

      if (!conversation) {
        return res
          .status(404)
          .json({ success: false, message: "Conversation not found" });
      }

      res.status(200).json({ success: true, conversation });
    } catch (error) {
      serverError(res, error);
    }
  }
);

/**
 * POST /conversation/new
 * Creates a blank conversation for the authenticated user.
 */
app.post(
  "/conversation/new",
  Validation,
  async (req: Request, res: Response) => {
    try {
      const conversation = await prisma.conversation.create({
        data: {
          title: "New Chat",
          slug: slugify(`chat-${Date.now()}`, { lower: true, strict: true }),
          userId: req.dbUserId!,
        },
      });

      res.status(201).json({ success: true, conversation });
    } catch (error) {
      serverError(res, error);
    }
  }
);

/**
 * POST /purplexity_ask
 * Handles the first message: web search → streamed AI answer → persists history.
 */
app.post(
  "/purplexity_ask",
  Validation,
  async (req: Request, res: Response) => {
    const { query } = req.body as { query?: string };

    if (!query?.trim()) {
      return res.status(400).json({ error: "Query must not be empty" });
    }

    try {
      const { results: webResults } = await tavilyClient.search(query, {
        searchDepth: "advanced",
      });

      // Create conversation + first user message in one transaction
      const conversation = await prisma.conversation.create({
        data: {
          title: query.slice(0, 80),
          slug: slugify(query, { lower: true, strict: true }),
          userId: req.dbUserId!, // ✅ already resolved by middleware — no extra DB call
          messages: { create: { content: query, role: "User" } },
        },
      });

      const prompt = PROMPT_TEMPLATE
        .replace("{{WEB_SEARCH_RESULTS}}", JSON.stringify(webResults))
        .replace("{{USER_QUERY}}", JSON.stringify(query));

      const { textStream } = streamText({
        model: google("gemini-2.5-flash"),
        system: SYSTEM_PROMT,
        prompt,
        output: Output.object({
          schema: z.object({
            followUps: z.array(z.string()),
            answer: z.string(),
          }),
        }),
      });

      setSseHeaders(res);

      const assistantText = await pipeTextStream(textStream, res);

      res.write("\n<SOURCE>\n");
      res.write(formatSources(webResults));
      res.end();

      // Persist after stream ends so the client isn't blocked
      await prisma.message.create({
        data: {
          content: assistantText,
          role: "Assistant",
          conversationId: conversation.id,
        },
      });
    } catch (error) {
      if (res.headersSent) { res.end(); return; }
      serverError(res, error);
    }
  }
);

/**
 * POST /purplexity/follow_up
 * Handles follow-up messages in an existing conversation.
 */
app.post(
  "/purplexity/follow_up",
  Validation,
  async (req: Request, res: Response) => {
    const schema = z.object({
      conversationId: z.string(),
      query: z.string().min(1),
    });

    const parsed = schema.safeParse(req.body);
    if (!parsed.success) {
      return res
        .status(400)
        .json({ success: false, message: parsed.error.message });
    }

    const { conversationId, query } = parsed.data;

    try {
      const conversation = await prisma.conversation.findFirst({
        where: { id: conversationId, userId: req.dbUserId },
        include: { messages: { orderBy: { createdAt: "asc" } } },
      });

      if (!conversation) {
        return res
          .status(404)
          .json({ success: false, message: "Conversation not found" });
      }

      // Persist user message before we start the search + stream
      await prisma.message.create({
        data: { content: query, role: "User", conversationId },
      });

      const { results: webResults } = await tavilyClient.search(query, {
        searchDepth: "advanced",
      });

      const history = conversation.messages
        .map((m) => `${m.role}: ${m.content}`)
        .join("\n");

      const prompt = `
Conversation History:
${history}

Web Results:
${JSON.stringify(webResults)}

User Follow-up:
${query}
      `.trim();

      const { textStream } = streamText({
        model: google("gemini-2.5-flash"),
        system: "You are a helpful AI assistant.",
        prompt,
      });

      setSseHeaders(res);
      res.setHeader("X-Conversation-Id", conversation.id);

      const finalAnswer = await pipeTextStream(textStream, res);

      res.write("\n<SOURCES>\n");
      res.write(formatSources(webResults));
      res.end();

      await prisma.message.create({
        data: { content: finalAnswer, role: "Assistant", conversationId },
      });
    } catch (error) {
      if (res.headersSent) { res.end(); return; }
      serverError(res, error);
    }
  }
);

// ─── Start ────────────────────────────────────────────────────────────────────

app.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`);
});