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
  Bell,
  RefreshCw,
  ChevronRight,
  WifiOff,
} from "lucide-react";
import Link from "next/link";
import { formatCurrency, getCitizenshipFlag } from "@/lib/utils";


const PIE_COLORS = ["#3b82f6", "#f59e0b", "#ef4444", "#8b5cf6"];

interface Stats {
  total: number;
  active: number;
  expired: number;
  blocked: number;
  totalRevenue: number;
  monthlyData: { month: string; registrations: number; payments: number }[];
  citizenshipData: { name: string; value: number }[];
}

interface GpsLostMigrant {
  id: string;
  firstName: string;
  lastName: string;
  lastSeen: string;
  address: string;
}

interface StaffMe {
  role: string;
  districts: string[];
}

export default function DashboardPage() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [notifRunning, setNotifRunning] = useState(false);
  const [notifResult, setNotifResult] = useState<{ sent: number; checked: number } | null>(null);
  const [notifThreshold, setNotifThreshold] = useState(30);
  const [pendingVerifications, setPendingVerifications] = useState(0);
  const [gpsLost, setGpsLost] = useState<GpsLostMigrant[]>([]);
  const [gpsAlertDismissed, setGpsAlertDismissed] = useState(false);
  const [staffMe, setStaffMe] = useState<StaffMe | null>(null);

  function loadStats() {
    fetch("/api/stats")
      .then((r) => r.json())
      .then((d) => { if (d && !d.error) setStats(d); })
      .catch(console.error);
    fetch("/api/inspections?status=pending&type=verification")
      .then((r) => r.json())
      .then((d) => { if (Array.isArray(d)) setPendingVerifications(d.length); })
      .catch(console.error);
    fetch("/api/admin/gps-lost")
      .then((r) => r.json())
      .then((d) => { if (Array.isArray(d.migrants)) setGpsLost(d.migrants); })
      .catch(console.error);
  }

  useEffect(() => {
    loadStats();
    fetch("/api/me/staff")
      .then((r) => r.json())
      .then((d) => { if (d && !d.error) setStaffMe({ role: d.role, districts: d.districts ?? [] }); })
      .catch(console.error);
    // Refresh GPS status every 2 minutes
    const interval = setInterval(() => {
      fetch("/api/admin/gps-lost")
        .then((r) => r.json())
        .then((d) => { if (Array.isArray(d.migrants)) { setGpsLost(d.migrants); setGpsAlertDismissed(false); } })
        .catch(console.error);
    }, 120_000);
    return () => clearInterval(interval);
  }, []);

  async function runNotifications() {
    setNotifRunning(true);
    setNotifResult(null);
    try {
      const res = await fetch(`/api/cron/notifications?threshold=${notifThreshold}`, {
        method: "POST",
        headers: { "x-cron-secret": "demo-secret" },
      });
      const json = await res.json();
      setNotifResult({ sent: json.sent ?? 0, checked: json.checked ?? 0 });
    } catch {
      setNotifResult({ sent: 0, checked: 0 });
    } finally {
      setNotifRunning(false);
    }
  }

  const totalMigrants = stats?.total ?? 0;
  const activeMigrants = stats?.active ?? 0;
  const expiredMigrants = stats?.expired ?? 0;
  const blockedMigrants = stats?.blocked ?? 0;
  const totalRevenue = stats?.totalRevenue ?? 0;
  const monthlyData = stats?.monthlyData ?? [];
  const citizenshipData = stats?.citizenshipData ?? [];

  return (
    <div className="p-6 space-y-6 bg-[#F0F2F5] min-h-screen">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-xl font-bold text-slate-900 uppercase tracking-wide">Дашборд</h1>
          <p className="text-slate-500 text-xs mt-1 uppercase tracking-wider">
            Обзор системы по состоянию на{" "}
            {new Date().toLocaleDateString("ru-RU", {
              day: "numeric",
              month: "long",
              year: "numeric",
            })}
          </p>
        </div>
        <div className="flex items-center gap-3">
          {notifResult && (
            <span className="text-sm text-emerald-600 font-medium">
              Отправлено {notifResult.sent} из {notifResult.checked}
            </span>
          )}
          <div className="flex items-center gap-2 bg-white border border-slate-200 rounded-lg px-3 py-2">
            <span className="text-xs text-slate-500 whitespace-nowrap">Порог (дней):</span>
            <select
              value={notifThreshold}
              onChange={(e) => { setNotifResult(null); setNotifThreshold(Number(e.target.value)); }}
              disabled={notifRunning}
              className="text-sm font-medium text-slate-700 bg-transparent focus:outline-none cursor-pointer"
            >
              <option value={7}>7 дней</option>
              <option value={14}>14 дней</option>
              <option value={30}>30 дней</option>
              <option value={60}>60 дней</option>
              <option value={90}>90 дней</option>
            </select>
          </div>
          <button
            onClick={runNotifications}
            disabled={notifRunning}
            className="flex items-center gap-2 px-4 py-2 bg-[#1E3A5F] hover:bg-[#0C2340] disabled:opacity-60 text-white text-sm font-medium rounded-md transition-colors"
          >
            {notifRunning ? (
              <RefreshCw size={15} className="animate-spin" />
            ) : (
              <Bell size={15} />
            )}
            Отправить уведомления
          </button>
        </div>
      </div>

      {/* District responsibility banner */}
      {staffMe && (staffMe.role === "inspector" || staffMe.role === "operator") && staffMe.districts.length > 0 && (
        <div className="bg-white border border-[#1E3A5F]/20 rounded-md px-4 py-3 flex items-center gap-3 flex-wrap">
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wide whitespace-nowrap">Ваша зона ответственности:</span>
          <div className="flex flex-wrap gap-2">
            {staffMe.districts.map((d) => (
              <span
                key={d}
                className="inline-block px-3 py-1 rounded-full text-xs font-semibold bg-[#0C2340] text-white cursor-default"
              >
                {d}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* GPS Lost Alert */}
      {gpsLost.length > 0 && !gpsAlertDismissed && (
        <div className="bg-red-50 border border-red-200 rounded-md p-4">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-md bg-red-600 flex items-center justify-center flex-shrink-0">
                <WifiOff size={16} className="text-white" />
              </div>
              <div>
                <div className="font-semibold text-red-800 text-sm">
                  GPS-сигнал потерян — {gpsLost.length}{" "}
                  {gpsLost.length === 1 ? "мигрант" : gpsLost.length < 5 ? "мигранта" : "мигрантов"}
                </div>
                <div className="text-xs text-red-500 mt-0.5">
                  Нет данных о местоположении более 24 часов
                </div>
              </div>
            </div>
            <div className="flex items-center gap-3 flex-shrink-0">
              <Link
                href="/admin/alerts"
                className="text-xs font-medium text-red-700 hover:text-red-900 underline underline-offset-2"
              >
                Перейти к списку
              </Link>
              <button
                onClick={() => setGpsAlertDismissed(true)}
                className="text-red-300 hover:text-red-500 transition-colors"
                title="Скрыть"
              >
                <XCircle size={16} />
              </button>
            </div>
          </div>
        </div>
      )}

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
          sub="оплачено сборов"
        />
      </div>

      {/* Second row */}
      <div className="grid grid-cols-3 gap-4">
        <div className="col-span-2 bg-white rounded-md border border-slate-200 p-5 shadow-sm">
          <h2 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-4">
            Регистрации по месяцам
          </h2>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={monthlyData} margin={{ top: 5, right: 10, bottom: 0, left: -10 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
              <XAxis
                dataKey="month"
                tick={{ fontSize: 12, fill: "#64748b" }}
                axisLine={{ stroke: "#cbd5e1" }}
                tickLine={false}
              />
              <YAxis
                tick={{ fontSize: 12, fill: "#64748b" }}
                axisLine={false}
                tickLine={false}
                allowDecimals={false}
                width={30}
              />
              <Tooltip
                contentStyle={{
                  borderRadius: 4,
                  border: "1px solid #e2e8f0",
                  boxShadow: "0 2px 4px rgba(0,0,0,.08)",
                  fontSize: 12,
                }}
              />
              <Bar dataKey="registrations" fill="#1E3A5F" radius={[3, 3, 0, 0]} name="Регистрации" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-white rounded-md border border-slate-200 p-5 shadow-sm">
          <h2 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-4">
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
                    {item.name}
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
        <div className="col-span-2 bg-white rounded-md border border-slate-200 p-5 shadow-sm">
          <h2 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-4">
            Финансовые поступления (₽)
          </h2>
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={monthlyData} margin={{ top: 5, right: 10, bottom: 0, left: -10 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
              <XAxis
                dataKey="month"
                tick={{ fontSize: 12, fill: "#64748b" }}
                axisLine={{ stroke: "#cbd5e1" }}
                tickLine={false}
              />
              <YAxis
                tick={{ fontSize: 12, fill: "#64748b" }}
                axisLine={false}
                tickLine={false}
                width={50}
                tickFormatter={(v) => v >= 1000 ? `${v/1000}к` : v}
              />
              <Tooltip
                formatter={(v) => [formatCurrency(Number(v)), "Поступления"]}
                contentStyle={{
                  borderRadius: 4,
                  border: "1px solid #e2e8f0",
                  fontSize: 12,
                }}
              />
              <Line
                type="monotone"
                dataKey="payments"
                stroke="#1E3A5F"
                strokeWidth={2}
                dot={{ fill: "#1E3A5F", r: 3 }}
                name="Поступления"
              />
            </LineChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-white rounded-md border border-slate-200 p-5 shadow-sm flex flex-col">
          <h2 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-4">Сводка нарушений</h2>
          <div className="flex flex-col gap-2 flex-1">
            <Link
              href="/admin/migrants?status=expired"
              className="flex items-center justify-between p-3 rounded-md border border-slate-100 hover:border-amber-300 hover:bg-amber-50 transition-colors group"
            >
              <div className="flex items-center gap-3">
                <div className="w-7 h-7 rounded flex items-center justify-center bg-amber-50 group-hover:bg-amber-100 transition-colors">
                  <Clock size={14} className="text-amber-600" />
                </div>
                <div>
                  <div className="text-sm font-medium text-slate-800">Просроченные</div>
                  <div className="text-xs text-slate-400">Истёк срок регистрации</div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xl font-bold text-amber-700">{expiredMigrants}</span>
                <ChevronRight size={14} className="text-slate-300" />
              </div>
            </Link>

            <Link
              href="/admin/migrants?status=blocked"
              className="flex items-center justify-between p-3 rounded-md border border-slate-100 hover:border-red-300 hover:bg-red-50 transition-colors group"
            >
              <div className="flex items-center gap-3">
                <div className="w-7 h-7 rounded flex items-center justify-center bg-red-50 group-hover:bg-red-100 transition-colors">
                  <XCircle size={14} className="text-red-600" />
                </div>
                <div>
                  <div className="text-sm font-medium text-slate-800">Заблокированные</div>
                  <div className="text-xs text-slate-400">Требуют проверки</div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xl font-bold text-red-700">{blockedMigrants}</span>
                <ChevronRight size={14} className="text-slate-300" />
              </div>
            </Link>

            <Link
              href="/admin/tasks?status=pending&type=verification"
              className="flex items-center justify-between p-3 rounded-md border border-slate-100 hover:border-slate-300 hover:bg-slate-50 transition-colors group"
            >
              <div className="flex items-center gap-3">
                <div className="w-7 h-7 rounded flex items-center justify-center bg-slate-50 group-hover:bg-slate-100 transition-colors">
                  <CheckCircle size={14} className="text-slate-500" />
                </div>
                <div>
                  <div className="text-sm font-medium text-slate-800">Верификации</div>
                  <div className="text-xs text-slate-400">Ожидают проверки selfie</div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {pendingVerifications > 0 && (
                  <span className="text-xl font-bold text-slate-700">{pendingVerifications}</span>
                )}
                <ChevronRight size={14} className="text-slate-300" />
              </div>
            </Link>

            <Link
              href="/admin/tasks?status=pending"
              className="flex items-center justify-between p-3 rounded-md border border-slate-100 hover:border-blue-300 hover:bg-blue-50 transition-colors group"
            >
              <div className="flex items-center gap-3">
                <div className="w-7 h-7 rounded flex items-center justify-center bg-blue-50 group-hover:bg-blue-100 transition-colors">
                  <Bell size={14} className="text-blue-700" />
                </div>
                <div>
                  <div className="text-sm font-medium text-slate-800">Открытые задания</div>
                  <div className="text-xs text-slate-400">Ожидают исполнения</div>
                </div>
              </div>
              <ChevronRight size={14} className="text-slate-300" />
            </Link>
          </div>
        </div>
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
  const borderMap: Record<string, string> = {
    blue: "border-l-4 border-l-blue-800",
    emerald: "border-l-4 border-l-green-700",
    amber: "border-l-4 border-l-amber-600",
    violet: "border-l-4 border-l-red-700",
  };
  return (
    <div className={`bg-white rounded-md border border-slate-200 p-5 shadow-sm ${borderMap[color]}`}>
      <div className="flex items-center justify-between mb-3">
        <span className="text-xs text-slate-500 uppercase tracking-wide font-semibold">{title}</span>
        <div className="flex-shrink-0">
          {icon}
        </div>
      </div>
      <div className="text-2xl font-bold text-slate-900 mb-1">{value}</div>
      <div className="text-xs text-slate-400">{sub}</div>
    </div>
  );
}

