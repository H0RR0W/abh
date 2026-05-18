"use client";

import Link from "next/link";
import { ShieldX, ArrowLeft } from "lucide-react";
import { useEffect, useState } from "react";
import { ROLE_LABELS } from "@/lib/roles";

export default function UnauthorizedPage() {
  const [roleLabel, setRoleLabel] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/me/staff")
      .then((r) => r.json())
      .then((d) => { if (d.role) setRoleLabel(ROLE_LABELS[d.role] ?? d.role); })
      .catch(() => {});
  }, []);

  return (
    <div className="flex-1 flex items-center justify-center bg-[#F0F2F5] min-h-screen">
      <div className="bg-white rounded-2xl shadow-lg p-10 max-w-md w-full text-center border border-slate-200">
        <div className="w-16 h-16 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-5">
          <ShieldX size={32} className="text-red-500" />
        </div>
        <h1 className="text-2xl font-bold text-[#0C2340] mb-2">Доступ запрещён</h1>
        {roleLabel && (
          <p className="text-slate-500 text-sm mb-1">
            Ваша роль: <span className="font-semibold text-slate-700">{roleLabel}</span>
          </p>
        )}
        <p className="text-slate-400 text-sm mb-7">
          У вашей учётной записи нет прав для просмотра этого раздела.
          Обратитесь к администратору системы.
        </p>
        <Link
          href="/admin/dashboard"
          className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#1E3A5F] text-white rounded-lg text-sm font-semibold hover:bg-[#0C2340] transition-colors"
        >
          <ArrowLeft size={15} />
          Вернуться на дашборд
        </Link>
      </div>
    </div>
  );
}
