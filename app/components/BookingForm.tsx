"use client";

import { useEffect, useState } from "react";

type Props = {
  disabled: boolean;
  onSubmit: (data: { name: string; phone: string; service: string; notes: string }) => Promise<void>;
  submitting: boolean;
};

const NAIL_SERVICES = [
  { id: "semi", label: "Esmaltado Semipermanente", desc: "Color y brillo de larga duración", icon: "brush" },
  { id: "kapping", label: "Kapping Gel", desc: "Refuerzo para uñas naturales", icon: "spa" },
  { id: "softgel", label: "Soft Gel / Esculpidas", desc: "Largo y forma perfecta", icon: "diamond" },
  { id: "nailart", label: "Nail Art & Diseño", desc: "Diseño cartoon & deco a mano", icon: "palette" },
  { id: "pedicuria", label: "Belleza de Pies", desc: "Cuidado integral y esmaltado", icon: "clean_hands" },
  { id: "retiro", label: "Retiro / Mantenimiento", desc: "Remoción profesional de gel", icon: "history" },
];

export default function BookingForm({ disabled, onSubmit, submitting }: Props) {
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [service, setService] = useState(NAIL_SERVICES[0].label);
  const [notes, setNotes] = useState("");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setError(null);
  }, [disabled]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (name.trim().length < 2) {
      return setError("Por favor, ingresá tu nombre completo.");
    }
    if (phone.trim().length < 6) {
      return setError("Por favor, ingresá un número de teléfono o WhatsApp válido.");
    }

    try {
      await onSubmit({
        name: name.trim(),
        phone: phone.trim(),
        service,
        notes: notes.trim(),
      });
      setName("");
      setPhone("");
      setNotes("");
    } catch (err: any) {
      setError(err?.message || "Ocurrió un error al procesar tu reserva.");
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Selector de servicio */}
      <div>
        <label className="block text-xs font-black text-slate-800 uppercase tracking-wider mb-2.5 flex items-center gap-1.5">
          <span className="material-symbols-outlined text-base text-mascot-purple">brush</span>
          <span>1. Seleccioná el servicio deseado:</span>
        </label>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5">
          {NAIL_SERVICES.map((s) => {
            const isSelected = service === s.label;
            return (
              <button
                key={s.id}
                type="button"
                disabled={disabled || submitting}
                onClick={() => setService(s.label)}
                className={`p-3 rounded-xl border-[2.5px] border-black text-left transition-all duration-150 cursor-pointer flex items-start gap-3 select-none ${
                  isSelected
                    ? "bg-mascot-purple text-white shadow-[4px_4px_0px_#000] scale-102 font-bold"
                    : "bg-white text-slate-800 shadow-[2px_2px_0px_#000] hover:bg-amber-50 hover:-translate-y-0.5 hover:shadow-[3px_3px_0px_#000] active:translate-y-0.5 active:shadow-none"
                } disabled:opacity-50 disabled:cursor-not-allowed`}
              >
                <span
                  className={`material-symbols-outlined text-xl mt-0.5 ${
                    isSelected ? "text-amber-300" : "text-mascot-purple"
                  }`}
                >
                  {s.icon}
                </span>
                <div className="min-w-0">
                  <div className="text-xs font-black leading-tight">
                    {s.label}
                  </div>
                  <div
                    className={`text-[10px] font-medium mt-0.5 truncate ${
                      isSelected ? "text-slate-200" : "text-slate-500"
                    }`}
                  >
                    {s.desc}
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Inputs Nombre y Teléfono */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-xs font-black text-slate-800 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
            <span className="material-symbols-outlined text-base text-mascot-purple">person</span>
            <span>Nombre y Apellido *</span>
          </label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            disabled={disabled || submitting}
            required
            className="w-full rounded-xl border-[2.5px] border-black bg-white px-3.5 py-2.5 font-bold text-sm text-slate-900 shadow-[2px_2px_0px_#000] placeholder:text-slate-400 placeholder:font-normal focus:outline-none focus:bg-amber-50/40 focus:shadow-[3px_3px_0px_#593c52] disabled:bg-slate-100 disabled:text-slate-500 transition-all"
            placeholder="Ej: Lucía Gómez"
          />
        </div>
        <div>
          <label className="block text-xs font-black text-slate-800 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
            <span className="material-symbols-outlined text-base text-mascot-purple">phone</span>
            <span>Teléfono / WhatsApp *</span>
          </label>
          <input
            type="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            disabled={disabled || submitting}
            required
            className="w-full rounded-xl border-[2.5px] border-black bg-white px-3.5 py-2.5 font-bold text-sm text-slate-900 shadow-[2px_2px_0px_#000] placeholder:text-slate-400 placeholder:font-normal focus:outline-none focus:bg-amber-50/40 focus:shadow-[3px_3px_0px_#593c52] disabled:bg-slate-100 disabled:text-slate-500 transition-all"
            placeholder="Ej: 11 2345-6789"
          />
        </div>
      </div>

      {/* Notas / Observaciones */}
      <div>
        <label className="block text-xs font-black text-slate-800 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
          <span className="material-symbols-outlined text-base text-mascot-purple">edit_note</span>
          <span>Notas u observaciones (opcional)</span>
        </label>
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          disabled={disabled || submitting}
          rows={2}
          className="w-full rounded-xl border-[2.5px] border-black bg-white px-3.5 py-2 font-bold text-sm text-slate-900 shadow-[2px_2px_0px_#000] placeholder:text-slate-400 placeholder:font-normal focus:outline-none focus:bg-amber-50/40 focus:shadow-[3px_3px_0px_#593c52] disabled:bg-slate-100 disabled:text-slate-500 transition-all resize-none"
          placeholder="Ej: Necesito retirar esmalte previo, consultar por diseño con strass..."
        />
      </div>

      {error && (
        <div className="rounded-xl bg-red-100 border-[2.5px] border-black text-red-950 font-bold text-sm px-4 py-3 shadow-[3px_3px_0px_#000] flex items-start gap-2.5">
          <span className="material-symbols-outlined text-red-700 text-lg mt-0.5">error</span>
          <span>{error}</span>
        </div>
      )}

      {/* Botón de confirmación elástico estilo cartoon */}
      <button
        type="submit"
        disabled={disabled || submitting}
        className={`w-full rounded-2xl border-[3px] border-black py-4 px-6 text-slate-950 font-cartoon text-lg sm:text-xl tracking-wide transition-all duration-150 flex items-center justify-center gap-2 cursor-pointer select-none ${
          disabled || submitting
            ? "bg-slate-200 text-slate-400 border-slate-400 shadow-none cursor-not-allowed"
            : "bg-vintage-yellow shadow-[5px_5px_0px_#000] hover:bg-amber-300 hover:-translate-y-1 hover:shadow-[7px_7px_0px_#000] active:translate-y-1 active:shadow-none"
        }`}
      >
        {submitting ? (
          <>
            <span className="material-symbols-outlined text-xl animate-spin">
              progress_activity
            </span>
            <span>¡Confirmando con el estudio...!</span>
          </>
        ) : disabled ? (
          <span className="text-base font-retro font-bold">👆 Seleccioná fecha y horario arriba</span>
        ) : (
          <>
            <span className="material-symbols-outlined text-2xl">check_circle</span>
            <span>¡Confirmar mi Turno!</span>
          </>
        )}
      </button>
    </form>
  );
}