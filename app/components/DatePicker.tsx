"use client";

import { useMemo, useRef } from "react";

type Props = {
  value: string;
  onChange: (date: string) => void;
};

function toISODate(d: Date) {
  const y = d.getFullYear();
  const m = (d.getMonth() + 1).toString().padStart(2, "0");
  const day = d.getDate().toString().padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export default function DatePicker({ value, onChange }: Props) {
  const scrollRef = useRef<HTMLDivElement>(null);

  const days = useMemo(() => {
    const today = new Date();
    return Array.from({ length: 14 }).map((_, i) => {
      const d = new Date(today);
      d.setDate(today.getDate() + i);
      const isToday = i === 0;
      const isTomorrow = i === 1;

      return {
        iso: toISODate(d),
        isToday,
        isTomorrow,
        badgeLabel: isToday ? "Hoy" : isTomorrow ? "Mañana" : null,
        weekday: d.toLocaleDateString("es-AR", { weekday: "short" }).replace(".", "").toUpperCase(),
        day: d.getDate(),
        month: d.toLocaleDateString("es-AR", { month: "short" }).replace(".", "").toUpperCase(),
      };
    });
  }, []);

  const scroll = (direction: "left" | "right") => {
    if (scrollRef.current) {
      const scrollAmount = direction === "left" ? -240 : 240;
      scrollRef.current.scrollBy({ left: scrollAmount, behavior: "smooth" });
    }
  };

  return (
    <div className="relative w-full">
      {/* Botones de navegación del carrusel */}
      <div className="flex items-center justify-between mb-1 px-1">
        <span className="text-xs sm:text-sm font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
          <span className="material-symbols-outlined text-base text-[#523450]">calendar_month</span>
          <span>Elegí el día:</span>
        </span>
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={() => scroll("left")}
            aria-label="Días anteriores"
            className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-white border-2 border-black shadow-[2px_2px_0px_#000] flex items-center justify-center text-black hover:bg-amber-50 active:translate-y-0.5 active:shadow-none transition-colors cursor-pointer"
          >
            <span className="material-symbols-outlined text-base">chevron_left</span>
          </button>
          <button
            type="button"
            onClick={() => scroll("right")}
            aria-label="Días siguientes"
            className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-white border-2 border-black shadow-[2px_2px_0px_#000] flex items-center justify-center text-black hover:bg-amber-50 active:translate-y-0.5 active:shadow-none transition-colors cursor-pointer"
          >
            <span className="material-symbols-outlined text-base">chevron_right</span>
          </button>
        </div>
      </div>

      {/* Carrusel de fichas de fecha con padding superior para que HOY/MAÑANA no se recorten */}
      <div
        ref={scrollRef}
        className="flex gap-2.5 sm:gap-3 overflow-x-auto pt-4 pb-2.5 px-1.5 scroll-smooth no-scrollbar"
        style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
      >
        {days.map((d) => {
          const selected = value === d.iso;
          return (
            <button
              key={d.iso}
              type="button"
              onClick={() => onChange(d.iso)}
              className={`group relative flex-shrink-0 w-18 sm:w-20 md:w-22 py-2 sm:py-2.5 px-1.5 rounded-2xl border-[2.5px] border-black transition-colors duration-150 cursor-pointer select-none text-center ${
                selected
                  ? "bg-vintage-yellow text-slate-950 shadow-[3px_3px_0px_#000] z-10"
                  : "bg-white text-slate-800 shadow-[2px_2px_0px_#000] hover:bg-amber-50 active:translate-y-0.5 active:shadow-none"
              }`}
            >
              {/* Badge Hoy / Mañana */}
              {d.badgeLabel ? (
                <span
                  className={`absolute -top-3 left-1/2 -translate-x-1/2 text-[9px] sm:text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full border-2 border-black whitespace-nowrap shadow-[1px_1px_0px_#000] ${
                    selected
                      ? "bg-[#523450] text-white"
                      : d.isToday
                      ? "bg-rose-500 text-white"
                      : "bg-amber-200 text-slate-950"
                  }`}
                >
                  {d.badgeLabel}
                </span>
              ) : null}

              <div
                className={`text-[10px] sm:text-[11px] font-extrabold uppercase tracking-wider ${
                  selected ? "text-slate-950" : "text-slate-600"
                }`}
              >
                {d.weekday}
              </div>

              <div className="font-cartoon text-xl sm:text-2xl leading-none my-1 tracking-normal text-slate-950">
                {d.day}
              </div>

              <div
                className={`text-[10px] font-black uppercase tracking-wider ${
                  selected ? "text-slate-950" : "text-slate-500"
                }`}
              >
                {d.month}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}