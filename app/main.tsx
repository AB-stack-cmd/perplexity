"use client"
import { useRouter } from "next/navigation";
import { createClient } from "./lib/supabase/client";
import { useEffect } from "react";
// api/conversation.ts
const supabase = createClient()

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
 * Fetch all conversations
 */
export async function getConversations() {
  try {
    const token = await getToken();

    const res = await fetch(
      `${BASE_URL}/conversation`,
      {
        method: "GET",

        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    if (!res.ok) {
      throw new Error(
        `Failed: ${res.status}`
      );
    }

    const data = await res.json();

    console.log(
      "All Conversations:",
      data
    );

    return data;

  } catch (error) {
    console.error(
      "Conversation Fetch Error:",
      error
    );
  }
}

/**
 * GET /conversation/:conversationId
 * Fetch single conversation
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
      throw new Error(
        `Failed: ${res.status}`
      );
    }

    const data = await res.json();

    console.log(
      "Single Conversation:",
      data
    );

    return data;

  } catch (error) {
    console.error(
      "Single Conversation Error:",
      error
    );
  }
}

export default function Main(){

  useEffect(() => {

    async function test() {

      // fetch all conversations
      const conversations =
        await getConversations();

      console.log(conversations);

      // fetch first conversation
      if (
        conversations?.conversations?.length
      ) {
        const firstId =
          conversations.conversations[0].id;

        const single =
          await getConversationById(
            firstId
          );

        console.log(single);
      }
    }

    test();

  }, []);
    const router = useRouter();

    return( <div>

        <h1 className="border p-2 "> Home</h1>
        <button className="font-bold border p-3" onClick={()=>router.push("/auth")}> Auth </button>
        <button onClick={()=> router.push("/auth/dashboard")}>Dashboard</button>
        
    </div>)
}