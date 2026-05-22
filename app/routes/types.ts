export interface Conversation {
  id: string;
  title: string;
  slug: string;
  createdAt: string;
}

export interface Message {
  id: string;
  content: string;
  role: "User" | "Assistant";
  createdAt: string;
}

export interface ConversationResponse {
  success: boolean;
  conversation: {
    id: string;
    title: string;
    messages: Message[];
  };
}