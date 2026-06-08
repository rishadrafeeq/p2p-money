"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { formatDateTime } from "@/lib/format";
import { PageContainer, PageHeader, Card } from "./PageLayout";

interface SupportMessage {
  id: string;
  senderRole: "client" | "admin";
  body: string | null;
  attachmentUrl: string | null;
  attachmentType: string | null;
  createdAt: string;
}

export default function SupportScreen() {
  const [messages, setMessages] = useState<SupportMessage[]>([]);
  const [text, setText] = useState("");
  const [attachment, setAttachment] = useState<File | null>(null);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");
  const bottomRef = useRef<HTMLDivElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  async function loadMessages() {
    try {
      const res = await fetch("/api/client/support/messages");
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Failed to load messages");
        return;
      }
      setMessages(data.messages || []);
      setError("");
    } catch {
      setError("Could not load messages. Check your connection.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadMessages();
    const interval = setInterval(loadMessages, 3000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  async function handleSend(e: React.FormEvent) {
    e.preventDefault();
    if (sending) return;
    if (!text.trim() && !attachment) return;

    setSending(true);
    setError("");

    try {
      const formData = new FormData();
      if (text.trim()) formData.append("body", text.trim());
      if (attachment) formData.append("attachment", attachment);

      const res = await fetch("/api/client/support/messages", { method: "POST", body: formData });
      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Failed to send message");
        return;
      }

      setText("");
      setAttachment(null);
      if (fileRef.current) fileRef.current.value = "";
      await loadMessages();
    } catch {
      setError("Could not send message. Try again.");
    } finally {
      setSending(false);
    }
  }

  return (
    <PageContainer>
      <PageHeader
        title="Support Center"
        subtitle="Chat with our support team — attach photos or videos"
        action={
          <Link
            href="/assets"
            className="text-sm font-medium text-blue-600 hover:text-blue-700 hover:underline"
          >
            ← Back to Assets
          </Link>
        }
      />

      <Card className="flex flex-col h-[calc(100vh-220px)] min-h-[480px] max-h-[720px] overflow-hidden">
        <div className="px-4 py-3 border-b border-slate-100 bg-gradient-to-r from-cyan-50 to-blue-50">
          <p className="font-semibold text-slate-800">P2P Money Support</p>
          <p className="text-xs text-slate-500">We typically reply within a few hours</p>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-slate-50">
          {loading && messages.length === 0 ? (
            <p className="text-center text-slate-400 text-sm py-8">Loading conversation...</p>
          ) : messages.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-4xl mb-3">🎧</p>
              <p className="font-medium text-slate-700">Start a conversation</p>
              <p className="text-sm text-slate-400 mt-1">Describe your issue or attach a screenshot</p>
            </div>
          ) : (
            messages.map((msg) => (
              <MessageBubble key={msg.id} message={msg} />
            ))
          )}
          <div ref={bottomRef} />
        </div>

        {error && (
          <p className="px-4 py-2 text-sm text-red-600 bg-red-50 border-t border-red-100">{error}</p>
        )}

        {attachment && (
          <div className="px-4 py-2 bg-blue-50 border-t border-blue-100 flex items-center justify-between text-sm">
            <span className="text-blue-700 truncate">📎 {attachment.name}</span>
            <button
              type="button"
              onClick={() => {
                setAttachment(null);
                if (fileRef.current) fileRef.current.value = "";
              }}
              className="text-red-500 hover:text-red-700 ml-2 shrink-0"
            >
              Remove
            </button>
          </div>
        )}

        <form onSubmit={handleSend} className="p-3 border-t border-slate-200 bg-white flex gap-2 items-end">
          <input
            ref={fileRef}
            type="file"
            accept="image/*,video/*"
            className="hidden"
            onChange={(e) => setAttachment(e.target.files?.[0] || null)}
          />
          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            className="shrink-0 w-10 h-10 rounded-xl bg-slate-100 hover:bg-slate-200 text-lg flex items-center justify-center"
            title="Attach photo or video"
          >
            📎
          </button>
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Type your message..."
            rows={1}
            className="flex-1 border border-slate-200 rounded-xl px-4 py-2.5 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-cyan-500/30 max-h-24"
          />
          <button
            type="submit"
            disabled={sending || (!text.trim() && !attachment)}
            className="shrink-0 px-4 py-2.5 bg-gradient-to-r from-cyan-600 to-blue-600 text-white font-semibold rounded-xl text-sm hover:opacity-90 disabled:opacity-50"
          >
            {sending ? "..." : "Send"}
          </button>
        </form>
      </Card>
    </PageContainer>
  );
}

function MessageBubble({ message }: { message: SupportMessage }) {
  const isClient = message.senderRole === "client";

  return (
    <div className={`flex ${isClient ? "justify-end" : "justify-start"}`}>
      <div
        className={`max-w-[85%] sm:max-w-[70%] rounded-2xl px-4 py-2.5 shadow-sm ${
          isClient
            ? "bg-gradient-to-br from-blue-600 to-indigo-600 text-white rounded-br-md"
            : "bg-white text-slate-800 border border-slate-200 rounded-bl-md"
        }`}
      >
        {!isClient && (
          <p className="text-[10px] font-semibold text-cyan-600 mb-1 uppercase tracking-wide">Support</p>
        )}
        {message.body && <p className="text-sm whitespace-pre-wrap break-words">{message.body}</p>}
        {message.attachmentUrl && message.attachmentType === "image" && (
          <a href={message.attachmentUrl} target="_blank" rel="noopener noreferrer" className="block mt-2">
            <img
              src={message.attachmentUrl}
              alt="Attachment"
              className="max-w-full rounded-lg max-h-48 object-cover"
            />
          </a>
        )}
        {message.attachmentUrl && message.attachmentType === "video" && (
          <video
            src={message.attachmentUrl}
            controls
            className="mt-2 max-w-full rounded-lg max-h-48"
          />
        )}
        <p className={`text-[10px] mt-1.5 ${isClient ? "text-blue-200" : "text-slate-400"}`}>
          {formatDateTime(message.createdAt)}
        </p>
      </div>
    </div>
  );
}
