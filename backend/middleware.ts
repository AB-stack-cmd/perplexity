import type { Request, Response, NextFunction } from "express";
import { createSupabseClient } from "./lib/supabase/Client.ts";
import prisma from "./db.ts";

// ─── Request Augmentation ─────────────────────────────────────────────────────

declare global {
  namespace Express {
    interface Request {
      userId?: string;    // Supabase UUID
      dbUserId?: string;  // Internal Prisma user ID
    }
  }
}

// ─── Singleton Supabase client ────────────────────────────────────────────────

const supabase = createSupabseClient();

// ─── Middleware ───────────────────────────────────────────────────────────────

export default async function Validation(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    console.log(`res : ${req.body}`
    )
    const auth = req.headers.authorization;
    console.log(`auth : ${auth}`)

    if (!auth?.startsWith("Bearer ")) {
      res.status(401).json({ success: false, message: "No token provided" });
      return;
    }

    const token = auth.split(" ")[1]; // token split from jwt fetch from client

    const { data:{user}, error } = await supabase.auth.getUser(token);

    if (error || !user) {
      res.status(401).json({ success: false, message: "Invalid token" });
      return;
    }

    const supabaseUser = user;
    console.log(`supabase`)
    console.log(supabase)
    console.log("_________")

    // Upsert: find or create the internal DB user in one query
    const dbUser = await prisma.user.upsert({
      where: { supabaseId: supabaseUser.id },
      update: {},  // nothing to update on repeat visits
      create: {
        supabaseId: supabaseUser.id,
        email: supabaseUser.email ?? "",
        name:
          supabaseUser.user_metadata?.full_name ??
          supabaseUser.user_metadata?.name ??
          "Unknown",
        provider:
          supabaseUser.app_metadata?.provider === "google" ? "Google" : "Github",
      },
    });

    // Attach both IDs so routes never need to query for the user again
    req.userId   = supabaseUser.id;  // Supabase UUID (kept for compatibility)
    req.dbUserId = dbUser.id;        // Prisma ID


    next();
  } catch (error: unknown) {
    console.error("Validation middleware error:", error);
    res.status(500).json({
      success: false,
      message: error instanceof Error ? error.message : "Internal Server Error",
    });
  }
}