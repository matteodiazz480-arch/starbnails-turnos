"use client";

import type { Slot } from "@/types/booking";

type Props = {
  slots: Slot[];
  selected: string | null;
  onSelect: (slot: Slot) => void;
  loading: boolean;
};

export default function SlotGrid({ slots, selected, onSelect, loading }: Props) {
  if (loading) {
    return (
      <div className="rounded-2xl border-[2.5px] border-black bg-white p-5 text-center shadow-[3px_3px_0px_#000]">
        <div className="flex flex-col items-center justify-center gap-2">
          <div className="w-8 h-8 rounded-full border-[3px] border-black border-t-mascot-purple animate-spin" />
          <p className="font-cartoon text-base text-slate-800">
            Cargando...
          </p>
        </div>
      </div>
    );
  }

  if (slots.length === 0) {
    return (
      <div className="rounded-2xl border-[2.5px] border-dashed border-slate-400 bg-amber-50/60 p-4 text-center">
        <span className="material-symbols-outlined text-2xl text-slate-400 mb-0.5">
          event_busy
        </span>
        <p className="font-cartoon text-sm sm:text-base text-slate-800">
          ¡Sin turnos disponibles!
        </p>
        <p className="text-[11px] font-bold text-slate-600 mt-0.5">
          Probá seleccionando otra fecha arriba.
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-2 sm:gap-2.5">
      {slots.map((s) => {
        const isSelected = selected === s.time;
        if (!s.available) {
          return (
            <div
              key={s.time}
              className="h-10 sm:h-11 rounded-xl bg-red-50/60 border-2 border-dashed border-red-300 text-red-500 text-xs sm:text-sm font-bold flex items-center justify-center gap-1 cursor-not-allowed select-none"
              title="Horario ocupado"
            >
              <span className="line-through">{s.time}</span>
              <span className="material-symbols-outlined text-xs">lock</span>
            </div>
          );
        }
        return (
          <button
            key={s.time}
            type="button"
            onClick={() => onSelect(s)}
            className={`h-10 sm:h-11 rounded-xl text-xs sm:text-sm font-black border-[2.5px] border-black transition-colors duration-150 cursor-pointer flex items-center justify-center gap-1.5 select-none ${
              isSelected
                ? "bg-[#523450] text-white shadow-[3px_3px_0px_#000] z-10"
                : "bg-white text-slate-950 shadow-[2px_2px_0px_#000] hover:bg-amber-100 active:translate-y-0.5 active:shadow-none"
            }`}
          >
            <span
              className={`material-symbols-outlined text-sm sm:text-base ${
                isSelected ? "text-amber-300" : "text-[#523450]"
              }`}
            >
              schedule
            </span>
            <span>{s.time}</span>
          </button>
        );
      })}
    </div>
  );
}