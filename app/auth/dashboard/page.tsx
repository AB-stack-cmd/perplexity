"use client";

import { useEffect, useState } from "react";
import { jwt_token } from "@/app/lib/supabase/token";

interface Message {
  id: string;
  content: string;
  role: "User" | "Assistant";
}

interface Conversation {
  id: string;
  title: string;
  messages?: Message[];
  createdAt?: string;
}

export default function ConversationUI() {
  const [conversations, setConversations] = useState<Conversation[]>([]);

  const [activeConversation, setActiveConversation] =
    useState<Conversation | null>(null);

  const [query, setQuery] = useState("");

  const [loading, setLoading] = useState(false);

  const jwt = jwt_token();
    

  // Fetch all conversations
  async function fetchConversations() {
    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_BACKEND_URL}/conversation`,
        {
          headers: {
            Authorization: `Bearer ${jwt}`,
          },
        }
      );

      const data = await res.json();

      setConversations(data.conversations || []);
    } catch (error) {
      console.error(error);
    }
  }
   // New chat
  async function handleAskResponse() {
    if (!query.trim()) return;

    setLoading(true);

    try {
      const res = await fetch(
        "http://localhost:4000/perplexity_ask",
        {
          method: "POST",

          headers: {
            "Content-Type": "application/json",

            Authorization: `Bearer ${jwt}`,
          },

          body: JSON.stringify({
            query,
          }),
        }
      );

      const reader = res.body?.getReader();

      const decoder = new TextDecoder();

      let finalText = "";

      while (true) {
        const { done, value } =
          await reader!.read();

        if (done) break;

        const chunk = decoder.decode(value);

        finalText += chunk;
      }
    await fetchConversations();

      setQuery("");
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }}

  // Fetch single conversation
  async function fetchConversationById(id: string) {
    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_BACKEND_URL}/conversation/${id}`,
        {
          headers: {
            Authorization: `Bearer ${jwt}`,
          },
        }
      );

      const data = await res.json();

      setActiveConversation(data.conversation);
    } catch (error) {
      console.error(error);
    }
  }

  // New chat
  async function handleAsk() {
    if (!query.trim()) return;

    setLoading(true);

    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_BACKEND_URL}/perplexity_ask`,
        {
          method: "POST",

          headers: {
            "Content-Type": "application/json",

            Authorization: `Bearer ${jwt}`,
          },

          body: JSON.stringify({
            query,
          }),
        }
      );

      const reader = res.body?.getReader();

      const decoder = new TextDecoder();

      let finalText = "";

      while (true) {
        const { done, value } =
          await reader!.read();

        if (done) break;

        const chunk = decoder.decode(value);

        finalText += chunk;
      }

      await fetchConversations();

      setQuery("");
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  }

  // Follow-up
  async function handleFollowup() {
    if (!query.trim()) return;

    if (!activeConversation) return;

    setLoading(true);

    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_BACKEND_URL}/perplexity/followups`,
        {
          method: "POST",

          headers: {
            "Content-Type": "application/json",

            Authorization: `Bearer ${jwt}`,
          },

          body: JSON.stringify({
            conversationId:
              activeConversation.id,

            query,
          }),
        }
      );

      const reader = res.body?.getReader();

      const decoder = new TextDecoder();

      let finalText = "";

      while (true) {
        const { done, value } =
          await reader!.read();

        if (done) break;

        const chunk = decoder.decode(value);

        finalText += chunk;
      }

      await fetchConversationById(
        activeConversation.id
      );

      setQuery("");
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchConversations();
  }, []);

  return (
    <div className="h-screen flex bg-zinc-950 text-zinc-100">
      {/* Sidebar */}
      <aside className="w-80 border-r border-zinc-800 flex flex-col">
        <div className="p-4 border-b border-zinc-800">
          <button
            onClick={() => {
              setActiveConversation(null);
            }}
            className="w-full rounded-xl bg-white text-black py-3 font-medium hover:opacity-90 transition"
          >
            + New Chat
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-3 space-y-2">
          {conversations.map((conversation) => (
            <button
              key={conversation.id}
              onClick={() =>
                fetchConversationById(
                  conversation.id
                )
              }
              className="w-full text-left p-3 rounded-xl hover:bg-zinc-900 transition border border-transparent hover:border-zinc-800"
            >
              <p className="text-sm font-medium truncate">
                {conversation.title}
              </p>
            </button>
          ))}
        </div>
      </aside>

      {/* Main */}
      <main className="flex-1 flex flex-col">
        {/* Header */}
        <div className="border-b border-zinc-800 px-6 py-4">
          <h1 className="text-lg font-semibold">
            {activeConversation?.title ||
              "New Chat"}
          </h1>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto px-6 py-8 space-y-8">
          {activeConversation?.messages?.map(
            (message) => (
              <div key={message.id}>
                <div className="text-sm text-zinc-400 mb-2">
                  {message.role}
                </div>

                <div className="bg-zinc-900 rounded-2xl p-4 max-w-3xl leading-7 whitespace-pre-wrap">
                  {message.content}
                </div>
              </div>
            )
          )}
        </div>

        {/* Input */}
        <div className="border-t border-zinc-800 p-4">
          <div className="max-w-4xl mx-auto flex gap-3">
            <input
              value={query}
              onChange={(e) =>
                setQuery(e.target.value)
              }
              placeholder="Ask anything..."
              className="flex-1 rounded-2xl bg-zinc-900 border border-zinc-800 px-4 py-4 outline-none focus:border-zinc-700"
            />

            <button
              disabled={loading}
              onClick={() => {
                if (activeConversation) {
                  handleFollowup();
                } else {
                  handleAsk();
                }
              }}
              className="px-6 rounded-2xl bg-white text-black font-medium hover:opacity-90 transition disabled:opacity-50"
            >
              {loading
                ? "Loading..."
                : "Send"}
            </button>
          </div>
        </div>
      </main>
    </div>
  );
}
