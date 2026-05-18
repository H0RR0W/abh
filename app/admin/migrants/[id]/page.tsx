"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { Migrant } from "@/lib/types";
import {
  getStatusLabel,
  getStatusColor,
  getDocStatusLabel,
  getDocStatusColor,
  getPaymentStatusLabel,
  getPaymentStatusColor,
  getInitials,
  getCitizenshipFlag,
  formatDate,
  formatCurrency,
} from "@/lib/utils";
import {
  ArrowLeft,
  Phone,
  MapPin,
  Calendar,
  FileText,
  CreditCard,
  AlertTriangle,
  CheckCircle,
  Send,
  Lock,
  Unlock,
  User,
  Building2,
  X,
  ExternalLink,
  ThumbsUp,
  ThumbsDown,
  MessageCircle,
  RefreshCw,
  ShieldAlert,
  Banknote,
  History,
  Trash2,
  Globe,
} from "lucide-react";
import Link from "next/link";

interface Violation {
  id: string;
  migrantId: string;
  type: string;
  description: string;
  severity: string;
  date: string;
  fine: number;
  fineStatus: string;
}

const DOC_ICONS: Record<string, string> = {
  passport: "🪪",
  migration_card: "📋",
  patent: "📜",
  medical: "🏥",
};


function getRegistrationHistory(registrationDate: string, registrationExpiry: string) {
  const start = new Date(registrationDate);
  const history = [];
  // Generate 1-3 prior registrations before current
  for (let i = 2; i >= 0; i--) {
    const from = new Date(start);
    from.setFullYear(from.getFullYear() - i - 1);
    const to = new Date(from);
    to.setFullYear(to.getFullYear() + 1);
    if (to < start) {
      history.push({
        from: from.toISOString().split("T")[0],
        to: to.toISOString().split("T")[0],
        status: "closed" as const,
        type: i % 2 === 0 ? "Первичная регистрация" : "Продление",
      });
    }
  }
  history.push({
    from: registrationDate,
    to: registrationExpiry,
    status: "active" as const,
    type: history.length === 0 ? "Первичная регистрация" : "Продление",
  });
  return history;
}

export default function MigrantProfilePage() {
  const params = useParams();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState("info");
  const [migrant, setMigrant] = useState<Migrant | null>(null);
  const [loading, setLoading] = useState(true);
  const [showInspection, setShowInspection] = useState(false);
  const [inspectionSent, setInspectionSent] = useState(false);
  const [showViolations, setShowViolations] = useState(false);
  const [docLoading, setDocLoading] = useState<string | null>(null);
  const [chatMessages, setChatMessages] = useState<{ id?: string; from: string; text: string; createdAt?: string }[]>([]);
  const [chatInput, setChatInput] = useState("");
  const [chatLoading, setChatLoading] = useState(false);
  const [unreadChatCount, setUnreadChatCount] = useState(0);
  const [inspectionForm, setInspectionForm] = useState({
    date: "",
    type: "office",
    inspector: "Амра Пилия",
    note: "",
  });
  const [violations, setViolations] = useState<Violation[]>([]);
  const [showAddViolation, setShowAddViolation] = useState(false);
  const [violationForm, setViolationForm] = useState({
    type: "",
    description: "",
    severity: "medium",
    date: new Date().toISOString().split("T")[0],
    fine: 0,
  });
  const [violationSubmitting, setViolationSubmitting] = useState(false);

  // Pick up ?tab= from URL on client mount only (no useSearchParams = no SSR issues)
  useEffect(() => {
    const tab = new URLSearchParams(window.location.search).get("tab");
    if (tab) setActiveTab(tab);
  }, []);

  useEffect(() => {
    fetch(`/api/migrants/${params.id}`)
      .then((r) => r.json())
      .then((d) => {
        if (d && d.id) setMigrant(d);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [params.id]);

  useEffect(() => {
    if (!params.id) return;
    function fetchChat() {
      fetch(`/api/chat/${params.id}`)
        .then((r) => r.json())
        .then((d) => { if (Array.isArray(d)) setChatMessages(d); })
        .catch(() => {});
    }
    fetchChat();
    const interval = setInterval(fetchChat, 3000);
    return () => clearInterval(interval);
  }, [params.id]);

  useEffect(() => {
    if (!params.id) return;
    fetch(`/api/migrants/${params.id}/violations`)
      .then(r => r.json())
      .then(d => { if (Array.isArray(d)) setViolations(d); })
      .catch(() => {});
  }, [params.id]);

  // Recalculate unread badge every 2s from localStorage
  useEffect(() => {
    function recalc() {
      if (activeTab === "chat") { setUnreadChatCount(0); return; }
      const readAt = JSON.parse(localStorage.getItem("staffReadAt") ?? "{}");
      const lastRead = readAt[params.id as string];
      const count = chatMessages.filter(
        (m) => m.from === "migrant" && (!lastRead || new Date(m.createdAt ?? 0) > new Date(lastRead))
      ).length;
      setUnreadChatCount(count);
    }
    recalc();
    const interval = setInterval(recalc, 2000);
    return () => clearInterval(interval);
  }, [chatMessages, activeTab, params.id]);

  // Mark chat as read when the chat tab is opened
  useEffect(() => {
    if (activeTab !== "chat" || !params.id) return;
    setUnreadChatCount(0);
    const readAt = JSON.parse(localStorage.getItem("staffReadAt") ?? "{}");
    readAt[params.id as string] = new Date().toISOString();
    localStorage.setItem("staffReadAt", JSON.stringify(readAt));
  }, [activeTab, params.id]);

  async function sendAdminMessage() {
    if (!chatInput.trim()) return;
    setChatLoading(true);
    const text = chatInput.trim();
    setChatInput("");
    try {
      const res = await fetch(`/api/chat/${params.id}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text }),
      });
      const msg = await res.json();
      setChatMessages((prev) => [...prev, msg]);
    } finally {
      setChatLoading(false);
    }
  }

  async function updateStatus(newStatus: string) {
    await fetch(`/api/migrants/${params.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: newStatus }),
    });
    setMigrant((prev) => prev ? { ...prev, status: newStatus } : prev);
  }

  async function updateDocStatus(docId: string, status: "verified" | "rejected") {
    setDocLoading(docId);
    await fetch(`/api/documents/${docId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    setMigrant((prev) =>
      prev
        ? {
            ...prev,
            documents: prev.documents.map((d) =>
              d.id === docId ? { ...d, status } : d
            ),
          }
        : prev
    );
    setDocLoading(null);
  }

  async function submitViolation() {
    if (!violationForm.type || !violationForm.date) return;
    setViolationSubmitting(true);
    try {
      const res = await fetch(`/api/migrants/${params.id}/violations`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(violationForm),
      });
      const text = await res.text();
      if (!res.ok) { console.error("Violation error:", text); return; }
      const v = text ? JSON.parse(text) : null;
      if (!v) return;
      setViolations(prev => [v, ...prev]);
      setMigrant(prev => prev ? { ...prev, violations: prev.violations + 1 } : prev);
      setShowAddViolation(false);
      setViolationForm({ type: "", description: "", severity: "medium", date: new Date().toISOString().split("T")[0], fine: 0 });
    } finally {
      setViolationSubmitting(false);
    }
  }

  async function updateFineStatus(vid: string, fineStatus: string) {
    await fetch(`/api/migrants/${params.id}/violations/${vid}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ fineStatus }),
    });
    setViolations(prev => prev.map(v => v.id === vid ? { ...v, fineStatus } : v));
  }

  async function deleteViolation(vid: string) {
    await fetch(`/api/migrants/${params.id}/violations/${vid}`, { method: "DELETE" });
    setViolations(prev => prev.filter(v => v.id !== vid));
    setMigrant(prev => prev ? { ...prev, violations: Math.max(0, prev.violations - 1) } : prev);
  }

  if (loading) {
    return (
      <div className="p-6 text-center text-slate-400 mt-20">
        Загрузка...
      </div>
    );
  }

  if (!migrant) {
    return (
      <div className="p-6 text-center text-slate-400 mt-20">
        Мигрант не найден
      </div>
    );
  }

  const currentStatus = migrant.status;

  const tabs = [
    { id: "info", label: "Данные", icon: User },
    { id: "documents", label: "Документы", icon: FileText },
    { id: "payments", label: "Платежи", icon: CreditCard },
    { id: "violations", label: "Нарушения", icon: ShieldAlert, badge: violations.filter(v => v.fineStatus !== "paid").length || undefined },
    { id: "location", label: "Геолокация", icon: MapPin },
    { id: "chat", label: "Чат", icon: MessageCircle, badge: unreadChatCount || undefined },
  ];

  const totalPaid = migrant.payments
    .filter((p) => p.status === "paid")
    .reduce((sum, p) => sum + p.amount, 0);

  const totalDebt =
    migrant.payments
      .filter((p) => p.status === "unpaid" || p.status === "overdue")
      .reduce((sum, p) => sum + p.amount, 0) +
    violations
      .filter((v) => v.fineStatus === "unpaid" && v.fine > 0)
      .reduce((sum, v) => sum + v.fine, 0);

  return (
    <div className="p-6 space-y-5 bg-[#F0F2F5] min-h-screen">
      {/* Header */}
      <div className="flex items-center gap-4">
        <button
          onClick={() => router.back()}
          className="p-2 rounded-md hover:bg-slate-200 transition-colors"
        >
          <ArrowLeft size={18} className="text-slate-600" />
        </button>
        <div>
          <h1 className="text-xl font-bold text-slate-900 uppercase tracking-wide">
            {migrant.lastName} {migrant.firstName}{" "}
            {migrant.middleName && migrant.middleName}
          </h1>
          <p className="text-slate-400 text-xs uppercase tracking-wider">{migrant.id}</p>
        </div>
      </div>

      {/* Profile card */}
      <div className="bg-white rounded-md border border-slate-200 p-6 shadow-sm">
        <div className="flex items-start gap-6">
          <div className="relative flex-shrink-0">
            {migrant.photo ? (
              <img src={migrant.photo} alt="Фото" className="w-16 h-16 rounded-md object-cover" />
            ) : (
              <div className="w-16 h-16 rounded-md bg-[#1A3A5C] flex items-center justify-center text-white text-xl font-bold">
                {getInitials(migrant.firstName, migrant.lastName)}
              </div>
            )}
            {/* Верификационный бейдж */}
            <div className={`absolute -bottom-1 -right-1 w-5 h-5 rounded-full border-2 border-white flex items-center justify-center text-[10px] ${
              migrant.identityStatus === "verified" ? "bg-emerald-500"
              : migrant.identityStatus === "pending" ? "bg-amber-400"
              : "bg-slate-300"
            }`} title={migrant.identityStatus === "verified" ? "Верифицирован" : migrant.identityStatus === "pending" ? "На проверке" : "Не верифицирован"}>
              {migrant.identityStatus === "verified" ? "✓" : migrant.identityStatus === "pending" ? "…" : "?"}
            </div>
          </div>
          <div className="flex-1 grid grid-cols-3 gap-4">
            <InfoItem
              icon={<Phone size={14} className="text-slate-400" />}
              label="Телефон"
              value={migrant.phone}
            />
            <InfoItem
              icon={<Globe size={14} className="text-slate-400" />}
              label="Гражданство"
              value={migrant.citizenship}
            />
            <InfoItem
              icon={<Calendar size={14} className="text-slate-400" />}
              label="Дата рождения"
              value={formatDate(migrant.birthDate)}
            />
            <InfoItem
              icon={<FileText size={14} className="text-slate-400" />}
              label="Паспорт"
              value={[migrant.passportSeries, migrant.passportNumber].filter(Boolean).join(" ") || migrant.passportNumber}
            />
            <InfoItem
              icon={<Building2 size={14} className="text-slate-400" />}
              label="Работодатель"
              value={migrant.employer ?? "—"}
            />
            <InfoItem
              icon={<MapPin size={14} className="text-slate-400" />}
              label="Адрес"
              value={migrant.address}
            />
          </div>
          <div className="flex flex-col items-end gap-3">
            <span
              className={`px-3 py-1 rounded text-xs font-bold uppercase tracking-wide ${getStatusColor(currentStatus)}`}
            >
              {getStatusLabel(currentStatus)}
            </span>
            {violations.filter(v => v.fineStatus !== "paid").length > 0 && (
              <button
                onClick={() => setActiveTab("violations")}
                className="flex items-center gap-1 text-amber-600 text-xs hover:text-amber-700 hover:underline transition-colors"
              >
                <AlertTriangle size={12} />
                {violations.filter(v => v.fineStatus !== "paid").length} нарушений
              </button>
            )}
          </div>
        </div>

        {/* Registration info */}
        <div className="mt-5 pt-5 border-t border-slate-100 grid grid-cols-4 gap-3">
          <div className="bg-slate-50 rounded-md p-3 border border-slate-200">
            <div className="text-[10px] text-slate-400 uppercase tracking-wider mb-1">Регистрация</div>
            <div className="text-sm font-medium text-slate-800">
              {formatDate(migrant.registrationDate)}
            </div>
          </div>
          <div className="bg-slate-50 rounded-md p-3 border border-slate-200">
            <div className="text-[10px] text-slate-400 uppercase tracking-wider mb-1">Действует до</div>
            <div className={`text-sm font-medium ${migrant.status === "expired" ? "text-red-600" : "text-slate-800"}`}>
              {formatDate(migrant.registrationExpiry)}
            </div>
          </div>
          <div className="bg-slate-50 rounded-md p-3 border border-slate-200">
            <div className="text-[10px] text-slate-400 uppercase tracking-wider mb-1">Занятость</div>
            <div className={`text-sm font-medium ${migrant.employed ? "text-green-700" : "text-slate-600"}`}>
              {migrant.employed ? "Трудоустроен" : "Не работает"}
            </div>
          </div>
          <div className="bg-slate-50 rounded-md p-3 border border-slate-200">
            <div className="text-[10px] text-slate-400 uppercase tracking-wider mb-1">Последняя активность</div>
            <div className="text-sm font-medium text-slate-800">
              {new Date(migrant.lastSeen).toLocaleString("ru-RU", {
                day: "2-digit",
                month: "2-digit",
                hour: "2-digit",
                minute: "2-digit",
              })}
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="mt-4 pt-4 border-t border-slate-100 flex gap-2 flex-wrap">
          <button
            onClick={() => setActiveTab("chat")}
            className="flex items-center gap-2 px-4 py-2 border border-slate-300 text-slate-700 rounded-md text-sm hover:bg-slate-50 transition-colors"
          >
            <MessageCircle size={14} />
            Написать в чат
          </button>
          {currentStatus !== "blocked" ? (
            <button
              onClick={() => updateStatus("blocked")}
              className="flex items-center gap-2 px-4 py-2 border border-red-300 text-red-700 rounded-md text-sm hover:bg-red-50 transition-colors"
            >
              <Lock size={14} />
              Заблокировать
            </button>
          ) : (
            <button
              onClick={() => updateStatus("active")}
              className="flex items-center gap-2 px-4 py-2 border border-green-300 text-green-700 rounded-md text-sm hover:bg-green-50 transition-colors"
            >
              <Unlock size={14} />
              Разблокировать
            </button>
          )}
          {currentStatus === "expired" && (
            <button
              onClick={() => updateStatus("active")}
              className="flex items-center gap-2 px-4 py-2 border border-green-300 text-green-700 rounded-md text-sm hover:bg-green-50 transition-colors"
            >
              <CheckCircle size={14} />
              Подтвердить продление
            </button>
          )}
          <button
            onClick={() => setShowInspection(true)}
            className="flex items-center gap-2 px-4 py-2 border border-slate-300 text-slate-600 rounded-md text-sm hover:bg-slate-50 transition-colors"
          >
            <AlertTriangle size={14} />
            Назначить проверку
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white rounded-md border border-slate-200 overflow-hidden shadow-sm">
        <div className="flex border-b border-slate-200 bg-slate-50">
          {tabs.map(({ id, label, icon: Icon, badge }) => (
            <button
              key={id}
              onClick={() => setActiveTab(id)}
              className={`relative flex items-center gap-2 px-5 py-3 text-xs font-semibold uppercase tracking-wide transition-colors border-b-2 -mb-px ${
                activeTab === id
                  ? "border-[#1E3A5F] text-[#1E3A5F] bg-white"
                  : "border-transparent text-slate-500 hover:text-slate-700 hover:bg-white"
              }`}
            >
              <Icon size={15} />
              {label}
              {badge && badge > 0 && (
                <span className="absolute top-2 right-2 w-4 h-4 rounded-full bg-red-500 text-white text-[10px] font-bold flex items-center justify-center">
                  {badge > 9 ? "9+" : badge}
                </span>
              )}
            </button>
          ))}
        </div>

        <div className="p-5">
          {/* Info Tab */}
          {activeTab === "info" && (
            <div className="space-y-4">
              <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                Персональные данные
              </h3>
              <div className="grid grid-cols-2 gap-4">
                <DetailRow label="ID" value={migrant.id} />
                <DetailRow
                  label="ФИО"
                  value={`${migrant.lastName} ${migrant.firstName} ${migrant.middleName}`}
                />
                <DetailRow
                  label="Серия / Номер"
                  value={[migrant.passportSeries, migrant.passportNumber].filter(Boolean).join(" ") || migrant.passportNumber}
                />
                {migrant.passportIssuedBy && (
                  <DetailRow label="Кем выдан" value={migrant.passportIssuedBy} />
                )}
                {migrant.passportIssueDate && (
                  <DetailRow label="Дата выдачи" value={formatDate(migrant.passportIssueDate)} />
                )}
                {migrant.passportExpiry && (
                  <DetailRow label="Действителен до" value={formatDate(migrant.passportExpiry)} />
                )}
                <DetailRow label="Телефон" value={migrant.phone} />
                <DetailRow
                  label="Гражданство"
                  value={migrant.citizenship}
                />
                <DetailRow
                  label="Дата рождения"
                  value={formatDate(migrant.birthDate)}
                />
                <DetailRow label="Адрес" value={migrant.address} />
                <DetailRow
                  label="Работодатель"
                  value={migrant.employer ?? "—"}
                />
                <DetailRow
                  label="Статус"
                  value={getStatusLabel(currentStatus)}
                />
                <DetailRow
                  label="Занятость"
                  value={migrant.employed ? "Трудоустроен" : "Не работает"}
                />
                <DetailRow
                  label="Нарушения"
                  value={migrant.violations.toString()}
                />
              </div>
              {migrant.employed && (
                <div className="mt-4 p-3 bg-slate-50 border border-slate-200 rounded-md flex items-start gap-2">
                  <CheckCircle size={15} className="text-slate-500 flex-shrink-0 mt-0.5" />
                  <div className="text-xs text-slate-600">
                    <span className="font-semibold">Разрешение на работу.</span> Мигрант трудоустроен официально. Для начала трудовой деятельности уплачивается сбор 5 000 ₽.
                  </div>
                </div>
              )}

              {/* Верификация личности */}
              <div className="mt-4 border border-slate-200 rounded-md overflow-hidden">
                <div className="flex items-center justify-between px-4 py-3 border-b border-slate-200 bg-slate-50">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-slate-600 uppercase tracking-wider">Верификация личности</span>
                    <span className={`px-2 py-0.5 rounded text-xs font-semibold uppercase tracking-wide ${
                      migrant.identityStatus === "verified" ? "bg-emerald-100 text-emerald-700"
                      : migrant.identityStatus === "pending" ? "bg-amber-100 text-amber-700"
                      : migrant.identityStatus === "rejected" ? "bg-red-100 text-red-700"
                      : "bg-slate-100 text-slate-500"
                    }`}>
                      {migrant.identityStatus === "verified" ? "Подтверждена"
                        : migrant.identityStatus === "pending" ? "На проверке"
                        : migrant.identityStatus === "rejected" ? "Отклонена"
                        : "Не пройдена"}
                    </span>
                  </div>
                  {migrant.identityStatus === "pending" && (
                    <div className="flex gap-2">
                      <button
                        onClick={async () => {
                          await fetch(`/api/migrants/${migrant.id}/verify`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ status: "verified" }) });
                          setMigrant((prev) => prev ? { ...prev, identityStatus: "verified" } : prev);
                        }}
                        className="flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-lg hover:bg-emerald-100 transition-colors"
                      >
                        <ThumbsUp size={12} /> Подтвердить
                      </button>
                      <button
                        onClick={async () => {
                          await fetch(`/api/migrants/${migrant.id}/verify`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ status: "rejected" }) });
                          setMigrant((prev) => prev ? { ...prev, identityStatus: "rejected" } : prev);
                        }}
                        className="flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-red-700 bg-red-50 border border-red-200 rounded-lg hover:bg-red-100 transition-colors"
                      >
                        <ThumbsDown size={12} /> Отклонить
                      </button>
                    </div>
                  )}
                </div>
                <div className="p-4 flex gap-4">
                  {/* Фото профиля */}
                  <div className="flex flex-col items-center gap-1.5">
                    <div className="text-xs text-slate-400 mb-1">Фото профиля</div>
                    {migrant.photo ? (
                      <img src={migrant.photo} alt="Фото" className="w-20 h-20 rounded-md object-cover border border-slate-200" />
                    ) : (
                      <div className="w-20 h-20 rounded-md bg-slate-100 flex items-center justify-center text-slate-300 text-xs text-center">нет фото</div>
                    )}
                  </div>
                  {/* Selfie */}
                  <div className="flex flex-col items-center gap-1.5">
                    <div className="text-xs text-slate-400 mb-1">Selfie</div>
                    {migrant.selfiePhoto ? (
                      <a href={migrant.selfiePhoto} target="_blank" rel="noopener noreferrer">
                        <img src={migrant.selfiePhoto} alt="Selfie" className="w-20 h-20 rounded-md object-cover border border-slate-200 hover:opacity-80 transition-opacity" />
                      </a>
                    ) : (
                      <div className="w-20 h-20 rounded-md bg-slate-100 flex items-center justify-center text-slate-300 text-xs text-center">нет selfie</div>
                    )}
                  </div>
                  {/* Паспорт */}
                  <div className="flex flex-col gap-1.5 flex-1">
                    <div className="text-xs text-slate-400 mb-1">Данные документа</div>
                    <div className="text-xs text-slate-700"><span className="text-slate-400">Паспорт:</span> {[migrant.passportSeries, migrant.passportNumber].filter(Boolean).join(" ")}</div>
                    {migrant.passportIssuedBy && <div className="text-xs text-slate-700"><span className="text-slate-400">Выдан:</span> {migrant.passportIssuedBy}</div>}
                    {migrant.passportExpiry && <div className="text-xs text-slate-700"><span className="text-slate-400">До:</span> {formatDate(migrant.passportExpiry)}</div>}
                    {migrant.identityStatus !== "pending" && (
                      <button
                        onClick={async () => {
                          await fetch(`/api/migrants/${migrant.id}/verify`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ status: migrant.identityStatus === "verified" ? "unverified" : "verified" }) });
                          setMigrant((prev) => prev ? { ...prev, identityStatus: prev.identityStatus === "verified" ? "unverified" : "verified" } : prev);
                        }}
                        className="mt-1 text-xs text-blue-600 hover:text-blue-800 underline"
                      >
                        {migrant.identityStatus === "verified" ? "Снять верификацию" : "Подтвердить вручную"}
                      </button>
                    )}
                  </div>
                </div>
              </div>

              {/* История регистрации */}
              <div className="mt-4 border border-slate-200 rounded-md overflow-hidden">
                <div className="flex items-center gap-2 px-4 py-3 border-b border-slate-200 bg-slate-50">
                  <History size={15} className="text-slate-400" />
                  <span className="text-xs font-bold text-slate-600 uppercase tracking-wider">История регистрации</span>
                </div>
                <div className="divide-y divide-slate-100">
                  {getRegistrationHistory(migrant.registrationDate, migrant.registrationExpiry).map((reg, i, arr) => (
                    <div key={i} className="flex items-center justify-between px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className={`w-2 h-2 rounded-full flex-shrink-0 ${reg.status === "active" ? "bg-emerald-500" : "bg-slate-300"}`} />
                        <div>
                          <div className="text-sm font-medium text-slate-800">{reg.type}</div>
                          <div className="text-xs text-slate-400">{formatDate(reg.from)} — {formatDate(reg.to)}</div>
                        </div>
                      </div>
                      <span className={`text-xs px-2 py-0.5 rounded font-semibold uppercase tracking-wide ${
                        reg.status === "active" ? "bg-emerald-100 text-emerald-700" : "bg-slate-100 text-slate-500"
                      }`}>
                        {reg.status === "active" ? "Действует" : "Закрыта"}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Documents Tab */}
          {activeTab === "documents" && (
            <div className="space-y-3">
              {migrant.documents.length === 0 && (
                <div className="text-center py-8 text-slate-400 text-sm">Документов нет</div>
              )}
              {migrant.documents.map((doc) => (
                <div
                  key={doc.id}
                  className={`border rounded-md p-4 transition-colors ${
                    doc.status === "pending"
                      ? "border-amber-200 bg-amber-50/40"
                      : "border-slate-200"
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      <span className="text-2xl flex-shrink-0">{DOC_ICONS[doc.type] ?? "📄"}</span>
                      <div className="min-w-0">
                        <div className="text-sm font-medium text-slate-800 truncate">{doc.name}</div>
                        <div className="text-xs text-slate-400">Загружен {formatDate(doc.uploadedAt)}</div>
                        <span className={`mt-1 inline-block px-2 py-0.5 rounded text-xs font-semibold uppercase tracking-wide ${getDocStatusColor(doc.status)}`}>
                          {getDocStatusLabel(doc.status)}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      {doc.filePath && (
                        <a
                          href={doc.filePath}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium text-slate-600 border border-slate-200 rounded-lg hover:bg-white hover:text-blue-600 hover:border-blue-300 transition-colors"
                          title="Открыть файл"
                        >
                          <ExternalLink size={12} />
                          Открыть
                        </a>
                      )}
                      {doc.status === "pending" && (
                        <>
                          <button
                            onClick={() => updateDocStatus(doc.id, "verified")}
                            disabled={docLoading === doc.id}
                            className="flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-lg hover:bg-emerald-100 disabled:opacity-50 transition-colors"
                            title="Подтвердить"
                          >
                            <ThumbsUp size={12} />
                            Подтвердить
                          </button>
                          <button
                            onClick={() => updateDocStatus(doc.id, "rejected")}
                            disabled={docLoading === doc.id}
                            className="flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium text-red-700 bg-red-50 border border-red-200 rounded-lg hover:bg-red-100 disabled:opacity-50 transition-colors"
                            title="Отклонить"
                          >
                            <ThumbsDown size={12} />
                            Отклонить
                          </button>
                        </>
                      )}
                      {doc.status === "verified" && (
                        <button
                          onClick={() => updateDocStatus(doc.id, "rejected")}
                          disabled={docLoading === doc.id}
                          className="flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium text-slate-500 border border-slate-200 rounded-lg hover:bg-red-50 hover:text-red-600 hover:border-red-200 disabled:opacity-50 transition-colors"
                        >
                          <X size={12} />
                          Отклонить
                        </button>
                      )}
                      {doc.status === "rejected" && (
                        <button
                          onClick={() => updateDocStatus(doc.id, "verified")}
                          disabled={docLoading === doc.id}
                          className="flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium text-slate-500 border border-slate-200 rounded-lg hover:bg-emerald-50 hover:text-emerald-600 hover:border-emerald-200 disabled:opacity-50 transition-colors"
                        >
                          <ThumbsUp size={12} />
                          Подтвердить
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Payments Tab */}
          {activeTab === "payments" && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3 mb-4">
                <div className="bg-white border-l-4 border-l-green-700 border border-slate-200 rounded-md p-4">
                  <div className="text-[10px] text-slate-500 uppercase tracking-wider mb-1">Оплачено</div>
                  <div className="text-xl font-bold text-slate-800">
                    {formatCurrency(totalPaid)}
                  </div>
                </div>
                <div className="bg-white border-l-4 border-l-red-700 border border-slate-200 rounded-md p-4">
                  <div className="text-[10px] text-slate-500 uppercase tracking-wider mb-1">
                    Задолженность
                  </div>
                  <div className="text-xl font-bold text-red-700">
                    {formatCurrency(totalDebt)}
                  </div>
                </div>
              </div>
              <div className="space-y-2">
                {migrant.payments
                  .slice()
                  .reverse()
                  .map((p) => (
                    <div
                      key={p.id}
                      className="flex items-center justify-between p-3 border border-slate-200 rounded-md"
                    >
                      <div>
                        <div className="text-sm font-medium text-slate-800">
                          {p.description}
                        </div>
                        <div className="text-xs text-slate-400">
                          {formatDate(p.date)} · {p.id}
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="text-sm font-medium text-slate-800">
                          {formatCurrency(p.amount)}
                        </span>
                        <span
                          className={`px-2 py-0.5 rounded text-xs font-semibold uppercase tracking-wide ${getPaymentStatusColor(p.status)}`}
                        >
                          {getPaymentStatusLabel(p.status)}
                        </span>
                      </div>
                    </div>
                  ))}
              </div>
            </div>
          )}

          {/* Violations Tab */}
          {activeTab === "violations" && (() => {
            const totalFines = violations.reduce((s, v) => s + v.fine, 0);
            const paidFines = violations.filter(v => v.fineStatus === "paid").reduce((s, v) => s + v.fine, 0);
            const unpaidFines = violations.filter(v => v.fineStatus !== "paid").reduce((s, v) => s + v.fine, 0);
            return (
              <div className="space-y-4">
                {/* Header with add button */}
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider">Нарушения и штрафы</h3>
                  <button
                    onClick={() => setShowAddViolation(true)}
                    className="flex items-center gap-1.5 px-3 py-1.5 border border-red-300 text-red-700 rounded-md text-sm hover:bg-red-50 transition-colors"
                  >
                    <ShieldAlert size={14} />
                    + Добавить нарушение
                  </button>
                </div>

                {violations.length === 0 ? (
                  <div className="text-center py-12 text-slate-400 text-sm">
                    <CheckCircle size={32} className="mx-auto mb-3 text-emerald-300" />
                    Нарушений не зафиксировано
                  </div>
                ) : (
                  <>
                    {/* Fines summary */}
                    <div className="grid grid-cols-3 gap-3">
                      <div className="bg-white rounded-md p-3 border-l-4 border-l-slate-600 border border-slate-200">
                        <div className="text-[10px] text-slate-500 uppercase tracking-wider mb-1">Всего штрафов</div>
                        <div className="text-lg font-bold text-slate-800">{formatCurrency(totalFines)}</div>
                      </div>
                      <div className="bg-white rounded-md p-3 border-l-4 border-l-green-700 border border-slate-200">
                        <div className="text-[10px] text-slate-500 uppercase tracking-wider mb-1">Оплачено</div>
                        <div className="text-lg font-bold text-green-700">{formatCurrency(paidFines)}</div>
                      </div>
                      <div className="bg-white rounded-md p-3 border-l-4 border-l-red-700 border border-slate-200">
                        <div className="text-[10px] text-slate-500 uppercase tracking-wider mb-1">Задолженность</div>
                        <div className="text-lg font-bold text-red-700">{formatCurrency(unpaidFines)}</div>
                      </div>
                    </div>

                    {/* Violations list */}
                    <div className="space-y-2">
                      {violations.map((v) => (
                        <div key={v.id} className={`rounded-md border p-4 ${
                          v.severity === "high" ? "border-red-200 bg-red-50/30"
                          : v.severity === "medium" ? "border-amber-200 bg-amber-50/30"
                          : "border-slate-200 bg-slate-50/30"
                        }`}>
                          <div className="flex items-start justify-between gap-3">
                            <div className="flex items-start gap-3 flex-1 min-w-0">
                              <div className={`mt-0.5 flex-shrink-0 ${
                                v.severity === "high" ? "text-red-500"
                                : v.severity === "medium" ? "text-amber-500"
                                : "text-slate-400"
                              }`}>
                                <ShieldAlert size={16} />
                              </div>
                              <div className="min-w-0 flex-1">
                                <div className="text-sm font-semibold text-slate-800">{v.type}</div>
                                {v.description && (
                                  <div className="text-xs text-slate-500 mt-0.5 leading-relaxed">{v.description}</div>
                                )}
                                <div className="flex items-center gap-2 mt-1">
                                  <span className="text-xs text-slate-400">{formatDate(v.date)}</span>
                                  <span className={`text-xs px-1.5 py-0.5 rounded font-semibold uppercase tracking-wide ${
                                    v.severity === "high" ? "bg-red-100 text-red-600"
                                    : v.severity === "medium" ? "bg-amber-100 text-amber-600"
                                    : "bg-slate-100 text-slate-500"
                                  }`}>
                                    {v.severity === "high" ? "Серьёзное" : v.severity === "medium" ? "Среднее" : "Незначительное"}
                                  </span>
                                </div>
                              </div>
                            </div>
                            <div className="flex flex-col items-end gap-2 flex-shrink-0">
                              <div className="flex items-center gap-2">
                                <div className="flex items-center gap-1 text-sm font-bold text-slate-800">
                                  <Banknote size={14} className="text-slate-400" />
                                  {formatCurrency(v.fine)}
                                </div>
                                <button
                                  onClick={() => {
                                    if (confirm("Удалить нарушение?")) deleteViolation(v.id);
                                  }}
                                  className="p-1 text-slate-300 hover:text-red-500 transition-colors"
                                  title="Удалить"
                                >
                                  <Trash2 size={14} />
                                </button>
                              </div>
                              <select
                                value={v.fineStatus}
                                onChange={(e) => updateFineStatus(v.id, e.target.value)}
                                className={`text-xs px-2 py-0.5 rounded-full font-medium border-0 cursor-pointer focus:outline-none focus:ring-1 focus:ring-blue-400 ${
                                  v.fineStatus === "paid" ? "bg-emerald-100 text-emerald-700"
                                  : v.fineStatus === "overdue" ? "bg-red-100 text-red-700"
                                  : "bg-amber-100 text-amber-700"
                                }`}
                              >
                                <option value="unpaid">Не оплачен</option>
                                <option value="paid">Оплачен</option>
                                <option value="overdue">Просрочен</option>
                              </select>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </>
                )}
              </div>
            );
          })()}

          {/* Location Tab */}
          {activeTab === "location" && (
            <div className="space-y-4">
              <div className="bg-slate-50 rounded-md p-4 flex items-center gap-3 border border-slate-200">
                <MapPin size={18} className="text-slate-500" />
                <div>
                  <div className="text-xs font-bold text-slate-600 uppercase tracking-wider">
                    Текущее местонахождение
                  </div>
                  <div className="text-sm text-slate-700 mt-0.5">{migrant.address}</div>
                  <div className="text-xs text-slate-400 mt-0.5">
                    {migrant.lat.toFixed(4)}, {migrant.lng.toFixed(4)}
                  </div>
                </div>
              </div>

              <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                История перемещений
              </h3>
              <div className="space-y-2">
                {migrant.locationHistory.map((loc, i) => (
                  <div
                    key={i}
                    className="flex items-start gap-3 p-3 border border-slate-200 rounded-md"
                  >
                    <div className="mt-1 flex flex-col items-center">
                      <div
                        className={`w-2.5 h-2.5 rounded-full ${i === 0 ? "bg-blue-500" : "bg-slate-300"}`}
                      />
                      {i < migrant.locationHistory.length - 1 && (
                        <div className="w-0.5 h-6 bg-slate-200 mt-1" />
                      )}
                    </div>
                    <div className="flex-1">
                      <div className="text-sm font-medium text-slate-800">
                        {loc.address}
                      </div>
                      <div className="text-xs text-slate-400">
                        {new Date(loc.timestamp).toLocaleString("ru-RU", {
                          day: "2-digit",
                          month: "2-digit",
                          year: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </div>
                      <div className="text-xs text-slate-300 mt-0.5">
                        {loc.lat.toFixed(4)}, {loc.lng.toFixed(4)}
                      </div>
                    </div>
                    {i === 0 && (
                      <span className="text-xs bg-slate-200 text-slate-700 px-2 py-0.5 rounded font-semibold uppercase tracking-wide">
                        Сейчас
                      </span>
                    )}
                  </div>
                ))}
              </div>
              <div className="text-center">
                <Link
                  href="/admin/map"
                  className="text-sm text-blue-600 hover:text-blue-800"
                >
                  Открыть на карте →
                </Link>
              </div>
            </div>
          )}
          {/* Chat Tab */}
          {activeTab === "chat" && (
            <div className="flex flex-col h-[520px]">
              <div className="flex-1 overflow-y-auto space-y-3 pb-3">
                {chatMessages.length === 0 && (
                  <div className="text-center py-12 text-slate-400 text-sm">Сообщений пока нет</div>
                )}
                {chatMessages.map((msg, i) => {
                  const isStaff = msg.from === "service" || msg.from === "staff";
                  return (
                    <div key={msg.id ?? i} className={`flex ${isStaff ? "justify-end" : "justify-start"}`}>
                      <div className={`max-w-[70%] rounded-md px-4 py-2.5 ${
                        isStaff
                          ? "bg-[#1E3A5F] text-white"
                          : "bg-slate-100 text-slate-800"
                      }`}>
                        {!isStaff && (
                          <div className="text-xs font-semibold text-slate-500 mb-0.5">Мигрант</div>
                        )}
                        <div className="text-sm leading-relaxed">{msg.text}</div>
                        {msg.createdAt && (
                          <div className={`text-[11px] mt-1 ${isStaff ? "text-blue-200" : "text-slate-400"}`}>
                            {new Date(msg.createdAt).toLocaleTimeString("ru-RU", { hour: "2-digit", minute: "2-digit" })}
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
              <div className="border-t border-slate-100 pt-3 flex gap-2">
                <input
                  type="text"
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && sendAdminMessage()}
                  placeholder="Ответить мигранту..."
                  className="flex-1 px-4 py-2.5 rounded-md border border-slate-200 text-sm focus:outline-none focus:border-[#1E3A5F]"
                />
                <button
                  onClick={sendAdminMessage}
                  disabled={!chatInput.trim() || chatLoading}
                  className="px-4 py-2.5 bg-[#1E3A5F] hover:bg-[#0C2340] disabled:opacity-50 text-white rounded-md transition-colors"
                >
                  {chatLoading ? <RefreshCw size={16} className="animate-spin" /> : <Send size={16} />}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Inspection Modal */}
      {showInspection && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-md shadow-sm w-full max-w-md border border-slate-200">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
              <h2 className="text-sm font-bold text-slate-800 uppercase tracking-wide">Назначить проверку</h2>
              <button onClick={() => { setShowInspection(false); setInspectionSent(false); }} className="text-slate-400 hover:text-slate-600 text-xl leading-none">✕</button>
            </div>

            {inspectionSent ? (
              <div className="p-8 text-center">
                <div className="w-14 h-14 bg-slate-100 rounded-md flex items-center justify-center mx-auto mb-4">
                  <CheckCircle size={28} className="text-green-600" />
                </div>
                <div className="font-bold text-slate-800 mb-1 uppercase tracking-wide text-sm">Проверка назначена</div>
                <div className="text-sm text-slate-500 mb-1">
                  {inspectionForm.type === "office" ? "Офисная проверка" : "Выездная проверка"}
                </div>
                <div className="text-sm text-slate-500 mb-4">
                  {inspectionForm.date} · {inspectionForm.inspector}
                </div>
                <div className="text-xs text-slate-400">Мигранту отправлено уведомление в чат</div>
                <button
                  onClick={() => { setShowInspection(false); setInspectionSent(false); }}
                  className="mt-5 w-full py-2.5 bg-[#1E3A5F] text-white rounded-md text-sm font-semibold hover:bg-[#0C2340]"
                >
                  Закрыть
                </button>
              </div>
            ) : (
              <div className="p-6 space-y-4">
                <div>
                  <label className="text-xs font-semibold text-slate-500 block mb-1.5">Тип проверки</label>
                  <div className="grid grid-cols-2 gap-2">
                    {[
                      { value: "office", label: "🏢 Офисная", desc: "Мигрант явится лично" },
                      { value: "field", label: "🚗 Выездная", desc: "Инспектор выедет на место" },
                    ].map((t) => (
                      <button
                        key={t.value}
                        onClick={() => setInspectionForm((p) => ({ ...p, type: t.value }))}
                        className={`p-3 rounded-md border text-left transition-colors ${
                          inspectionForm.type === t.value
                            ? "border-[#1E3A5F] bg-slate-50"
                            : "border-slate-200 hover:border-slate-300"
                        }`}
                      >
                        <div className="text-sm font-semibold text-slate-800">{t.label}</div>
                        <div className="text-xs text-slate-400 mt-0.5">{t.desc}</div>
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-500 block mb-1.5">Дата проверки</label>
                  <input
                    type="date"
                    value={inspectionForm.date}
                    min={new Date().toISOString().split("T")[0]}
                    onChange={(e) => setInspectionForm((p) => ({ ...p, date: e.target.value }))}
                    className="w-full px-3 py-2 border border-slate-200 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-[#1E3A5F]"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-500 block mb-1.5">Ответственный инспектор</label>
                  <select
                    value={inspectionForm.inspector}
                    onChange={(e) => setInspectionForm((p) => ({ ...p, inspector: e.target.value }))}
                    className="w-full px-3 py-2 border border-slate-200 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-[#1E3A5F]"
                  >
                    <option>Амра Пилия</option>
                    <option>Администратор</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-500 block mb-1.5">Причина / комментарий</label>
                  <textarea
                    value={inspectionForm.note}
                    onChange={(e) => setInspectionForm((p) => ({ ...p, note: e.target.value }))}
                    placeholder="Плановая проверка документов..."
                    rows={2}
                    className="w-full px-3 py-2 border border-slate-200 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-[#1E3A5F] resize-none"
                  />
                </div>
                <div className="flex gap-3 pt-1">
                  <button
                    onClick={() => setShowInspection(false)}
                    className="flex-1 py-2.5 border border-slate-200 rounded-md text-sm text-slate-600 hover:bg-slate-50"
                  >
                    Отмена
                  </button>
                  <button
                    onClick={async () => {
                      if (!inspectionForm.date) return;
                      await Promise.all([
                        fetch("/api/inspections", {
                          method: "POST",
                          headers: { "Content-Type": "application/json" },
                          body: JSON.stringify({ migrantId: params.id, ...inspectionForm }),
                        }),
                        fetch(`/api/chat/${params.id}`, {
                          method: "POST",
                          headers: { "Content-Type": "application/json" },
                          body: JSON.stringify({
                            text: `Вам назначена ${inspectionForm.type === "office" ? "офисная" : "выездная"} проверка на ${inspectionForm.date}. Инспектор: ${inspectionForm.inspector}.${inspectionForm.note ? " " + inspectionForm.note : ""}`,
                          }),
                        }),
                      ]);
                      setInspectionSent(true);
                    }}
                    disabled={!inspectionForm.date}
                    className="flex-1 py-2.5 bg-[#1E3A5F] text-white rounded-md text-sm font-semibold hover:bg-[#0C2340] disabled:opacity-50"
                  >
                    Назначить
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Add Violation Modal */}
      {showAddViolation && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-md shadow-sm w-full max-w-md border border-slate-200">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
              <h2 className="text-sm font-bold text-slate-800 uppercase tracking-wide">Добавить нарушение</h2>
              <button onClick={() => setShowAddViolation(false)} className="text-slate-400 hover:text-slate-600">
                <X size={20} />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="text-xs font-semibold text-slate-500 block mb-1.5">Тип нарушения</label>
                <select
                  value={violationForm.type}
                  onChange={(e) => setViolationForm(p => ({ ...p, type: e.target.value }))}
                  className="w-full px-3 py-2 border border-slate-200 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-[#1E3A5F]"
                >
                  <option value="">— Выберите тип —</option>
                  <option>Превышение срока пребывания</option>
                  <option>Работа без разрешения</option>
                  <option>Несвоевременная оплата сбора</option>
                  <option>Неявка на плановую проверку</option>
                  <option>Недостоверные сведения о месте проживания</option>
                  <option>Нарушение миграционного режима</option>
                  <option>Другое</option>
                </select>
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-500 block mb-1.5">Описание</label>
                <textarea
                  value={violationForm.description}
                  onChange={(e) => setViolationForm(p => ({ ...p, description: e.target.value }))}
                  placeholder="Подробности нарушения..."
                  rows={2}
                  className="w-full px-3 py-2 border border-slate-200 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-[#1E3A5F] resize-none"
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-500 block mb-1.5">Степень тяжести</label>
                <div className="flex gap-2">
                  {[
                    { value: "high", label: "Серьёзное", cls: "border-red-300 bg-red-50 text-red-700" },
                    { value: "medium", label: "Среднее", cls: "border-amber-300 bg-amber-50 text-amber-700" },
                    { value: "low", label: "Незначительное", cls: "border-slate-300 bg-slate-50 text-slate-600" },
                  ].map(opt => (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => setViolationForm(p => ({ ...p, severity: opt.value }))}
                      className={`flex-1 py-2 rounded-md border text-xs font-medium transition-colors ${
                        violationForm.severity === opt.value ? opt.cls : "border-slate-200 text-slate-400 hover:border-slate-300"
                      }`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-slate-500 block mb-1.5">Дата</label>
                  <input
                    type="date"
                    value={violationForm.date}
                    onChange={(e) => setViolationForm(p => ({ ...p, date: e.target.value }))}
                    className="w-full px-3 py-2 border border-slate-200 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-[#1E3A5F]"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-500 block mb-1.5">Штраф (₽)</label>
                  <input
                    type="number"
                    min={0}
                    value={violationForm.fine}
                    onChange={(e) => setViolationForm(p => ({ ...p, fine: Number(e.target.value) }))}
                    className="w-full px-3 py-2 border border-slate-200 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-[#1E3A5F]"
                  />
                </div>
              </div>
              <div className="flex gap-3 pt-1">
                <button
                  onClick={() => setShowAddViolation(false)}
                  className="flex-1 py-2.5 border border-slate-200 rounded-md text-sm text-slate-600 hover:bg-slate-50"
                >
                  Отмена
                </button>
                <button
                  onClick={submitViolation}
                  disabled={!violationForm.type || !violationForm.date || violationSubmitting}
                  className="flex-1 py-2.5 bg-red-700 text-white rounded-md text-sm font-semibold hover:bg-red-800 disabled:opacity-50 transition-colors"
                >
                  {violationSubmitting ? "Добавление..." : "Добавить"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Violations Modal */}
      {showViolations && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-md shadow-sm w-full max-w-lg max-h-[80vh] flex flex-col border border-slate-200">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
              <div>
                <h2 className="text-base font-bold text-slate-800">Нарушения</h2>
                <p className="text-xs text-slate-400 mt-0.5">{migrant.lastName} {migrant.firstName}</p>
              </div>
              <button onClick={() => setShowViolations(false)} className="text-slate-400 hover:text-slate-600">
                <X size={20} />
              </button>
            </div>
            <div className="overflow-y-auto p-5 space-y-3">
              {violations.length === 0 && (
                <div className="text-center py-8 text-slate-400 text-sm">Нарушений нет</div>
              )}
              {violations.map((v) => (
                <div key={v.id} className={`rounded-md border p-4 ${v.severity === "high" ? "border-red-200 bg-red-50/30" : v.severity === "medium" ? "border-amber-200 bg-amber-50/30" : "border-slate-200 bg-slate-50"}`}>
                  <div className="flex items-start gap-3">
                    <div className={`w-2 h-2 rounded-full mt-1.5 flex-shrink-0 ${v.severity === "high" ? "bg-red-500" : v.severity === "medium" ? "bg-amber-500" : "bg-slate-400"}`} />
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-sm font-semibold text-slate-800">{v.type}</span>
                        <span className={`text-xs px-2 py-0.5 rounded font-semibold uppercase tracking-wide ${v.severity === "high" ? "bg-red-100 text-red-700" : v.severity === "medium" ? "bg-amber-100 text-amber-700" : "bg-slate-200 text-slate-600"}`}>
                          {v.severity === "high" ? "Серьёзное" : v.severity === "medium" ? "Среднее" : "Незначительное"}
                        </span>
                      </div>
                      {v.description && <p className="text-xs text-slate-600 leading-relaxed">{v.description}</p>}
                      <p className="text-xs text-slate-400 mt-1.5">Зафиксировано: {formatDate(v.date)}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            <div className="px-6 py-4 border-t border-slate-100">
              <button
                onClick={() => setShowViolations(false)}
                className="w-full py-2.5 bg-[#1E3A5F] text-white rounded-md text-sm font-semibold hover:bg-[#0C2340] transition-colors"
              >
                Закрыть
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}



function InfoItem({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-start gap-2">
      <span className="mt-0.5 flex-shrink-0">{icon}</span>
      <div className="min-w-0">
        <div className="text-xs text-slate-400">{label}</div>
        <div className="text-sm text-slate-800 font-medium truncate">{value}</div>
      </div>
    </div>
  );
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col">
      <span className="text-xs text-slate-400">{label}</span>
      <span className="text-sm text-slate-800 font-medium mt-0.5">{value}</span>
    </div>
  );
}
