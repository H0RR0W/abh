"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Search, Filter, Download, Plus, MapPin, AlertTriangle } from "lucide-react";
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

export default function MigrantsPage() {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [citizenshipFilter, setCitizenshipFilter] = useState("all");
  const [data, setData] = useState<Migrant[]>([]);

  useEffect(() => {
    const params = new URLSearchParams();
    if (search) params.set("search", search);
    if (statusFilter !== "all") params.set("status", statusFilter);
    if (citizenshipFilter !== "all") params.set("citizenship", citizenshipFilter);

    const timer = setTimeout(() => {
      fetch(`/api/migrants?${params}`)
        .then((r) => r.json())
        .then((d) => { if (Array.isArray(d)) setData(d); })
        .catch(console.error);
    }, 300);
    return () => clearTimeout(timer);
  }, [search, statusFilter, citizenshipFilter]);

  return (
    <div className="p-6 space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Мигранты</h1>
          <p className="text-slate-500 text-sm mt-1">
            {data.length} записей
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => window.open("/api/reports/migrants", "_blank")}
            className="flex items-center gap-2 px-4 py-2 border border-slate-200 rounded-lg text-sm text-slate-600 hover:bg-slate-50 transition-colors"
          >
            <Download size={15} />
            Экспорт
          </button>
          <button className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700 transition-colors">
            <Plus size={15} />
            Добавить
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex gap-3 flex-wrap">
        <div className="relative flex-1 min-w-64">
          <Search
            size={15}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
          />
          <input
            type="text"
            placeholder="Поиск по ФИО, паспорту, ID, телефону..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2.5 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
          />
        </div>

        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="px-3 py-2.5 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white text-slate-700"
        >
          {STATUSES.map((s) => (
            <option key={s} value={s}>
              {s === "all" ? "Все статусы" : getStatusLabel(s)}
            </option>
          ))}
        </select>

        <select
          value={citizenshipFilter}
          onChange={(e) => setCitizenshipFilter(e.target.value)}
          className="px-3 py-2.5 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white text-slate-700"
        >
          {ALL_CITIZENSHIPS.map((c) => (
            <option key={c} value={c}>
              {c === "all" ? "Все гражданства" : `${getCitizenshipFlag(c)} ${c}`}
            </option>
          ))}
        </select>

        <button className="flex items-center gap-2 px-3 py-2.5 border border-slate-200 rounded-lg text-sm text-slate-600 hover:bg-slate-50 transition-colors">
          <Filter size={15} />
          Фильтры
        </button>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-slate-100 bg-slate-50">
              <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                Мигрант
              </th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                Гражданство
              </th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                Статус
              </th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                Регистрация до
              </th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                Работодатель
              </th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                Локация
              </th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody>
            {data.length === 0 && (
              <tr>
                <td colSpan={7} className="text-center py-12 text-slate-400 text-sm">
                  Загрузка...
                </td>
              </tr>
            )}
            {data.map((m) => (
              <tr
                key={m.id}
                className="border-b border-slate-50 hover:bg-slate-50 transition-colors"
              >
                <td className="px-4 py-3">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                      {getInitials(m.firstName, m.lastName)}
                    </div>
                    <div>
                      <div className="font-medium text-slate-800 text-sm">
                        {m.lastName} {m.firstName}
                      </div>
                      <div className="text-xs text-slate-400">
                        {m.id} · {m.passportNumber}
                      </div>
                    </div>
                  </div>
                </td>
                <td className="px-4 py-3 text-sm text-slate-600">
                  {getCitizenshipFlag(m.citizenship)} {m.citizenship}
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    <span
                      className={`px-2 py-0.5 rounded-full text-xs font-medium ${getStatusColor(m.status)}`}
                    >
                      {getStatusLabel(m.status)}
                    </span>
                    {m.violations > 0 && (
                      <span className="text-amber-500">
                        <AlertTriangle size={13} />
                      </span>
                    )}
                  </div>
                </td>
                <td className="px-4 py-3 text-sm text-slate-600">
                  {formatDate(m.registrationExpiry)}
                </td>
                <td className="px-4 py-3 text-sm text-slate-600 max-w-[160px] truncate">
                  {m.employer ?? "—"}
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-1 text-xs text-slate-400">
                    <MapPin size={11} />
                    {m.address.split(",")[0]}
                  </div>
                </td>
                <td className="px-4 py-3">
                  <Link
                    href={`/admin/migrants/${m.id}`}
                    className="text-xs text-blue-600 hover:text-blue-800 font-medium"
                  >
                    Открыть →
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
