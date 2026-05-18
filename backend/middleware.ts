import type { Request, Response, NextFunction } from "express";
import { createSupabseClient } from "./lib/supabase/Client.ts";
import prisma from "./db.ts";

declare global {
  namespace Express {
    interface Request {
      userId?: string;
    }
  }
}

const supabase = createSupabseClient();

export default async function Validation(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    // Authorization header
    const auth = req.headers.authorization;

    console.log("AUTH HEADER:", auth);

    // Validate header
    if (!auth || !auth.startsWith("Bearer ")) {
      return res.status(401).json({
        success: false,
        message: "No token provided",
      });
    }

    // Extract token
    const token = auth.split(" ")[1];

    // Validate token with Supabase
    const { data, error } = await supabase.auth.getUser(token);

    // Invalid token
    if (error || !data.user) {
      return res.status(401).json({
        success: false,
        message: "Invalid token",
      });
    }

    const user = data.user;

    console.log("SUPABASE USER:", user);

    // Attach userId to request
    req.userId = user.id;

    // if user exists
    const existingUser = await prisma.user.findFirst({
      where: {
        supabaseId: user.id,
      },
    });

    //  user if not exists
    if (!existingUser) {
      await prisma.user.create({
        data: {
          email: user.email || "",

          provider:
            user.app_metadata.provider === "google"
              ? "Google"
              : "Github",

          name:
            user.user_metadata.full_name ||
            user.user_metadata.name ||
            "Unknown",

          supabaseId: user.id,
        },
      });

      console.log("User created");
    } else {
      console.log("User already exists");
    }

    next();

  } catch (error: any) {
    console.error("VALIDATION ERROR:", error);

    return res.status(500).json({
      success: false,
      message: error.message || "Internal Server Error",
    });
  }
}