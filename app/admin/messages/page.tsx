"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { MessageCircle, RefreshCw, User, ChevronRight } from "lucide-react";

interface Conversation {
  migrant: { id: string; firstName: string; lastName: string; photo?: string | null };
  lastMessage: string;
  lastAt: string;
  lastFrom: string;
  lastMigrantAt: string | null;
  totalCount: number;
  migrantCount: number;
}

function markRead(migrantId: string) {
  const readAt = JSON.parse(localStorage.getItem("staffReadAt") ?? "{}");
  readAt[migrantId] = new Date().toISOString();
  localStorage.setItem("staffReadAt", JSON.stringify(readAt));
}

function isUnread(conv: Conversation): boolean {
  if (!conv.lastMigrantAt) return false;
  const readAt = JSON.parse(localStorage.getItem("staffReadAt") ?? "{}");
  const lastRead = readAt[conv.migrant.id];
  return !lastRead || new Date(conv.lastMigrantAt) > new Date(lastRead);
}

function getInitials(first: string, last: string) {
  return `${first?.[0] ?? ""}${last?.[0] ?? ""}`.toUpperCase();
}

function timeAgo(iso: string) {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "только что";
  if (mins < 60) return `${mins} мин назад`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours} ч назад`;
  return new Date(iso).toLocaleDateString("ru-RU", { day: "numeric", month: "short" });
}

export default function MessagesPage() {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);

  function load() {
    setLoading(true);
    fetch("/api/admin/messages")
      .then((r) => r.json())
      .then((d) => { if (d.conversations) setConversations(d.conversations); })
      .catch(console.error)
      .finally(() => setLoading(false));
  }

  useEffect(() => { load(); }, []);

  const totalFromMigrants = conversations.reduce((s, c) => s + c.migrantCount, 0);

  return (
    <div className="p-6 space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Обращения</h1>
          <p className="text-slate-500 text-sm mt-1">Сообщения от мигрантов в чате</p>
        </div>
        <button onClick={load} className="p-2 rounded-lg hover:bg-slate-100 transition-colors text-slate-500">
          <RefreshCw size={16} className={loading ? "animate-spin" : ""} />
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-white rounded-xl border border-blue-100 p-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-blue-50 flex items-center justify-center">
            <MessageCircle size={18} className="text-blue-500" />
          </div>
          <div>
            <div className="text-2xl font-bold text-slate-800">{conversations.length}</div>
            <div className="text-xs text-slate-500">Переписок</div>
          </div>
        </div>
        <div className="bg-white rounded-xl border border-violet-100 p-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-violet-50 flex items-center justify-center">
            <User size={18} className="text-violet-500" />
          </div>
          <div>
            <div className="text-2xl font-bold text-slate-800">{totalFromMigrants}</div>
            <div className="text-xs text-slate-500">Сообщений от мигрантов</div>
          </div>
        </div>
        <div className="bg-white rounded-xl border border-emerald-100 p-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-emerald-50 flex items-center justify-center">
            <MessageCircle size={18} className="text-emerald-500" />
          </div>
          <div>
            <div className="text-2xl font-bold text-slate-800">
              {conversations.reduce((s, c) => s + c.totalCount - c.migrantCount, 0)}
            </div>
            <div className="text-xs text-slate-500">Ответов службы</div>
          </div>
        </div>
      </div>

      {/* Conversations list */}
      <div className="space-y-2">
        {loading && (
          <div className="text-center py-12 text-slate-400 text-sm">Загрузка...</div>
        )}
        {!loading && conversations.length === 0 && (
          <div className="text-center py-12 text-slate-400 text-sm">
            Нет сообщений. Мигранты ещё не писали в чат.
          </div>
        )}
        {conversations.map((conv) => {
          const unread = isUnread(conv);
          return (
            <Link
              key={conv.migrant.id}
              href={`/admin/migrants/${conv.migrant.id}?tab=chat`}
              onClick={() => markRead(conv.migrant.id)}
              className={`flex items-center gap-4 bg-white rounded-xl border p-4 hover:border-blue-300 hover:bg-blue-50/30 transition-colors group ${
                unread ? "border-blue-300 bg-blue-50/40" : "border-slate-200"
              }`}
            >
              {/* Avatar */}
              <div className="relative flex-shrink-0">
                {conv.migrant.photo ? (
                  <img src={conv.migrant.photo} alt="" className="w-11 h-11 rounded-full object-cover" />
                ) : (
                  <div className="w-11 h-11 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center text-white text-sm font-bold">
                    {getInitials(conv.migrant.firstName, conv.migrant.lastName)}
                  </div>
                )}
                {unread && (
                  <span className="absolute -top-1 -right-1 w-3 h-3 rounded-full bg-red-500 border-2 border-white" />
                )}
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2">
                  <span className={`text-sm ${unread ? "font-bold text-slate-900" : "font-semibold text-slate-800"}`}>
                    {conv.migrant.lastName} {conv.migrant.firstName}
                  </span>
                  <span className="text-xs text-slate-400 flex-shrink-0">{timeAgo(conv.lastAt)}</span>
                </div>
                <div className="flex items-center gap-1.5 mt-0.5">
                  {conv.lastFrom === "migrant" && (
                    <span className="text-xs text-blue-500 font-medium flex-shrink-0">Мигрант:</span>
                  )}
                  {conv.lastFrom === "service" && (
                    <span className="text-xs text-slate-400 font-medium flex-shrink-0">Вы:</span>
                  )}
                  <p className={`text-xs truncate ${unread ? "text-slate-700 font-medium" : "text-slate-500"}`}>
                    {conv.lastMessage}
                  </p>
                </div>
                <div className="text-xs text-slate-300 mt-0.5">{conv.migrant.id}</div>
              </div>

              <ChevronRight size={15} className="text-slate-300 group-hover:text-blue-400 flex-shrink-0 transition-colors" />
            </Link>
          );
        })}
      </div>
    </div>
  );
}
