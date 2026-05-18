"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import {
  WifiOff,
  RefreshCw,
  Search,
  MapPin,
  Clock,
  ChevronLeft,
  ChevronRight,
  AlertTriangle,
  ExternalLink,
} from "lucide-react";

interface GpsLostMigrant {
  id: string;
  firstName: string;
  lastName: string;
  lastSeen: string;
  address: string;
}

const PAGE_SIZE = 20;

function formatHoursAgo(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(hours / 24);
  if (days >= 1) return `${days} ${days === 1 ? "день" : days < 5 ? "дня" : "дней"} назад`;
  return `${hours} ч назад`;
}

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleString("ru-RU", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function getSeverity(dateStr: string): "critical" | "high" | "medium" {
  const hours = (Date.now() - new Date(dateStr).getTime()) / 3600000;
  if (hours >= 72) return "critical";
  if (hours >= 48) return "high";
  return "medium";
}

const SEVERITY_LABELS = {
  critical: { label: "Критично", color: "text-red-400", bg: "bg-red-500/10 border-red-500/30" },
  high: { label: "Высокий", color: "text-orange-400", bg: "bg-orange-500/10 border-orange-500/30" },
  medium: { label: "Средний", color: "text-amber-400", bg: "bg-amber-500/10 border-amber-500/30" },
};

export default function AlertsPage() {
  const [migrants, setMigrants] = useState<GpsLostMigrant[]>([]);
  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [search, setSearch] = useState("");
  const [severityFilter, setSeverityFilter] = useState<"all" | "critical" | "high" | "medium">("all");
  const [page, setPage] = useState(1);
  const [refreshing, setRefreshing] = useState(false);

  const fetchData = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    else setRefreshing(true);
    try {
      const res = await fetch("/api/admin/gps-lost");
      const data = await res.json();
      if (Array.isArray(data.migrants)) setMigrants(data.migrants);
      setLastUpdated(new Date());
    } catch {}
    setLoading(false);
    setRefreshing(false);
  }, []);

  useEffect(() => {
    fetchData();
    const interval = setInterval(() => fetchData(true), 120_000);
    return () => clearInterval(interval);
  }, [fetchData]);

  // Reset page when filters change
  useEffect(() => { setPage(1); }, [search, severityFilter]);

  const filtered = migrants.filter((m) => {
    const matchSearch =
      !search ||
      `${m.firstName} ${m.lastName}`.toLowerCase().includes(search.toLowerCase()) ||
      m.address.toLowerCase().includes(search.toLowerCase());
    const matchSeverity = severityFilter === "all" || getSeverity(m.lastSeen) === severityFilter;
    return matchSearch && matchSeverity;
  });

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const paginated = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const counts = {
    critical: migrants.filter((m) => getSeverity(m.lastSeen) === "critical").length,
    high: migrants.filter((m) => getSeverity(m.lastSeen) === "high").length,
    medium: migrants.filter((m) => getSeverity(m.lastSeen) === "medium").length,
  };

  return (
    <div className="flex-1 bg-[#F0F2F5] min-h-screen">
      {/* Header */}
      <div className="bg-white border-b border-slate-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2 text-sm text-slate-500 mb-1">
              <Link href="/admin/dashboard" className="hover:text-[#1E3A5F]">Главная</Link>
              <span>/</span>
              <span className="text-slate-700">Алерты</span>
            </div>
            <h1 className="text-lg font-bold text-[#0C2340] flex items-center gap-2">
              <WifiOff size={18} className="text-red-500" />
              Алерты GPS-мониторинга
            </h1>
          </div>
          <div className="flex items-center gap-3">
            {lastUpdated && (
              <span className="text-xs text-slate-400">
                Обновлено: {lastUpdated.toLocaleTimeString("ru-RU", { hour: "2-digit", minute: "2-digit" })}
              </span>
            )}
            <button
              onClick={() => fetchData(true)}
              disabled={refreshing}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs border border-slate-200 rounded text-slate-600 hover:bg-slate-50 transition-colors"
            >
              <RefreshCw size={12} className={refreshing ? "animate-spin" : ""} />
              Обновить
            </button>
          </div>
        </div>
      </div>

      <div className="p-6 space-y-4">
        {/* Summary cards */}
        <div className="grid grid-cols-3 gap-4">
          {(["critical", "high", "medium"] as const).map((s) => {
            const sv = SEVERITY_LABELS[s];
            return (
              <button
                key={s}
                onClick={() => setSeverityFilter(severityFilter === s ? "all" : s)}
                className={`bg-white border rounded-lg p-4 text-left transition-all ${
                  severityFilter === s ? "ring-2 ring-[#1E3A5F] border-[#1E3A5F]" : "border-slate-200 hover:border-slate-300"
                }`}
              >
                <div className={`text-2xl font-bold ${sv.color}`}>{counts[s]}</div>
                <div className="text-xs text-slate-500 mt-1">{sv.label} приоритет</div>
                <div className="text-[10px] text-slate-400 mt-0.5">
                  {s === "critical" ? "≥ 72 часов" : s === "high" ? "48–72 часа" : "24–48 часов"}
                </div>
              </button>
            );
          })}
        </div>

        {/* Filters */}
        <div className="bg-white border border-slate-200 rounded-lg p-4 flex items-center gap-3">
          <div className="relative flex-1 max-w-xs">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Поиск по ФИО или адресу..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 text-sm border border-slate-200 rounded focus:outline-none focus:ring-1 focus:ring-[#1E3A5F]"
            />
          </div>
          <div className="text-xs text-slate-400 ml-auto">
            Найдено: <span className="font-semibold text-slate-700">{filtered.length}</span> из {migrants.length}
          </div>
        </div>

        {/* Table */}
        <div className="bg-white border border-slate-200 rounded-lg overflow-hidden">
          {loading ? (
            <div className="py-16 text-center text-slate-400 text-sm">Загрузка...</div>
          ) : paginated.length === 0 ? (
            <div className="py-16 text-center">
              <WifiOff size={32} className="text-slate-200 mx-auto mb-3" />
              <div className="text-sm text-slate-400">
                {migrants.length === 0 ? "Все мигранты на связи" : "Нет результатов по фильтру"}
              </div>
            </div>
          ) : (
            <>
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-100 bg-slate-50">
                    <th className="text-left text-xs text-slate-500 font-semibold uppercase tracking-wide px-4 py-3">Мигрант</th>
                    <th className="text-left text-xs text-slate-500 font-semibold uppercase tracking-wide px-4 py-3">Адрес регистрации</th>
                    <th className="text-left text-xs text-slate-500 font-semibold uppercase tracking-wide px-4 py-3">Последний сигнал</th>
                    <th className="text-left text-xs text-slate-500 font-semibold uppercase tracking-wide px-4 py-3">Приоритет</th>
                    <th className="px-4 py-3"></th>
                  </tr>
                </thead>
                <tbody>
                  {paginated.map((m, i) => {
                    const sev = getSeverity(m.lastSeen);
                    const sv = SEVERITY_LABELS[sev];
                    return (
                      <tr
                        key={m.id}
                        className={`border-b border-slate-50 hover:bg-slate-50/50 transition-colors ${
                          i % 2 === 0 ? "" : "bg-slate-50/30"
                        }`}
                      >
                        <td className="px-4 py-3">
                          <div className="font-medium text-slate-800">
                            {m.lastName} {m.firstName}
                          </div>
                          <div className="text-xs text-slate-400 mt-0.5">ID: {m.id.slice(0, 8)}...</div>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-1 text-slate-600">
                            <MapPin size={12} className="text-slate-400 flex-shrink-0" />
                            <span className="truncate max-w-[200px]">{m.address || "—"}</span>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-1 text-slate-600">
                            <Clock size={12} className="text-slate-400 flex-shrink-0" />
                            <span>{formatDate(m.lastSeen)}</span>
                          </div>
                          <div className="text-xs text-red-500 mt-0.5 font-medium">{formatHoursAgo(m.lastSeen)}</div>
                        </td>
                        <td className="px-4 py-3">
                          <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium border ${sv.bg} ${sv.color}`}>
                            <AlertTriangle size={10} />
                            {sv.label}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-right">
                          <Link
                            href={`/admin/migrants/${m.id}?tab=location`}
                            className="inline-flex items-center gap-1 text-xs text-[#1E3A5F] hover:underline font-medium"
                          >
                            Открыть
                            <ExternalLink size={11} />
                          </Link>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex items-center justify-between px-4 py-3 border-t border-slate-100">
                  <span className="text-xs text-slate-400">
                    Страница {page} из {totalPages} · записи {(page - 1) * PAGE_SIZE + 1}–{Math.min(page * PAGE_SIZE, filtered.length)} из {filtered.length}
                  </span>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => setPage((p) => Math.max(1, p - 1))}
                      disabled={page === 1}
                      className="p-1.5 rounded border border-slate-200 text-slate-500 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed"
                    >
                      <ChevronLeft size={14} />
                    </button>
                    {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                      let p: number;
                      if (totalPages <= 5) p = i + 1;
                      else if (page <= 3) p = i + 1;
                      else if (page >= totalPages - 2) p = totalPages - 4 + i;
                      else p = page - 2 + i;
                      return (
                        <button
                          key={p}
                          onClick={() => setPage(p)}
                          className={`w-7 h-7 rounded border text-xs font-medium transition-colors ${
                            p === page
                              ? "bg-[#1E3A5F] text-white border-[#1E3A5F]"
                              : "border-slate-200 text-slate-600 hover:bg-slate-50"
                          }`}
                        >
                          {p}
                        </button>
                      );
                    })}
                    <button
                      onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                      disabled={page === totalPages}
                      className="p-1.5 rounded border border-slate-200 text-slate-500 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed"
                    >
                      <ChevronRight size={14} />
                    </button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
