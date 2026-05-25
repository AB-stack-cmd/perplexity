"use client";

import { useRouter } from "next/navigation";
import { createClient } from "./lib/supabase/client";
import { useEffect, useState } from "react";

const supabase = createClient();

const BASE_URL = "http://localhost:4000";

/**
 * Get auth token from Supabase
 */
async function getToken() {
  const {
    data: { session },
  } = await supabase.auth.getSession();

  return session?.access_token;
}

/**
 * GET /conversation
 */
export async function getConversations() {
  try {
    const token = await getToken();

    const res = await fetch(`${BASE_URL}/conversation`, {
      method: "GET",

      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (!res.ok) {
      throw new Error(`Failed: ${res.status}`);
    }

    const data = await res.json();

    console.log("All Conversations:", data);

    return data;
  } catch (error) {
    console.error("Conversation Fetch Error:", error);
  }
}

/**
 * GET /conversation/:conversationId
 */
export async function getConversationById(
  conversationId: string
) {
  try {
    const token = await getToken();

    const res = await fetch(
      `${BASE_URL}/conversation/${conversationId}`,
      {
        method: "GET",

        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    if (!res.ok) {
      throw new Error(`Failed: ${res.status}`);
    }

    const data = await res.json();

    console.log("Single Conversation:", data);

    return data;
  } catch (error) {
    console.error("Single Conversation Error:", error);
  }
}

export default function Main() {
  const router = useRouter();

  const [query, setQuery] = useState("");
  const [text, setText] = useState("");

  /**
   * AI streaming request
   */
  useEffect(() => {
    async function getText() {
      try {
        console.log(`origin ${window.location.origin}`)
        if (query.length < 2) return;

        const token = await getToken();

        const res = await fetch(
          "http://localhost:4000/purplexity_ask",
          {
            method: "POST",

            headers: {
              "Content-Type": "application/json",

              Authorization: `Bearer ${token}`,
            },

            body: JSON.stringify({
              query,
            }),
          }
        );

        if (!res.body) return;

        const reader = res.body.getReader();

        const decoder = new TextDecoder();

        let finalText = "";

        while (true) {
          const { done, value } =
            await reader.read();

          if (done) break;

          const chunk =
            decoder.decode(value);

          finalText += chunk;

          setText(finalText);
        }
      } catch (error) {
        console.error(
          "Streaming Error:",
          error
        );
      }
    }

    getText();
  }, [query]);

  /**
   * Fetch conversations
   */
  useEffect(() => {
    async function test() {
      const conversations =
        await getConversations();

      console.log(conversations);

      if (
        conversations?.conversations
          ?.length
      ) {
        const firstId =
          conversations.conversations[0]
            .id;

        const single =
          await getConversationById(
            firstId
          );

        console.log(single);
      }
    }

    test();
  }, []);

  return (
    <div>
      <h1 className="border p-2">
        Home
      </h1>

      <button
        className="font-bold border p-3"
        onClick={() =>
          router.push("/auth")
        }
      >
        Auth
      </button>

      <button
        onClick={() =>
          router.push(
            "/auth/dashboard"
          )
        }
      >
        Dashboard
      </button>

      <textarea
        onChange={(e) =>
          setQuery(e.target.value)
        }
        name="ask"
        id="value"
        placeholder="Ask to ai"
      />

      <div>
        <h2>
          {text.length > 0
            ? text
            : "text will show here"}
        </h2>
      </div>
    </div>
  );
}