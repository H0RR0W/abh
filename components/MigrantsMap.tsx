"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { Migrant } from "@/lib/types";
import {
  getStatusLabel,
  getStatusColor,
  getCitizenshipFlag,
  formatDate,
} from "@/lib/utils";

interface Props {
  migrants: Migrant[];
  selectedId?: string;
  focusId?: string | null;
}

export default function MigrantsMap({ migrants, selectedId, focusId }: Props) {
  const mapRef = useRef<HTMLDivElement>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const mapInstanceRef = useRef<any>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const markersLayerRef = useRef<any>(null);
  const [selected, setSelected] = useState<Migrant | null>(
    selectedId ? (migrants.find((m) => m.id === selectedId) ?? null) : null
  );

  // Initialize map once
  useEffect(() => {
    if (!mapRef.current || mapInstanceRef.current) return;

    async function initMap() {
      const L = (await import("leaflet")).default;

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      if ((mapRef.current as any)?._leaflet_id) return;

      const map = L.map(mapRef.current!, {
        center: [43.05, 41.0],
        zoom: 9,
        attributionControl: false,
      });

      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png").addTo(map);

      markersLayerRef.current = L.layerGroup().addTo(map);
      mapInstanceRef.current = map;
    }

    initMap();

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
        markersLayerRef.current = null;
      }
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Update markers whenever migrants data changes
  useEffect(() => {
    if (!mapInstanceRef.current || !markersLayerRef.current) return;

    async function updateMarkers() {
      const L = (await import("leaflet")).default;

      markersLayerRef.current.clearLayers();

      const statusColors: Record<string, string> = {
        active: "#10b981",
        expired: "#f59e0b",
        blocked: "#ef4444",
        pending: "#3b82f6",
      };

      migrants.forEach((m) => {
        const color = statusColors[m.status] ?? "#64748b";
        const icon = L.divIcon({
          className: "",
          html: `<div style="
            width:32px;height:32px;border-radius:50%;
            background:${color};border:3px solid white;
            box-shadow:0 2px 8px rgba(0,0,0,.3);
            display:flex;align-items:center;justify-content:center;
            font-size:13px;cursor:pointer;
            ${selectedId === m.id ? "outline:3px solid #1d4ed8;outline-offset:2px;" : ""}
          ">${m.citizenship[0]}</div>`,
          iconSize: [32, 32],
          iconAnchor: [16, 16],
        });

        const marker = L.marker([m.lat, m.lng], { icon }).addTo(markersLayerRef.current);
        marker.on("click", () => setSelected(m));
      });
    }

    updateMarkers();
  }, [migrants, selectedId]);

  // Fly to focused migrant
  useEffect(() => {
    if (!focusId || !mapInstanceRef.current) return;
    const m = migrants.find((m) => m.id === focusId);
    if (!m) return;
    mapInstanceRef.current.flyTo([m.lat, m.lng], 14, { animate: true, duration: 0.8 });
    setSelected(m);
  }, [focusId, migrants]);

  return (
    <div className="relative w-full h-full">
      <div ref={mapRef} className="w-full h-full rounded-xl" />

      {/* Popup */}
      {selected && (
        <div className="absolute bottom-4 left-4 right-4 bg-white rounded-xl shadow-xl border border-slate-200 p-4 z-[1000]">
          <div className="flex items-start justify-between">
            <div>
              <div className="font-semibold text-slate-800">
                {selected.lastName} {selected.firstName}
              </div>
              <div className="text-xs text-slate-400 mt-0.5">{selected.id}</div>
            </div>
            <div className="flex items-center gap-2">
              <span
                className={`px-2 py-0.5 rounded-full text-xs font-medium ${getStatusColor(selected.status)}`}
              >
                {getStatusLabel(selected.status)}
              </span>
              <button
                onClick={() => setSelected(null)}
                className="text-slate-400 hover:text-slate-600 ml-1"
              >
                ✕
              </button>
            </div>
          </div>
          <div className="mt-2 grid grid-cols-2 gap-2 text-xs text-slate-600">
            <div>
              {selected.citizenship}
            </div>
            <div>📋 {selected.passportNumber}</div>
            <div>📍 {selected.address}</div>
            <div>
              ⏱ Рег. до {formatDate(selected.registrationExpiry)}
            </div>
          </div>
          <div className="mt-3">
            <Link
              href={`/admin/migrants/${selected.id}`}
              className="text-xs text-blue-600 hover:text-blue-800 font-medium"
            >
              Открыть карточку →
            </Link>
          </div>
        </div>
      )}

      {/* Legend */}
      <div className="absolute top-3 right-3 bg-white rounded-xl shadow-md border border-slate-200 p-3 z-[1000]">
        <div className="text-xs font-semibold text-slate-700 mb-2">Статус</div>
        {[
          { color: "#10b981", label: "Активен" },
          { color: "#f59e0b", label: "Просрочен" },
          { color: "#ef4444", label: "Заблокирован" },
        ].map(({ color, label }) => (
          <div key={label} className="flex items-center gap-2 mb-1">
            <div
              className="w-3 h-3 rounded-full"
              style={{ background: color }}
            />
            <span className="text-xs text-slate-600">{label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
