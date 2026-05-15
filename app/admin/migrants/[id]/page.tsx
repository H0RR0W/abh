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
} from "lucide-react";
import Link from "next/link";

const DOC_ICONS: Record<string, string> = {
  passport: "🪪",
  migration_card: "📋",
  patent: "📜",
  medical: "🏥",
};

export default function MigrantProfilePage() {
  const params = useParams();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState("info");
  const [migrant, setMigrant] = useState<Migrant | null>(null);
  const [loading, setLoading] = useState(true);
  const [notifSent, setNotifSent] = useState(false);

  useEffect(() => {
    fetch(`/api/migrants/${params.id}`)
      .then((r) => r.json())
      .then((d) => {
        if (d && d.id) setMigrant(d);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [params.id]);

  async function updateStatus(newStatus: string) {
    await fetch(`/api/migrants/${params.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: newStatus }),
    });
    setMigrant((prev) => prev ? { ...prev, status: newStatus } : prev);
  }

  async function sendNotification() {
    await fetch(`/api/chat/${params.id}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text: "Вам необходимо явиться в миграционную службу для проверки документов." }),
    });
    setNotifSent(true);
    setTimeout(() => setNotifSent(false), 2000);
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
    { id: "location", label: "Геолокация", icon: MapPin },
  ];

  const totalPaid = migrant.payments
    .filter((p) => p.status === "paid")
    .reduce((sum, p) => sum + p.amount, 0);

  const totalDebt = migrant.payments
    .filter((p) => p.status === "unpaid" || p.status === "overdue")
    .reduce((sum, p) => sum + p.amount, 0);

  return (
    <div className="p-6 space-y-5">
      {/* Header */}
      <div className="flex items-center gap-4">
        <button
          onClick={() => router.back()}
          className="p-2 rounded-lg hover:bg-slate-100 transition-colors"
        >
          <ArrowLeft size={18} className="text-slate-600" />
        </button>
        <div>
          <h1 className="text-xl font-bold text-slate-900">
            {migrant.lastName} {migrant.firstName}{" "}
            {migrant.middleName && migrant.middleName}
          </h1>
          <p className="text-slate-400 text-sm">{migrant.id}</p>
        </div>
      </div>

      {/* Profile card */}
      <div className="bg-white rounded-xl border border-slate-200 p-6">
        <div className="flex items-start gap-6">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center text-white text-xl font-bold flex-shrink-0">
            {getInitials(migrant.firstName, migrant.lastName)}
          </div>
          <div className="flex-1 grid grid-cols-3 gap-4">
            <InfoItem
              icon={<Phone size={14} className="text-slate-400" />}
              label="Телефон"
              value={migrant.phone}
            />
            <InfoItem
              icon={<span className="text-sm">{getCitizenshipFlag(migrant.citizenship)}</span>}
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
              value={migrant.passportNumber}
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
              className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(currentStatus)}`}
            >
              {getStatusLabel(currentStatus)}
            </span>
            {migrant.violations > 0 && (
              <div className="flex items-center gap-1 text-amber-600 text-xs">
                <AlertTriangle size={12} />
                {migrant.violations} нарушений
              </div>
            )}
          </div>
        </div>

        {/* Registration info */}
        <div className="mt-5 pt-5 border-t border-slate-100 grid grid-cols-4 gap-4">
          <div className="bg-slate-50 rounded-lg p-3">
            <div className="text-xs text-slate-400 mb-1">Регистрация</div>
            <div className="text-sm font-medium text-slate-800">
              {formatDate(migrant.registrationDate)}
            </div>
          </div>
          <div className="bg-slate-50 rounded-lg p-3">
            <div className="text-xs text-slate-400 mb-1">Действует до</div>
            <div
              className={`text-sm font-medium ${migrant.status === "expired" ? "text-red-600" : "text-slate-800"}`}
            >
              {formatDate(migrant.registrationExpiry)}
            </div>
          </div>
          <div className="bg-slate-50 rounded-lg p-3">
            <div className="text-xs text-slate-400 mb-1">Патент до</div>
            <div
              className={`text-sm font-medium ${migrant.patentExpiry && new Date(migrant.patentExpiry) < new Date() ? "text-red-600" : "text-slate-800"}`}
            >
              {formatDate(migrant.patentExpiry)}
            </div>
          </div>
          <div className="bg-slate-50 rounded-lg p-3">
            <div className="text-xs text-slate-400 mb-1">Последняя активность</div>
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
            onClick={sendNotification}
            className="flex items-center gap-2 px-4 py-2 bg-blue-50 text-blue-700 rounded-lg text-sm hover:bg-blue-100 transition-colors"
          >
            <Send size={14} />
            {notifSent ? "✓ Отправлено!" : "Уведомление"}
          </button>
          {currentStatus !== "blocked" ? (
            <button
              onClick={() => updateStatus("blocked")}
              className="flex items-center gap-2 px-4 py-2 bg-red-50 text-red-700 rounded-lg text-sm hover:bg-red-100 transition-colors"
            >
              <Lock size={14} />
              Заблокировать
            </button>
          ) : (
            <button
              onClick={() => updateStatus("active")}
              className="flex items-center gap-2 px-4 py-2 bg-emerald-50 text-emerald-700 rounded-lg text-sm hover:bg-emerald-100 transition-colors"
            >
              <Unlock size={14} />
              Разблокировать
            </button>
          )}
          {currentStatus === "expired" && (
            <button
              onClick={() => updateStatus("active")}
              className="flex items-center gap-2 px-4 py-2 bg-emerald-50 text-emerald-700 rounded-lg text-sm hover:bg-emerald-100 transition-colors"
            >
              <CheckCircle size={14} />
              Подтвердить продление
            </button>
          )}
          <button className="flex items-center gap-2 px-4 py-2 bg-slate-50 text-slate-600 rounded-lg text-sm hover:bg-slate-100 transition-colors">
            <AlertTriangle size={14} />
            Назначить проверку
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        <div className="flex border-b border-slate-100">
          {tabs.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => setActiveTab(id)}
              className={`flex items-center gap-2 px-5 py-3.5 text-sm font-medium transition-colors border-b-2 -mb-px ${
                activeTab === id
                  ? "border-blue-600 text-blue-600"
                  : "border-transparent text-slate-500 hover:text-slate-700"
              }`}
            >
              <Icon size={15} />
              {label}
            </button>
          ))}
        </div>

        <div className="p-5">
          {/* Info Tab */}
          {activeTab === "info" && (
            <div className="space-y-4">
              <h3 className="font-semibold text-slate-800">
                Персональные данные
              </h3>
              <div className="grid grid-cols-2 gap-4">
                <DetailRow label="ID" value={migrant.id} />
                <DetailRow
                  label="ФИО"
                  value={`${migrant.lastName} ${migrant.firstName} ${migrant.middleName}`}
                />
                <DetailRow label="Паспорт" value={migrant.passportNumber} />
                <DetailRow label="Телефон" value={migrant.phone} />
                <DetailRow
                  label="Гражданство"
                  value={`${getCitizenshipFlag(migrant.citizenship)} ${migrant.citizenship}`}
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
                  label="Нарушения"
                  value={migrant.violations.toString()}
                />
              </div>
              {migrant.patentNumber && (
                <div className="mt-4">
                  <h3 className="font-semibold text-slate-800 mb-3">Патент</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <DetailRow label="Номер патента" value={migrant.patentNumber} />
                    <DetailRow
                      label="Действует до"
                      value={formatDate(migrant.patentExpiry)}
                    />
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Documents Tab */}
          {activeTab === "documents" && (
            <div className="space-y-3">
              {migrant.documents.map((doc, i) => (
                <div
                  key={i}
                  className="flex items-center justify-between p-4 border border-slate-100 rounded-xl hover:bg-slate-50 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">
                      {DOC_ICONS[doc.type] ?? "📄"}
                    </span>
                    <div>
                      <div className="text-sm font-medium text-slate-800">
                        {doc.name}
                      </div>
                      <div className="text-xs text-slate-400">
                        Загружен {formatDate(doc.uploadedAt)}
                      </div>
                    </div>
                  </div>
                  <span
                    className={`px-2.5 py-1 rounded-full text-xs font-medium ${getDocStatusColor(doc.status)}`}
                  >
                    {getDocStatusLabel(doc.status)}
                  </span>
                </div>
              ))}
              <button className="w-full p-4 border-2 border-dashed border-slate-200 rounded-xl text-sm text-slate-400 hover:border-blue-400 hover:text-blue-600 transition-colors">
                + Добавить документ
              </button>
            </div>
          )}

          {/* Payments Tab */}
          {activeTab === "payments" && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div className="bg-emerald-50 rounded-xl p-4">
                  <div className="text-xs text-emerald-600 mb-1">Оплачено</div>
                  <div className="text-xl font-bold text-emerald-700">
                    {formatCurrency(totalPaid)}
                  </div>
                </div>
                <div className="bg-red-50 rounded-xl p-4">
                  <div className="text-xs text-red-600 mb-1">
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
                      className="flex items-center justify-between p-3 border border-slate-100 rounded-xl"
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
                          className={`px-2 py-0.5 rounded-full text-xs font-medium ${getPaymentStatusColor(p.status)}`}
                        >
                          {getPaymentStatusLabel(p.status)}
                        </span>
                      </div>
                    </div>
                  ))}
              </div>
            </div>
          )}

          {/* Location Tab */}
          {activeTab === "location" && (
            <div className="space-y-4">
              <div className="bg-blue-50 rounded-xl p-4 flex items-center gap-3">
                <MapPin size={18} className="text-blue-600" />
                <div>
                  <div className="text-sm font-semibold text-blue-800">
                    Текущее местонахождение
                  </div>
                  <div className="text-xs text-blue-600">{migrant.address}</div>
                  <div className="text-xs text-blue-500 mt-0.5">
                    {migrant.lat.toFixed(4)}, {migrant.lng.toFixed(4)}
                  </div>
                </div>
              </div>

              <h3 className="font-semibold text-slate-800">
                История перемещений
              </h3>
              <div className="space-y-2">
                {migrant.locationHistory.map((loc, i) => (
                  <div
                    key={i}
                    className="flex items-start gap-3 p-3 border border-slate-100 rounded-xl"
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
                      <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full">
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
        </div>
      </div>
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
