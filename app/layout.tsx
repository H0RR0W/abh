import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "ЕЦСМУ — Единая цифровая система миграционного учёта",
  description: "Миграционная служба Республики Абхазия",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ru">
      <body>{children}</body>
    </html>
  );
}
