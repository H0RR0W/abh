"use client";

import { useState, useEffect, useCallback } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { ClipboardList, Calendar, User, MapPin, CheckCircle, Clock, AlertTriangle, Filter, RefreshCw, ChevronDown, ChevronUp, ThumbsUp, ThumbsDown, ExternalLink } from "lucide-react";

type TaskStatus = "pending" | "done" | "missed";
type TaskType = "office" | "field" | "renewal" | "verification";

interface Task {
  id: string;
  migrantId: string;
  type: TaskType;
  date: string;
  inspector: string;
  note: string;
  status: TaskStatus;
  migrant: { firstName: string; lastName: string; address: string };
}

const STATUS_LABELS: Record<TaskStatus, string> = {
  pending: "Ожидает",
  done: "Выполнено",
  missed: "Пропущено",
};

const STATUS_COLORS: Record<TaskStatus, string> = {
  pending: "bg-blue-100 text-blue-700",
  done: "bg-emerald-100 text-emerald-700",
  missed: "bg-red-100 text-red-700",
};

const STATUS_ICONS: Record<TaskStatus, React.ReactNode> = {
  pending: <Clock size={13} className="text-blue-500" />,
  done: <CheckCircle size={13} className="text-emerald-500" />,
  missed: <AlertTriangle size={13} className="text-red-500" />,
};

const TYPE_LABELS: Record<TaskType, string> = {
  office: "🏢 Офисная",
  field: "🚗 Выездная",
  renewal: "📋 Продление регистрации",
  verification: "🤳 Верификация личности",
};

interface MigrantDetail {
  photo?: string;
  selfiePhoto?: string;
  identityStatus?: string;
}

export default function TasksPage() {
  const searchParams = useSearchParams();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<"all" | TaskStatus>(
    (searchParams.get("status") as TaskStatus) ?? "all"
  );
  const [typeFilter, setTypeFilter] = useState<"all" | TaskType>(
    (searchParams.get("type") as TaskType) ?? "all"
  );
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [migrantDetails, setMigrantDetails] = useState<Record<string, MigrantDetail>>({});
  const [verifyLoading, setVerifyLoading] = useState<string | null>(null);

  const loadTasks = useCallback(() => {
    setLoading(true);
    fetch("/api/inspections")
      .then((r) => r.json())
      .then((d) => { if (Array.isArray(d)) setTasks(d); })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { loadTasks(); }, [loadTasks]);

  async function markDone(id: string) {
    await fetch(`/api/inspections/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: "done" }),
    });
    setTasks((prev) => prev.map((t) => t.id === id ? { ...t, status: "done" } : t));
  }

  async function toggleExpand(task: Task) {
    if (expandedId === task.id) {
      setExpandedId(null);
      return;
    }
    setExpandedId(task.id);
    if (!migrantDetails[task.migrantId]) {
      try {
        const res = await fetch(`/api/migrants/${task.migrantId}`);
        const data = await res.json();
        setMigrantDetails((prev) => ({ ...prev, [task.migrantId]: data }));
      } catch {}
    }
  }

  async function handleVerify(task: Task, verdict: "verified" | "rejected") {
    setVerifyLoading(task.id + verdict);
    try {
      await fetch(`/api/migrants/${task.migrantId}/verify`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: verdict }),
      });
      // mark task done
      await fetch(`/api/inspections/${task.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "done" }),
      });
      setTasks((prev) => prev.map((t) => t.id === task.id ? { ...t, status: "done" } : t));
      setMigrantDetails((prev) => ({
        ...prev,
        [task.migrantId]: { ...prev[task.migrantId], identityStatus: verdict },
      }));
      setExpandedId(null);
    } finally {
      setVerifyLoading(null);
    }
  }

  const filtered = tasks
    .filter((t) => statusFilter === "all" || t.status === statusFilter)
    .filter((t) => typeFilter === "all" || t.type === typeFilter);
  const counts = {
    pending: tasks.filter((t) => t.status === "pending").length,
    done: tasks.filter((t) => t.status === "done").length,
    missed: tasks.filter((t) => t.status === "missed").length,
  };

  return (
    <div className="p-6 space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Задания</h1>
          <p className="text-slate-500 text-sm mt-1">Назначенные проверки мигрантов</p>
        </div>
        <button onClick={loadTasks} className="p-2 rounded-lg hover:bg-slate-100 transition-colors text-slate-500">
          <RefreshCw size={16} className={loading ? "animate-spin" : ""} />
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-white rounded-xl border border-blue-100 p-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg flex items-center justify-center bg-blue-50">
            <Clock size={18} className="text-blue-500" />
          </div>
          <div>
            <div className="text-2xl font-bold text-slate-800">{counts.pending}</div>
            <div className="text-xs text-slate-500">Ожидают</div>
          </div>
        </div>
        <div className="bg-white rounded-xl border border-emerald-100 p-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg flex items-center justify-center bg-emerald-50">
            <CheckCircle size={18} className="text-emerald-500" />
          </div>
          <div>
            <div className="text-2xl font-bold text-slate-800">{counts.done}</div>
            <div className="text-xs text-slate-500">Выполнено</div>
          </div>
        </div>
        <div className="bg-white rounded-xl border border-red-100 p-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg flex items-center justify-center bg-red-50">
            <AlertTriangle size={18} className="text-red-500" />
          </div>
          <div>
            <div className="text-2xl font-bold text-slate-800">{counts.missed}</div>
            <div className="text-xs text-slate-500">Пропущено</div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-2 items-center">
        <Filter size={14} className="text-slate-400" />
        {(["all", "pending", "done", "missed"] as const).map((s) => (
          <button
            key={s}
            onClick={() => setStatusFilter(s)}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
              statusFilter === s ? "bg-blue-600 text-white" : "bg-white border border-slate-200 text-slate-600 hover:bg-slate-50"
            }`}
          >
            {s === "all" ? "Все статусы" : STATUS_LABELS[s]}
          </button>
        ))}
        <div className="h-5 w-px bg-slate-200 mx-1" />
        {(["all", "verification", "renewal", "office", "field"] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTypeFilter(t)}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
              typeFilter === t ? "bg-violet-600 text-white" : "bg-white border border-slate-200 text-slate-600 hover:bg-slate-50"
            }`}
          >
            {t === "all" ? "Все типы" : TYPE_LABELS[t]}
          </button>
        ))}
      </div>

      {/* Tasks list */}
      <div className="space-y-3">
        {loading && (
          <div className="text-center py-12 text-slate-400 text-sm">Загрузка...</div>
        )}
        {!loading && filtered.length === 0 && (
          <div className="text-center py-12 text-slate-400 text-sm">
            Нет заданий. Назначьте проверку на странице мигранта.
          </div>
        )}
        {filtered.map((task) => {
          const isExpanded = expandedId === task.id;
          const detail = migrantDetails[task.migrantId];
          const isVerification = task.type === "verification";

          return (
            <div key={task.id} className={`bg-white rounded-xl border p-5 transition-colors ${
              isExpanded ? "border-violet-300" : "border-slate-200"
            }`}>
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-start gap-3 flex-1 min-w-0">
                  <div className={`w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 ${
                    task.status === "done" ? "bg-emerald-100" : task.status === "missed" ? "bg-red-100" : "bg-blue-100"
                  }`}>
                    <ClipboardList size={16} className={
                      task.status === "done" ? "text-emerald-600" : task.status === "missed" ? "text-red-600" : "text-blue-600"
                    } />
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <Link
                        href={task.type === "verification"
                          ? `/admin/migrants/${task.migrantId}?tab=info`
                          : `/admin/migrants/${task.migrantId}`}
                        className="font-semibold text-slate-800 hover:text-blue-600 transition-colors"
                      >
                        {task.migrant.lastName} {task.migrant.firstName}
                      </Link>
                      <span className="text-xs text-slate-400">{task.migrantId}</span>
                    </div>
                    <div className="flex items-center gap-3 mt-1 flex-wrap">
                      <span className="text-xs text-slate-500">{TYPE_LABELS[task.type as TaskType] ?? task.type}</span>
                      <span className="text-xs text-slate-400 flex items-center gap-1">
                        <Calendar size={11} />
                        {task.date}
                      </span>
                      <span className="text-xs text-slate-400 flex items-center gap-1">
                        <User size={11} />
                        {task.inspector}
                      </span>
                      {task.type === "field" && task.migrant.address && (
                        <span className="text-xs text-slate-400 flex items-center gap-1">
                          <MapPin size={11} />
                          {task.migrant.address.split(",")[0]}
                        </span>
                      )}
                    </div>
                    {task.note && (
                      <p className="text-xs text-slate-500 mt-1.5 leading-relaxed">{task.note}</p>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  {isVerification && task.status === "pending" && (
                    <button
                      onClick={() => toggleExpand(task)}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border transition-colors ${
                        isExpanded
                          ? "bg-violet-100 border-violet-300 text-violet-700"
                          : "bg-white border-slate-200 text-slate-600 hover:bg-violet-50 hover:border-violet-200"
                      }`}
                    >
                      Сверить фото
                      {isExpanded ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
                    </button>
                  )}
                  {task.status === "pending" && !isVerification ? (
                    <button
                      onClick={() => markDone(task.id)}
                      className="px-4 py-1.5 bg-emerald-600 text-white rounded-lg text-xs font-semibold hover:bg-emerald-700 transition-colors"
                    >
                      Отметить выполненным
                    </button>
                  ) : task.status !== "pending" ? (
                    <div className="flex items-center gap-1.5">
                      {STATUS_ICONS[task.status as TaskStatus]}
                      <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${STATUS_COLORS[task.status as TaskStatus]}`}>
                        {STATUS_LABELS[task.status as TaskStatus]}
                      </span>
                    </div>
                  ) : null}
                </div>
              </div>

              {/* Expanded photo comparison for verification tasks */}
              {isExpanded && isVerification && (
                <div className="mt-4 pt-4 border-t border-violet-100">
                  {!detail ? (
                    <div className="text-center py-4 text-slate-400 text-sm">Загрузка данных...</div>
                  ) : (
                    <div>
                      <p className="text-xs font-medium text-slate-500 mb-3">Сравнение фотографий</p>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="flex flex-col items-center gap-2">
                          <div className="w-full aspect-square rounded-xl overflow-hidden bg-slate-100 border border-slate-200">
                            {detail.photo ? (
                              <img src={detail.photo} alt="Фото профиля" className="w-full h-full object-cover" />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center">
                                <div className="text-4xl font-bold text-slate-300">
                                  {task.migrant.firstName?.[0]}{task.migrant.lastName?.[0]}
                                </div>
                              </div>
                            )}
                          </div>
                          <span className="text-xs text-slate-500 font-medium">📷 Фото профиля</span>
                        </div>
                        <div className="flex flex-col items-center gap-2">
                          <div className="w-full aspect-square rounded-xl overflow-hidden bg-slate-100 border border-slate-200">
                            {detail.selfiePhoto ? (
                              <img src={detail.selfiePhoto} alt="Selfie" className="w-full h-full object-cover" />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center text-slate-300 text-xs">
                                Нет selfie
                              </div>
                            )}
                          </div>
                          <span className="text-xs text-slate-500 font-medium">🤳 Selfie мигранта</span>
                        </div>
                      </div>
                      <div className="flex gap-3 mt-4">
                        <button
                          onClick={() => handleVerify(task, "verified")}
                          disabled={!!verifyLoading}
                          className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-60 text-white text-sm font-semibold rounded-xl transition-colors"
                        >
                          <ThumbsUp size={15} />
                          Подтвердить личность
                        </button>
                        <button
                          onClick={() => handleVerify(task, "rejected")}
                          disabled={!!verifyLoading}
                          className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-red-600 hover:bg-red-700 disabled:opacity-60 text-white text-sm font-semibold rounded-xl transition-colors"
                        >
                          <ThumbsDown size={15} />
                          Отклонить
                        </button>
                      </div>
                      <div className="mt-2 text-center">
                        <Link
                          href={`/admin/migrants/${task.migrantId}?tab=info`}
                          className="text-xs text-blue-500 hover:text-blue-700 flex items-center justify-center gap-1"
                        >
                          <ExternalLink size={11} />
                          Открыть карточку мигранта
                        </Link>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
