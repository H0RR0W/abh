import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDate(dateStr: string | null | undefined): string {
  if (!dateStr) return "—";
  return new Date(dateStr).toLocaleDateString("ru-RU", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("ru-RU", {
    style: "currency",
    currency: "RUB",
    minimumFractionDigits: 0,
  }).format(amount);
}

export function getStatusLabel(status: string): string {
  const labels: Record<string, string> = {
    active: "Активен",
    expired: "Просрочен",
    blocked: "Заблокирован",
    pending: "На проверке",
  };
  return labels[status] ?? status;
}

export function getStatusColor(status: string): string {
  const colors: Record<string, string> = {
    active: "bg-emerald-100 text-emerald-800",
    expired: "bg-amber-100 text-amber-800",
    blocked: "bg-red-100 text-red-800",
    pending: "bg-blue-100 text-blue-800",
  };
  return colors[status] ?? "bg-gray-100 text-gray-800";
}

export function getDocStatusLabel(status: string): string {
  const labels: Record<string, string> = {
    verified: "Проверен",
    expired: "Просрочен",
    expiring: "Истекает",
    pending: "На проверке",
  };
  return labels[status] ?? status;
}

export function getDocStatusColor(status: string): string {
  const colors: Record<string, string> = {
    verified: "bg-emerald-100 text-emerald-700",
    expired: "bg-red-100 text-red-700",
    expiring: "bg-amber-100 text-amber-700",
    pending: "bg-blue-100 text-blue-700",
  };
  return colors[status] ?? "bg-gray-100 text-gray-700";
}

export function getPaymentStatusLabel(status: string): string {
  const labels: Record<string, string> = {
    paid: "Оплачен",
    unpaid: "Не оплачен",
    overdue: "Просрочен",
    pending: "Ожидает",
  };
  return labels[status] ?? status;
}

export function getPaymentStatusColor(status: string): string {
  const colors: Record<string, string> = {
    paid: "bg-emerald-100 text-emerald-700",
    unpaid: "bg-red-100 text-red-700",
    overdue: "bg-red-100 text-red-700",
    pending: "bg-amber-100 text-amber-700",
  };
  return colors[status] ?? "bg-gray-100 text-gray-700";
}

export function getCitizenshipFlag(citizenship: string): string { void citizenship;
  return "";
}

export function getInitials(firstName: string, lastName: string): string {
  return `${firstName[0] ?? ""}${lastName[0] ?? ""}`.toUpperCase();
}
