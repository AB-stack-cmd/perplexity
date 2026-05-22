import axios from "axios";
import { Conversation , Message ,  ConversationResponse } from "./types";


import { createClient } from "../lib/supabase/client";

import { ApiError } from "./errors";

const BASE_URL =
  process.env.NEXT_PUBLIC_BACKEND_URL!;

const supabase = createClient();

async function getAccessToken() {
  const {
    data: { session },
    error,
  } = await supabase.auth.getSession();

  if (error || !session?.access_token) {
    throw new ApiError(
      "Authentication required",
      401
    );
  }

  return session.access_token;
}

export async function apiClient<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {

  try {

    const token =
      await getAccessToken();

    const response = await fetch(
      `${BASE_URL}${endpoint}`,
      {
        ...options,

        headers: {
          "Content-Type":
            "application/json",

          Authorization:
            `Bearer ${token}`,

          ...(options.headers || {}),
        },

        credentials: "include",
      }
    );

    let data: any = null;

    const contentType =
      response.headers.get(
        "content-type"
      );

    if (
      contentType?.includes(
        "application/json"
      )
    ) {
      data = await response.json();
    }

    if (!response.ok) {
      throw new ApiError(
        data?.message ||
          "Something went wrong",

        response.status
      );
    }

    return data;

  } catch (error) {

    console.error(
      "API CLIENT ERROR:",
      error
    );

    if (error instanceof ApiError) {
      throw error;
    }

    throw new ApiError(
      "Network error"
    );
  }
}

export async function streamResponse(
  response: Response,
  onChunk?: (chunk: string) => void
) {

  if (!response.ok) {
    throw new ApiError(
      "Streaming request failed",
      response.status
    );
  }

  if (!response.body) {
    throw new ApiError(
      "No response stream found"
    );
  }

  const reader =
    response.body.getReader();

  const decoder =
    new TextDecoder();

  let finalText = "";

  while (true) {

    const { done, value } =
      await reader.read();

    if (done) break;

    const chunk =
      decoder.decode(value);

    finalText += chunk;

    onChunk?.(chunk);
  }

  return finalText;
}


export async function getConversations() {

  return apiClient<{
    conversations: Conversation[];
  }>("/conversation", {
    method: "GET",
  });
}




export async function getConversationById(
  conversationId: string
) {

  return apiClient<ConversationResponse>(
    `/conversation/${conversationId}`,
    {
      method: "GET",
    }
  );
};
interface AskPayload {
  query: string;
}

export async function askPerplexity(
  payload: AskPayload,

  onChunk?: (chunk: string) => void
) {

  const {
    data: { session },
  } = await supabase.auth.getSession();

  const token =
    session?.access_token;

  if (!token) {
    throw new ApiError(
      "Unauthorized",
      401
    );
  }

  const response = await fetch(`${BASE_URL}/purplexity_ask`,
    {
      method: "POST",

      headers: {
        "Content-Type":
          "application/json",

        Authorization:
          `Bearer ${token}`,
      },

      body: JSON.stringify(payload),
    }
  );

  return streamResponse(
    response,
    onChunk
  );
}


interface FollowUpPayload {
  conversationId: string;
  query: string;
}

export async function followUpConversation(
  payload: FollowUpPayload,

  onChunk?: (chunk: string) => void
) {

  const {
    data: { session },
  } = await supabase.auth.getSession();

  const token =
    session?.access_token;

  if (!token) {
    throw new ApiError(
      "Unauthorized",
      401
    );
  }

  const response = await fetch(`${BASE_URL}/purplexity/follow_up`,
    {
      method: "POST",

      headers: {
        "Content-Type":
          "application/json",

        Authorization:
          `Bearer ${token}`,
      },

      body: JSON.stringify(payload),
    }
  );

  return streamResponse(
    response,
    onChunk
  );
};
