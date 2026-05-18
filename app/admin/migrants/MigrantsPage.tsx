"use client";

export const dynamic = "force-dynamic";

import { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { Search, Filter, Download, Plus, MapPin, AlertTriangle, X, CheckCircle, Clock, ShieldQuestion } from "lucide-react";
import { Migrant } from "@/lib/types";
import {
  getStatusLabel,
  getStatusColor,
  getCitizenshipFlag,
  getInitials,
  formatDate,
} from "@/lib/utils";

const STATUSES = ["all", "active", "expired", "blocked"];
const ALL_CITIZENSHIPS = ["all", "Армения", "Грузия", "Турция", "Украина", "Азербайджан", "Молдова", "Беларусь"];
const CITIZENSHIP_OPTIONS = ["Армения", "Грузия", "Турция", "Украина", "Азербайджан", "Молдова", "Беларусь"];

const EMPTY_FORM = {
  lastName: "",
  firstName: "",
  middleName: "",
  citizenship: "Армения",
  passportNumber: "",
  phone: "",
  birthDate: "",
  registrationDate: new Date().toISOString().split("T")[0],
  registrationExpiry: "",
  employed: false,
  employer: "",
  address: "",
};

function Field({ label, required, children }: { label: string; required?: boolean; children: React.ReactNode }) {
  return (
    <div>
      <label className="text-xs font-semibold text-slate-500 block mb-1">
        {label}{required && <span className="text-red-400 ml-0.5">*</span>}
      </label>
      {children}
    </div>
  );
}

const inputCls = "w-full px-3 py-2 border border-slate-200 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-[#1E3A5F]";

export default function MigrantsPage() {
  const searchParams = useSearchParams();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState(searchParams.get("status") ?? "all");
  const [citizenshipFilter, setCitizenshipFilter] = useState("all");
  const [data, setData] = useState<Migrant[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [staffDistricts, setStaffDistricts] = useState<string[] | null>(null);
  const [staffRole, setStaffRole] = useState<string>("");

  useEffect(() => {
    fetch("/api/me/staff")
      .then((r) => r.json())
      .then((d) => {
        if (d?.role) {
          setStaffRole(d.role);
          setStaffDistricts(d.districts ?? []);
        }
      })
      .catch(() => {});
  }, []);

  function loadMigrants(p = page) {
    const params = new URLSearchParams();
    if (search) params.set("search", search);
    if (statusFilter !== "all") params.set("status", statusFilter);
    if (citizenshipFilter !== "all") params.set("citizenship", citizenshipFilter);
    params.set("page", String(p));
    params.set("limit", "20");
    fetch(`/api/migrants?${params}`)
      .then((r) => r.json())
      .then((d) => {
        if (d && Array.isArray(d.data)) {
          setData(d.data);
          setTotal(d.total ?? 0);
          setPages(d.pages ?? 1);
        }
      })
      .catch(console.error);
  }

  useEffect(() => {
    setPage(1);
    const timer = setTimeout(() => loadMigrants(1), 300);
    return () => clearTimeout(timer);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search, statusFilter, citizenshipFilter]);

  useEffect(() => {
    loadMigrants(page);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page]);

  function set(field: string, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  async function handleCreate() {
    if (!form.lastName || !form.firstName || !form.passportNumber || !form.phone || !form.registrationExpiry || !form.birthDate) {
      setError("Заполните все обязательные поля");
      return;
    }
    setSaving(true);
    setError(null);
    const res = await fetch("/api/migrants", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    setSaving(false);
    if (!res.ok) { setError("Ошибка при сохранении"); return; }
    setShowModal(false);
    setForm(EMPTY_FORM);
    loadMigrants();
  }

  return (
    <div className="p-6 space-y-5 bg-[#F0F2F5] min-h-screen">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-slate-900 uppercase tracking-wide">Мигранты</h1>
          <p className="text-slate-500 text-xs mt-1 uppercase tracking-wider">{total} записей</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => window.open("/api/reports/migrants", "_blank")}
            className="flex items-center gap-2 px-4 py-2 border border-slate-300 rounded-md text-sm text-slate-600 hover:bg-slate-100 transition-colors"
          >
            <Download size={15} />
            Экспорт
          </button>
          <button
            onClick={() => { setShowModal(true); setError(null); }}
            className="flex items-center gap-2 px-4 py-2 bg-[#1E3A5F] text-white rounded-md text-sm hover:bg-[#0C2340] transition-colors"
          >
            <Plus size={15} />
            Добавить
          </button>
        </div>
      </div>

      {/* District filter banner */}
      {(staffRole === "inspector" || staffRole === "operator") && staffDistricts && staffDistricts.length > 0 && (
        <div className="flex items-center gap-2 px-4 py-2.5 bg-[#0C2340]/5 border border-[#1E3A5F]/20 rounded-md text-xs">
          <MapPin size={13} className="text-[#1E3A5F] flex-shrink-0" />
          <span className="text-slate-500 font-medium">Фильтр по районам:</span>
          <div className="flex gap-1.5 flex-wrap">
            {staffDistricts.map((d) => (
              <span key={d} className="px-2 py-0.5 rounded-full bg-[#0C2340] text-white font-semibold">{d}</span>
            ))}
          </div>
          <span className="text-slate-400 ml-auto">Показано {total} мигрантов вашей зоны</span>
        </div>
      )}

      {/* Filters */}
      <div className="flex gap-3 flex-wrap items-center bg-white border border-slate-200 rounded-md p-3 shadow-sm">
        <div className="relative flex-1 min-w-64">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Поиск по ФИО, паспорту, ID, телефону..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 border border-slate-200 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-[#1E3A5F] bg-white"
          />
        </div>
        <div className="flex items-center gap-1">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className={`px-3 py-2 border rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-[#1E3A5F] bg-white ${
              statusFilter !== "all" ? "border-slate-400 text-slate-800 font-medium" : "border-slate-200 text-slate-600"
            }`}
          >
            {STATUSES.map((s) => (
              <option key={s} value={s}>{s === "all" ? "Все статусы" : getStatusLabel(s)}</option>
            ))}
          </select>
          {statusFilter !== "all" && (
            <button
              onClick={() => setStatusFilter("all")}
              className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-md transition-colors"
              title="Сбросить"
            >
              <X size={14} />
            </button>
          )}
        </div>
        <div className="flex items-center gap-1">
          <select
            value={citizenshipFilter}
            onChange={(e) => setCitizenshipFilter(e.target.value)}
            className={`px-3 py-2 border rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-[#1E3A5F] bg-white ${
              citizenshipFilter !== "all" ? "border-slate-400 text-slate-800 font-medium" : "border-slate-200 text-slate-600"
            }`}
          >
            {ALL_CITIZENSHIPS.map((c) => (
              <option key={c} value={c}>{c === "all" ? "Все гражданства" : c}</option>
            ))}
          </select>
          {citizenshipFilter !== "all" && (
            <button
              onClick={() => setCitizenshipFilter("all")}
              className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-md transition-colors"
              title="Сбросить"
            >
              <X size={14} />
            </button>
          )}
        </div>
        {(statusFilter !== "all" || citizenshipFilter !== "all" || search) && (
          <button
            onClick={() => { setStatusFilter("all"); setCitizenshipFilter("all"); setSearch(""); }}
            className="flex items-center gap-1.5 px-3 py-2 text-sm text-slate-500 hover:text-red-600 hover:bg-red-50 border border-slate-200 hover:border-red-200 rounded-md transition-colors"
          >
            <X size={14} />
            Сбросить
          </button>
        )}
      </div>

      {/* Table */}
      <div className="bg-white rounded-md border border-slate-200 overflow-hidden shadow-sm" id="migrants-table">
        <table className="w-full">
          <thead>
            <tr className="border-b border-slate-100 bg-slate-50">
              <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Мигрант</th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Гражданство</th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Статус</th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Регистрация до</th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Работодатель</th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Локация</th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody>
            {data.length === 0 && (
              <tr>
                <td colSpan={7} className="text-center py-12 text-slate-400 text-sm">Загрузка...</td>
              </tr>
            )}
            {data.map((m) => (
              <tr key={m.id} className="border-b border-slate-50 hover:bg-slate-50 transition-colors">
                <td className="px-4 py-3">
                  <div className="flex items-center gap-3">
                    <div className="relative w-9 h-9 flex-shrink-0">
                      {(m as any).photo ? (
                        <img src={(m as any).photo} alt="" className="w-9 h-9 rounded object-cover" />
                      ) : (
                        <div className="w-9 h-9 rounded bg-[#1A3A5C] flex items-center justify-center text-white text-xs font-bold">
                          {getInitials(m.firstName, m.lastName)}
                        </div>
                      )}
                      {/* Verification badge */}
                      <div className={`absolute -bottom-0.5 -right-0.5 w-4 h-4 rounded-full flex items-center justify-center border-2 border-white ${
                        (m as any).identityStatus === "verified" ? "bg-emerald-500"
                        : (m as any).identityStatus === "pending" ? "bg-amber-400"
                        : "bg-slate-300"
                      }`}
                        title={
                          (m as any).identityStatus === "verified" ? "Личность подтверждена"
                          : (m as any).identityStatus === "pending" ? "Верификация на проверке"
                          : "Личность не верифицирована"
                        }
                      >
                        {(m as any).identityStatus === "verified"
                          ? <CheckCircle size={9} className="text-white" />
                          : (m as any).identityStatus === "pending"
                            ? <Clock size={9} className="text-white" />
                            : <ShieldQuestion size={9} className="text-white" />
                        }
                      </div>
                    </div>
                    <div>
                      <div className="font-medium text-slate-800 text-sm">{m.lastName} {m.firstName}</div>
                      <div className="text-xs text-slate-400">{m.id} · {m.passportNumber}</div>
                    </div>
                  </div>
                </td>
                <td className="px-4 py-3 text-sm text-slate-600">{m.citizenship}</td>
                <td className="px-4 py-3">
                  <div className="flex flex-col gap-1">
                    <div className="flex items-center gap-2">
                      <span className={`px-2 py-0.5 rounded text-xs font-medium uppercase tracking-wide ${getStatusColor(m.status)}`}>
                        {getStatusLabel(m.status)}
                      </span>
                      {m.violations > 0 && <span className="text-amber-500"><AlertTriangle size={13} /></span>}
                    </div>
                    {m.status === "expired" && (
                      <span className="text-[10px] text-amber-600 font-medium">↳ срок регистрации</span>
                    )}
                    {m.status === "blocked" && (
                      <span className="text-[10px] text-red-500 font-medium">↳ доступ закрыт</span>
                    )}
                  </div>
                </td>
                <td className="px-4 py-3">
                  <span className={`text-sm font-medium ${
                    m.status === "expired" || new Date(m.registrationExpiry) < new Date()
                      ? "text-red-600"
                      : new Date(m.registrationExpiry) < new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
                      ? "text-amber-600"
                      : "text-slate-600"
                  }`}>
                    {formatDate(m.registrationExpiry)}
                  </span>
                </td>
                <td className="px-4 py-3 text-sm text-slate-600 max-w-[160px] truncate">{m.employer ?? "—"}</td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-1 text-xs text-slate-400">
                    <MapPin size={11} />
                    {m.address.split(",")[0]}
                  </div>
                </td>
                <td className="px-4 py-3">
                  <Link href={`/admin/migrants/${m.id}`} className="text-xs text-blue-600 hover:text-blue-800 font-medium">
                    Открыть →
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* Pagination */}
        {pages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-slate-100 bg-slate-50">
            <div className="text-xs text-slate-500">
              Страница {page} из {pages} · {total} записей
            </div>
            <div className="flex gap-1">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className="px-3 py-1.5 text-xs border border-slate-200 rounded-md bg-white hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                ← Назад
              </button>
              {Array.from({ length: Math.min(5, pages) }, (_, i) => {
                const p = page <= 3 ? i + 1 : page - 2 + i;
                if (p < 1 || p > pages) return null;
                return (
                  <button
                    key={p}
                    onClick={() => setPage(p)}
                    className={`px-3 py-1.5 text-xs border rounded-md transition-colors ${
                      p === page ? "bg-[#1E3A5F] text-white border-[#1E3A5F]" : "border-slate-200 bg-white hover:bg-slate-50"
                    }`}
                  >
                    {p}
                  </button>
                );
              })}
              <button
                onClick={() => setPage((p) => Math.min(pages, p + 1))}
                disabled={page === pages}
                className="px-3 py-1.5 text-xs border border-slate-200 rounded-md bg-white hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                Вперёд →
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Add Migrant Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-md shadow-sm w-full max-w-2xl max-h-[90vh] flex flex-col border border-slate-200">
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
              <h2 className="text-sm font-bold text-slate-800 uppercase tracking-wide">Новый мигрант</h2>
              <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-slate-600">
                <X size={20} />
              </button>
            </div>

            {/* Body */}
            <div className="overflow-y-auto p-6 space-y-5">
              {error && (
                <div className="p-3 bg-red-50 text-red-700 rounded-lg text-sm">{error}</div>
              )}

              <div>
                <div className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">Личные данные</div>
                <div className="grid grid-cols-3 gap-3">
                  <Field label="Фамилия" required>
                    <input className={inputCls} value={form.lastName} onChange={(e) => set("lastName", e.target.value)} placeholder="Иванов" />
                  </Field>
                  <Field label="Имя" required>
                    <input className={inputCls} value={form.firstName} onChange={(e) => set("firstName", e.target.value)} placeholder="Иван" />
                  </Field>
                  <Field label="Отчество">
                    <input className={inputCls} value={form.middleName} onChange={(e) => set("middleName", e.target.value)} placeholder="Иванович" />
                  </Field>
                  <Field label="Дата рождения" required>
                    <input type="date" className={inputCls} value={form.birthDate} onChange={(e) => set("birthDate", e.target.value)} />
                  </Field>
                  <Field label="Гражданство" required>
                    <select className={inputCls} value={form.citizenship} onChange={(e) => set("citizenship", e.target.value)}>
                      {CITIZENSHIP_OPTIONS.map((c) => <option key={c}>{c}</option>)}
                    </select>
                  </Field>
                  <Field label="Номер паспорта" required>
                    <input className={inputCls} value={form.passportNumber} onChange={(e) => set("passportNumber", e.target.value)} placeholder="AA1234567" />
                  </Field>
                  <Field label="Телефон" required>
                    <input className={inputCls} value={form.phone} onChange={(e) => set("phone", e.target.value)} placeholder="+7 999 123-45-67" />
                  </Field>
                </div>
              </div>

              <div>
                <div className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">Регистрация</div>
                <div className="grid grid-cols-2 gap-3">
                  <Field label="Дата регистрации">
                    <input type="date" className={inputCls} value={form.registrationDate} onChange={(e) => set("registrationDate", e.target.value)} />
                  </Field>
                  <Field label="Регистрация действует до" required>
                    <input type="date" className={inputCls} value={form.registrationExpiry} onChange={(e) => set("registrationExpiry", e.target.value)} />
                  </Field>
                  <Field label="Адрес проживания">
                    <input className={inputCls} value={form.address} onChange={(e) => set("address", e.target.value)} placeholder="г. Сухум, ул. Ленина, д. 1" />
                  </Field>
                  <Field label="Работодатель">
                    <input className={inputCls} value={form.employer} onChange={(e) => set("employer", e.target.value)} placeholder="ООО «Компания»" />
                  </Field>
                </div>
              </div>

              <div>
                <div className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">Занятость</div>
                <div className="grid grid-cols-2 gap-3">
                  <Field label="Статус занятости" required>
                    <select
                      className={inputCls}
                      value={form.employed ? "employed" : "unemployed"}
                      onChange={(e) => setForm((prev) => ({ ...prev, employed: e.target.value === "employed", employer: e.target.value === "unemployed" ? "" : prev.employer }))}
                    >
                      <option value="unemployed">Не работает</option>
                      <option value="employed">Трудоустроен официально</option>
                    </select>
                  </Field>
                  {form.employed && (
                    <Field label="Работодатель" required>
                      <input className={inputCls} value={form.employer} onChange={(e) => set("employer", e.target.value)} placeholder="ООО «Компания»" />
                    </Field>
                  )}
                </div>
                {form.employed && (
                  <div className="mt-2 p-2.5 bg-slate-50 border border-slate-200 rounded-md text-xs text-slate-600">
                    Трудоустроенный мигрант обязан получить разрешение на работу через ГМС. Сбор за оформление разрешения — 5 000 ₽.
                  </div>
                )}
              </div>
            </div>

            {/* Footer */}
            <div className="flex gap-3 px-6 py-4 border-t border-slate-100">
              <button
                onClick={() => setShowModal(false)}
                className="flex-1 py-2.5 border border-slate-200 rounded-md text-sm text-slate-600 hover:bg-slate-50 transition-colors"
              >
                Отмена
              </button>
              <button
                onClick={handleCreate}
                disabled={saving}
                className="flex-1 py-2.5 bg-[#1E3A5F] text-white rounded-md text-sm font-semibold hover:bg-[#0C2340] transition-colors disabled:opacity-60"
              >
                {saving ? "Сохраняем..." : "Создать мигранта"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
