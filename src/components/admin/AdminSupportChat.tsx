"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { formatDateTime } from "@/lib/format";

export interface SupportThreadItem {
  id: string;
  clientId: string;
  mobile: string;
  status: string;
  unreadCount: number;
  lastMessage: string | null;
  lastMessageAt: string | null;
  updatedAt: string;
}

interface SupportMessage {
  id: string;
  senderRole: "client" | "admin";
  body: string | null;
  attachmentUrl: string | null;
  attachmentType: string | null;
  createdAt: string;
}

interface AdminSupportChatProps {
  initialThreads: SupportThreadItem[];
  clients: { id: string; mobile: string }[];
}

export default function AdminSupportChat({ initialThreads, clients }: AdminSupportChatProps) {
  const router = useRouter();
  const [threads, setThreads] = useState(initialThreads);
  const [selectedId, setSelectedId] = useState<string | null>(
    initialThreads.find((t) => t.unreadCount > 0)?.id ?? initialThreads[0]?.id ?? null
  );
  const [messages, setMessages] = useState<SupportMessage[]>([]);
  const [threadMobile, setThreadMobile] = useState("");
  const [text, setText] = useState("");
  const [attachment, setAttachment] = useState<File | null>(null);
  const [sending, setSending] = useState(false);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [error, setError] = useState("");
  const [filter, setFilter] = useState<"all" | "unread">("all");
  const [newClientId, setNewClientId] = useState("");
  const bottomRef = useRef<HTMLDivElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const totalUnread = threads.reduce((sum, t) => sum + t.unreadCount, 0);
  const filteredThreads =
    filter === "unread" ? threads.filter((t) => t.unreadCount > 0) : threads;

  async function refreshThreads() {
    try {
      const res = await fetch("/api/admin/support/threads");
      const data = await res.json();
      if (res.ok) setThreads(data.threads || []);
    } catch {
      /* ignore poll errors */
    }
  }

  async function loadMessages(threadId: string) {
    setLoadingMessages(true);
    try {
      const res = await fetch(`/api/admin/support/messages?threadId=${threadId}`);
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Failed to load messages");
        return;
      }
      setMessages(data.messages || []);
      setThreadMobile(data.thread?.mobile || "");
      setError("");
      await refreshThreads();
    } catch {
      setError("Could not load messages");
    } finally {
      setLoadingMessages(false);
    }
  }

  useEffect(() => {
    if (selectedId) loadMessages(selectedId);
  }, [selectedId]);

  useEffect(() => {
    const interval = setInterval(() => {
      refreshThreads();
      if (selectedId) loadMessages(selectedId);
    }, 4000);
    return () => clearInterval(interval);
  }, [selectedId]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  async function handleSend(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedId || sending) return;
    if (!text.trim() && !attachment) return;

    setSending(true);
    setError("");

    try {
      const formData = new FormData();
      formData.append("threadId", selectedId);
      if (text.trim()) formData.append("body", text.trim());
      if (attachment) formData.append("attachment", attachment);

      const res = await fetch("/api/admin/support/messages", { method: "POST", body: formData });
      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Failed to send");
        return;
      }

      setText("");
      setAttachment(null);
      if (fileRef.current) fileRef.current.value = "";
      await loadMessages(selectedId);
      router.refresh();
    } catch {
      setError("Could not send message");
    } finally {
      setSending(false);
    }
  }

  async function handleStartChat() {
    if (!newClientId) return;
    setError("");
    try {
      const res = await fetch("/api/admin/support/threads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ clientId: newClientId }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Failed to start chat");
        return;
      }
      await refreshThreads();
      setSelectedId(data.threadId);
      setNewClientId("");
    } catch {
      setError("Could not start chat");
    }
  }

  const clientsWithoutThread = clients.filter((c) => !threads.some((t) => t.clientId === c.id));

  return (
    <div className="bg-white rounded-xl border shadow-sm overflow-hidden">
      <div className="px-6 py-4 border-b bg-slate-50 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-bold text-slate-900">Support Chat</h2>
          <p className="text-sm text-slate-500">
            {totalUnread > 0 ? (
              <span className="text-red-600 font-medium">{totalUnread} unread message(s)</span>
            ) : (
              "All caught up"
            )}
          </p>
        </div>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => setFilter("all")}
            className={`px-3 py-1.5 text-xs rounded-lg font-medium ${
              filter === "all" ? "bg-blue-500 text-white" : "bg-white border text-slate-600"
            }`}
          >
            All ({threads.length})
          </button>
          <button
            type="button"
            onClick={() => setFilter("unread")}
            className={`px-3 py-1.5 text-xs rounded-lg font-medium ${
              filter === "unread" ? "bg-red-500 text-white" : "bg-white border text-slate-600"
            }`}
          >
            Unread ({threads.filter((t) => t.unreadCount > 0).length})
          </button>
        </div>
      </div>

      {clientsWithoutThread.length > 0 && (
        <div className="px-6 py-3 border-b bg-amber-50 flex flex-wrap items-center gap-2 text-sm">
          <span className="text-amber-800">Start chat with client:</span>
          <select
            value={newClientId}
            onChange={(e) => setNewClientId(e.target.value)}
            className="border rounded-lg px-2 py-1 text-sm"
          >
            <option value="">Select client...</option>
            {clientsWithoutThread.map((c) => (
              <option key={c.id} value={c.id}>
                +91 {c.mobile}
              </option>
            ))}
          </select>
          <button
            type="button"
            onClick={handleStartChat}
            disabled={!newClientId}
            className="px-3 py-1 bg-amber-600 text-white rounded-lg text-xs font-medium disabled:opacity-50"
          >
            Open Chat
          </button>
        </div>
      )}

      <div className="grid lg:grid-cols-[320px_1fr] min-h-[520px]">
        <div className="border-r border-slate-100 max-h-[600px] overflow-y-auto">
          {filteredThreads.length === 0 ? (
            <p className="p-6 text-sm text-slate-400 text-center">
              {filter === "unread" ? "No unread conversations" : "No support chats yet"}
            </p>
          ) : (
            filteredThreads.map((thread) => (
              <button
                key={thread.id}
                type="button"
                onClick={() => setSelectedId(thread.id)}
                className={`w-full text-left px-4 py-3 border-b border-slate-50 hover:bg-slate-50 transition-colors ${
                  selectedId === thread.id ? "bg-blue-50 border-l-4 border-l-blue-500" : ""
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <p className="font-semibold text-slate-800 text-sm">+91 {thread.mobile}</p>
                  {thread.unreadCount > 0 && (
                    <span className="shrink-0 min-w-[20px] h-5 px-1.5 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                      {thread.unreadCount}
                    </span>
                  )}
                </div>
                <p className="text-xs text-slate-500 mt-1 truncate">
                  {thread.lastMessage || "No messages yet"}
                </p>
                {thread.lastMessageAt && (
                  <p className="text-[10px] text-slate-400 mt-1">{formatDateTime(thread.lastMessageAt)}</p>
                )}
              </button>
            ))
          )}
        </div>

        <div className="flex flex-col min-h-[480px]">
          {!selectedId ? (
            <div className="flex-1 flex items-center justify-center text-slate-400 text-sm">
              Select a conversation to reply
            </div>
          ) : (
            <>
              <div className="px-4 py-3 border-b bg-gradient-to-r from-slate-50 to-blue-50">
                <p className="font-semibold text-slate-800">+91 {threadMobile}</p>
                <p className="text-xs text-slate-500">Support conversation</p>
              </div>

              <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-slate-50 max-h-[420px]">
                {loadingMessages && messages.length === 0 ? (
                  <p className="text-center text-slate-400 text-sm py-8">Loading...</p>
                ) : messages.length === 0 ? (
                  <p className="text-center text-slate-400 text-sm py-8">No messages yet. Send a reply below.</p>
                ) : (
                  messages.map((msg) => <AdminMessageBubble key={msg.id} message={msg} />)
                )}
                <div ref={bottomRef} />
              </div>

              {error && <p className="px-4 py-2 text-sm text-red-600 bg-red-50">{error}</p>}

              {attachment && (
                <div className="px-4 py-2 bg-blue-50 border-t text-sm flex justify-between">
                  <span className="text-blue-700 truncate">📎 {attachment.name}</span>
                  <button
                    type="button"
                    onClick={() => {
                      setAttachment(null);
                      if (fileRef.current) fileRef.current.value = "";
                    }}
                    className="text-red-500 text-xs"
                  >
                    Remove
                  </button>
                </div>
              )}

              <form onSubmit={handleSend} className="p-3 border-t bg-white flex gap-2 items-end">
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
                  className="shrink-0 w-9 h-9 rounded-lg bg-slate-100 hover:bg-slate-200 text-base"
                  title="Attach photo or video"
                >
                  📎
                </button>
                <textarea
                  value={text}
                  onChange={(e) => setText(e.target.value)}
                  placeholder="Reply to client..."
                  rows={1}
                  className="flex-1 border rounded-xl px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-blue-500/30"
                />
                <button
                  type="submit"
                  disabled={sending || (!text.trim() && !attachment)}
                  className="shrink-0 px-4 py-2 bg-blue-600 text-white rounded-xl text-sm font-semibold disabled:opacity-50"
                >
                  {sending ? "..." : "Send"}
                </button>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

function AdminMessageBubble({ message }: { message: SupportMessage }) {
  const isAdmin = message.senderRole === "admin";

  return (
    <div className={`flex ${isAdmin ? "justify-end" : "justify-start"}`}>
      <div
        className={`max-w-[80%] rounded-2xl px-4 py-2.5 shadow-sm ${
          isAdmin
            ? "bg-blue-600 text-white rounded-br-md"
            : "bg-white border border-slate-200 text-slate-800 rounded-bl-md"
        }`}
      >
        {!isAdmin && <p className="text-[10px] font-semibold text-orange-600 mb-1">Client</p>}
        {message.body && <p className="text-sm whitespace-pre-wrap break-words">{message.body}</p>}
        {message.attachmentUrl && message.attachmentType === "image" && (
          <a href={message.attachmentUrl} target="_blank" rel="noopener noreferrer" className="block mt-2">
            <img src={message.attachmentUrl} alt="Attachment" className="max-w-full rounded-lg max-h-40" />
          </a>
        )}
        {message.attachmentUrl && message.attachmentType === "video" && (
          <video src={message.attachmentUrl} controls className="mt-2 max-w-full rounded-lg max-h-40" />
        )}
        <p className={`text-[10px] mt-1 ${isAdmin ? "text-blue-200" : "text-slate-400"}`}>
          {formatDateTime(message.createdAt)}
        </p>
      </div>
    </div>
  );
}
