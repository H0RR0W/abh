"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Users,
  Map,
  Shield,
  Bell,
  Settings,
  LogOut,
  FileText,
} from "lucide-react";

const navItems = [
  { href: "/admin/dashboard", label: "Дашборд", icon: LayoutDashboard },
  { href: "/admin/migrants", label: "Мигранты", icon: Users },
  { href: "/admin/map", label: "Карта", icon: Map },
  { href: "/admin/reports", label: "Отчёты", icon: FileText },
];

export default function AdminSidebar() {
  const pathname = usePathname();

  async function handleLogout() {
    await fetch("/api/auth/logout", { method: "POST" });
    window.location.href = "/login";
  }

  return (
    <aside className="w-64 min-h-screen bg-slate-900 text-white flex flex-col">
      <div className="p-5 border-b border-slate-700">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-blue-500 flex items-center justify-center">
            <Shield size={18} />
          </div>
          <div>
            <div className="font-bold text-sm leading-tight">ЕЦСМУ</div>
            <div className="text-slate-400 text-xs">Республика Абхазия</div>
          </div>
        </div>
      </div>

      <div className="p-4 border-b border-slate-700">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-slate-600 flex items-center justify-center text-xs font-bold">
            АП
          </div>
          <div>
            <div className="text-sm font-medium">Амра Пилия</div>
            <div className="text-slate-400 text-xs">Инспектор</div>
          </div>
        </div>
      </div>

      <nav className="flex-1 p-3">
        <div className="text-slate-500 text-xs font-semibold uppercase tracking-wider px-3 mb-2">
          Меню
        </div>
        {navItems.map(({ href, label, icon: Icon }) => {
          const active = pathname.startsWith(href);
          return (
            <Link
              key={href}
              href={href}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg mb-1 text-sm transition-colors ${
                active
                  ? "bg-blue-600 text-white"
                  : "text-slate-300 hover:bg-slate-800 hover:text-white"
              }`}
            >
              <Icon size={16} />
              {label}
            </Link>
          );
        })}

        <div className="text-slate-500 text-xs font-semibold uppercase tracking-wider px-3 mb-2 mt-5">
          Система
        </div>
        <button className="flex items-center gap-3 px-3 py-2.5 rounded-lg mb-1 text-sm text-slate-300 hover:bg-slate-800 hover:text-white w-full transition-colors">
          <Bell size={16} />
          Уведомления
          <span className="ml-auto bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
            3
          </span>
        </button>
        <button className="flex items-center gap-3 px-3 py-2.5 rounded-lg mb-1 text-sm text-slate-300 hover:bg-slate-800 hover:text-white w-full transition-colors">
          <Settings size={16} />
          Настройки
        </button>
      </nav>

      <div className="p-3 border-t border-slate-700">
        <button
          onClick={handleLogout}
          className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-slate-300 hover:bg-slate-800 hover:text-white w-full transition-colors"
        >
          <LogOut size={16} />
          Выйти
        </button>
      </div>
    </aside>
  );
}
