"use client";

import { useEffect, useState } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
} from "recharts";
import {
  Users,
  AlertTriangle,
  Clock,
  TrendingUp,
  CheckCircle,
  XCircle,
  MapPin,
  DollarSign,
} from "lucide-react";
import Link from "next/link";
import { formatCurrency, getCitizenshipFlag } from "@/lib/utils";

interface Payment {
  id: string;
  type: string;
  amount: number;
  status: string;
}

interface MigrantSummary {
  id: string;
  firstName: string;
  lastName: string;
  status: string;
  violations: number;
  citizenship: string;
  payments: Payment[];
}

const monthlyData = [
  { month: "Янв", registrations: 32, payments: 96000 },
  { month: "Фев", registrations: 28, payments: 84000 },
  { month: "Мар", registrations: 41, payments: 123000 },
  { month: "Апр", registrations: 35, payments: 105000 },
  { month: "Май", registrations: 22, payments: 66000 },
];

const PIE_COLORS = ["#3b82f6", "#f59e0b", "#ef4444", "#8b5cf6"];

export default function DashboardPage() {
  const [data, setData] = useState<MigrantSummary[]>([]);

  useEffect(() => {
    fetch("/api/migrants")
      .then((r) => r.json())
      .then((d) => { if (Array.isArray(d)) setData(d); })
      .catch(console.error);
  }, []);

  const totalMigrants = data.length;
  const activeMigrants = data.filter((m) => m.status === "active").length;
  const expiredMigrants = data.filter((m) => m.status === "expired").length;
  const blockedMigrants = data.filter((m) => m.status === "blocked").length;

  const totalRevenue = data
    .flatMap((m) => m.payments)
    .filter((p) => p.status === "paid")
    .reduce((sum, p) => sum + p.amount, 0);

  const unpaidFines = data
    .flatMap((m) => m.payments)
    .filter((p) => p.type === "fine" && p.status === "unpaid")
    .reduce((sum, p) => sum + p.amount, 0);

  const citizenshipStats = data.reduce(
    (acc, m) => {
      acc[m.citizenship] = (acc[m.citizenship] ?? 0) + 1;
      return acc;
    },
    {} as Record<string, number>
  );

  const citizenshipData = Object.entries(citizenshipStats)
    .sort((a, b) => b[1] - a[1])
    .map(([name, value]) => ({ name, value }));

  const recentAlerts = data
    .filter((m) => m.status !== "active" || m.violations > 0)
    .slice(0, 5);

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Дашборд</h1>
        <p className="text-slate-500 text-sm mt-1">
          Обзор системы по состоянию на{" "}
          {new Date().toLocaleDateString("ru-RU", {
            day: "numeric",
            month: "long",
            year: "numeric",
          })}
        </p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-4 gap-4">
        <KpiCard
          title="Всего мигрантов"
          value={totalMigrants}
          icon={<Users size={20} className="text-blue-600" />}
          color="blue"
          sub="в системе"
        />
        <KpiCard
          title="Активных"
          value={activeMigrants}
          icon={<CheckCircle size={20} className="text-emerald-600" />}
          color="emerald"
          sub={totalMigrants > 0 ? `${Math.round((activeMigrants / totalMigrants) * 100)}% от общего числа` : "0%"}
        />
        <KpiCard
          title="Нарушений"
          value={expiredMigrants + blockedMigrants}
          icon={<AlertTriangle size={20} className="text-amber-600" />}
          color="amber"
          sub="просрочено или заблокировано"
        />
        <KpiCard
          title="Поступления"
          value={formatCurrency(totalRevenue)}
          icon={<TrendingUp size={20} className="text-violet-600" />}
          color="violet"
          sub="оплачено патентов"
        />
      </div>

      {/* Second row */}
      <div className="grid grid-cols-3 gap-4">
        <div className="col-span-2 bg-white rounded-xl border border-slate-200 p-5">
          <h2 className="font-semibold text-slate-800 mb-4">
            Регистрации по месяцам
          </h2>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={monthlyData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis
                dataKey="month"
                tick={{ fontSize: 12, fill: "#64748b" }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                tick={{ fontSize: 12, fill: "#64748b" }}
                axisLine={false}
                tickLine={false}
              />
              <Tooltip
                contentStyle={{
                  borderRadius: 8,
                  border: "1px solid #e2e8f0",
                  boxShadow: "0 4px 6px -1px rgba(0,0,0,.1)",
                }}
              />
              <Bar dataKey="registrations" fill="#3b82f6" radius={[4, 4, 0, 0]} name="Регистрации" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 p-5">
          <h2 className="font-semibold text-slate-800 mb-4">
            По гражданству
          </h2>
          <ResponsiveContainer width="100%" height={180}>
            <PieChart>
              <Pie
                data={citizenshipData}
                cx="50%"
                cy="50%"
                innerRadius={50}
                outerRadius={80}
                paddingAngle={2}
                dataKey="value"
              >
                {citizenshipData.map((_, index) => (
                  <Cell
                    key={index}
                    fill={PIE_COLORS[index % PIE_COLORS.length]}
                  />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
          <div className="mt-2 space-y-1">
            {citizenshipData.map((item, i) => (
              <div key={item.name} className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <div
                    className="w-2.5 h-2.5 rounded-full"
                    style={{ background: PIE_COLORS[i % PIE_COLORS.length] }}
                  />
                  <span className="text-slate-600">
                    {getCitizenshipFlag(item.name)} {item.name}
                  </span>
                </div>
                <span className="font-medium text-slate-800">{item.value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Third row */}
      <div className="grid grid-cols-3 gap-4">
        <div className="col-span-2 bg-white rounded-xl border border-slate-200 p-5">
          <h2 className="font-semibold text-slate-800 mb-4">
            Финансовые поступления (₽)
          </h2>
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={monthlyData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis
                dataKey="month"
                tick={{ fontSize: 12, fill: "#64748b" }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                tick={{ fontSize: 12, fill: "#64748b" }}
                axisLine={false}
                tickLine={false}
              />
              <Tooltip
                formatter={(v) => [formatCurrency(Number(v)), "Поступления"]}
                contentStyle={{
                  borderRadius: 8,
                  border: "1px solid #e2e8f0",
                }}
              />
              <Line
                type="monotone"
                dataKey="payments"
                stroke="#8b5cf6"
                strokeWidth={2}
                dot={{ fill: "#8b5cf6", r: 4 }}
                name="Поступления"
              />
            </LineChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 p-5">
          <h2 className="font-semibold text-slate-800 mb-4">
            Требуют внимания
          </h2>
          <div className="space-y-3">
            {recentAlerts.map((m) => (
              <Link
                key={m.id}
                href={`/admin/migrants/${m.id}`}
                className="flex items-start gap-3 p-2 rounded-lg hover:bg-slate-50 transition-colors"
              >
                <div
                  className={`mt-0.5 w-2 h-2 rounded-full flex-shrink-0 ${
                    m.status === "blocked"
                      ? "bg-red-500"
                      : m.status === "expired"
                        ? "bg-amber-500"
                        : "bg-blue-500"
                  }`}
                />
                <div className="min-w-0">
                  <div className="text-sm font-medium text-slate-800 truncate">
                    {m.lastName} {m.firstName}
                  </div>
                  <div className="text-xs text-slate-500">
                    {m.status === "blocked"
                      ? "Заблокирован"
                      : m.status === "expired"
                        ? "Документы просрочены"
                        : `${m.violations} нарушений`}
                  </div>
                </div>
              </Link>
            ))}
          </div>
          <div className="mt-4 p-3 bg-red-50 rounded-lg">
            <div className="flex items-center gap-2 text-red-700">
              <DollarSign size={14} />
              <span className="text-xs font-medium">
                Неоплаченные штрафы: {formatCurrency(unpaidFines)}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Status summary */}
      <div className="grid grid-cols-4 gap-4">
        <StatusCard
          icon={<CheckCircle size={16} className="text-emerald-600" />}
          label="Активных"
          value={activeMigrants}
          bg="bg-emerald-50"
        />
        <StatusCard
          icon={<Clock size={16} className="text-amber-600" />}
          label="Просроченных"
          value={expiredMigrants}
          bg="bg-amber-50"
        />
        <StatusCard
          icon={<XCircle size={16} className="text-red-600" />}
          label="Заблокированных"
          value={blockedMigrants}
          bg="bg-red-50"
        />
        <StatusCard
          icon={<MapPin size={16} className="text-blue-600" />}
          label="Онлайн сейчас"
          value={Math.floor(activeMigrants * 0.7)}
          bg="bg-blue-50"
        />
      </div>
    </div>
  );
}

function KpiCard({
  title,
  value,
  icon,
  color,
  sub,
}: {
  title: string;
  value: number | string;
  icon: React.ReactNode;
  color: string;
  sub: string;
}) {
  const bgMap: Record<string, string> = {
    blue: "bg-blue-50",
    emerald: "bg-emerald-50",
    amber: "bg-amber-50",
    violet: "bg-violet-50",
  };
  return (
    <div className="bg-white rounded-xl border border-slate-200 p-5">
      <div className="flex items-center justify-between mb-3">
        <span className="text-sm text-slate-500">{title}</span>
        <div className={`w-9 h-9 rounded-lg ${bgMap[color]} flex items-center justify-center`}>
          {icon}
        </div>
      </div>
      <div className="text-2xl font-bold text-slate-900 mb-1">{value}</div>
      <div className="text-xs text-slate-400">{sub}</div>
    </div>
  );
}

function StatusCard({
  icon,
  label,
  value,
  bg,
}: {
  icon: React.ReactNode;
  label: string;
  value: number;
  bg: string;
}) {
  return (
    <div className={`${bg} rounded-xl p-4 flex items-center gap-3`}>
      {icon}
      <div>
        <div className="text-xl font-bold text-slate-800">{value}</div>
        <div className="text-xs text-slate-500">{label}</div>
      </div>
    </div>
  );
}
