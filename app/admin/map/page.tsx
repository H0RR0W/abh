"use client";

import dynamic from "next/dynamic";
import { useState, useEffect } from "react";
import { Migrant } from "@/lib/types";
import { Users, MapPin, AlertTriangle } from "lucide-react";
import { getCitizenshipFlag } from "@/lib/utils";
import Link from "next/link";

const MigrantsMap = dynamic(() => import("@/components/MigrantsMap"), {
  ssr: false,
  loading: () => (
    <div className="w-full h-full bg-slate-100 rounded-xl flex items-center justify-center">
      <div className="text-slate-400 text-sm">Загружаем карту...</div>
    </div>
  ),
});

const STATUS_FILTERS = [
  { value: "all", label: "Все" },
  { value: "active", label: "Активные" },
  { value: "expired", label: "Просроченные" },
  { value: "blocked", label: "Заблокированные" },
];

export default function MapPage() {
  const [statusFilter, setStatusFilter] = useState("all");
  const [allData, setAllData] = useState<Migrant[]>([]);

  useEffect(() => {
    fetch("/api/migrants")
      .then((r) => r.json())
      .then((d) => { if (Array.isArray(d)) setAllData(d); })
      .catch(console.error);
  }, []);

  const filtered = statusFilter === "all"
    ? allData
    : allData.filter((m) => m.status === statusFilter);

  return (
    <div className="p-6 h-screen flex flex-col gap-5">
      <div className="flex items-center justify-between flex-shrink-0">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Карта мигрантов</h1>
          <p className="text-slate-500 text-sm mt-1">
            {filtered.length} отображается на карте
          </p>
        </div>
        <div className="flex gap-2">
          {STATUS_FILTERS.map(({ value, label }) => (
            <button
              key={value}
              onClick={() => setStatusFilter(value)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                statusFilter === value
                  ? "bg-blue-600 text-white"
                  : "bg-white border border-slate-200 text-slate-600 hover:bg-slate-50"
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      <div className="flex gap-4 flex-1 min-h-0">
        {/* Map */}
        <div className="flex-1 min-h-0">
          <MigrantsMap migrants={filtered} />
        </div>

        {/* Sidebar list */}
        <div className="w-72 bg-white rounded-xl border border-slate-200 flex flex-col overflow-hidden">
          <div className="p-4 border-b border-slate-100">
            <div className="flex items-center gap-2 text-sm font-semibold text-slate-700">
              <Users size={15} />
              Список ({filtered.length})
            </div>
          </div>
          <div className="flex-1 overflow-y-auto">
            {filtered.map((m) => (
              <Link
                key={m.id}
                href={`/admin/migrants/${m.id}`}
                className="flex items-start gap-3 p-3 border-b border-slate-50 hover:bg-slate-50 transition-colors"
              >
                <div className="mt-1 flex flex-col items-center">
                  <div
                    className={`w-2.5 h-2.5 rounded-full ${
                      m.status === "active"
                        ? "bg-emerald-500"
                        : m.status === "expired"
                          ? "bg-amber-500"
                          : "bg-red-500"
                    }`}
                  />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="text-sm font-medium text-slate-800 truncate">
                    {m.lastName} {m.firstName}
                  </div>
                  <div className="text-xs text-slate-400 flex items-center gap-1 mt-0.5">
                    {getCitizenshipFlag(m.citizenship)}
                    <span>{m.citizenship}</span>
                  </div>
                  <div className="text-xs text-slate-400 flex items-center gap-1 mt-0.5">
                    <MapPin size={10} />
                    {m.address.split(",")[0]}
                  </div>
                </div>
                {m.violations > 0 && (
                  <AlertTriangle size={14} className="text-amber-500 flex-shrink-0 mt-0.5" />
                )}
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
