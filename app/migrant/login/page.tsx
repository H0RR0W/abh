"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Shield, Phone, ArrowRight, RefreshCw } from "lucide-react";

export default function MigrantLoginPage() {
  const router = useRouter();
  const [step, setStep] = useState<"phone" | "code">("phone");
  const [phone, setPhone] = useState("");
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  function showToast(msg: string) {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 2500);
  }

  async function handleSendCode() {
    if (phone.length < 10) { showToast("Введите корректный номер телефона"); return; }
    setLoading(true);
    const res = await fetch("/api/auth/migrant/send-code", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ phone }),
    });
    const data = await res.json();
    setLoading(false);
    if (!res.ok) { showToast(data.error ?? "Ошибка"); return; }
    setStep("code");
    showToast(data.hint ?? "SMS отправлено");
  }

  async function handleVerify() {
    if (code.length < 4) { showToast("Введите 4-значный код"); return; }
    setLoading(true);
    const res = await fetch("/api/auth/migrant/verify", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ phone, code }),
    });
    const data = await res.json();
    setLoading(false);
    if (!res.ok) { showToast(data.error ?? "Неверный код"); return; }
    router.push("/migrant/cabinet");
    router.refresh();
  }

  return (
    <div className="flex-1 flex flex-col relative overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-to-br from-blue-600 to-blue-800 p-8 text-white">
        <div className="w-12 h-12 rounded-2xl bg-white/20 flex items-center justify-center mb-4">
          <Shield size={24} />
        </div>
        <h1 className="text-2xl font-bold">МигрантРА</h1>
        <p className="text-blue-200 text-sm mt-1">
          Миграционная служба Республики Абхазия
        </p>
      </div>

      {/* Form */}
      <div className="flex-1 p-6 flex flex-col">
        <h2 className="text-lg font-bold text-slate-800 mb-1">
          {step === "phone" ? "Войти в личный кабинет" : "Введите код из SMS"}
        </h2>
        <p className="text-slate-400 text-sm mb-6">
          {step === "phone"
            ? "Введите номер телефона для получения кода"
            : `Мы отправили SMS на ${phone}`}
        </p>

        {step === "phone" ? (
          <div className="space-y-4">
            <div>
              <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider block mb-2">
                Номер телефона
              </label>
              <div className="relative">
                <Phone
                  size={16}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                />
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+7 (___) ___-__-__"
                  className="w-full pl-10 pr-4 py-3 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
            <button
              onClick={handleSendCode}
              disabled={loading}
              className="w-full py-3 bg-blue-600 text-white rounded-xl font-semibold text-sm hover:bg-blue-700 transition-colors flex items-center justify-center gap-2 disabled:opacity-60"
            >
              {loading ? (
                <RefreshCw size={16} className="animate-spin" />
              ) : (
                <>
                  Получить код <ArrowRight size={16} />
                </>
              )}
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            <div>
              <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider block mb-2">
                Код подтверждения
              </label>
              <input
                type="text"
                value={code}
                onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 4))}
                placeholder="• • • •"
                className="w-full px-4 py-3 border border-slate-200 rounded-xl text-center text-2xl font-bold tracking-[0.5em] focus:outline-none focus:ring-2 focus:ring-blue-500"
                maxLength={4}
              />
              <p className="text-xs text-slate-400 mt-1 text-center">
                Введите код из SMS-сообщения
              </p>
            </div>
            <button
              onClick={handleVerify}
              disabled={loading}
              className="w-full py-3 bg-blue-600 text-white rounded-xl font-semibold text-sm hover:bg-blue-700 transition-colors flex items-center justify-center gap-2 disabled:opacity-60"
            >
              {loading ? (
                <RefreshCw size={16} className="animate-spin" />
              ) : (
                <>
                  Войти <ArrowRight size={16} />
                </>
              )}
            </button>
            <button
              onClick={() => setStep("phone")}
              className="w-full py-2 text-slate-400 text-sm hover:text-slate-600 transition-colors"
            >
              Изменить номер
            </button>
          </div>
        )}

        <div className="mt-auto pt-6 text-center text-xs text-slate-300">
          Поддержка: +7 (840) 226-58-58
        </div>
      </div>

      {/* Toast */}
      {toastMsg && (
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 bg-slate-800 text-white text-xs px-4 py-2 rounded-xl shadow-lg whitespace-nowrap z-50">
          {toastMsg}
        </div>
      )}
    </div>
  );
}
