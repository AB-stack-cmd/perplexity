"use client"

import axios from "axios";
import {
  Search,
  MessageSquare,
  Plus,
  Loader2,
  PanelLeftClose,
  PanelLeftOpen,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { cn } from "@/lib/utils";
import { createClient } from "../lib/supabase/client";
import { jwt_token } from "../lib/supabase/token";



const supabase = createClient()


interface Conversation {
  id: string;
  title: string;
  slug: string;
  updatedAt: string;
}

export default  function ConversationSidebar() {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [activeId, setActiveId] = useState<string | null>(null);
  const [open, setOpen] = useState(true);

 
  useEffect(() => {
   
    const fetchConversations = async () => {
      try {
        const {data: { session },error,} = await  supabase.auth.getSession();
      if (error) throw error;
        // Access token from session
        const jwt = session?.access_token;
        const user = session?.user
        console.log(user)
       
        const response = await axios.get(
          "http://localhost:4000/conversation",
          {
            headers: {
              Authorization: `Bearer ${jwt}`,
            },
            withCredentials: true,
          }
        );
        console.log(response.data)
        
        const filteredConversations = response.data;
        console.log(`success ${response.success} \n message ${response.message}`)


        setConversations(response.data|| []);
      } catch (error) {
        console.error("Failed to load conversations", error);
      } finally {
        setLoading(false);
      }
    };

    fetchConversations();
  }, []);

  //  useMemo(() => {
  //   return conversations.filter((conversation) =>
  //     conversation.title
  //       .toLowerCase()
  //       .includes(search.toLowerCase())
  //   );
  // }, [conversations, search]);

  return (
    <>
      {/* Toggle Button */}
      <button
        onClick={() => setOpen(!open)}
        className="fixed top-4 left-4 z-50 w-9 h-9 rounded-xl bg-zinc-900 border border-zinc-800 flex items-center justify-center text-zinc-300 hover:bg-zinc-800 transition"
      >
        {open ? (
          <PanelLeftClose size={18} />
        ) : (
          <PanelLeftOpen size={18} />
        )}
      </button>

      {/* Sidebar */}
      <aside
        className={cn(
          "fixed top-0 left-0 h-screen bg-[#0b0b0b] border-r border-zinc-800 flex flex-col overflow-hidden transition-all duration-300 z-40",
          open
            ? "w-[260px] translate-x-0"
            : "w-[260px] -translate-x-full"
        )}
      >
        {/* Header */}
        <div className="h-16 px-4 border-b border-zinc-800 flex items-center justify-between mt-12">
          <div>
            <h1 className="text-white text-sm font-semibold tracking-tight">
              Chat History
            </h1>

            <p className="text-zinc-500 text-[11px] mt-0.5">
              Previous searches
            </p>
          </div>

          <button className="w-8 h-8 rounded-xl bg-zinc-900 border border-zinc-800 text-zinc-200 flex items-center justify-center hover:bg-zinc-800 transition">
            <Plus size={15} />
          </button>
        </div>

        {/* Search */}
        <div className="p-3 border-b border-zinc-800">
          <div className="relative">
            <Search
              size={14}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500"
            />

            <input
              type="text"
              placeholder="Search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-zinc-900 border border-zinc-800 rounded-xl pl-9 pr-3 py-2 text-xs text-white outline-none focus:ring-2 focus:ring-zinc-700 placeholder:text-zinc-500"
            />
          </div>
        </div>

        {/* History */}
        <div className="flex-1 overflow-y-auto px-2 py-3 space-y-1 scrollbar-thin scrollbar-thumb-zinc-800">
          {loading ? (
            <div className="flex items-center justify-center h-full">
              <Loader2
                size={18}
                className="animate-spin text-zinc-500"
              />
            </div>
          ) : filteredConversations.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center px-4">
              <MessageSquare
                size={28}
                className="text-zinc-700 mb-2"
              />

              <p className="text-zinc-500 text-xs">
                No conversations yet
              </p>
            </div>
          ) : (
            filteredConversations.map((conversation) => (
              <button
                key={conversation.id}
                onClick={() => setActiveId(conversation.id)}
                className={cn(
                  "w-full flex items-start gap-3 rounded-xl px-3 py-2.5 transition-all text-left border",
                  activeId === conversation.id
                    ? "bg-zinc-900 border-zinc-700"
                    : "border-transparent hover:bg-zinc-900/70 hover:border-zinc-800"
                )}
              >
                <MessageSquare
                  size={15}
                  className="text-zinc-500 mt-0.5 shrink-0"
                />

                <div className="min-w-0 flex-1">
                  <p className="text-sm text-zinc-100 truncate leading-5">
                    {conversation.title}
                  </p>

                  <p className="text-[10px] text-zinc-500 mt-1 truncate">
                    {new Date(
                      conversation.createdAt
                    ).toLocaleDateString()}
                  </p>
                </div>
              </button>
            ))
          )}
        </div>
      </aside>
    </>
  );
}
