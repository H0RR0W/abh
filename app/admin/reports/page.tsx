"use client";

import { useState, useEffect } from "react";
import { Download, FileText, FileSpreadsheet } from "lucide-react";
import { formatCurrency, getCitizenshipFlag } from "@/lib/utils";

interface Payment {
  type: string;
  amount: number;
  status: string;
}

interface MigrantSummary {
  id: string;
  citizenship: string;
  status: string;
  payments: Payment[];
}

const REPORTS = [
  { title: "Общий реестр мигрантов", desc: "Полный список с персональными данными", format: "Excel" },
  { title: "Просроченные документы", desc: "Мигранты с истекшими сроками регистрации или патентов", format: "PDF" },
  { title: "Финансовые поступления", desc: "Отчёт по платежам патентов, пошлин и штрафов", format: "Excel" },
  { title: "Статистика по странам", desc: "Распределение мигрантов по гражданству", format: "PDF" },
  { title: "Нарушители", desc: "Мигранты с зафиксированными нарушениями", format: "Excel" },
  { title: "Журнал действий инспекторов", desc: "Лог активности сотрудников миграционной службы", format: "CSV" },
];

export default function ReportsPage() {
  const [data, setData] = useState<MigrantSummary[]>([]);

  useEffect(() => {
    fetch("/api/migrants")
      .then((r) => r.json())
      .then((d) => { if (Array.isArray(d)) setData(d); })
      .catch(console.error);
  }, []);

  const citizenshipStats = data.reduce(
    (acc, m) => {
      acc[m.citizenship] = (acc[m.citizenship] ?? 0) + 1;
      return acc;
    },
    {} as Record<string, number>
  );

  const totalRevenue = data
    .flatMap((m) => m.payments)
    .filter((p) => p.status === "paid")
    .reduce((sum, p) => sum + p.amount, 0);

  function handleDownload(title: string) {
    if (title === "Общий реестр мигрантов") {
      window.open("/api/reports/migrants", "_blank");
    } else {
      alert(`Демо: отчёт "${title}" — в реальной системе будет сгенерирован здесь`);
    }
  }

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Отчёты и аналитика</h1>
        <p className="text-slate-500 text-sm mt-1">Сводная статистика и экспорт данных</p>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-white rounded-xl border border-slate-200 p-5">
          <div className="text-sm text-slate-500 mb-3">Всего мигрантов</div>
          <div className="text-3xl font-bold text-slate-900">{data.length}</div>
          <div className="mt-3 space-y-1">
            {Object.entries(citizenshipStats)
              .sort((a, b) => b[1] - a[1])
              .map(([c, n]) => (
                <div key={c} className="flex justify-between text-xs text-slate-500">
                  <span>{getCitizenshipFlag(c)} {c}</span>
                  <span className="font-medium">{n}</span>
                </div>
              ))}
          </div>
        </div>
        <div className="bg-white rounded-xl border border-slate-200 p-5">
          <div className="text-sm text-slate-500 mb-3">Финансовые поступления</div>
          <div className="text-3xl font-bold text-slate-900">
            {formatCurrency(totalRevenue)}
          </div>
          <div className="mt-3 space-y-1">
            {[
              { label: "Патенты", amount: data.flatMap(m => m.payments).filter(p => p.type === "patent" && p.status === "paid").reduce((s, p) => s + p.amount, 0) },
              { label: "Пошлины", amount: data.flatMap(m => m.payments).filter(p => p.type === "duty" && p.status === "paid").reduce((s, p) => s + p.amount, 0) },
              { label: "Штрафы", amount: data.flatMap(m => m.payments).filter(p => p.type === "fine" && p.status === "paid").reduce((s, p) => s + p.amount, 0) },
            ].map(({ label, amount }) => (
              <div key={label} className="flex justify-between text-xs text-slate-500">
                <span>{label}</span>
                <span className="font-medium">{formatCurrency(amount)}</span>
              </div>
            ))}
          </div>
        </div>
        <div className="bg-white rounded-xl border border-slate-200 p-5">
          <div className="text-sm text-slate-500 mb-3">Статусы</div>
          <div className="space-y-2 mt-2">
            {[
              { label: "Активных", count: data.filter(m => m.status === "active").length, color: "bg-emerald-500" },
              { label: "Просроченных", count: data.filter(m => m.status === "expired").length, color: "bg-amber-500" },
              { label: "Заблокированных", count: data.filter(m => m.status === "blocked").length, color: "bg-red-500" },
            ].map(({ label, count, color }) => (
              <div key={label}>
                <div className="flex justify-between text-xs text-slate-600 mb-1">
                  <span>{label}</span>
                  <span className="font-medium">{count}</span>
                </div>
                <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                  <div
                    className={`h-full ${color} rounded-full`}
                    style={{ width: data.length > 0 ? `${(count / data.length) * 100}%` : "0%" }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Reports list */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        <div className="p-5 border-b border-slate-100">
          <h2 className="font-semibold text-slate-800">Доступные отчёты</h2>
        </div>
        <div className="divide-y divide-slate-50">
          {REPORTS.map((r) => (
            <div
              key={r.title}
              className="flex items-center justify-between p-4 hover:bg-slate-50 transition-colors"
            >
              <div className="flex items-center gap-3">
                {r.format === "PDF" ? (
                  <div className="w-9 h-9 bg-red-50 rounded-lg flex items-center justify-center">
                    <FileText size={16} className="text-red-600" />
                  </div>
                ) : r.format === "CSV" ? (
                  <div className="w-9 h-9 bg-blue-50 rounded-lg flex items-center justify-center">
                    <FileText size={16} className="text-blue-600" />
                  </div>
                ) : (
                  <div className="w-9 h-9 bg-emerald-50 rounded-lg flex items-center justify-center">
                    <FileSpreadsheet size={16} className="text-emerald-600" />
                  </div>
                )}
                <div>
                  <div className="text-sm font-medium text-slate-800">{r.title}</div>
                  <div className="text-xs text-slate-400">{r.desc}</div>
                </div>
              </div>
              <button
                onClick={() => handleDownload(r.title)}
                className="flex items-center gap-2 px-3 py-1.5 border border-slate-200 rounded-lg text-xs text-slate-600 hover:bg-white hover:border-blue-300 hover:text-blue-600 transition-colors"
              >
                <Download size={13} />
                {r.format}
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
