"use client";

import { Trash2 } from "lucide-react";
import { createClient } from "../lib/supabase/client";

const supabase = createClient();
const API =
  process.env.NEXT_PUBLIC_BACKEND_URL ??
  "http://localhost:4000";

interface DeleteConversationButtonProps {
  conversationId: string;

  onDeleted?: (conversationId: string) => void;
}

export const handleDeleteConversation = async (
  e: React.MouseEvent,
  conversationId: string
) => {
  e.stopPropagation();

  const confirmed = window.confirm(
    "Delete this conversation?"
  );

  if (!confirmed) return;

  try {
    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (!session) {
      alert("Not authenticated");
      return;
    }

    const res = await fetch(
      `${API}/conversation/${conversationId}`,
      {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
        credentials: "include",
      }
    );

    const data = await res.json();

    if (!res.ok) {
      throw new Error(
        data.message || "Failed to delete conversation"
      );
    }
  } catch (error) {
    console.error(error);
    alert("Failed to delete conversation");
  }
};