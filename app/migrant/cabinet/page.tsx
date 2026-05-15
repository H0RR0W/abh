"use client";

import { useState, useEffect } from "react";
import dynamic from "next/dynamic";
import {
  User,
  FileText,
  CreditCard,
  MessageCircle,
  Bell,
  QrCode,
  LogOut,
  ChevronRight,
  CheckCircle,
  Clock,
  AlertTriangle,
  Upload,
  Send,
} from "lucide-react";
import { formatDate, formatCurrency, getDocStatusColor, getDocStatusLabel, getPaymentStatusColor, getPaymentStatusLabel } from "@/lib/utils";

interface ChatMessage {
  id?: string;
  from: string;
  text: string;
  createdAt?: string;
}

interface MigrantDoc {
  type: string;
  name: string;
  status: string;
}

interface MigrantPayment {
  id: string;
  type: string;
  amount: number;
  date: string;
  status: string;
  description: string;
}

interface MigrantData {
  id: string;
  firstName: string;
  lastName: string;
  citizenship: string;
  passportNumber: string;
  phone: string;
  status: string;
  registrationExpiry: string;
  patentExpiry?: string;
  patentNumber?: string;
  employer?: string;
  address: string;
  documents: MigrantDoc[];
  payments: MigrantPayment[];
}

const QRCode = dynamic(() => import("qrcode.react").then((m) => m.QRCodeSVG), {
  ssr: false,
});

const TABS = [
  { id: "home", label: "Главная", icon: User },
  { id: "docs", label: "Документы", icon: FileText },
  { id: "payments", label: "Платежи", icon: CreditCard },
  { id: "chat", label: "Чат", icon: MessageCircle },
];

const DOC_ICONS: Record<string, string> = {
  passport: "🪪",
  migration_card: "📋",
  patent: "📜",
  medical: "🏥",
};

export default function MigrantCabinetPage() {
  const [tab, setTab] = useState("home");
  const [showQR, setShowQR] = useState(false);
  const [chatMsg, setChatMsg] = useState("");
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [paymentLoading, setPaymentLoading] = useState(false);
  const [paidNow, setPaidNow] = useState(false);
  const [migrant, setMigrant] = useState<MigrantData | null>(null);

  useEffect(() => {
    fetch("/api/me")
      .then((r) => {
        if (r.status === 401) { window.location.href = "/migrant/login"; return null; }
        return r.json();
      })
      .then((d) => { if (d) setMigrant(d); });
    fetch("/api/me/chat")
      .then((r) => r.json())
      .then((d) => { if (Array.isArray(d)) setMessages(d); });
  }, []);

  async function sendMessage() {
    if (!chatMsg.trim()) return;
    const res = await fetch("/api/me/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text: chatMsg }),
    });
    const msg = await res.json();
    setMessages((prev) => [...prev, msg]);
    setChatMsg("");
  }

  async function handlePay() {
    setPaymentLoading(true);
    await fetch("/api/me/payments", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ amount: 3000, description: "Патент июнь 2025" }),
    });
    setPaymentLoading(false);
    setPaidNow(true);
    fetch("/api/me").then((r) => r.json()).then((d) => { if (d) setMigrant(d); });
  }

  async function handleLogout() {
    await fetch("/api/auth/logout", { method: "POST" });
    window.location.href = "/migrant/login";
  }

  if (!migrant) {
    return (
      <div className="flex-1 flex items-center justify-center text-slate-400 text-sm">
        Загрузка...
      </div>
    );
  }

  const daysLeft = migrant.registrationExpiry
    ? Math.ceil((new Date(migrant.registrationExpiry).getTime() - Date.now()) / 86400000)
    : 0;

  const initials = `${migrant.firstName?.[0] ?? ""}${migrant.lastName?.[0] ?? ""}`;

  return (
    <div className="flex-1 flex flex-col">
      {/* Status bar */}
      <div className="bg-gradient-to-br from-blue-600 to-blue-800 px-5 pt-6 pb-5 text-white">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center font-bold text-sm">
              {initials}
            </div>
            <div>
              <div className="font-bold text-sm">{migrant?.lastName} {migrant?.firstName}</div>
              <div className="text-blue-200 text-xs">{migrant?.id}</div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button className="relative p-2 rounded-full hover:bg-white/10 transition-colors">
              <Bell size={18} />
              <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-red-400" />
            </button>
            <button onClick={handleLogout} className="p-2 rounded-full hover:bg-white/10 transition-colors">
              <LogOut size={18} />
            </button>
          </div>
        </div>

        <div className="bg-white/10 rounded-2xl p-4">
          <div className="flex items-center gap-2 mb-2">
            <CheckCircle size={14} className="text-emerald-300" />
            <span className="text-xs text-emerald-200 font-medium">
              Статус: {migrant?.status === "active" ? "Активен" : migrant?.status === "expired" ? "Просрочен" : "Заблокирован"}
            </span>
          </div>
          <div className="text-sm text-blue-100">Регистрация действует до</div>
          <div className="text-xl font-bold">{formatDate(migrant?.registrationExpiry)}</div>
          <div className="text-xs text-blue-200 mt-1">
            {daysLeft > 0 ? `Осталось ${daysLeft} дней` : "Истёк!"}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto">
        {/* HOME */}
        {tab === "home" && (
          <div className="p-4 space-y-3">
            {/* Quick actions */}
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => setShowQR(true)}
                className="flex flex-col items-center gap-2 bg-blue-50 rounded-2xl p-4 hover:bg-blue-100 transition-colors"
              >
                <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center">
                  <QrCode size={20} className="text-white" />
                </div>
                <span className="text-xs font-semibold text-blue-800">Мой QR-код</span>
              </button>
              <button
                onClick={() => setTab("payments")}
                className="flex flex-col items-center gap-2 bg-emerald-50 rounded-2xl p-4 hover:bg-emerald-100 transition-colors"
              >
                <div className="w-10 h-10 bg-emerald-600 rounded-xl flex items-center justify-center">
                  <CreditCard size={20} className="text-white" />
                </div>
                <span className="text-xs font-semibold text-emerald-800">Оплатить патент</span>
              </button>
            </div>

            {/* Info cards */}
            <div className="bg-white rounded-2xl border border-slate-100 p-4 space-y-3">
              <h3 className="text-sm font-bold text-slate-700">Мои данные</h3>
              {[
                { label: "Гражданство", value: migrant?.citizenship ?? "—" },
                { label: "Паспорт", value: migrant?.passportNumber ?? "—" },
                { label: "Работодатель", value: migrant?.employer ?? "—" },
                { label: "Адрес", value: migrant?.address ?? "—" },
              ].map(({ label, value }) => (
                <div key={label} className="flex justify-between items-start">
                  <span className="text-xs text-slate-400">{label}</span>
                  <span className="text-xs font-medium text-slate-700 text-right max-w-[60%]">
                    {value}
                  </span>
                </div>
              ))}
            </div>

            {/* Patent status */}
            {migrant?.patentNumber && (
              <div className="bg-amber-50 rounded-2xl border border-amber-100 p-4">
                <div className="flex items-center gap-2 mb-1">
                  <Clock size={14} className="text-amber-600" />
                  <span className="text-sm font-bold text-amber-800">Патент</span>
                </div>
                <div className="text-xs text-amber-600">
                  {migrant.patentNumber} · Истекает {formatDate(migrant.patentExpiry)}
                </div>
              </div>
            )}

            {/* Notifications */}
            <div className="bg-white rounded-2xl border border-slate-100 p-4">
              <h3 className="text-sm font-bold text-slate-700 mb-3">Уведомления</h3>
              <div className="space-y-2">
                {daysLeft < 60 && daysLeft > 0 && (
                  <div className="flex items-start gap-3 p-2 bg-amber-50 rounded-xl">
                    <AlertTriangle size={14} className="text-amber-500 mt-0.5 flex-shrink-0" />
                    <div>
                      <div className="text-xs font-medium text-amber-800">Регистрация истекает через {daysLeft} дней</div>
                      <div className="text-xs text-amber-600">Необходимо продление</div>
                    </div>
                  </div>
                )}
                <div className="flex items-start gap-3 p-2 bg-blue-50 rounded-xl">
                  <CheckCircle size={14} className="text-blue-500 mt-0.5 flex-shrink-0" />
                  <div>
                    <div className="text-xs font-medium text-blue-800">Добро пожаловать в личный кабинет</div>
                    <div className="text-xs text-blue-600">Все ваши данные актуальны</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* DOCUMENTS */}
        {tab === "docs" && (
          <div className="p-4 space-y-3">
            <h2 className="text-sm font-bold text-slate-700">Мои документы</h2>
            {(migrant?.documents ?? []).map((doc: MigrantDoc, i: number) => (
              <div
                key={i}
                className="bg-white rounded-2xl border border-slate-100 p-4 flex items-center gap-3"
              >
                <span className="text-2xl">{DOC_ICONS[doc.type] ?? "📄"}</span>
                <div className="flex-1">
                  <div className="text-sm font-semibold text-slate-800">{doc.name}</div>
                  <span
                    className={`text-xs px-2 py-0.5 rounded-full ${getDocStatusColor(doc.status)}`}
                  >
                    {getDocStatusLabel(doc.status)}
                  </span>
                </div>
                <ChevronRight size={16} className="text-slate-300" />
              </div>
            ))}
            <button className="w-full p-4 border-2 border-dashed border-slate-200 rounded-2xl text-sm text-slate-400 hover:border-blue-400 hover:text-blue-600 transition-colors flex items-center justify-center gap-2">
              <Upload size={16} />
              Загрузить документ
            </button>
          </div>
        )}

        {/* PAYMENTS */}
        {tab === "payments" && (
          <div className="p-4 space-y-3">
            <h2 className="text-sm font-bold text-slate-700">Платежи</h2>

            {/* Pay now card */}
            <div className="bg-gradient-to-br from-blue-600 to-blue-700 rounded-2xl p-4 text-white">
              <div className="text-xs text-blue-200 mb-1">К оплате</div>
              <div className="text-2xl font-bold mb-3">3 000 ₽</div>
              <div className="text-xs text-blue-200 mb-4">Патент июнь 2025</div>
              {paidNow ? (
                <div className="bg-white/20 rounded-xl py-2.5 text-center text-sm font-semibold">
                  Оплачено!
                </div>
              ) : (
                <button
                  onClick={handlePay}
                  disabled={paymentLoading}
                  className="w-full bg-white text-blue-700 rounded-xl py-2.5 text-sm font-semibold hover:bg-blue-50 transition-colors disabled:opacity-60"
                >
                  {paymentLoading ? "Обработка..." : "Оплатить →"}
                </button>
              )}
            </div>

            {/* History */}
            <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider pt-1">
              История платежей
            </h3>
            {(migrant?.payments ?? []).map((p: MigrantPayment) => (
              <div
                key={p.id}
                className="bg-white rounded-2xl border border-slate-100 p-4 flex items-center justify-between"
              >
                <div>
                  <div className="text-sm font-medium text-slate-800">{p.description}</div>
                  <div className="text-xs text-slate-400">{formatDate(p.date)}</div>
                </div>
                <div className="text-right">
                  <div className="text-sm font-bold text-slate-800">{formatCurrency(p.amount)}</div>
                  <span
                    className={`text-xs px-2 py-0.5 rounded-full ${getPaymentStatusColor(p.status)}`}
                  >
                    {getPaymentStatusLabel(p.status)}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* CHAT */}
        {tab === "chat" && (
          <div className="flex flex-col h-full">
            <div className="flex-1 p-4 space-y-3 overflow-y-auto">
              <div className="text-center text-xs text-slate-400 py-2">
                Чат с миграционной службой
              </div>
              {messages.map((msg, i) => (
                <div
                  key={msg.id ?? i}
                  className={`flex ${msg.from === "migrant" ? "justify-end" : "justify-start"}`}
                >
                  <div
                    className={`max-w-[75%] px-3 py-2 rounded-2xl text-sm ${
                      msg.from === "migrant"
                        ? "bg-blue-600 text-white rounded-br-sm"
                        : "bg-slate-100 text-slate-800 rounded-bl-sm"
                    }`}
                  >
                    {msg.text}
                    <div
                      className={`text-xs mt-1 ${msg.from === "migrant" ? "text-blue-200" : "text-slate-400"}`}
                    >
                      {msg.createdAt
                        ? new Date(msg.createdAt).toLocaleTimeString("ru-RU", { hour: "2-digit", minute: "2-digit" })
                        : ""}
                    </div>
                  </div>
                </div>
              ))}
            </div>
            <div className="p-3 border-t border-slate-100 flex gap-2">
              <input
                type="text"
                value={chatMsg}
                onChange={(e) => setChatMsg(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && sendMessage()}
                placeholder="Сообщение..."
                className="flex-1 px-4 py-2.5 bg-slate-100 rounded-xl text-sm focus:outline-none focus:bg-white focus:ring-2 focus:ring-blue-500"
              />
              <button
                onClick={sendMessage}
                className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center text-white hover:bg-blue-700 transition-colors"
              >
                <Send size={16} />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Bottom nav */}
      <div className="border-t border-slate-100 px-2 py-2 flex">
        {TABS.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            onClick={() => setTab(id)}
            className={`flex-1 flex flex-col items-center gap-1 py-1.5 rounded-xl transition-colors ${
              tab === id ? "text-blue-600" : "text-slate-400 hover:text-slate-600"
            }`}
          >
            <Icon size={19} />
            <span className="text-[10px] font-medium">{label}</span>
          </button>
        ))}
      </div>

      {/* QR Modal */}
      {showQR && (
        <div
          className="absolute inset-0 bg-black/60 flex items-center justify-center z-50 p-6"
          onClick={() => setShowQR(false)}
        >
          <div
            className="bg-white rounded-3xl p-6 w-full max-w-xs"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-center font-bold text-slate-800 mb-1">QR-код мигранта</h3>
            <p className="text-center text-xs text-slate-400 mb-4">
              Покажите код инспектору для быстрой проверки
            </p>
            <div className="flex justify-center mb-4">
              <QRCode
                value={`https://migrant.abkhazia.gov/check/${migrant?.id}`}
                size={200}
                level="H"
                includeMargin
              />
            </div>
            <div className="text-center text-sm font-bold text-slate-700 mb-1">
              {migrant?.id}
            </div>
            <div className="text-center text-xs text-slate-400">
              {migrant?.lastName} {migrant?.firstName} · {migrant?.citizenship}
            </div>
            <button
              onClick={() => setShowQR(false)}
              className="mt-4 w-full py-2.5 bg-slate-100 rounded-xl text-sm font-medium text-slate-600 hover:bg-slate-200 transition-colors"
            >
              Закрыть
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
