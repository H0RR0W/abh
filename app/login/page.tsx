"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Shield, Eye, EyeOff } from "lucide-react";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("inspector@migration.gov");
  const [password, setPassword] = useState("inspector123");
  const [showPwd, setShowPwd] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleLogin() {
    setLoading(true);
    setError(null);
    const res = await fetch("/api/auth/staff/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });
    const data = await res.json();
    setLoading(false);
    if (!res.ok) {
      setError(data.error ?? "Ошибка входа");
      return;
    }
    router.push("/admin/dashboard");
    router.refresh();
  }

  return (
    <div className="w-full max-w-sm">
      <div className="bg-white rounded-2xl shadow-xl p-8">
        <div className="flex items-center gap-3 mb-8">
          <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center">
            <Shield size={20} className="text-white" />
          </div>
          <div>
            <div className="font-bold text-slate-800">ЕЦСМУ</div>
            <div className="text-xs text-slate-400">Миграционная служба Абхазии</div>
          </div>
        </div>

        <h1 className="text-xl font-bold text-slate-800 mb-6">Вход для сотрудников</h1>

        {error && (
          <div className="mb-4 p-3 bg-red-50 text-red-700 rounded-lg text-sm">{error}</div>
        )}

        <div className="space-y-4">
          <div>
            <label className="text-xs font-semibold text-slate-500 block mb-1.5">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-3 py-2.5 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="text-xs font-semibold text-slate-500 block mb-1.5">Пароль</label>
            <div className="relative">
              <input
                type={showPwd ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleLogin()}
                className="w-full px-3 py-2.5 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 pr-10"
              />
              <button
                type="button"
                onClick={() => setShowPwd((p) => !p)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400"
              >
                {showPwd ? <EyeOff size={15} /> : <Eye size={15} />}
              </button>
            </div>
          </div>
          <button
            onClick={handleLogin}
            disabled={loading}
            className="w-full py-2.5 bg-blue-600 text-white rounded-lg font-semibold text-sm hover:bg-blue-700 transition-colors disabled:opacity-60"
          >
            {loading ? "Входим..." : "Войти"}
          </button>
        </div>

      </div>
    </div>
  );
}
