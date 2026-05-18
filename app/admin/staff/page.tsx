"use client";

import { useState, useEffect } from "react";
import { Users, Plus, Check, X, Pencil, MapPin } from "lucide-react";
import { ROLE_LABELS } from "@/lib/roles";
import { DISTRICTS } from "@/lib/districts";

interface StaffUser {
  id: string;
  name: string;
  email: string;
  role: string;
  createdAt: string;
  districts: string[];
}

const VALID_ROLES = ["admin", "inspector", "operator", "analyst", "management"] as const;

export default function StaffPage() {
  const [users, setUsers] = useState<StaffUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ name: "", email: "", role: "inspector" });
  const [formError, setFormError] = useState<string | null>(null);
  const [formLoading, setFormLoading] = useState(false);
  const [createdTempPwd, setCreatedTempPwd] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editRole, setEditRole] = useState("");
  const [districtEditingId, setDistrictEditingId] = useState<string | null>(null);
  const [selectedDistricts, setSelectedDistricts] = useState<string[]>([]);
  const [districtSaving, setDistrictSaving] = useState(false);

  async function fetchUsers() {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/staff");
      if (!res.ok) { setLoading(false); return; }
      const data = await res.json();
      if (Array.isArray(data.users)) setUsers(data.users);
    } catch {
      // network or parse error — stay empty
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { fetchUsers(); }, []);

  async function handleCreate() {
    setFormLoading(true);
    setFormError(null);
    const res = await fetch("/api/admin/staff", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    const data = await res.json();
    setFormLoading(false);
    if (!res.ok) {
      setFormError(data.error ?? "Ошибка создания");
      return;
    }
    setCreatedTempPwd(data.tempPassword);
    setForm({ name: "", email: "", role: "inspector" });
    setShowForm(false);
    fetchUsers();
  }

  async function handleRoleUpdate(id: string, role: string) {
    await fetch(`/api/admin/staff/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ role }),
    });
    setEditingId(null);
    fetchUsers();
  }

  function openDistrictEdit(u: StaffUser) {
    setDistrictEditingId(u.id);
    setSelectedDistricts(u.districts ?? []);
  }

  function toggleDistrict(d: string) {
    setSelectedDistricts((prev) =>
      prev.includes(d) ? prev.filter((x) => x !== d) : [...prev, d]
    );
  }

  async function saveDistricts(id: string) {
    setDistrictSaving(true);
    await fetch(`/api/admin/staff/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ districts: selectedDistricts }),
    });
    setDistrictSaving(false);
    setDistrictEditingId(null);
    fetchUsers();
  }

  const roleBadgeColor: Record<string, string> = {
    admin: "bg-red-100 text-red-700",
    inspector: "bg-blue-100 text-blue-700",
    operator: "bg-amber-100 text-amber-700",
    analyst: "bg-purple-100 text-purple-700",
    management: "bg-emerald-100 text-emerald-700",
  };

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded bg-[#1A3A5C] flex items-center justify-center">
            <Users size={18} className="text-white" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-[#0C2340]">Управление сотрудниками</h1>
            <p className="text-sm text-slate-500">Список всех сотрудников системы</p>
          </div>
        </div>
        <button
          onClick={() => { setShowForm(true); setCreatedTempPwd(null); setFormError(null); }}
          className="flex items-center gap-2 px-4 py-2 bg-[#1E3A5F] text-white rounded-lg text-sm font-medium hover:bg-[#0C2340] transition-colors"
        >
          <Plus size={15} />
          Добавить сотрудника
        </button>
      </div>

      {createdTempPwd && (
        <div className="mb-4 p-4 bg-emerald-50 border border-emerald-200 rounded-lg">
          <div className="font-semibold text-emerald-700 text-sm mb-1">Сотрудник создан</div>
          <div className="text-sm text-emerald-600">
            Временный пароль: <span className="font-mono font-bold">{createdTempPwd}</span>
          </div>
          <button onClick={() => setCreatedTempPwd(null)} className="mt-2 text-xs text-emerald-500 underline">
            Закрыть
          </button>
        </div>
      )}

      {showForm && (
        <div className="mb-6 p-5 bg-white border border-slate-200 rounded-xl shadow-sm">
          <div className="font-semibold text-slate-800 mb-4">Новый сотрудник</div>
          {formError && (
            <div className="mb-3 p-3 bg-red-50 text-red-700 rounded-lg text-sm">{formError}</div>
          )}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-4">
            <div>
              <label className="text-xs font-semibold text-slate-500 block mb-1">Имя</label>
              <input
                type="text"
                value={form.name}
                onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                placeholder="Иванов Иван"
                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-500 block mb-1">Email</label>
              <input
                type="email"
                value={form.email}
                onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
                placeholder="user@migration.gov"
                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-500 block mb-1">Роль</label>
              <select
                value={form.role}
                onChange={(e) => setForm((f) => ({ ...f, role: e.target.value }))}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
              >
                {VALID_ROLES.map((r) => (
                  <option key={r} value={r}>{ROLE_LABELS[r]}</option>
                ))}
              </select>
            </div>
          </div>
          <div className="flex gap-2">
            <button
              onClick={handleCreate}
              disabled={formLoading || !form.name || !form.email}
              className="px-4 py-2 bg-[#1E3A5F] text-white rounded-lg text-sm font-medium hover:bg-[#0C2340] transition-colors disabled:opacity-60"
            >
              {formLoading ? "Создание..." : "Создать"}
            </button>
            <button
              onClick={() => setShowForm(false)}
              className="px-4 py-2 bg-slate-100 text-slate-600 rounded-lg text-sm font-medium hover:bg-slate-200 transition-colors"
            >
              Отмена
            </button>
          </div>
        </div>
      )}

      {/* District assignment modal */}
      {districtEditingId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-[#F0F2F5] border border-slate-200 rounded-xl shadow-xl p-6 w-full max-w-sm">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <MapPin size={16} className="text-[#1E3A5F]" />
                <span className="font-semibold text-[#0C2340] text-sm">Назначить районы</span>
              </div>
              <button onClick={() => setDistrictEditingId(null)} className="text-slate-400 hover:text-slate-600">
                <X size={16} />
              </button>
            </div>
            <div className="space-y-2 mb-5">
              {DISTRICTS.map((d) => (
                <label key={d} className="flex items-center gap-3 cursor-pointer group">
                  <div
                    className="w-4 h-4 rounded border-2 flex items-center justify-center flex-shrink-0 transition-colors"
                    style={{
                      borderColor: selectedDistricts.includes(d) ? "#0C2340" : "#cbd5e1",
                      backgroundColor: selectedDistricts.includes(d) ? "#0C2340" : "white",
                    }}
                    onClick={() => toggleDistrict(d)}
                  >
                    {selectedDistricts.includes(d) && (
                      <Check size={10} className="text-white" strokeWidth={3} />
                    )}
                  </div>
                  <span
                    className="text-sm text-slate-700 select-none"
                    onClick={() => toggleDistrict(d)}
                  >
                    {d}
                  </span>
                </label>
              ))}
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => saveDistricts(districtEditingId)}
                disabled={districtSaving}
                className="flex-1 px-4 py-2 bg-[#1E3A5F] text-white rounded-lg text-sm font-medium hover:bg-[#0C2340] transition-colors disabled:opacity-60"
              >
                {districtSaving ? "Сохранение..." : "Сохранить"}
              </button>
              <button
                onClick={() => setDistrictEditingId(null)}
                className="px-4 py-2 bg-white border border-slate-200 text-slate-600 rounded-lg text-sm font-medium hover:bg-slate-50 transition-colors"
              >
                Отмена
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-[#F0F2F5] border-b border-slate-200">
              <th className="text-left px-4 py-3 font-semibold text-slate-600 text-xs uppercase tracking-wide">Имя</th>
              <th className="text-left px-4 py-3 font-semibold text-slate-600 text-xs uppercase tracking-wide">Email</th>
              <th className="text-left px-4 py-3 font-semibold text-slate-600 text-xs uppercase tracking-wide">Роль</th>
              <th className="text-left px-4 py-3 font-semibold text-slate-600 text-xs uppercase tracking-wide">Районы</th>
              <th className="text-left px-4 py-3 font-semibold text-slate-600 text-xs uppercase tracking-wide">Создан</th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {loading ? (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-slate-400 text-sm">Загрузка...</td>
              </tr>
            ) : users.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-slate-400 text-sm">Нет сотрудников</td>
              </tr>
            ) : (
              users.map((u) => (
                <tr key={u.id} className="hover:bg-slate-50 transition-colors">
                  <td className="px-4 py-3 font-medium text-slate-800">{u.name}</td>
                  <td className="px-4 py-3 text-slate-500">{u.email}</td>
                  <td className="px-4 py-3">
                    {editingId === u.id ? (
                      <div className="flex items-center gap-2">
                        <select
                          value={editRole}
                          onChange={(e) => setEditRole(e.target.value)}
                          className="px-2 py-1 border border-slate-200 rounded text-xs focus:outline-none focus:ring-1 focus:ring-blue-400"
                        >
                          {VALID_ROLES.map((r) => (
                            <option key={r} value={r}>{ROLE_LABELS[r]}</option>
                          ))}
                        </select>
                        <button
                          onClick={() => handleRoleUpdate(u.id, editRole)}
                          className="text-emerald-600 hover:text-emerald-700"
                        >
                          <Check size={14} />
                        </button>
                        <button
                          onClick={() => setEditingId(null)}
                          className="text-slate-400 hover:text-slate-600"
                        >
                          <X size={14} />
                        </button>
                      </div>
                    ) : (
                      <span className={`inline-block px-2 py-0.5 rounded text-xs font-semibold ${roleBadgeColor[u.role] ?? "bg-slate-100 text-slate-600"}`}>
                        {ROLE_LABELS[u.role] ?? u.role}
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    {(u.role === "inspector" || u.role === "operator") ? (
                      <div className="flex flex-wrap gap-1 items-center">
                        {(u.districts ?? []).length === 0 ? (
                          <span className="text-xs text-slate-400 italic">Не назначены</span>
                        ) : (
                          (u.districts ?? []).map((d) => (
                            <span key={d} className="inline-block px-1.5 py-0.5 rounded text-[10px] font-semibold bg-[#0C2340] text-white">
                              {d}
                            </span>
                          ))
                        )}
                      </div>
                    ) : (
                      <span className="text-xs text-slate-400">Все районы</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-slate-400 text-xs">
                    {new Date(u.createdAt).toLocaleDateString("ru-RU")}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex items-center justify-end gap-2">
                      {(u.role === "inspector" || u.role === "operator") && editingId !== u.id && (
                        <button
                          onClick={() => openDistrictEdit(u)}
                          className="flex items-center gap-1 text-xs text-[#1E3A5F] hover:text-[#0C2340] font-medium transition-colors"
                          title="Назначить районы"
                        >
                          <MapPin size={12} />
                          Районы
                        </button>
                      )}
                      {editingId !== u.id && (
                        <button
                          onClick={() => { setEditingId(u.id); setEditRole(u.role); }}
                          className="text-slate-400 hover:text-[#1E3A5F] transition-colors"
                        >
                          <Pencil size={14} />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
