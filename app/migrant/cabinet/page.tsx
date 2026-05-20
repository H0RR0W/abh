"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import dynamic from "next/dynamic";
import {
  User,
  FileText,
  CreditCard,
  MessageCircle,
  Bell,
  QrCode,
  LogOut,
  ChevronRight,
  CheckCircle,
  Clock,
  AlertTriangle,
  Upload,
  Send,
  MapPin,
  RefreshCw,
  FileCheck,
  ArrowLeft,
  Download,
  X,
  Trash2,
  RotateCcw,
} from "lucide-react";
import { formatDate, formatCurrency, getDocStatusColor, getDocStatusLabel, getPaymentStatusColor, getPaymentStatusLabel } from "@/lib/utils";
import { useTranslation, LANGS } from "@/lib/i18n";

interface ChatMessage {
  id?: string;
  from: string;
  text: string;
  createdAt?: string;
}

interface MigrantDoc {
  id?: string;
  type: string;
  name: string;
  status: string;
  filePath?: string;
}

interface MigrantPayment {
  id: string;
  type: string;
  amount: number;
  date: string;
  status: string;
  description: string;
}

interface MigrantViolation {
  id: string;
  type: string;
  description: string;
  severity: string;
  date: string;
  fine: number;
  fineStatus: string;
}

interface MigrantData {
  id: string;
  firstName: string;
  lastName: string;
  middleName?: string;
  citizenship: string;
  passportNumber: string;
  passportSeries?: string | null;
  passportIssuedBy?: string | null;
  passportIssueDate?: string | null;
  passportExpiry?: string | null;
  phone: string;
  status: string;
  registrationExpiry: string;
  employed: boolean;
  employer?: string;
  address: string;
  photo?: string | null;
  selfiePhoto?: string | null;
  identityStatus?: string;
  documents: MigrantDoc[];
  payments: MigrantPayment[];
  violations2: MigrantViolation[];
}

const QRCode = dynamic(() => import("qrcode.react").then((m) => m.QRCodeSVG), {
  ssr: false,
});

const TAB_IDS = [
  { id: "home", icon: User },
  { id: "docs", icon: FileText },
  { id: "payments", icon: CreditCard },
  { id: "chat", icon: MessageCircle },
  { id: "geo", icon: MapPin },
] as const;

const GEO_FREQ_OPTIONS = [
  { value: 5, label: "5 мин" },
  { value: 15, label: "15 мин" },
  { value: 30, label: "30 мин" },
  { value: 60, label: "1 час" },
];

const DOC_TYPE_NAMES: Record<string, string> = {
  passport: "Паспорт",
  migration_card: "Миграционная карта",
  stay_receipt: "Квитанция об оплате",
  medical: "Медицинская справка",
  other: "Документ",
};

const DOC_ICONS: Record<string, string> = {
  passport: "🪪",
  migration_card: "📋",
  stay_receipt: "📄",
  medical: "🏥",
};

export default function MigrantCabinetPage() {
  const { t, lang, setLang } = useTranslation();
  const [tab, setTab] = useState("home");
  const [showQR, setShowQR] = useState(false);
  const [showNotif, setShowNotif] = useState(false);
  const [selectedDoc, setSelectedDoc] = useState<MigrantDoc | null>(null);
  const [chatMsg, setChatMsg] = useState("");
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [paymentLoading, setPaymentLoading] = useState(false);
  const [paidNow, setPaidNow] = useState(false);
  const [finePayingId, setFinePayingId] = useState<string | null>(null);
  const [migrant, setMigrant] = useState<MigrantData | null>(null);
  const [loadError, setLoadError] = useState(false);
  const [checkinLoading, setCheckinLoading] = useState(false);
  const [checkinDone, setCheckinDone] = useState(false);
  const [showRenewal, setShowRenewal] = useState(false);
  const [renewalLoading, setRenewalLoading] = useState(false);
  const [renewalDone, setRenewalDone] = useState(false);
  const [showProfile, setShowProfile] = useState(false);

  // Фото
  const [photoUploading, setPhotoUploading] = useState(false);
  const photoInputRef = useRef<HTMLInputElement>(null);

  // Selfie / верификация
  const [showSelfie, setShowSelfie] = useState(false);
  const [selfieStep, setSelfieStep] = useState<"camera" | "preview" | "checking" | "done">("camera");
  const [selfieBlob, setSelfieBlob] = useState<Blob | null>(null);
  const [selfieUrl, setSelfieUrl] = useState<string | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  // Геолокация
  const [geoFreq, setGeoFreq] = useState(15); // минуты
  const [geoActive, setGeoActive] = useState(false);
  const [geoPermission, setGeoPermission] = useState<"granted" | "denied" | "prompt" | "unknown">("unknown");
  const [geoNextIn, setGeoNextIn] = useState(0); // секунд до след. пинга
  const [locationHistory, setLocationHistory] = useState<{ id?: string; lat: number; lng: number; address: string; timestamp: string }[]>([]);
  const [lastPingTime, setLastPingTime] = useState<Date | null>(null);

  const [showUpload, setShowUpload] = useState(false);
  const [uploadType, setUploadType] = useState("passport");
  const [uploadName, setUploadName] = useState("");
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [uploadLoading, setUploadLoading] = useState(false);
  const [uploadDone, setUploadDone] = useState(false);
  const [docs, setDocs] = useState<MigrantDoc[]>([]);
  const [deletingDocId, setDeletingDocId] = useState<string | null>(null);
  const [replacingDocId, setReplacingDocId] = useState<string | null>(null);
  const replaceInputRef = useRef<HTMLInputElement>(null);
  // Паспортные поля
  const [ppSeries, setPpSeries] = useState("");
  const [ppNumber, setPpNumber] = useState("");
  const [ppIssuedBy, setPpIssuedBy] = useState("");
  const [ppIssueDate, setPpIssueDate] = useState("");
  const [ppExpiry, setPpExpiry] = useState("");

  function loadDocs() {
    fetch("/api/me/documents")
      .then(async (r) => { if (!r.ok) return; const d = await r.json().catch(() => []); if (Array.isArray(d)) setDocs(d); })
      .catch(() => {});
  }

  function loadLocationHistory() {
    fetch("/api/me/checkin")
      .then(async (r) => { if (!r.ok) return; const d = await r.json().catch(() => []); if (Array.isArray(d)) setLocationHistory(d); })
      .catch(() => {});
  }

  useEffect(() => {
    const timeout = setTimeout(() => setLoadError(true), 8000);
    fetch("/api/me")
      .then(async (r) => {
        clearTimeout(timeout);
        if (r.status === 401) { window.location.href = "/migrant/login"; return; }
        if (!r.ok) { setLoadError(true); return; }
        const d = await r.json().catch(() => null);
        if (d && !d.error) setMigrant(d);
        else setLoadError(true);
      })
      .catch(() => { clearTimeout(timeout); setLoadError(true); });
    loadDocs();
    loadLocationHistory();

    // Проверяем разрешение геолокации
    if (navigator.permissions) {
      navigator.permissions.query({ name: "geolocation" }).then((result) => {
        setGeoPermission(result.state as "granted" | "denied" | "prompt");
        result.onchange = () => setGeoPermission(result.state as "granted" | "denied" | "prompt");
      });
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Поллинг чата каждые 3 секунды
  useEffect(() => {
    function fetchChat() {
      fetch("/api/me/chat")
        .then(async (r) => { if (!r.ok) return; const d = await r.json().catch(() => []); if (Array.isArray(d)) setMessages(d); })
        .catch(() => {});
    }
    fetchChat();
    const interval = setInterval(fetchChat, 3000);
    return () => clearInterval(interval);
  }, []);

  // Авто-пинг геолокации
  const pingGeo = useCallback(async () => {
    try {
      const pos = await new Promise<GeolocationPosition>((resolve, reject) =>
        navigator.geolocation.getCurrentPosition(resolve, reject, { timeout: 10000 })
      );
      await fetch("/api/me/checkin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
          address: "Автоматическая проверка геолокации",
        }),
      });
      setLastPingTime(new Date());
      loadLocationHistory();
    } catch {
      // геолокация недоступна — ничего не делаем
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const watchIdRef = useRef<number | null>(null);
  const lastSentRef = useRef<number>(0);
  const countdownRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    // Останавливаем предыдущее наблюдение
    if (watchIdRef.current !== null) navigator.geolocation.clearWatch(watchIdRef.current);
    if (countdownRef.current) clearInterval(countdownRef.current);

    if (!geoActive) {
      setGeoNextIn(0);
      return;
    }

    const freqSeconds = geoFreq * 60;
    setGeoNextIn(freqSeconds);

    // watchPosition — браузер сам отслеживает изменения координат.
    // Мы фильтруем: отправляем не чаще чем раз в geoFreq минут.
    watchIdRef.current = navigator.geolocation.watchPosition(
      async (pos) => {
        const now = Date.now();
        if (now - lastSentRef.current < freqSeconds * 1000) return;
        lastSentRef.current = now;

        await fetch("/api/me/checkin", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            lat: pos.coords.latitude,
            lng: pos.coords.longitude,
            address: "Автоматическая проверка геолокации",
          }),
        });
        setLastPingTime(new Date());
        setGeoNextIn(freqSeconds);
        loadLocationHistory();
      },
      () => { /* геолокация недоступна */ },
      { enableHighAccuracy: false, maximumAge: 30000, timeout: 15000 }
    );

    // Сразу делаем первый пинг
    pingGeo();

    // Обратный отсчёт
    countdownRef.current = setInterval(() => {
      setGeoNextIn((prev) => (prev > 1 ? prev - 1 : 0));
    }, 1000);

    return () => {
      if (watchIdRef.current !== null) navigator.geolocation.clearWatch(watchIdRef.current);
      if (countdownRef.current) clearInterval(countdownRef.current);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [geoActive, geoFreq]);

  async function sendMessage() {
    if (!chatMsg.trim()) return;
    const res = await fetch("/api/me/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text: chatMsg }),
    });
    const msg = await res.json();
    setMessages((prev) => [...prev, msg]);
    setChatMsg("");
  }

  async function handlePay() {
    setPaymentLoading(true);
    await fetch("/api/me/payments", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ amount: 5000, description: "Разрешение на работу — июнь 2025" }),
    });
    setPaymentLoading(false);
    setPaidNow(true);
    fetch("/api/me").then((r) => r.json()).then((d) => { if (d) setMigrant(d); });
  }

  async function handlePayFine(violationId: string) {
    setFinePayingId(violationId);
    try {
      const res = await fetch(`/api/me/violations/${violationId}`, { method: "POST" });
      if (res.ok) {
        // Refresh migrant data to update violations and payment history
        const d = await fetch("/api/me").then((r) => r.json());
        if (d && d.id) setMigrant(d);
      }
    } finally {
      setFinePayingId(null);
    }
  }

  async function handleCheckin() {
    setCheckinLoading(true);
    try {
      const pos = await new Promise<GeolocationPosition>((resolve, reject) =>
        navigator.geolocation.getCurrentPosition(resolve, reject, { timeout: 8000 })
      );
      await fetch("/api/me/checkin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
          address: "Местоположение подтверждено через приложение",
        }),
      });
    } catch {
      // geolocation denied or unavailable — send approximate
      await fetch("/api/me/checkin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ lat: 43.0016, lng: 41.0234, address: "Местоположение подтверждено" }),
      });
    }
    setCheckinLoading(false);
    setCheckinDone(true);
    setLastPingTime(new Date());
    loadLocationHistory();
    setTimeout(() => setCheckinDone(false), 4000);
  }

  async function handleRenewal() {
    setRenewalLoading(true);
    await fetch("/api/me/renewal", { method: "POST" });
    setRenewalLoading(false);
    setRenewalDone(true);
  }

  async function handlePhotoUpload(file: File) {
    setPhotoUploading(true);
    const fd = new FormData();
    fd.append("photo", file);
    const res = await fetch("/api/me/photo", { method: "POST", body: fd });
    const data = await res.json();
    if (data.photo) {
      setMigrant((prev) => prev ? { ...prev, photo: data.photo } : prev);
    }
    setPhotoUploading(false);
  }

  async function startCamera() {
    setSelfieStep("camera");
    setSelfieBlob(null);
    setSelfieUrl(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "user" }, audio: false });
      streamRef.current = stream;
      if (videoRef.current) videoRef.current.srcObject = stream;
    } catch {
      alert("Не удалось получить доступ к камере. Проверьте разрешения браузера.");
    }
  }

  function stopCamera() {
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
  }

  function captureSelfie() {
    if (!videoRef.current) return;
    const canvas = document.createElement("canvas");
    canvas.width = videoRef.current.videoWidth;
    canvas.height = videoRef.current.videoHeight;
    canvas.getContext("2d")!.drawImage(videoRef.current, 0, 0);
    canvas.toBlob((blob) => {
      if (!blob) return;
      setSelfieBlob(blob);
      setSelfieUrl(URL.createObjectURL(blob));
      setSelfieStep("preview");
      stopCamera();
    }, "image/jpeg", 0.9);
  }

  async function submitSelfie() {
    if (!selfieBlob) return;
    setSelfieStep("checking");
    // Имитация проверки (в реальной системе — Face API)
    await new Promise((r) => setTimeout(r, 2500));

    const fd = new FormData();
    fd.append("selfie", selfieBlob, "selfie.jpg");
    const res = await fetch("/api/me/selfie", { method: "POST", body: fd });
    const text = await res.text();
    const data = text ? JSON.parse(text) : {};
    if (data.selfiePhoto) {
      setMigrant((prev) => prev ? { ...prev, selfiePhoto: data.selfiePhoto, identityStatus: data.identityStatus } : prev);
    }
    setSelfieStep("done");
  }

  function closeSelfieModal() {
    stopCamera();
    setShowSelfie(false);
    setSelfieStep("camera");
    setSelfieBlob(null);
    setSelfieUrl(null);
  }

  async function handleUpload() {
    if (!uploadFile) return;
    setUploadLoading(true);

    // 1. Загружаем файл документа
    const fd = new FormData();
    fd.append("file", uploadFile);
    fd.append("type", uploadType);
    fd.append("name", uploadName || uploadFile.name);
    await fetch("/api/me/documents", { method: "POST", body: fd });

    // 2. Если это паспорт — обновляем паспортные данные мигранта
    if (uploadType === "passport" && ppNumber.trim()) {
      const updated = await fetch("/api/me", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          passportSeries: ppSeries.trim() || null,
          passportNumber: ppNumber.trim(),
          passportIssuedBy: ppIssuedBy.trim() || null,
          passportIssueDate: ppIssueDate || null,
          passportExpiry: ppExpiry || null,
        }),
      }).then((r) => r.json());
      if (updated?.id) setMigrant((prev) => prev ? { ...prev, ...updated } : prev);
    }

    setUploadLoading(false);
    setUploadDone(true);
    loadDocs();
    setTimeout(() => {
      setShowUpload(false);
      setUploadDone(false);
      setUploadFile(null);
      setUploadName(DOC_TYPE_NAMES["passport"]);
      setUploadType("passport");
      setPpSeries(""); setPpNumber(""); setPpIssuedBy(""); setPpIssueDate(""); setPpExpiry("");
    }, 1500);
  }

  async function handleDeleteDoc(docId: string) {
    if (!confirm("Удалить документ?")) return;
    setDeletingDocId(docId);
    try {
      await fetch(`/api/me/documents/${docId}`, { method: "DELETE" });
      setDocs((prev) => prev.filter((d) => d.id !== docId));
    } finally {
      setDeletingDocId(null);
    }
  }

  async function handleReplaceDoc(docId: string, file: File) {
    setReplacingDocId(docId);
    try {
      const fd = new FormData();
      fd.append("file", file);
      fd.append("name", file.name);
      const res = await fetch(`/api/me/documents/${docId}`, { method: "PUT", body: fd });
      if (res.ok) {
        const updated = await res.json();
        setDocs((prev) => prev.map((d) => d.id === docId ? { ...d, ...updated } : d));
      }
    } finally {
      setReplacingDocId(null);
    }
  }

  async function handleLogout() {
    await fetch("/api/auth/logout", { method: "POST" });
    window.location.href = "/migrant/login";
  }

  if (!migrant) {
    return (
      <div className="flex-1 flex items-center justify-center">
        {loadError ? (
          <div className="text-center">
            <div className="text-slate-600 text-sm font-medium mb-2">Не удалось загрузить данные</div>
            <button
              onClick={() => { setLoadError(false); window.location.reload(); }}
              className="text-xs text-blue-600 underline"
            >
              Попробовать снова
            </button>
            <div className="mt-3">
              <a href="/migrant/login" className="text-xs text-slate-400 underline">Войти заново</a>
            </div>
          </div>
        ) : (
          <div className="text-slate-400 text-sm">Загрузка...</div>
        )}
      </div>
    );
  }

  const daysLeft = migrant.registrationExpiry
    ? Math.ceil((new Date(migrant.registrationExpiry).getTime() - Date.now()) / 86400000)
    : 0;

  const initials = `${migrant.firstName?.[0] ?? ""}${migrant.lastName?.[0] ?? ""}`;

  return (
    <div className="flex-1 flex flex-col relative overflow-hidden">
      {/* Status bar */}
      <div className="bg-[#0C2340] px-5 pt-6 pb-5 text-white">
        <div className="flex items-center justify-between mb-4">
          {/* Hidden photo input */}
          <input
            ref={photoInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => { const f = e.target.files?.[0]; if (f) handlePhotoUpload(f); e.target.value = ""; }}
          />
          <button onClick={() => setShowProfile(true)} className="flex items-center gap-2 hover:bg-white/10 rounded-md px-2 py-1 -mx-2 -my-1 transition-colors">
            <div className="relative w-10 h-10 flex-shrink-0">
              {migrant?.photo ? (
                <img src={migrant.photo} alt="Фото" className="w-10 h-10 rounded-full object-cover border-2 border-white/30" />
              ) : (
                <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center font-bold text-sm">
                  {initials}
                </div>
              )}
              {photoUploading && (
                <div className="absolute inset-0 rounded-full bg-black/50 flex items-center justify-center">
                  <RefreshCw size={12} className="text-white animate-spin" />
                </div>
              )}
              {migrant?.identityStatus === "verified" && (
                <div className="absolute -bottom-0.5 -right-0.5 w-4 h-4 rounded-full bg-emerald-500 border-2 border-[#0C2340] flex items-center justify-center">
                  <CheckCircle size={9} className="text-white" />
                </div>
              )}
            </div>
            <div className="text-left">
              <div className="font-bold text-sm">{migrant?.lastName} {migrant?.firstName}</div>
              <div className="text-slate-300 text-xs">{migrant?.id}</div>
            </div>
          </button>
          <div className="flex items-center gap-2">
            <button onClick={() => setShowNotif(true)} className="relative p-2 rounded-full hover:bg-white/10 transition-colors">
              <Bell size={18} />
              <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-red-400" />
            </button>
            <div className="flex items-center gap-1 bg-white/10 rounded p-0.5">
              {LANGS.map(l => (
                <button key={l.code} onClick={() => setLang(l.code)}
                  className={`px-2 py-0.5 rounded text-xs font-medium transition-colors ${
                    lang === l.code ? "bg-white/20 text-white" : "text-white/50 hover:text-white/80"
                  }`}>
                  {l.label}
                </button>
              ))}
            </div>
            <button onClick={handleLogout} className="p-2 rounded-full hover:bg-white/10 transition-colors">
              <LogOut size={18} />
            </button>
          </div>
        </div>

        <div className="bg-white/10 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-2">
            <CheckCircle size={12} className="text-emerald-300" />
            <span className="text-[10px] tracking-wider font-semibold uppercase text-emerald-300">
              {t.status[migrant?.status === "active" ? "active" : migrant?.status === "expired" ? "expired" : "blocked"]}
            </span>
          </div>
          <div className="text-sm text-slate-300">{t.nav.registrationUntil}</div>
          <div className="text-xl font-bold">{formatDate(migrant?.registrationExpiry)}</div>
          <div className="text-xs text-slate-400 mt-1">
            {daysLeft > 0 ? `${t.nav.daysLeft}: ${daysLeft}` : t.nav.daysExpired}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto bg-[#F0F2F5]">
        {/* HOME */}
        {tab === "home" && (
          <div className="p-4 space-y-3">
            {/* Quick actions */}
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => setShowQR(true)}
                className="flex flex-col items-center gap-2 bg-white rounded-lg p-4 hover:bg-slate-50 transition-colors border border-slate-200"
              >
                <div className="w-10 h-10 bg-[#1A3A5C] rounded-md flex items-center justify-center">
                  <QrCode size={20} className="text-white" />
                </div>
                <span className="text-xs font-semibold text-slate-700">{t.qr.title}</span>
              </button>
              <button
                onClick={() => setTab("payments")}
                className="flex flex-col items-center gap-2 bg-white rounded-lg p-4 hover:bg-slate-50 transition-colors border border-slate-200"
              >
                <div className="w-10 h-10 bg-[#1E5631] rounded-md flex items-center justify-center">
                  <CreditCard size={20} className="text-white" />
                </div>
                <span className="text-xs font-semibold text-slate-700">{t.payments.pay}</span>
              </button>
              <button
                onClick={handleCheckin}
                disabled={checkinLoading || checkinDone}
                className={`flex flex-col items-center gap-2 rounded-lg p-4 transition-colors col-span-2 border ${
                  checkinDone ? "bg-white border-emerald-200" : "bg-white border-slate-200 hover:bg-slate-50"
                }`}
              >
                <div className={`w-10 h-10 rounded-md flex items-center justify-center ${checkinDone ? "bg-emerald-600" : "bg-slate-700"}`}>
                  {checkinLoading ? <RefreshCw size={20} className="text-white animate-spin" /> : checkinDone ? <CheckCircle size={20} className="text-white" /> : <MapPin size={20} className="text-white" />}
                </div>
                <span className={`text-xs font-semibold ${checkinDone ? "text-emerald-700" : "text-slate-700"}`}>
                  {checkinLoading ? t.home.confirmingLocation : checkinDone ? t.home.presenceConfirmed : t.home.confirmPresence}
                </span>
              </button>
              {/* Верификация личности — кнопка только если ещё не подтверждено */}
              {migrant?.identityStatus !== "verified" && (
                <button
                  onClick={() => { setShowSelfie(true); setTimeout(startCamera, 100); }}
                  className={`flex flex-col items-center gap-2 rounded-lg p-4 transition-colors col-span-2 border ${
                    migrant?.identityStatus === "pending"
                      ? "bg-white border-amber-200 hover:bg-amber-50/50"
                      : "bg-white border-slate-200 hover:bg-slate-50"
                  }`}
                >
                  <div className={`w-10 h-10 rounded-md flex items-center justify-center ${
                    migrant?.identityStatus === "pending" ? "bg-amber-600" : "bg-slate-600"
                  }`}>
                    <span className="text-white text-lg">🤳</span>
                  </div>
                  <span className={`text-xs font-semibold ${
                    migrant?.identityStatus === "pending" ? "text-amber-800" : "text-slate-700"
                  }`}>
                    {migrant?.identityStatus === "pending" ? t.home.verifyPending : t.home.verifySelfie}
                  </span>
                </button>
              )}

              {daysLeft < 60 && (
                <button
                  onClick={() => setShowRenewal(true)}
                  className="flex flex-col items-center gap-2 bg-white rounded-lg p-4 hover:bg-slate-50 transition-colors col-span-2 border border-slate-200"
                >
                  <div className="w-10 h-10 bg-[#1A3A5C] rounded-md flex items-center justify-center">
                    <FileCheck size={20} className="text-white" />
                  </div>
                  <span className="text-xs font-semibold text-slate-700">{t.home.renewRegistration}</span>
                </button>
              )}
            </div>

            {/* Unpaid fines alert */}
            {(migrant?.violations2 ?? []).filter((v: MigrantViolation) => v.fineStatus === "unpaid" && v.fine > 0).length > 0 && (
              <button
                onClick={() => setTab("payments")}
                className="w-full bg-red-50 border border-red-200 rounded-lg p-4 flex items-center gap-3 hover:bg-red-100 transition-colors text-left"
              >
                <div className="w-10 h-10 bg-red-700 rounded-md flex items-center justify-center flex-shrink-0">
                  <span className="text-white text-lg">⚠️</span>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-bold text-red-700">Неоплаченные штрафы</div>
                  <div className="text-xs text-red-500 mt-0.5">
                    {(migrant?.violations2 ?? []).filter((v: MigrantViolation) => v.fineStatus === "unpaid" && v.fine > 0).length} штраф(а) · {formatCurrency((migrant?.violations2 ?? []).filter((v: MigrantViolation) => v.fineStatus === "unpaid" && v.fine > 0).reduce((s: number, v: MigrantViolation) => s + v.fine, 0))} к оплате
                  </div>
                </div>
                <span className="text-red-400 text-lg">→</span>
              </button>
            )}

            {/* Info cards */}
            <div className="bg-white rounded-lg border border-slate-200 p-4 space-y-3">
              <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider">{t.home.myData}</h3>
              {[
                { label: t.home.citizenship, value: migrant?.citizenship ?? "—" },
                { label: t.home.passport, value: migrant?.passportNumber ?? "—" },
                { label: t.home.employer, value: migrant?.employer ?? "—" },
                { label: t.home.address, value: migrant?.address ?? "—" },
              ].map(({ label, value }) => (
                <div key={label} className="flex justify-between items-start">
                  <span className="text-xs text-slate-400">{label}</span>
                  <span className="text-xs font-medium text-slate-700 text-right max-w-[60%]">
                    {value}
                  </span>
                </div>
              ))}
              {/* Статус верификации личности */}
              <div className="flex justify-between items-center pt-1 border-t border-slate-100">
                <span className="text-xs text-slate-400">{t.home.identityVerification}</span>
                {migrant?.identityStatus === "verified" ? (
                  <span className="flex items-center gap-1.5 text-xs font-semibold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full">
                    <CheckCircle size={12} />
                    {t.home.verified}
                  </span>
                ) : migrant?.identityStatus === "pending" ? (
                  <span className="flex items-center gap-1.5 text-xs font-semibold text-amber-700 bg-amber-50 px-2.5 py-1 rounded-full">
                    <Clock size={12} />
                    {t.home.pending}
                  </span>
                ) : (
                  <span className="flex items-center gap-1.5 text-xs font-semibold text-slate-500 bg-slate-100 px-2.5 py-1 rounded-full">
                    <AlertTriangle size={12} />
                    {t.home.unverified}
                  </span>
                )}
              </div>
            </div>

            {/* Work permit payment for employed */}
            {migrant && migrant.employed && (
              <button
                onClick={() => setTab("payments")}
                className="w-full text-left bg-white rounded-lg border border-slate-200 p-4 hover:bg-slate-50 transition-colors"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 mb-1">
                    <CheckCircle size={14} className="text-[#1A3A5C]" />
                    <span className="text-sm font-semibold text-slate-800">{t.home.workPermit}</span>
                  </div>
                  <ChevronRight size={15} className="text-slate-400" />
                </div>
                <div className="text-xs text-slate-500">
                  {t.home.workPermitFee}
                </div>
              </button>
            )}

            {/* Notifications */}
            <div className="bg-white rounded-lg border border-slate-200 p-4">
              <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">{t.home.notifications}</h3>
              <div className="space-y-2">
                {daysLeft <= 0 && (
                  <div className="flex items-start gap-3 p-2 bg-red-50 rounded-md border border-red-100">
                    <AlertTriangle size={14} className="text-red-500 mt-0.5 flex-shrink-0" />
                    <div>
                      <div className="text-xs font-medium text-red-800">
                        {daysLeft === 0 ? t.profile.expiredToday : <>{t.profile.expiredAgo} <b>{Math.abs(daysLeft)}</b> {t.profile.daysAgo}</>}
                      </div>
                      <div className="text-xs text-red-600">{t.home.notifExpiringSub}</div>
                    </div>
                  </div>
                )}
                {daysLeft > 0 && daysLeft < 60 && (
                  <div className="flex items-start gap-3 p-2 bg-amber-50 rounded-md border border-amber-100">
                    <AlertTriangle size={14} className="text-amber-600 mt-0.5 flex-shrink-0" />
                    <div>
                      <div className="text-xs font-medium text-amber-800">{t.home.notifExpiring} {daysLeft} {t.profile.daysWord}</div>
                      <div className="text-xs text-amber-600">{t.home.notifExpiringSub}</div>
                    </div>
                  </div>
                )}
                <div className="flex items-start gap-3 p-2 bg-slate-50 rounded-md border border-slate-100">
                  <CheckCircle size={14} className="text-slate-500 mt-0.5 flex-shrink-0" />
                  <div>
                    <div className="text-xs font-medium text-slate-700">{t.home.notifWelcome}</div>
                    <div className="text-xs text-slate-500">{t.home.notifWelcomeSub}</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* DOCUMENTS */}
        {tab === "docs" && (
          <div className="p-4 space-y-3 bg-[#F0F2F5] min-h-full">
            <h2 className="text-xs font-semibold text-slate-500 uppercase tracking-wider">{t.docs.myDocs}</h2>
            {docs.length === 0 && (
              <div className="text-center py-6 text-slate-400 text-sm">{t.docs.noDocsYet}</div>
            )}
            {/* Hidden replace file input */}
            <input
              ref={replaceInputRef}
              type="file"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file && replacingDocId) handleReplaceDoc(replacingDocId, file);
                e.target.value = "";
              }}
            />

            {docs.map((doc, i) => (
              <div
                key={doc.id ?? i}
                className="bg-white rounded-lg border border-slate-200 overflow-hidden"
              >
                {/* Main row */}
                <button
                  onClick={() => setSelectedDoc(doc)}
                  className="w-full text-left p-4 flex items-center gap-3 hover:bg-slate-50 transition-colors"
                >
                  <span className="text-2xl flex-shrink-0">{DOC_ICONS[doc.type] ?? "📄"}</span>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-semibold text-slate-800 truncate">{doc.name}</div>
                    <span className={`text-xs px-2 py-0.5 rounded-full ${getDocStatusColor(doc.status)}`}>
                      {getDocStatusLabel(doc.status)}
                    </span>
                  </div>
                  <ChevronRight size={15} className="text-slate-300 flex-shrink-0" />
                </button>

                {/* Action bar */}
                <div className="border-t border-slate-100 flex divide-x divide-slate-100">
                  {doc.filePath && (
                    <a
                      href={doc.filePath}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex-1 flex items-center justify-center gap-1.5 py-2.5 text-xs text-slate-500 hover:bg-slate-50 hover:text-slate-700 transition-colors"
                    >
                      <Download size={13} />
                      Скачать
                    </a>
                  )}
                  <button
                    onClick={() => {
                      if (!doc.id) return;
                      setReplacingDocId(doc.id);
                      replaceInputRef.current?.click();
                    }}
                    disabled={replacingDocId === doc.id}
                    className="flex-1 flex items-center justify-center gap-1.5 py-2.5 text-xs text-blue-600 hover:bg-blue-50 transition-colors disabled:opacity-50"
                  >
                    {replacingDocId === doc.id
                      ? <RefreshCw size={13} className="animate-spin" />
                      : <RotateCcw size={13} />}
                    Заменить
                  </button>
                  <button
                    onClick={() => doc.id && handleDeleteDoc(doc.id)}
                    disabled={deletingDocId === doc.id}
                    className="flex-1 flex items-center justify-center gap-1.5 py-2.5 text-xs text-red-500 hover:bg-red-50 transition-colors disabled:opacity-50"
                  >
                    {deletingDocId === doc.id
                      ? <RefreshCw size={13} className="animate-spin" />
                      : <Trash2 size={13} />}
                    Удалить
                  </button>
                </div>
              </div>
            ))}
            <button
              onClick={() => { setUploadName(DOC_TYPE_NAMES["passport"]); setShowUpload(true); }}
              className="w-full p-4 border-2 border-dashed border-slate-300 rounded-lg text-sm text-slate-500 hover:border-[#1A3A5C] hover:text-[#1A3A5C] transition-colors flex items-center justify-center gap-2"
            >
              <Upload size={16} />
              {t.docs.addDoc}
            </button>
          </div>
        )}

        {/* PAYMENTS */}
        {tab === "payments" && (
          <div className="p-4 space-y-3 bg-[#F0F2F5] min-h-full">
            <h2 className="text-xs font-semibold text-slate-500 uppercase tracking-wider">{t.payments.myPayments}</h2>

            {/* Pay now card */}
            <div className="bg-[#1A3A5C] rounded-lg p-4 text-white">
              <div className="text-xs text-slate-300 mb-1 uppercase tracking-wider">К оплате</div>
              <div className="text-2xl font-bold mb-3">5 000 ₽</div>
              <div className="text-xs text-slate-300 mb-4">Разрешение на работу — июнь 2025</div>
              {paidNow ? (
                <div className="bg-white/20 rounded-md py-2.5 text-center text-sm font-semibold">
                  Оплачено!
                </div>
              ) : (
                <button
                  onClick={handlePay}
                  disabled={paymentLoading}
                  className="w-full bg-[#1E5631] text-white rounded-md py-2.5 text-sm font-semibold hover:bg-[#174a29] transition-colors disabled:opacity-60"
                >
                  {paymentLoading ? "..." : t.payments.pay}
                </button>
              )}
            </div>

            {/* Violations / fines */}
            {(migrant?.violations2 ?? []).length > 0 && (
              <>
                <h3 className="text-xs font-semibold text-red-500 uppercase tracking-wider pt-1 flex items-center gap-1">
                  <span>⚠️</span> Штрафы и нарушения
                </h3>
                {(migrant?.violations2 ?? []).map((v: MigrantViolation) => (
                  <div
                    key={v.id}
                    className={`bg-white rounded-lg border p-4 ${v.fineStatus === "unpaid" ? "border-red-200 bg-red-50/20" : "border-slate-200"}`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-semibold text-slate-800">{v.type}</div>
                        {v.description && (
                          <div className="text-xs text-slate-500 mt-0.5 leading-snug">{v.description}</div>
                        )}
                        <div className="text-xs text-slate-400 mt-1">{formatDate(v.date)}</div>
                      </div>
                      <div className="text-right flex-shrink-0">
                        {v.fine > 0 && (
                          <div className="text-sm font-bold text-red-600">{formatCurrency(v.fine)}</div>
                        )}
                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                          v.fineStatus === "paid"
                            ? "bg-emerald-100 text-emerald-700"
                            : v.fineStatus === "unpaid"
                            ? "bg-red-100 text-red-700"
                            : "bg-slate-100 text-slate-600"
                        }`}>
                          {v.fineStatus === "paid" ? "Оплачен" : v.fineStatus === "unpaid" ? "Не оплачен" : v.fineStatus}
                        </span>
                      </div>
                    </div>
                    {v.fineStatus === "unpaid" && v.fine > 0 && (
                      <button
                        onClick={() => handlePayFine(v.id)}
                        disabled={finePayingId === v.id}
                        className="mt-3 w-full py-2 bg-red-700 text-white rounded-md text-xs font-semibold hover:bg-red-800 transition-colors disabled:opacity-60"
                      >
                        {finePayingId === v.id ? "Обработка..." : `Оплатить штраф ${formatCurrency(v.fine)}`}
                      </button>
                    )}
                  </div>
                ))}
              </>
            )}

            {/* History */}
            <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider pt-1">
              История платежей
            </h3>
            {(migrant?.payments ?? []).map((p: MigrantPayment) => (
              <div
                key={p.id}
                className="bg-white rounded-lg border border-slate-200 p-4 flex items-center justify-between"
              >
                <div>
                  <div className="text-sm font-medium text-slate-800">{p.description}</div>
                  <div className="text-xs text-slate-400">{formatDate(p.date)}</div>
                </div>
                <div className="text-right">
                  <div className="text-sm font-bold text-slate-800">{formatCurrency(p.amount)}</div>
                  <span
                    className={`text-xs px-2 py-0.5 rounded-full ${getPaymentStatusColor(p.status)}`}
                  >
                    {getPaymentStatusLabel(p.status)}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* CHAT */}
        {tab === "chat" && (
          <div className="flex flex-col h-full">
            <div className="flex-1 p-4 space-y-3 overflow-y-auto">
              <div className="text-center text-xs text-slate-400 py-2">
                {t.chat.title}
              </div>
              {messages.map((msg, i) => (
                <div
                  key={msg.id ?? i}
                  className={`flex ${msg.from === "migrant" ? "justify-end" : "justify-start"}`}
                >
                  <div
                    className={`max-w-[75%] px-3 py-2 rounded-lg text-sm ${
                      msg.from === "migrant"
                        ? "bg-[#1A3A5C] text-white rounded-br-sm"
                        : "bg-slate-200 text-slate-800 rounded-bl-sm"
                    }`}
                  >
                    {msg.text}
                    <div
                      className={`text-xs mt-1 ${msg.from === "migrant" ? "text-blue-200" : "text-slate-400"}`}
                    >
                      {msg.createdAt
                        ? new Date(msg.createdAt).toLocaleTimeString("ru-RU", { hour: "2-digit", minute: "2-digit" })
                        : ""}
                    </div>
                  </div>
                </div>
              ))}
            </div>
            <div className="p-3 border-t border-slate-100 flex gap-2">
              <input
                type="text"
                value={chatMsg}
                onChange={(e) => setChatMsg(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && sendMessage()}
                placeholder={t.chat.placeholder}
                className="flex-1 px-4 py-2.5 bg-slate-100 rounded-md text-sm focus:outline-none focus:bg-white focus:ring-2 focus:ring-[#1A3A5C]"
              />
              <button
                onClick={sendMessage}
                className="w-10 h-10 bg-[#1A3A5C] rounded-md flex items-center justify-center text-white hover:bg-[#0C2340] transition-colors"
              >
                <Send size={16} />
              </button>
            </div>
          </div>
        )}
        {/* GEO */}
        {tab === "geo" && (
          <div className="p-4 space-y-4 bg-[#F0F2F5] min-h-full">
            <h2 className="text-xs font-semibold text-slate-500 uppercase tracking-wider">{t.geo.title}</h2>

            {/* Permission warning */}
            {geoPermission === "denied" && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-start gap-3">
                <AlertTriangle size={18} className="text-red-500 flex-shrink-0 mt-0.5" />
                <div>
                  <div className="text-sm font-bold text-red-800">{t.geo.permissionDenied}</div>
                  <div className="text-xs text-red-600 mt-1">
                    Разрешите доступ к местоположению в настройках браузера. Это обязательное требование для пребывания на территории Республики.
                  </div>
                </div>
              </div>
            )}

            {/* Status card */}
            <div className={`rounded-lg p-4 border ${geoActive ? "bg-white border-emerald-200" : "bg-white border-slate-200"}`}>
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <div className={`w-2.5 h-2.5 rounded-full ${geoActive ? "bg-emerald-500 animate-pulse" : "bg-slate-400"}`} />
                  <span className={`text-sm font-bold ${geoActive ? "text-emerald-800" : "text-slate-600"}`}>
                    {t.geo.toggle} {geoActive ? "✓" : "✕"}
                  </span>
                </div>
                <button
                  onClick={() => setGeoActive((v) => !v)}
                  disabled={geoPermission === "denied"}
                  className={`relative w-12 h-6 rounded-full transition-colors disabled:opacity-40 ${geoActive ? "bg-emerald-500" : "bg-slate-300"}`}
                >
                  <span className={`absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition-all ${geoActive ? "left-6" : "left-0.5"}`} />
                </button>
              </div>

              {geoActive && (
                <div className="space-y-2">
                  <div className="flex justify-between text-xs text-emerald-700">
                    <span>{t.geo.nextPing}</span>
                    <span className="font-bold font-mono">
                      {Math.floor(geoNextIn / 60)}:{String(geoNextIn % 60).padStart(2, "0")}
                    </span>
                  </div>
                  <div className="h-1.5 bg-emerald-200 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-emerald-500 rounded-full transition-all duration-1000"
                      style={{ width: `${100 - (geoNextIn / (geoFreq * 60)) * 100}%` }}
                    />
                  </div>
                  {lastPingTime && (
                    <div className="text-xs text-emerald-600">
                      Последний пинг: {lastPingTime.toLocaleTimeString("ru-RU", { hour: "2-digit", minute: "2-digit", second: "2-digit" })}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Frequency */}
            <div className="bg-white rounded-lg border border-slate-200 p-4">
              <div className="text-xs text-slate-500 mb-3 font-medium">{t.geo.freqLabel}</div>
              <div className="grid grid-cols-4 gap-2">
                {GEO_FREQ_OPTIONS.map(({ value, label }) => (
                  <button
                    key={value}
                    onClick={() => { setGeoFreq(value); if (geoActive) setGeoNextIn(value * 60); }}
                    className={`py-2 rounded-md text-xs font-semibold transition-colors ${
                      geoFreq === value
                        ? "bg-[#1A3A5C] text-white"
                        : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>
              <div className="text-xs text-slate-400 mt-2">
                Не чаще раза в {geoFreq} мин. Работает пока браузер открыт, в т.ч. в свёрнутом виде
              </div>
            </div>

            {/* History */}
            <div className="bg-white rounded-lg border border-slate-200 p-4">
              <div className="text-xs text-slate-500 mb-3 font-medium">
                {t.geo.history} ({locationHistory.length})
              </div>
              {locationHistory.length === 0 ? (
                <div className="text-center py-4 text-slate-400 text-sm">
                  {t.geo.noHistory}
                </div>
              ) : (
                <div className="space-y-0">
                  {locationHistory.slice(0, 20).map((loc, i) => (
                    <div key={loc.id ?? i} className="flex items-start gap-3 py-2.5">
                      <div className="flex flex-col items-center flex-shrink-0 mt-1">
                        <div className={`w-2.5 h-2.5 rounded-full border-2 ${i === 0 ? "border-blue-500 bg-blue-500" : "border-slate-300 bg-white"}`} />
                        {i < locationHistory.slice(0, 20).length - 1 && (
                          <div className="w-0.5 h-5 bg-slate-200 mt-1" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0 pb-1">
                        <div className="text-xs font-medium text-slate-700 truncate">{loc.address}</div>
                        <div className="text-xs text-slate-400 mt-0.5 flex items-center gap-2">
                          <span>{new Date(loc.timestamp).toLocaleString("ru-RU", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" })}</span>
                          <span className="text-slate-300">·</span>
                          <span className="font-mono">{Number(loc.lat).toFixed(3)}, {Number(loc.lng).toFixed(3)}</span>
                        </div>
                      </div>
                      {i === 0 && (
                        <span className="text-[10px] bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded-full flex-shrink-0 mt-1">Сейчас</span>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Manual check-in button */}
            <button
              onClick={handleCheckin}
              disabled={checkinLoading || checkinDone || geoPermission === "denied"}
              className={`w-full py-3.5 rounded-lg text-sm font-semibold flex items-center justify-center gap-2 transition-colors ${
                checkinDone
                  ? "bg-emerald-100 text-emerald-700"
                  : "bg-slate-700 hover:bg-slate-800 text-white disabled:opacity-50"
              }`}
            >
              {checkinLoading ? <RefreshCw size={16} className="animate-spin" /> : checkinDone ? <CheckCircle size={16} /> : <MapPin size={16} />}
              {checkinLoading ? t.home.confirmingLocation : checkinDone ? t.home.presenceConfirmed : t.home.confirmPresence}
            </button>
          </div>
        )}
      </div>

      {/* Bottom nav */}
      <div className="border-t border-slate-200 bg-white px-2 py-2 flex">
        {TAB_IDS.map(({ id, icon: Icon }) => (
          <button
            key={id}
            onClick={() => setTab(id)}
            className={`flex-1 flex flex-col items-center gap-1 py-1.5 rounded-md transition-colors ${
              tab === id ? "text-[#0C2340]" : "text-slate-400 hover:text-slate-600"
            }`}
          >
            <Icon size={19} />
            <span className="text-[10px] font-medium">{t.tabs[id as keyof typeof t.tabs]}</span>
          </button>
        ))}
      </div>

      {/* QR Modal */}
      {showQR && (
        <div
          className="absolute inset-0 bg-black/60 flex items-center justify-center z-50 p-6"
          onClick={() => setShowQR(false)}
        >
          <div
            className="bg-white rounded-lg p-6 w-full max-w-xs"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-center font-bold text-slate-800 mb-1">{t.qr.title}</h3>
            <p className="text-center text-xs text-slate-400 mb-4">
              {t.selfie.step3}
            </p>
            <div className="flex justify-center mb-4" id="qr-wrapper">
              <QRCode
                id="migrant-qr"
                value={`${typeof window !== "undefined" ? window.location.origin : ""}/admin/migrants/${migrant?.id}`}
                size={200}
                level="H"
                includeMargin
              />
            </div>
            <div className="text-center text-sm font-bold text-slate-700 mb-1">
              {migrant?.id}
            </div>
            <div className="text-center text-xs text-slate-400">
              {migrant?.lastName} {migrant?.firstName} · {migrant?.citizenship}
            </div>
            <button
              onClick={() => {
                const svg = document.getElementById("migrant-qr") as SVGSVGElement | null;
                if (!svg) return;
                const canvas = document.createElement("canvas");
                const size = 400;
                canvas.width = size;
                canvas.height = size;
                const ctx = canvas.getContext("2d")!;
                const img = new Image();
                const svgData = new XMLSerializer().serializeToString(svg);
                img.onload = () => {
                  ctx.fillStyle = "#ffffff";
                  ctx.fillRect(0, 0, size, size);
                  ctx.drawImage(img, 0, 0, size, size);
                  const a = document.createElement("a");
                  a.download = `QR_${migrant?.id}.png`;
                  a.href = canvas.toDataURL("image/png");
                  a.click();
                };
                img.src = "data:image/svg+xml;base64," + btoa(unescape(encodeURIComponent(svgData)));
              }}
              className="mt-4 w-full py-2.5 bg-[#1A3A5C] hover:bg-[#0C2340] rounded-md text-sm font-medium text-white transition-colors flex items-center justify-center gap-2"
            >
              <Download size={15} />
              {t.qr.download}
            </button>
            <button
              onClick={() => setShowQR(false)}
              className="mt-2 w-full py-2.5 bg-slate-100 rounded-md text-sm font-medium text-slate-600 hover:bg-slate-200 transition-colors"
            >
              Закрыть
            </button>
          </div>
        </div>
      )}

      {/* Document Viewer Modal */}
      {selectedDoc && (
        <div className="absolute inset-0 bg-black flex flex-col z-50">
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 bg-black/80 flex-shrink-0">
            <div className="flex items-center gap-2 min-w-0">
              <span className="text-xl">{DOC_ICONS[selectedDoc.type] ?? "📄"}</span>
              <div className="min-w-0">
                <div className="text-sm font-semibold text-white truncate">{selectedDoc.name}</div>
                <span className={`text-xs px-1.5 py-0.5 rounded-full ${getDocStatusColor(selectedDoc.status)}`}>
                  {getDocStatusLabel(selectedDoc.status)}
                </span>
              </div>
            </div>
            <div className="flex items-center gap-2 flex-shrink-0 ml-3">
              {selectedDoc.filePath && (
                <a
                  href={selectedDoc.filePath}
                  download
                  className="p-2 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors"
                  title="Скачать"
                >
                  <Download size={18} />
                </a>
              )}
              <button
                onClick={() => setSelectedDoc(null)}
                className="p-2 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors"
              >
                <X size={18} />
              </button>
            </div>
          </div>

          {/* Preview area */}
          <div className="flex-1 overflow-hidden flex items-center justify-center bg-slate-900">
            {selectedDoc.filePath ? (
              (() => {
                const ext = selectedDoc.filePath.split(".").pop()?.toLowerCase();
                const isImage = ["jpg", "jpeg", "png", "gif", "webp"].includes(ext ?? "");
                const isPdf = ext === "pdf";
                if (isImage) {
                  return (
                    <img
                      src={selectedDoc.filePath}
                      alt={selectedDoc.name}
                      className="max-w-full max-h-full object-contain"
                    />
                  );
                }
                if (isPdf) {
                  return (
                    <iframe
                      src={selectedDoc.filePath}
                      className="w-full h-full border-0"
                      title={selectedDoc.name}
                    />
                  );
                }
                return (
                  <div className="text-center text-white/60 p-8">
                    <div className="text-5xl mb-4">📎</div>
                    <div className="text-sm mb-4">Предпросмотр недоступен</div>
                    <a
                      href={selectedDoc.filePath}
                      download
                      className="px-4 py-2 bg-[#1A3A5C] text-white rounded-md text-sm font-medium"
                    >
                      Скачать файл
                    </a>
                  </div>
                );
              })()
            ) : (
              <div className="text-center text-white/40 p-8">
                <div className="text-5xl mb-3">📄</div>
                <div className="text-sm">Файл не прикреплён</div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Profile Modal */}
      {showProfile && (
        <div className="absolute inset-0 bg-black/60 flex flex-col z-50">
          <div className="flex-1 overflow-y-auto bg-white">
            {/* Header */}
            <div className="bg-[#0C2340] px-5 pt-10 pb-8 text-white">
              <div className="flex items-center justify-between mb-5">
                <button onClick={() => setShowProfile(false)} className="p-2 rounded-full hover:bg-white/10 transition-colors">
                  <ArrowLeft size={20} />
                </button>
                <span className="text-sm font-semibold">{t.profile.title}</span>
                <div className="w-9" />
              </div>
              <div className="flex flex-col items-center gap-3">
                <button
                  onClick={() => photoInputRef.current?.click()}
                  disabled={photoUploading}
                  className="relative group"
                  title="Изменить фото"
                >
                  {migrant?.photo ? (
                    <img src={migrant.photo} alt="Фото" className="w-20 h-20 rounded-full object-cover border-2 border-white/30" />
                  ) : (
                    <div className="w-20 h-20 rounded-full bg-white/20 flex items-center justify-center text-3xl font-bold">
                      {initials}
                    </div>
                  )}
                  {/* Overlay on hover */}
                  <div className="absolute inset-0 rounded-full bg-black/40 flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                    {photoUploading
                      ? <RefreshCw size={16} className="text-white animate-spin" />
                      : <><Upload size={16} className="text-white" /><span className="text-white text-[9px] mt-0.5">{t.profile.changePhoto}</span></>
                    }
                  </div>
                </button>
                <div className="text-center">
                  <div className="text-xl font-bold">{migrant.lastName} {migrant.firstName} {migrant.middleName}</div>
                  <div className="text-slate-300 text-sm mt-1">{migrant.id}</div>
                </div>
                <div className={`px-3 py-0.5 rounded text-[10px] font-semibold uppercase tracking-wider ${
                  migrant.status === "active" ? "bg-emerald-700/60 text-emerald-200" :
                  migrant.status === "expired" ? "bg-amber-700/60 text-amber-200" :
                  "bg-red-700/60 text-red-200"
                }`}>
                  {migrant.status === "active" ? t.status.active : migrant.status === "expired" ? t.status.expired : t.status.blocked}
                </div>
              </div>
            </div>

            <div className="p-4 space-y-4 bg-[#F0F2F5]">
              {/* Personal info */}
              <Section title={t.profile.personalData}>
                <Row label={t.profile.fullName} value={`${migrant.lastName} ${migrant.firstName} ${migrant.middleName ?? ""}`} />
                <Row label={t.home.citizenship} value={migrant.citizenship} />
                <Row
                  label={t.home.passport}
                  value={[migrant.passportSeries, migrant.passportNumber].filter(Boolean).join(" ") || migrant.passportNumber}
                />
                {migrant.passportIssuedBy && <Row label={t.upload.issuedBy} value={migrant.passportIssuedBy} />}
                {migrant.passportIssueDate && <Row label={t.upload.issueDate} value={formatDate(migrant.passportIssueDate)} />}
                {migrant.passportExpiry && <Row label={t.upload.expiry} value={formatDate(migrant.passportExpiry)} />}
                <Row label="Tel" value={migrant.phone} />
                <Row label={t.home.address} value={migrant.address} />
              </Section>

              {/* Registration */}
              <Section title={t.profile.registrationStatus}>
                <Row label={t.nav.registrationUntil} value={
                  migrant.status === "active" ? t.status.active :
                  migrant.status === "expired" ? t.status.expired : t.status.blocked
                } />
                <Row label={t.profile.registrationUntil} value={formatDate(migrant.registrationExpiry)} />
                <Row label={t.profile.daysLeft} value={daysLeft > 0 ? `${daysLeft}` : t.nav.daysExpired} highlight={daysLeft <= 14} />
                <Row label={t.profile.employment} value={migrant.employed ? `${t.profile.employed} · ${migrant.employer ?? ""}` : t.profile.unemployed} />
                {migrant.employed && (
                  <Row label={t.home.workPermit} value="✓" />
                )}
              </Section>

              {/* Payment history */}
              <Section title={t.profile.paymentHistory}>
                {migrant.payments.length === 0 ? (
                  <div className="text-xs text-slate-400 text-center py-3">{t.payments.noPayments}</div>
                ) : (
                  migrant.payments.map((p) => (
                    <div key={p.id} className="flex items-center justify-between py-2 border-b border-slate-50 last:border-0">
                      <div>
                        <div className="text-xs font-medium text-slate-700">{p.description}</div>
                        <div className="text-xs text-slate-400">{formatDate(p.date)}</div>
                      </div>
                      <div className="text-right">
                        <div className="text-xs font-bold text-slate-800">{formatCurrency(p.amount)}</div>
                        <div className={`text-xs ${p.status === "paid" ? "text-emerald-600" : "text-amber-600"}`}>
                          {p.status === "paid" ? t.renewal.success : "..."}
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </Section>

              {/* Appeals / chat messages from staff */}
              <Section title={t.profile.requestHistory}>
                {messages.length === 0 ? (
                  <div className="text-xs text-slate-400 text-center py-3">{t.payments.noPayments}</div>
                ) : (
                  messages.filter(m => m.from === "staff").slice(0, 5).map((m, i) => (
                    <div key={m.id ?? i} className="flex gap-3 py-2 border-b border-slate-50 last:border-0">
                      <div className="w-6 h-6 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                        <span className="text-xs text-blue-600">С</span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-xs text-slate-700 leading-relaxed">{m.text}</div>
                        <div className="text-xs text-slate-400 mt-0.5">
                          {m.createdAt ? new Date(m.createdAt).toLocaleString("ru-RU", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" }) : ""}
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </Section>

              {/* Warnings */}
              <Section title={t.profile.warnings}>
                {daysLeft <= 0 && (
                  <Warning color="red" text={t.profile.expiredWarning} />
                )}
                {daysLeft > 0 && daysLeft <= 7 && (
                  <Warning color="red" text={`${t.profile.urgentWarning} ${daysLeft}!`} />
                )}
                {daysLeft > 7 && daysLeft <= 30 && (
                  <Warning color="amber" text={`${t.profile.soonWarning} ${daysLeft}.`} />
                )}
                {migrant.employed && (
                  <Warning color="blue" text={t.profile.workWarning} />
                )}
                {daysLeft > 30 && !migrant.employed && (
                  <div className="text-xs text-slate-400 text-center py-2">—</div>
                )}
              </Section>
            </div>
          </div>
        </div>
      )}

      {/* Selfie / Верификация */}
      {showSelfie && (
        <div className="absolute inset-0 bg-black flex flex-col z-50">
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 bg-black/80 flex-shrink-0">
            <span className="text-sm font-semibold text-white">{t.selfie.title}</span>
            <button onClick={closeSelfieModal} className="p-2 rounded-full bg-white/10 text-white">
              <X size={18} />
            </button>
          </div>

          <div className="flex-1 flex flex-col items-center justify-center p-6 gap-5">

            {/* STEP: camera */}
            {selfieStep === "camera" && (
              <>
                <div className="relative w-full max-w-sm aspect-[3/4] rounded-3xl overflow-hidden bg-slate-900">
                  <video
                    ref={videoRef}
                    autoPlay
                    playsInline
                    muted
                    className="w-full h-full object-cover scale-x-[-1]"
                  />
                  {/* Face guide oval */}
                  <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                    <div className="w-48 h-64 rounded-full border-4 border-white/60" style={{ boxShadow: "0 0 0 9999px rgba(0,0,0,0.4)" }} />
                  </div>
                </div>
                <p className="text-white/70 text-sm text-center">{t.selfie.capture}</p>
                <button
                  onClick={captureSelfie}
                  className="w-16 h-16 rounded-full bg-white flex items-center justify-center shadow-lg active:scale-95 transition-transform"
                >
                  <div className="w-12 h-12 rounded-full bg-white border-4 border-slate-300" />
                </button>
              </>
            )}

            {/* STEP: preview */}
            {selfieStep === "preview" && selfieUrl && (
              <>
                <div className="w-full max-w-sm aspect-[3/4] rounded-3xl overflow-hidden">
                  <img src={selfieUrl} alt="Selfie" className="w-full h-full object-cover scale-x-[-1]" />
                </div>
                <p className="text-white/70 text-sm text-center">{t.selfie.capture}</p>
                <div className="flex gap-3 w-full max-w-sm">
                  <button
                    onClick={() => { setSelfieStep("camera"); startCamera(); }}
                    className="flex-1 py-3 rounded-lg bg-white/10 text-white text-sm font-medium"
                  >
                    {t.selfie.retake}
                  </button>
                  <button
                    onClick={submitSelfie}
                    className="flex-1 py-3 rounded-lg bg-[#1A3A5C] text-white text-sm font-semibold"
                  >
                    {t.selfie.submit}
                  </button>
                </div>
              </>
            )}

            {/* STEP: checking */}
            {selfieStep === "checking" && (
              <div className="flex flex-col items-center gap-6 text-center">
                <div className="w-24 h-24 rounded-full bg-blue-500/20 flex items-center justify-center">
                  <RefreshCw size={36} className="text-blue-400 animate-spin" />
                </div>
                <div>
                  <div className="text-white font-bold text-lg mb-2">{t.selfie.checking}</div>
                  <div className="text-white/60 text-sm">{t.selfie.step2}…</div>
                </div>
                <div className="w-full max-w-xs space-y-2">
                  {[t.selfie.step1, t.selfie.step2, t.selfie.step3].map((step, i) => (
                    <div key={step} className="flex items-center gap-3 text-sm">
                      <div className={`w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 ${i === 0 ? "bg-blue-500" : "bg-white/10"}`}>
                        {i === 0 ? <RefreshCw size={10} className="text-white animate-spin" /> : <span className="text-white/30 text-xs">{i + 1}</span>}
                      </div>
                      <span className={i === 0 ? "text-white" : "text-white/40"}>{step}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* STEP: done */}
            {selfieStep === "done" && (
              <div className="flex flex-col items-center gap-5 text-center">
                <div className="w-24 h-24 rounded-full bg-amber-500/20 flex items-center justify-center">
                  <span className="text-5xl">⏳</span>
                </div>
                <div>
                  <div className="text-white font-bold text-xl mb-2">{t.selfie.done}</div>
                  <div className="text-white/60 text-sm leading-relaxed">
                    {t.selfie.doneSub}
                  </div>
                </div>
                <div className="bg-white/10 rounded-lg p-4 w-full max-w-xs text-left space-y-2 text-sm text-white/70">
                  <div className="flex items-center gap-2"><CheckCircle size={14} className="text-emerald-400" /> Selfie ✓</div>
                  <div className="flex items-center gap-2"><CheckCircle size={14} className="text-emerald-400" /> {t.selfie.step3}</div>
                  <div className="flex items-center gap-2"><Clock size={14} className="text-amber-400" /> {t.home.verifyPending}</div>
                </div>
                <button onClick={closeSelfieModal} className="w-full max-w-xs py-3 bg-white text-slate-900 rounded-lg text-sm font-semibold">
                  OK
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Upload Document Modal */}
      {showUpload && (
        <div
          className="absolute inset-0 bg-black/60 flex items-end z-50"
          onClick={() => !uploadLoading && setShowUpload(false)}
        >
          <div
            className="bg-white rounded-t-lg w-full p-5 pb-8"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-slate-800">{t.upload.title}</h3>
              {!uploadLoading && <button onClick={() => setShowUpload(false)} className="text-slate-400 text-lg leading-none">✕</button>}
            </div>
            {uploadDone ? (
              <div className="py-6 text-center space-y-3">
                <div className="w-14 h-14 bg-emerald-100 rounded-full flex items-center justify-center mx-auto">
                  <CheckCircle size={28} className="text-emerald-500" />
                </div>
                <div className="font-bold text-slate-800">{t.docs.myDocs} ✓</div>
                <div className="text-sm text-slate-500">{t.selfie.step3}</div>
              </div>
            ) : (
              <div className="space-y-4">
                <div>
                  <label className="text-xs text-slate-500 mb-1.5 block">{t.upload.type}</label>
                  <select
                    value={uploadType}
                    onChange={(e) => {
                      setUploadType(e.target.value);
                      // автоподставить название если поле не трогали
                      setUploadName((prev) =>
                        prev === "" || Object.values(DOC_TYPE_NAMES).includes(prev)
                          ? DOC_TYPE_NAMES[e.target.value] ?? ""
                          : prev
                      );
                    }}
                    className="w-full border border-slate-200 rounded-md px-3 py-2.5 text-sm text-slate-700 bg-white focus:outline-none focus:ring-2 focus:ring-[#1A3A5C]"
                  >
                    <option value="passport">🪪 Паспорт</option>
                    <option value="migration_card">📋 Миграционная карта</option>
                    <option value="stay_receipt">📄 Квитанция об оплате</option>
                    <option value="medical">🏥 Медицинская справка</option>
                    <option value="other">📁 Другое</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs text-slate-500 mb-1.5 block">{t.upload.name}</label>
                  <input
                    type="text"
                    value={uploadName}
                    onChange={(e) => setUploadName(e.target.value)}
                    placeholder={t.upload.namePlaceholder}
                    className="w-full border border-slate-200 rounded-md px-3 py-2.5 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-[#1A3A5C]"
                  />
                </div>

                {/* Паспортные данные — только для паспорта */}
                {uploadType === "passport" && (
                  <div className="bg-[#F0F2F5] rounded-lg p-4 space-y-3 border border-slate-200">
                    <div className="text-xs font-semibold text-slate-600 uppercase tracking-wider mb-1">{t.upload.passportData}</div>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="text-xs text-slate-500 mb-1 block">{t.upload.series}</label>
                        <input
                          type="text"
                          value={ppSeries}
                          onChange={(e) => setPpSeries(e.target.value.toUpperCase())}
                          placeholder="AA"
                          className="w-full border border-slate-200 rounded-md px-3 py-2 text-sm text-slate-700 bg-white focus:outline-none focus:ring-2 focus:ring-[#1A3A5C] uppercase"
                        />
                      </div>
                      <div>
                        <label className="text-xs text-slate-500 mb-1 block">{t.upload.number} <span className="text-red-500">*</span></label>
                        <input
                          type="text"
                          value={ppNumber}
                          onChange={(e) => setPpNumber(e.target.value.toUpperCase())}
                          placeholder="1234567"
                          className="w-full border border-slate-200 rounded-md px-3 py-2 text-sm text-slate-700 bg-white focus:outline-none focus:ring-2 focus:ring-[#1A3A5C]"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="text-xs text-slate-500 mb-1 block">{t.upload.issuedBy}</label>
                      <input
                        type="text"
                        value={ppIssuedBy}
                        onChange={(e) => setPpIssuedBy(e.target.value)}
                        placeholder="МВД"
                        className="w-full border border-slate-200 rounded-md px-3 py-2 text-sm text-slate-700 bg-white focus:outline-none focus:ring-2 focus:ring-[#1A3A5C]"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="text-xs text-slate-500 mb-1 block">{t.upload.issueDate}</label>
                        <input
                          type="date"
                          value={ppIssueDate}
                          onChange={(e) => setPpIssueDate(e.target.value)}
                          className="w-full border border-slate-200 rounded-md px-3 py-2 text-sm text-slate-700 bg-white focus:outline-none focus:ring-2 focus:ring-[#1A3A5C]"
                        />
                      </div>
                      <div>
                        <label className="text-xs text-slate-500 mb-1 block">{t.upload.expiry}</label>
                        <input
                          type="date"
                          value={ppExpiry}
                          onChange={(e) => setPpExpiry(e.target.value)}
                          className="w-full border border-slate-200 rounded-md px-3 py-2 text-sm text-slate-700 bg-white focus:outline-none focus:ring-2 focus:ring-[#1A3A5C]"
                        />
                      </div>
                    </div>
                    <div className="text-xs text-blue-600">
                      Данные будут обновлены в карточке мигранта
                    </div>
                  </div>
                )}

                <div>
                  <label className="text-xs text-slate-500 mb-1.5 block">{t.upload.file}</label>
                  <label className={`flex flex-col items-center justify-center w-full border-2 border-dashed rounded-md py-5 cursor-pointer transition-colors ${uploadFile ? "border-[#1A3A5C] bg-slate-50" : "border-slate-300 hover:border-[#1A3A5C] hover:bg-slate-50"}`}>
                    <input
                      type="file"
                      accept="image/*,.pdf"
                      className="hidden"
                      onChange={(e) => setUploadFile(e.target.files?.[0] ?? null)}
                    />
                    {uploadFile ? (
                      <>
                        <span className="text-2xl mb-1">📎</span>
                        <span className="text-sm font-medium text-blue-700">{uploadFile.name}</span>
                        <span className="text-xs text-slate-400 mt-0.5">{(uploadFile.size / 1024).toFixed(0)} KB</span>
                      </>
                    ) : (
                      <>
                        <Upload size={20} className="text-slate-400 mb-2" />
                        <span className="text-sm text-slate-500">{t.upload.chooseFile}</span>
                        <span className="text-xs text-slate-400 mt-0.5">PDF, JPG, PNG</span>
                      </>
                    )}
                  </label>
                </div>
                <button
                  onClick={handleUpload}
                  disabled={!uploadFile || uploadLoading || (uploadType === "passport" && !ppNumber.trim())}
                  className="w-full py-3 bg-[#1A3A5C] hover:bg-[#0C2340] disabled:opacity-50 text-white rounded-md text-sm font-semibold transition-colors"
                >
                  {uploadLoading ? t.upload.uploading : t.upload.submit}
                </button>
                {uploadType === "passport" && !ppNumber.trim() && uploadFile && (
                  <div className="text-xs text-center text-red-500">Укажите номер паспорта</div>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Renewal Modal */}
      {showRenewal && (
        <div
          className="absolute inset-0 bg-black/60 flex items-end z-50"
          onClick={() => !renewalLoading && setShowRenewal(false)}
        >
          <div
            className="bg-white rounded-t-lg w-full p-5 pb-8"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-slate-800">{t.renewal.title}</h3>
              {!renewalLoading && <button onClick={() => setShowRenewal(false)} className="text-slate-400 text-lg leading-none">✕</button>}
            </div>
            {renewalDone ? (
              <div className="py-6 text-center space-y-3">
                <div className="w-14 h-14 bg-emerald-100 rounded-full flex items-center justify-center mx-auto">
                  <CheckCircle size={28} className="text-emerald-500" />
                </div>
                <div className="font-bold text-slate-800">{t.renewal.success}</div>
                <div className="text-sm text-slate-500">{t.selfie.doneSub}</div>
                <button
                  onClick={() => { setShowRenewal(false); setRenewalDone(false); }}
                  className="mt-2 w-full py-3 bg-[#1A3A5C] text-white rounded-md text-sm font-semibold"
                >
                  OK
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                <div className={`rounded-md p-3 flex gap-3 border ${daysLeft < 0 ? "bg-red-50 border-red-100" : daysLeft <= 7 ? "bg-red-50 border-red-100" : "bg-amber-50 border-amber-100"}`}>
                  <AlertTriangle size={15} className={`flex-shrink-0 mt-0.5 ${daysLeft < 0 || daysLeft <= 7 ? "text-red-500" : "text-amber-600"}`} />
                  <div className={`text-xs ${daysLeft < 0 || daysLeft <= 7 ? "text-red-700" : "text-amber-700"}`}>
                    {daysLeft < 0
                      ? <>{t.profile.expiredAgo} <b>{Math.abs(daysLeft)}</b> {t.profile.daysAgo}.</>
                      : daysLeft === 0
                        ? <>{t.profile.expiredToday}</>
                        : daysLeft <= 7
                          ? <>{t.profile.urgentWarning} <b>{daysLeft}</b> {t.profile.daysWord}!</>
                          : <>{t.profile.soonWarning} <b>{daysLeft}</b> {t.profile.daysWord}.</>
                    }
                  </div>
                </div>
                <div className="space-y-2 text-sm">
                  {[
                    { label: t.profile.fullName, value: `${migrant.lastName} ${migrant.firstName}` },
                    { label: t.home.passport, value: migrant.passportNumber },
                    { label: t.renewal.currentExpiry, value: formatDate(migrant.registrationExpiry) },
                    { label: t.home.citizenship, value: migrant.citizenship },
                  ].map(({ label, value }) => (
                    <div key={label} className="flex justify-between py-2 border-b border-slate-100">
                      <span className="text-slate-400">{label}</span>
                      <span className="font-medium text-slate-800">{value}</span>
                    </div>
                  ))}
                </div>
                <p className="text-xs text-slate-400">
                  {t.renewal.submit}.
                </p>
                <button
                  onClick={handleRenewal}
                  disabled={renewalLoading}
                  className="w-full py-3 bg-[#1A3A5C] hover:bg-[#0C2340] disabled:opacity-60 text-white rounded-md text-sm font-semibold transition-colors"
                >
                  {renewalLoading ? "..." : t.renewal.submit}
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Notifications Modal */}
      {showNotif && (
        <div
          className="absolute inset-0 bg-black/60 flex items-end z-50"
          onClick={() => setShowNotif(false)}
        >
          <div
            className="bg-white rounded-t-lg w-full p-5 pb-8"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-slate-800">{t.home.notifications}</h3>
              <button onClick={() => setShowNotif(false)} className="text-slate-400 text-lg leading-none">✕</button>
            </div>
            <div className="space-y-3">
              {migrant.employed && (
                <div className="flex gap-3 p-3 bg-slate-50 rounded-md border border-slate-200">
                  <CheckCircle size={16} className="text-slate-500 flex-shrink-0 mt-0.5" />
                  <div>
                    <div className="text-sm font-medium text-slate-800">{t.home.workPermit}</div>
                    <div className="text-xs text-slate-500 mt-0.5">
                      {t.home.workPermitFee}
                    </div>
                  </div>
                </div>
              )}
              <div className="flex gap-3 p-3 bg-slate-50 rounded-md border border-slate-200">
                <CheckCircle size={16} className="text-slate-500 flex-shrink-0 mt-0.5" />
                <div>
                  <div className="text-sm font-medium text-slate-800">{t.nav.registrationUntil}</div>
                  <div className="text-xs text-slate-500 mt-0.5">
                    {migrant.registrationExpiry ? formatDate(migrant.registrationExpiry) : "—"}.{" "}
                    {daysLeft < 0
                      ? <span className="text-red-500">{t.profile.expiredAgo} {Math.abs(daysLeft)} {t.profile.daysAgo}</span>
                      : daysLeft === 0
                        ? <span className="text-red-500">{t.profile.expiredToday}</span>
                        : <>{t.nav.daysLeft}: {daysLeft}</>
                    }
                  </div>
                </div>
              </div>
              {migrant.payments.length > 0 && (
                <div className="flex gap-3 p-3 bg-slate-50 rounded-md border border-slate-200">
                  <CheckCircle size={16} className="text-emerald-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <div className="text-sm font-medium text-slate-800">Последний платёж подтверждён</div>
                    <div className="text-xs text-slate-500 mt-0.5">
                      {migrant.payments[0].description} · {formatCurrency(migrant.payments[0].amount)}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="bg-white rounded-lg border border-slate-200 overflow-hidden">
      <div className="px-4 py-2.5 bg-[#F0F2F5] border-b border-slate-200">
        <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">{title}</span>
      </div>
      <div className="px-4 py-2">{children}</div>
    </div>
  );
}

function Row({ label, value, highlight }: { label: string; value: string; highlight?: boolean }) {
  return (
    <div className="flex justify-between items-start py-2 border-b border-slate-50 last:border-0">
      <span className="text-xs text-slate-400 flex-shrink-0 mr-4">{label}</span>
      <span className={`text-xs font-medium text-right ${highlight ? "text-red-600" : "text-slate-700"}`}>{value}</span>
    </div>
  );
}

function Warning({ color, text }: { color: "red" | "amber" | "blue"; text: string }) {
  const styles = {
    red: { bg: "bg-red-50", border: "border-red-100", icon: "text-red-500", text: "text-red-700" },
    amber: { bg: "bg-amber-50", border: "border-amber-100", icon: "text-amber-500", text: "text-amber-700" },
    blue: { bg: "bg-blue-50", border: "border-blue-100", icon: "text-blue-500", text: "text-blue-700" },
  }[color];
  return (
    <div className={`flex gap-2 p-3 rounded-md border ${styles.bg} ${styles.border} mb-2 last:mb-0`}>
      <AlertTriangle size={14} className={`${styles.icon} flex-shrink-0 mt-0.5`} />
      <span className={`text-xs ${styles.text}`}>{text}</span>
    </div>
  );
}
