"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, useEffect } from "react";
import {
  LayoutDashboard,
  Users,
  Map,
  Shield,
  Bell,
  Settings,
  LogOut,
  FileText,
  X,
  CheckCircle,
  AlertTriangle,
  Clock,
  ClipboardList,
  MessageCircle,
  WifiOff,
  ChevronRight,
} from "lucide-react";
import { hasPermission, ROLE_LABELS, Permission } from "@/lib/roles";

type NotifType = "blocked" | "expired" | "payment" | "violation";

interface LiveNotification {
  type: NotifType;
  text: string;
  href: string;
  time: string;
  timestamp: string;
}

const NOTIF_STYLE: Record<NotifType, { icon: React.ElementType; color: string; bg: string }> = {
  blocked:   { icon: AlertTriangle, color: "text-red-400",    bg: "bg-red-500/10" },
  expired:   { icon: Clock,         color: "text-amber-400",  bg: "bg-amber-500/10" },
  payment:   { icon: CheckCircle,   color: "text-emerald-400",bg: "bg-emerald-500/10" },
  violation: { icon: AlertTriangle, color: "text-orange-400", bg: "bg-orange-500/10" },
};

interface GpsLostMigrant {
  id: string;
  firstName: string;
  lastName: string;
  lastSeen: string;
  address: string;
}

interface StaffInfo {
  id: string;
  name: string;
  email: string;
  role: string;
  roleLabel: string;
}

export default function AdminSidebar() {
  const pathname = usePathname();
  const [showNotif, setShowNotif] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [notifications, setNotifications] = useState<LiveNotification[]>([]);
  const [msgCount, setMsgCount] = useState(0);
  const [conversations, setConversations] = useState<{ migrant: { id: string }; lastMigrantAt: string | null }[]>([]);
  const [gpsLost, setGpsLost] = useState<GpsLostMigrant[]>([]);
  const [staffInfo, setStaffInfo] = useState<StaffInfo | null>(null);

  // Fetch live notifications every 60s
  useEffect(() => {
    function fetchNotifs() {
      fetch("/api/admin/notifications")
        .then((r) => r.json())
        .then((d) => { if (Array.isArray(d.notifications)) setNotifications(d.notifications); })
        .catch(() => {});
    }
    fetchNotifs();
    const interval = setInterval(fetchNotifs, 60_000);
    return () => clearInterval(interval);
  }, []);

  // Fetch current staff info
  useEffect(() => {
    fetch("/api/me/staff")
      .then((r) => r.json())
      .then((d) => { if (d.role) setStaffInfo(d); })
      .catch(() => {});
  }, []);

  // Fetch conversations list every 30s
  useEffect(() => {
    function fetchConvs() {
      fetch("/api/admin/messages")
        .then((r) => r.json())
        .then((d) => { if (Array.isArray(d.conversations)) setConversations(d.conversations); })
        .catch(() => {});
    }
    fetchConvs();
    const interval = setInterval(fetchConvs, 30000);
    return () => clearInterval(interval);
  }, []);

  // Fetch GPS-lost migrants every 5 minutes
  useEffect(() => {
    function fetchGpsLost() {
      fetch("/api/admin/gps-lost")
        .then((r) => r.json())
        .then((d) => { if (Array.isArray(d.migrants)) setGpsLost(d.migrants); })
        .catch(() => {});
    }
    fetchGpsLost();
    const interval = setInterval(fetchGpsLost, 300_000);
    return () => clearInterval(interval);
  }, []);

  // Recalculate unread count from localStorage every 2s
  useEffect(() => {
    function recalc() {
      const readAt: Record<string, string> = JSON.parse(localStorage.getItem("staffReadAt") ?? "{}");
      let count = 0;
      for (const conv of conversations) {
        if (!conv.lastMigrantAt) continue;
        const lastRead = readAt[conv.migrant.id];
        if (!lastRead || new Date(conv.lastMigrantAt) > new Date(lastRead)) count++;
      }
      setMsgCount(count);
    }
    recalc();
    const interval = setInterval(recalc, 2000);
    return () => clearInterval(interval);
  }, [conversations]);

  async function handleLogout() {
    await fetch("/api/auth/logout", { method: "POST" });
    window.location.href = "/login";
  }

  const role = staffInfo?.role ?? "";

  // Nav items with required permission (undefined = visible to all staff)
  const allNavItems: { href: string; label: string; icon: React.ElementType; badge?: number; permission?: Permission }[] = [
    { href: "/admin/dashboard", label: "Дашборд", icon: LayoutDashboard },
    { href: "/admin/migrants", label: "Мигранты", icon: Users, permission: "migrants.view" },
    { href: "/admin/map", label: "Карта", icon: Map, permission: "map.view" },
    { href: "/admin/tasks", label: "Задания", icon: ClipboardList, permission: "tasks.view" },
    { href: "/admin/alerts", label: "Алерты", icon: WifiOff, badge: gpsLost.length, permission: "alerts.view" },
    { href: "/admin/messages", label: "Обращения", icon: MessageCircle, badge: msgCount, permission: "messages.view" },
    { href: "/admin/reports", label: "Отчёты", icon: FileText, permission: "reports.view" },
    { href: "/admin/staff", label: "Сотрудники", icon: Users, permission: "staff.manage" },
  ];

  const navItems = allNavItems.filter(({ permission }) => {
    if (!permission) return true;
    if (!role) return true; // show all while loading
    return hasPermission(role, permission);
  });

  // Initials from name
  const initials = staffInfo?.name
    ? staffInfo.name.split(" ").map((w) => w[0]).slice(0, 2).join("").toUpperCase()
    : "АП";

  return (
    <>
      <aside className="w-64 min-h-screen bg-[#0C2340] text-white flex flex-col">
        <div className="border-t-2 border-amber-500 p-5 border-b border-[#1A3A5C]">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded bg-[#1A3A5C] flex items-center justify-center">
              <Shield size={18} />
            </div>
            <div>
              <div className="font-bold text-sm leading-tight tracking-wide uppercase">ЕЦСМУ</div>
              <div className="text-blue-300 text-xs opacity-80">Республика Абхазия</div>
            </div>
          </div>
        </div>

        <div className="p-4 border-b border-[#1A3A5C]">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded bg-[#1A3A5C] flex items-center justify-center text-xs font-bold">
              {initials}
            </div>
            <div>
              <div className="text-sm font-medium">{staffInfo?.name ?? "Загрузка..."}</div>
              {staffInfo?.roleLabel && (
                <div className="text-blue-300 text-xs opacity-70">{staffInfo.roleLabel}</div>
              )}
            </div>
          </div>
        </div>

        <nav className="flex-1 p-3">
          <div className="text-blue-400 text-[10px] font-bold uppercase tracking-widest px-3 mb-2 opacity-70">
            Навигация
          </div>
          {navItems.map(({ href, label, icon: Icon, badge }) => {
            const active = pathname.startsWith(href);
            return (
              <Link
                key={href}
                href={href}
                className={`flex items-center gap-3 px-3 py-2.5 rounded mb-0.5 text-sm transition-colors ${
                  active
                    ? "bg-[#1A3A5C] text-white"
                    : "text-blue-200 hover:bg-[#162F4A] hover:text-white"
                }`}
              >
                <Icon size={16} />
                {label}
                {badge !== undefined && badge > 0 && (
                  <span className="ml-auto bg-red-500 text-white text-xs rounded w-5 h-5 flex items-center justify-center font-bold">
                    {badge > 99 ? "99+" : badge}
                  </span>
                )}
              </Link>
            );
          })}

          <div className="text-blue-400 text-[10px] font-bold uppercase tracking-widest px-3 mb-2 mt-5 opacity-70">
            Система
          </div>
          <button
            onClick={() => setShowNotif(true)}
            className="flex items-center gap-3 px-3 py-2.5 rounded mb-0.5 text-sm text-blue-200 hover:bg-[#162F4A] hover:text-white w-full transition-colors"
          >
            <Bell size={16} />
            Уведомления
            {(notifications.length + gpsLost.length) > 0 && (
              <span className="ml-auto bg-red-500 text-white text-xs rounded w-5 h-5 flex items-center justify-center">
                {Math.min(notifications.length + gpsLost.length, 99)}
              </span>
            )}
          </button>
          <button
            onClick={() => setShowSettings(true)}
            className="flex items-center gap-3 px-3 py-2.5 rounded mb-0.5 text-sm text-blue-200 hover:bg-[#162F4A] hover:text-white w-full transition-colors"
          >
            <Settings size={16} />
            Настройки
          </button>
        </nav>

        <div className="p-3 border-t border-[#1A3A5C]">
          <button
            onClick={handleLogout}
            className="flex items-center gap-3 px-3 py-2.5 rounded text-sm text-blue-200 hover:bg-[#162F4A] hover:text-white w-full transition-colors"
          >
            <LogOut size={16} />
            Выйти
          </button>
        </div>
      </aside>

      {/* Notifications panel */}
      {showNotif && (
        <div className="fixed inset-0 z-50 flex">
          <div className="absolute inset-0 bg-black/40" onClick={() => setShowNotif(false)} />
          <div className="relative ml-64 mt-0 w-80 bg-[#0C2340] border-l border-[#1A3A5C] shadow-md flex flex-col h-screen">
            <div className="flex items-center justify-between p-4 border-b border-[#1A3A5C]">
              <div className="font-semibold text-white text-xs uppercase tracking-widest">Уведомления</div>
              <button onClick={() => setShowNotif(false)} className="text-blue-300 hover:text-white">
                <X size={16} />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-3 space-y-2">
              {gpsLost.length > 0 && (
                <a
                  href="/admin/alerts"
                  onClick={() => setShowNotif(false)}
                  className="bg-red-500/10 border border-red-500/20 rounded-md p-3 flex items-center gap-3 hover:bg-red-500/20 transition-colors"
                >
                  <WifiOff size={15} className="text-red-400 flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <div className="text-xs text-red-300 font-semibold leading-snug">
                      {gpsLost.length} {gpsLost.length === 1 ? "мигрант" : gpsLost.length < 5 ? "мигранта" : "мигрантов"} без GPS-сигнала
                    </div>
                    <div className="text-xs text-red-400/70 mt-0.5">Нет данных более 24 часов</div>
                  </div>
                  <ChevronRight size={13} className="text-red-400 flex-shrink-0" />
                </a>
              )}
              {notifications.length === 0 && gpsLost.length === 0 && (
                <div className="text-center text-blue-400 text-xs py-8 opacity-60">
                  Нет новых уведомлений
                </div>
              )}
              {notifications.map((n, i) => {
                const style = NOTIF_STYLE[n.type];
                const Icon = style.icon;
                return (
                  <a
                    key={i}
                    href={n.href}
                    onClick={() => setShowNotif(false)}
                    className={`${style.bg} rounded-md p-3 flex gap-3 hover:brightness-125 transition-all cursor-pointer block`}
                  >
                    <Icon size={15} className={`${style.color} flex-shrink-0 mt-0.5`} />
                    <div className="flex-1 min-w-0">
                      <div className="text-xs text-blue-100 leading-snug">{n.text}</div>
                      <div className="text-xs text-blue-400 mt-1">{n.time}</div>
                    </div>
                    <ChevronRight size={13} className="text-blue-600 flex-shrink-0 mt-0.5" />
                  </a>
                );
              })}
            </div>
            <div className="p-3 border-t border-[#1A3A5C]">
              <button
                onClick={() => setShowNotif(false)}
                className="w-full py-2 text-xs text-blue-300 hover:text-white transition-colors"
              >
                Закрыть
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Settings panel */}
      {showSettings && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/40" onClick={() => setShowSettings(false)} />
          <div className="relative bg-white rounded-md shadow-sm w-96 p-6 border border-slate-200">
            <div className="flex items-center justify-between mb-5">
              <div className="font-bold text-slate-800 text-sm uppercase tracking-wide">Настройки системы</div>
              <button onClick={() => setShowSettings(false)} className="text-slate-400 hover:text-slate-600">
                <X size={18} />
              </button>
            </div>
            <div className="space-y-4">
              {[
                { label: "Язык интерфейса", value: "Русский" },
                { label: "Часовой пояс", value: "Europe/Moscow (UTC+3)" },
                { label: "Версия системы", value: "1.0.0-demo" },
                { label: "База данных", value: "SQLite (локальная)" },
              ].map(({ label, value }) => (
                <div key={label} className="flex justify-between items-center py-2 border-b border-slate-100">
                  <span className="text-sm text-slate-500">{label}</span>
                  <span className="text-sm font-medium text-slate-800">{value}</span>
                </div>
              ))}
              <div className="flex justify-between items-center py-2">
                <span className="text-sm text-slate-500">Уведомления по email</span>
                <button className="w-10 h-5 bg-blue-500 rounded-full relative">
                  <span className="absolute right-0.5 top-0.5 w-4 h-4 bg-white rounded-full shadow" />
                </button>
              </div>
            </div>
            <button
              onClick={() => setShowSettings(false)}
              className="mt-5 w-full py-2.5 bg-[#1E3A5F] text-white rounded-md text-sm font-semibold hover:bg-[#0C2340] transition-colors"
            >
              Закрыть
            </button>
          </div>
        </div>
      )}
    </>
  );
}
