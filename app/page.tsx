"use client";

import { useCallback, useEffect, useState } from "react";
import Image from "next/image";
import DatePicker from "./components/DatePicker";
import SlotGrid from "./components/SlotGrid";
import type { Slot, SlotsResponse, UserAppointment } from "@/types/booking";

const STORAGE_KEY = "nails_studio_active_appointment";

const NAIL_SERVICES = [
  { id: "semi", label: "Semipermanente", price: 13000, icon: "brush" },
  { id: "kapping", label: "Kapping", price: 15000, icon: "spa" },
  { id: "softgel", label: "Soft Gel", price: 16000, icon: "diamond" },
];

const REMOVAL_PRICE = 3000;
const DEPOSIT_AMOUNT = 5000;
const CONTACT_PHONE = "3804949550";

function formatARS(amount: number) {
  return `$${amount.toLocaleString("es-AR")}`;
}

function nextAvailableDateISO() {
  const d = new Date();
  // Si hoy es domingo (0), seleccionamos lunes por defecto
  if (d.getDay() === 0) {
    d.setDate(d.getDate() + 1);
  }
  const y = d.getFullYear();
  const m = (d.getMonth() + 1).toString().padStart(2, "0");
  const day = d.getDate().toString().padStart(2, "0");
  return `${y}-${m}-${day}`;
}

/** Destello / Estrellita 4 puntas estilo cartoon retro años 30 */
function RetroSparkle({
  className,
  fill = "#ffd15c",
}: {
  className?: string;
  fill?: string;
}) {
  return (
    <svg viewBox="0 0 36 36" className={className} fill="none">
      <path
        d="M18 2 C19.8 12.5 23.5 16.2 34 18 C23.5 19.8 19.8 23.5 18 34 C16.2 23.5 12.5 19.8 2 18 C12.5 16.2 16.2 12.5 18 2 Z"
        fill={fill}
        stroke="#000000"
        strokeWidth="2.5"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export default function HomePage() {
  // Wizard de 3 pasos en un único cuadro sin scroll: 1 = Servicio, 2 = Día y Horario, 3 = Tus Datos
  const [currentStep, setCurrentStep] = useState<number>(1);

  // Datos seleccionados
  const [selectedServiceId, setSelectedServiceId] = useState<string>(NAIL_SERVICES[0].id);
  const [includeRemoval, setIncludeRemoval] = useState<boolean>(false);
  const [date, setDate] = useState<string>(nextAvailableDateISO());
  const [slots, setSlots] = useState<Slot[]>([]);
  const [selectedSlot, setSelectedSlot] = useState<Slot | null>(null);
  const [loadingSlots, setLoadingSlots] = useState(false);

  // Formulario de contacto
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [notes, setNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);

  // Transición Iris-Wipe estilo 1930
  const [irisState, setIrisState] = useState<"idle" | "closing" | "closed" | "opening">("idle");

  // Turno activo recordado
  const [activeAppointment, setActiveAppointment] = useState<UserAppointment | null>(null);
  const [checkingSavedAppointment, setCheckingSavedAppointment] = useState(true);

  // Ticket de confirmación
  const [confirmedTicket, setConfirmedTicket] = useState<{
    date: string;
    time: string;
    service: string;
    name: string;
    phone: string;
  } | null>(null);

  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [cancelling, setCancelling] = useState(false);

  const currentServiceObj =
    NAIL_SERVICES.find((s) => s.id === selectedServiceId) || NAIL_SERVICES[0];
  const totalPrice = currentServiceObj.price + (includeRemoval ? REMOVAL_PRICE : 0);
  const fullServiceLabel = `${currentServiceObj.label}${
    includeRemoval ? " + Retiro de otro salón" : ""
  } (${formatARS(totalPrice)})`;

  // Consulta turnos disponibles para una fecha
  const fetchSlots = useCallback(async (d: string) => {
    setLoadingSlots(true);
    setErrorMsg(null);
    setSelectedSlot(null);
    try {
      const res = await fetch(`/api/slots?date=${d}`, { cache: "no-store" });
      const data = (await res.json()) as SlotsResponse & { error?: string };
      if (!res.ok) throw new Error(data.error || "Error al cargar turnos.");
      setSlots(data.slots);
    } catch (err: any) {
      setErrorMsg(err.message);
      setSlots([]);
    } finally {
      setLoadingSlots(false);
    }
  }, []);

  // 1. Validar reserva previa
  useEffect(() => {
    async function loadSavedAppointment() {
      try {
        const raw = localStorage.getItem(STORAGE_KEY);
        if (!raw) {
          setCheckingSavedAppointment(false);
          return;
        }

        const parsed = JSON.parse(raw) as UserAppointment;
        if (!parsed.eventId) {
          localStorage.removeItem(STORAGE_KEY);
          setCheckingSavedAppointment(false);
          return;
        }

        const res = await fetch(`/api/book?eventId=${encodeURIComponent(parsed.eventId)}`, {
          cache: "no-store",
        });

        if (res.ok) {
          const check = await res.json();
          if (check.exists && check.active) {
            setActiveAppointment(parsed);
          } else {
            localStorage.removeItem(STORAGE_KEY);
            setActiveAppointment(null);
          }
        } else {
          localStorage.removeItem(STORAGE_KEY);
          setActiveAppointment(null);
        }
      } catch (err) {
        console.error("Error al validar el turno:", err);
      } finally {
        setCheckingSavedAppointment(false);
      }
    }

    loadSavedAppointment();
  }, []);

  // 2. Refrescar slots al cambiar de fecha
  useEffect(() => {
    fetchSlots(date);
  }, [date, fetchSlots]);

  // Confirmar la reserva con transición Iris-Wipe
  const handleConfirmBooking = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSlot) {
      setErrorMsg("Por favor, seleccioná un horario disponible.");
      return;
    }
    if (name.trim().length < 2) return setErrorMsg("Por favor, ingresá tu nombre completo.");
    if (phone.trim().length < 6) return setErrorMsg("Por favor, ingresá un teléfono o WhatsApp válido.");

    setSubmitting(true);
    setErrorMsg(null);

    // FASE 1: CIERRE DEL OBTURADOR (0.75s)
    setIrisState("closing");

    try {
      await new Promise((r) => setTimeout(r, 750));
      setIrisState("closed");

      const res = await fetch("/api/book", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          date,
          time: selectedSlot.time,
          name: name.trim(),
          phone: phone.trim(),
          service: fullServiceLabel,
          notes: notes.trim(),
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Error al confirmar la reserva.");

      const newAppointment: UserAppointment = {
        eventId: data.eventId,
        date,
        time: selectedSlot.time,
        name: name.trim(),
        phone: phone.trim(),
        service: fullServiceLabel,
        notes: notes.trim(),
        createdAt: new Date().toISOString(),
      };

      localStorage.setItem(STORAGE_KEY, JSON.stringify(newAppointment));
      setActiveAppointment(newAppointment);

      setConfirmedTicket({
        date,
        time: selectedSlot.time,
        service: fullServiceLabel,
        name: name.trim(),
        phone: phone.trim(),
      });

      await fetchSlots(date);

      await new Promise((r) => setTimeout(r, 350));

      // FASE 2: APERTURA DEL OBTURADOR (0.75s)
      setIrisState("opening");
      await new Promise((r) => setTimeout(r, 750));

      setIrisState("idle");
    } catch (err: any) {
      setIrisState("idle");
      setErrorMsg(err.message || "No se pudo procesar la reserva.");
    } finally {
      setSubmitting(false);
    }
  };

  // Cancelar turno
  const handleCancelAppointment = async () => {
    if (!activeAppointment?.eventId) return;
    setCancelling(true);
    setErrorMsg(null);
    try {
      const res = await fetch("/api/book", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          eventId: activeAppointment.eventId,
          phone: activeAppointment.phone,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Error al cancelar el turno.");

      localStorage.removeItem(STORAGE_KEY);
      setActiveAppointment(null);
      setConfirmedTicket(null);
      setShowCancelModal(false);
      setCurrentStep(1);
      await fetchSlots(date);
    } catch (err: any) {
      setErrorMsg(err.message || "No se pudo cancelar el turno.");
      setShowCancelModal(false);
    } finally {
      setCancelling(false);
    }
  };

  const stepHeaderTitle = confirmedTicket
    ? "¡Turno Confirmado!"
    : !checkingSavedAppointment && activeAppointment
    ? "Tu Cita Reservada"
    : currentStep === 1
    ? "1. Elegí tu Servicio"
    : currentStep === 2
    ? "2. Día y Horario"
    : "3. Completá tus Datos";

  return (
    <div className="h-[100dvh] max-h-[100dvh] w-screen retro-paper-bg relative overflow-hidden flex flex-col justify-center items-center py-2 sm:py-3 text-slate-950 select-none">
      {/* ------------------------------------------------------------- */}
      {/* TELÓN / OBTURADOR VINTAGE AÑOS 30                             */}
      {/* ------------------------------------------------------------- */}
      {irisState !== "idle" && (
        <div className="fixed inset-0 z-50 pointer-events-auto flex items-center justify-center overflow-hidden">
          <div
            className={`rounded-full shrink-0 ${
              irisState === "closing"
                ? "iris-shutter-closing"
                : irisState === "opening"
                ? "iris-shutter-opening"
                : "w-0 h-0"
            }`}
            style={{
              borderWidth: "125vmax",
              borderColor: "#523450",
              borderStyle: "solid",
              boxShadow: "inset 0 0 0 6px #000, 0 0 0 6px #000",
              boxSizing: "content-box",
            }}
          />

          {irisState === "closed" && (
            <div className="absolute inset-0 bg-[#523450] flex flex-col items-center justify-center text-center p-6 text-white animate-cartoon-pop">
              <div className="w-64 h-52 sm:w-80 sm:h-64 relative mb-3 animate-rubber-bob">
                <Image
                  src="/starbnails-banner.png?v=5"
                  alt="Manicurista"
                  fill
                  sizes="(max-width: 640px) 256px, 320px"
                  className="object-contain"
                  priority
                />
              </div>
              <div className="font-cartoon text-2xl sm:text-4xl text-amber-200 mb-1.5 tracking-wide">
                ¡AFINANDO PINCELES!
              </div>
              <p className="font-retro font-bold text-xs sm:text-sm text-slate-100 tracking-wider flex items-center justify-center gap-2">
                <span className="material-symbols-outlined text-base animate-spin">
                  progress_activity
                </span>
                <span>Preparando tu turno...</span>
              </p>
            </div>
          )}
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* FONDO DE BORDE A BORDE CON DESTELLOS SUTILES CARTOON RETRO    */}
      {/* ------------------------------------------------------------- */}
      <div className="pointer-events-none fixed inset-0 w-screen h-screen overflow-hidden z-0 select-none">
        {/* Esquina Superior Izquierda */}
        <div className="absolute top-6 left-4 sm:top-10 sm:left-10 animate-sparkle">
          <RetroSparkle className="w-6 h-6 sm:w-8 sm:h-8" fill="#ffd15c" />
        </div>
        <div className="absolute top-16 left-12 sm:top-24 sm:left-24 animate-sparkle-alt">
          <RetroSparkle className="w-4 h-4 sm:w-5 sm:h-5" fill="#523450" />
        </div>

        {/* Esquina Superior Derecha */}
        <div className="absolute top-7 right-5 sm:top-12 sm:right-12 animate-sparkle-alt">
          <RetroSparkle className="w-6 h-6 sm:w-8 sm:h-8" fill="#ffd15c" />
        </div>
        <div className="absolute top-20 right-14 sm:top-28 sm:right-28 animate-sparkle">
          <RetroSparkle className="w-4 h-4 sm:w-5 sm:h-5" fill="#523450" />
        </div>

        {/* Costado Medio Izquierdo */}
        <div className="absolute top-1/2 -translate-y-12 left-3 sm:left-8 animate-sparkle-alt hidden sm:block">
          <RetroSparkle className="w-7 h-7" fill="#523450" />
        </div>
        <div className="absolute top-1/2 translate-y-10 left-8 sm:left-16 animate-sparkle hidden md:block">
          <RetroSparkle className="w-5 h-5" fill="#ffd15c" />
        </div>

        {/* Costado Medio Derecho */}
        <div className="absolute top-1/2 -translate-y-10 right-3 sm:right-8 animate-sparkle hidden sm:block">
          <RetroSparkle className="w-7 h-7" fill="#523450" />
        </div>
        <div className="absolute top-1/2 translate-y-12 right-8 sm:right-16 animate-sparkle-alt hidden md:block">
          <RetroSparkle className="w-5 h-5" fill="#ffd15c" />
        </div>

        {/* Esquina Inferior Izquierda */}
        <div className="absolute bottom-8 left-5 sm:bottom-12 sm:left-12 animate-sparkle">
          <RetroSparkle className="w-6 h-6 sm:w-8 sm:h-8" fill="#ffd15c" />
        </div>
        <div className="absolute bottom-20 left-12 sm:bottom-24 sm:left-24 animate-sparkle-alt hidden sm:block">
          <RetroSparkle className="w-4 h-4 sm:w-5 sm:h-5" fill="#523450" />
        </div>

        {/* Esquina Inferior Derecha */}
        <div className="absolute bottom-8 right-5 sm:bottom-12 sm:right-12 animate-sparkle-alt">
          <RetroSparkle className="w-6 h-6 sm:w-8 sm:h-8" fill="#ffd15c" />
        </div>
        <div className="absolute bottom-20 right-12 sm:bottom-24 sm:right-24 animate-sparkle hidden sm:block">
          <RetroSparkle className="w-4 h-4 sm:w-5 sm:h-5" fill="#523450" />
        </div>
      </div>

      {/* ------------------------------------------------------------- */}
      {/* HERO: PERSONAJE SOSTENIENDO EL CARTEL                         */}
      {/* ------------------------------------------------------------- */}
      <header className="relative z-10 flex flex-col items-center justify-center shrink-0 mb-1 sm:mb-2">
        <div className="w-64 sm:w-80 md:w-96 aspect-[578/432] relative animate-rubber-bob">
          <Image
            src="/starbnails-banner.png?v=5"
            alt="Bienvenida"
            fill
            sizes="(max-width: 640px) 256px, (max-width: 768px) 320px, 384px"
            className="object-contain"
            priority
          />
        </div>
      </header>

      {/* ------------------------------------------------------------- */}
      {/* CUADRO CENTRAL AMPLIO (PC Y CELULAR) - CERO SCROLL VERTICAL   */}
      {/* ------------------------------------------------------------- */}
      <main className="relative z-10 w-[95%] sm:w-[92%] md:max-w-2xl lg:max-w-3xl mx-auto shrink-0">
        <div className="w-full rounded-3xl bg-[#fdfaf3] border-[4px] border-black ring-[3px] ring-[#523450] shadow-[6px_6px_0px_#000] overflow-hidden flex flex-col">
          {/* Cinta superior del cuadro con el paso actual */}
          <div className="bg-[#523450] border-b-[3.5px] border-black px-4 sm:px-6 py-2.5 sm:py-3 flex items-center justify-between text-white shrink-0">
            <span className="font-cartoon text-base sm:text-lg md:text-xl tracking-wide text-amber-200">
              {stepHeaderTitle}
            </span>

            {!confirmedTicket && (checkingSavedAppointment || !activeAppointment) && (
              <div className="flex items-center gap-1.5 sm:gap-2">
                {[1, 2, 3].map((step) => (
                  <div
                    key={step}
                    className={`h-3 rounded-full border-2 border-black transition-all duration-200 ${
                      step === currentStep
                        ? "w-7 bg-vintage-yellow"
                        : step < currentStep
                        ? "w-3 bg-emerald-400"
                        : "w-3 bg-white/40"
                    }`}
                  />
                ))}
              </div>
            )}
          </div>

          {/* Cuerpo interno del cuadro */}
          <div className="p-4 sm:p-6 md:p-7">
            {/* ========================================================= */}
            {/* CASO A: TICKET CONFIRMADO                                 */}
            {/* ========================================================= */}
            {confirmedTicket ? (
              <div className="space-y-4 animate-cartoon-pop">
                <div className="flex items-center justify-between border-b-2 border-dashed border-black pb-2.5">
                  <div className="flex items-center gap-2">
                    <span className="material-symbols-outlined text-xl text-[#523450]">
                      confirmation_number
                    </span>
                    <span className="font-cartoon text-base sm:text-lg text-slate-950">
                      COMPROBANTE DE CITA
                    </span>
                  </div>
                  <span className="inline-block bg-[#523450] text-amber-200 px-2.5 py-0.5 rounded-lg border-2 border-black font-cartoon text-xs uppercase shadow-[2px_2px_0px_#000]">
                    ¡Todo Listo!
                  </span>
                </div>

                <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                  <div className="space-y-1.5 text-center sm:text-left flex-1 text-sm sm:text-base">
                    <h3 className="text-lg sm:text-xl font-black text-slate-950">
                      {confirmedTicket.name}
                    </h3>
                    <p className="font-bold text-slate-800 flex items-center justify-center sm:justify-start gap-1.5">
                      <span className="material-symbols-outlined text-base text-[#523450]">brush</span>
                      <span>
                        Servicio: <strong className="text-slate-950">{confirmedTicket.service}</strong>
                      </span>
                    </p>
                    <p className="font-bold text-slate-800 flex items-center justify-center sm:justify-start gap-1.5">
                      <span className="material-symbols-outlined text-base text-[#523450]">
                        calendar_month
                      </span>
                      <span>
                        Fecha: <strong className="text-slate-950">{confirmedTicket.date}</strong> a las{" "}
                        <strong className="text-slate-950">{confirmedTicket.time} hs</strong>
                      </span>
                    </p>
                    <p className="text-xs sm:text-sm font-bold text-slate-700">
                      Recordá abonar la seña de{" "}
                      <strong className="text-slate-950">{formatARS(DEPOSIT_AMOUNT)}</strong> (se descuenta del total).
                    </p>
                  </div>

                  {/* Sello de goma vintage CONFIRMADO */}
                  <div className="shrink-0">
                    <div className="w-20 h-20 rounded-full border-[3px] border-emerald-700 text-emerald-800 font-cartoon flex flex-col items-center justify-center p-1.5 shadow-[2px_2px_0px_#000] bg-emerald-50">
                      <span className="material-symbols-outlined text-xl">verified</span>
                      <span className="text-[9px] font-black tracking-widest">CITA</span>
                      <span className="text-[11px] font-cartoon">CONFIRMADA</span>
                    </div>
                  </div>
                </div>

                <div className="border-t-2 border-dashed border-black pt-3.5 flex items-center justify-between gap-2">
                  <span className="text-xs sm:text-sm font-bold text-slate-700 flex items-center gap-1.5">
                    <span className="material-symbols-outlined text-base text-emerald-700">
                      call
                    </span>
                    <span>Consultas: {CONTACT_PHONE}</span>
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      setConfirmedTicket(null);
                      setCurrentStep(1);
                    }}
                    className="retro-btn bg-vintage-yellow hover:bg-amber-300 text-slate-950 px-4 py-2 rounded-xl font-cartoon text-xs sm:text-sm cursor-pointer"
                  >
                    Reservar otro turno
                  </button>
                </div>
              </div>
            ) : !checkingSavedAppointment && activeAppointment ? (
              /* ========================================================= */
              /* CASO B: TURNO ACTIVO RECORDADO                            */
              /* ========================================================= */
              <div className="space-y-4 animate-cartoon-pop">
                <div className="flex items-center justify-between border-b-2 border-slate-300 pb-2.5">
                  <span className="text-xs sm:text-sm font-bold text-slate-800">
                    Detalles de tu próximo turno
                  </span>
                  <span className="inline-flex items-center gap-1 text-xs font-black px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-950 border-2 border-black shadow-[1.5px_1.5px_0px_#000]">
                    <span className="material-symbols-outlined text-sm">verified</span>
                    <span>Confirmado</span>
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 sm:gap-3 text-xs sm:text-sm">
                  <div className="p-3 rounded-xl bg-amber-50 border-2 border-black">
                    <div className="text-[10px] font-black uppercase text-slate-600 mb-0.5">
                      Fecha & Hora
                    </div>
                    <div className="font-black text-slate-950">{activeAppointment.date}</div>
                    <div className="font-cartoon text-[#523450]">{activeAppointment.time} hs</div>
                  </div>
                  <div className="p-3 rounded-xl bg-amber-50 border-2 border-black">
                    <div className="text-[10px] font-black uppercase text-slate-600 mb-0.5">
                      Servicio
                    </div>
                    <div className="font-black text-slate-950 truncate">
                      {activeAppointment.service}
                    </div>
                  </div>
                  <div className="p-3 rounded-xl bg-amber-50 border-2 border-black">
                    <div className="text-[10px] font-black uppercase text-slate-600 mb-0.5">
                      Clienta
                    </div>
                    <div className="font-black text-slate-950 truncate">
                      {activeAppointment.name}
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between gap-3 pt-1">
                  <button
                    type="button"
                    onClick={() => setShowCancelModal(true)}
                    className="retro-btn bg-red-100 text-red-950 hover:bg-red-200 px-3.5 py-2 rounded-xl text-xs sm:text-sm font-black inline-flex items-center gap-1.5 cursor-pointer"
                  >
                    <span className="material-symbols-outlined text-base">cancel</span>
                    <span>Cancelar turno</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setActiveAppointment(null)}
                    className="retro-btn bg-vintage-yellow text-slate-950 px-4 py-2 rounded-xl text-xs sm:text-sm font-cartoon cursor-pointer"
                  >
                    Agendar otra cita
                  </button>
                </div>
              </div>
            ) : (
              /* ========================================================= */
              /* CASO C: WIZARD DE 3 PASOS AMPLIO Y NÍTIDO                 */
              /* ========================================================= */
              <div>
                {/* Mensaje de error si ocurre */}
                {errorMsg && (
                  <div className="mb-3 rounded-xl bg-red-100 border-2 border-black text-red-950 p-2.5 shadow-[2px_2px_0px_#000] flex items-center justify-between text-xs sm:text-sm font-bold">
                    <div className="flex items-center gap-1.5">
                      <span className="material-symbols-outlined text-base text-red-700">error</span>
                      <span>{errorMsg}</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => setErrorMsg(null)}
                      className="font-black hover:opacity-70 text-sm ml-2 cursor-pointer"
                    >
                      ✕
                    </button>
                  </div>
                )}

                {/* PASO 1: ELEGÍ EL SERVICIO */}
                {currentStep === 1 && (
                  <div className="space-y-3.5 animate-cartoon-pop">
                    {/* Los 3 servicios principales con sus precios */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 sm:gap-3">
                      {NAIL_SERVICES.map((s) => {
                        const isSelected = selectedServiceId === s.id;
                        return (
                          <button
                            key={s.id}
                            type="button"
                            onClick={() => setSelectedServiceId(s.id)}
                            className={`p-3 sm:p-4 rounded-2xl border-[2.5px] border-black text-left transition-colors duration-150 cursor-pointer flex sm:flex-col items-center sm:items-start justify-between gap-2 select-none ${
                              isSelected
                                ? "bg-[#523450] text-white shadow-[3px_3px_0px_#000]"
                                : "bg-white text-slate-950 shadow-[2px_2px_0px_#000] hover:bg-amber-50"
                            }`}
                          >
                            <div className="flex items-center gap-2.5">
                              <span
                                className={`material-symbols-outlined text-xl sm:text-2xl shrink-0 ${
                                  isSelected ? "text-amber-300" : "text-[#523450]"
                                }`}
                              >
                                {s.icon}
                              </span>
                              <div>
                                <div className="text-sm sm:text-base font-black leading-tight">
                                  {s.label}
                                </div>
                                <div
                                  className={`text-[11px] font-semibold mt-0.5 ${
                                    isSelected ? "text-amber-100" : "text-slate-600"
                                  }`}
                                >
                                  Duración: 1 h 15 min
                                </div>
                              </div>
                            </div>
                            <div
                              className={`font-cartoon text-base sm:text-lg px-2.5 py-0.5 rounded-lg border-2 border-black ${
                                isSelected
                                  ? "bg-vintage-yellow text-slate-950"
                                  : "bg-amber-100 text-slate-950"
                              }`}
                            >
                              {formatARS(s.price)}
                            </div>
                          </button>
                        );
                      })}
                    </div>

                    {/* Opción de Retiro de otro salón (+$3.000) */}
                    <button
                      type="button"
                      onClick={() => setIncludeRemoval((prev) => !prev)}
                      className={`w-full p-2.5 sm:p-3 rounded-xl border-2 border-black transition-colors cursor-pointer flex items-center justify-between text-xs sm:text-sm font-bold ${
                        includeRemoval
                          ? "bg-amber-200 text-slate-950 shadow-[2px_2px_0px_#000]"
                          : "bg-white text-slate-800 hover:bg-amber-50"
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <span className="material-symbols-outlined text-lg text-[#523450]">
                          {includeRemoval ? "check_box" : "check_box_outline_blank"}
                        </span>
                        <span>Sumar retiro de otro salón</span>
                      </div>
                      <span className="font-black text-slate-950">+{formatARS(REMOVAL_PRICE)}</span>
                    </button>

                    {/* Pie del Paso 1: Aviso de Seña y Botón Continuar */}
                    <div className="pt-1 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
                      <div className="text-xs font-bold text-slate-800 bg-[#f5ecf3] border-2 border-black rounded-xl px-3 py-2 flex items-center gap-2">
                        <span className="material-symbols-outlined text-base text-[#523450]">
                          payments
                        </span>
                        <span>
                          Seña para confirmar: <strong className="text-slate-950">{formatARS(DEPOSIT_AMOUNT)}</strong>{" "}
                          (se descuenta del total)
                        </span>
                      </div>

                      <button
                        type="button"
                        onClick={() => {
                          setErrorMsg(null);
                          setCurrentStep(2);
                        }}
                        className="w-full sm:w-auto retro-btn bg-vintage-yellow hover:bg-amber-300 text-slate-950 font-cartoon text-sm sm:text-base py-2.5 px-6 rounded-xl flex items-center justify-center gap-2 cursor-pointer shrink-0"
                      >
                        <span>Elegir Día y Hora</span>
                        <span className="material-symbols-outlined text-lg">arrow_forward</span>
                      </button>
                    </div>
                  </div>
                )}

                {/* PASO 2: ELEGÍ DÍA Y HORARIO */}
                {currentStep === 2 && (
                  <div className="space-y-3 animate-cartoon-pop">
                    <DatePicker value={date} onChange={setDate} />

                    <div>
                      <div className="flex items-center justify-between mb-1.5 px-1">
                        <span className="text-xs sm:text-sm font-bold text-slate-800">
                          Horarios disponibles ({date}):
                        </span>
                        {selectedSlot && (
                          <span className="bg-vintage-yellow text-slate-950 font-black text-xs px-2.5 py-0.5 rounded-full border-2 border-black shadow-[1.5px_1.5px_0px_#000]">
                            {selectedSlot.time} hs
                          </span>
                        )}
                      </div>
                      <SlotGrid
                        slots={slots}
                        selected={selectedSlot?.time ?? null}
                        onSelect={setSelectedSlot}
                        loading={loadingSlots}
                      />
                    </div>

                    {/* Aviso por horarios antes de las 16:00 */}
                    <div className="bg-[#f5ecf3] border-2 border-black rounded-xl px-3 py-2 flex flex-wrap items-center justify-between gap-2 text-xs font-bold text-slate-800">
                      <span className="flex items-center gap-1.5">
                        <span className="material-symbols-outlined text-base text-[#523450]">
                          schedule
                        </span>
                        <span>¿Necesitás turno antes de las 16:00 hs por excepción?</span>
                      </span>
                      <a
                        href={`https://wa.me/549${CONTACT_PHONE}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="underline font-black text-[#523450] hover:text-black"
                      >
                        Consultar al {CONTACT_PHONE}
                      </a>
                    </div>

                    <div className="pt-1 flex items-center justify-between gap-3">
                      <button
                        type="button"
                        onClick={() => {
                          setErrorMsg(null);
                          setCurrentStep(1);
                        }}
                        className="retro-btn bg-white hover:bg-slate-50 text-slate-900 font-bold text-xs sm:text-sm py-2 px-4 rounded-xl flex items-center gap-1.5 cursor-pointer"
                      >
                        <span className="material-symbols-outlined text-base">arrow_back</span>
                        <span>Volver</span>
                      </button>

                      <button
                        type="button"
                        disabled={!selectedSlot}
                        onClick={() => {
                          if (!selectedSlot) return setErrorMsg("Por favor, seleccioná un horario.");
                          setErrorMsg(null);
                          setCurrentStep(3);
                        }}
                        className={`retro-btn font-cartoon text-xs sm:text-base py-2 px-5 rounded-xl flex items-center gap-1.5 cursor-pointer ${
                          selectedSlot
                            ? "bg-vintage-yellow hover:bg-amber-300 text-slate-950"
                            : "bg-slate-200 text-slate-500 border-slate-400 shadow-none cursor-not-allowed"
                        }`}
                      >
                        <span>Continuar</span>
                        <span className="material-symbols-outlined text-base">arrow_forward</span>
                      </button>
                    </div>
                  </div>
                )}

                {/* PASO 3: TUS DATOS DE RESERVA */}
                {currentStep === 3 && (
                  <form onSubmit={handleConfirmBooking} className="space-y-3 animate-cartoon-pop select-text">
                    <div className="bg-[#f5ecf3] border-2 border-black rounded-xl p-2.5 sm:p-3 flex flex-col sm:flex-row sm:items-center justify-between gap-1 text-xs sm:text-sm">
                      <div>
                        <span className="font-cartoon text-[#523450] mr-1.5">Servicio:</span>
                        <strong className="font-black text-slate-950">{fullServiceLabel}</strong>
                      </div>
                      <div className="font-black text-slate-900">
                        {date} · {selectedSlot?.time} hs · Seña: {formatARS(DEPOSIT_AMOUNT)}
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 sm:gap-3">
                      <div>
                        <label className="block text-[11px] sm:text-xs font-black uppercase text-slate-800 mb-1 flex items-center gap-1">
                          <span className="material-symbols-outlined text-sm text-[#523450]">
                            person
                          </span>
                          <span>Nombre y Apellido *</span>
                        </label>
                        <input
                          type="text"
                          value={name}
                          onChange={(e) => setName(e.target.value)}
                          required
                          placeholder="Ej: Lucía Gómez"
                          className="w-full rounded-xl border-2 border-black bg-white px-3 py-2 text-xs sm:text-sm font-bold text-slate-950 shadow-[2px_2px_0px_#000] focus:outline-none focus:bg-amber-50/40"
                        />
                      </div>

                      <div>
                        <label className="block text-[11px] sm:text-xs font-black uppercase text-slate-800 mb-1 flex items-center gap-1">
                          <span className="material-symbols-outlined text-sm text-[#523450]">
                            phone
                          </span>
                          <span>Teléfono / WhatsApp *</span>
                        </label>
                        <input
                          type="tel"
                          value={phone}
                          onChange={(e) => setPhone(e.target.value)}
                          required
                          placeholder="Ej: 380 412-3456"
                          className="w-full rounded-xl border-2 border-black bg-white px-3 py-2 text-xs sm:text-sm font-bold text-slate-950 shadow-[2px_2px_0px_#000] focus:outline-none focus:bg-amber-50/40"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-[11px] sm:text-xs font-black uppercase text-slate-800 mb-1 flex items-center gap-1">
                        <span className="material-symbols-outlined text-sm text-[#523450]">
                          edit_note
                        </span>
                        <span>Notas u observaciones (opcional)</span>
                      </label>
                      <textarea
                        value={notes}
                        onChange={(e) => setNotes(e.target.value)}
                        rows={2}
                        placeholder="Ej: Diseño o consulta adicional..."
                        className="w-full rounded-xl border-2 border-black bg-white px-3 py-1.5 text-xs sm:text-sm font-bold text-slate-950 shadow-[2px_2px_0px_#000] focus:outline-none focus:bg-amber-50/40 resize-none"
                      />
                    </div>

                    <div className="pt-1 flex items-center justify-between gap-3">
                      <button
                        type="button"
                        disabled={submitting}
                        onClick={() => {
                          setErrorMsg(null);
                          setCurrentStep(2);
                        }}
                        className="retro-btn bg-white hover:bg-slate-50 text-slate-900 font-bold text-xs sm:text-sm py-2.5 px-4 rounded-xl flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                      >
                        <span className="material-symbols-outlined text-base">arrow_back</span>
                        <span>Volver</span>
                      </button>

                      <button
                        type="submit"
                        disabled={submitting}
                        className="flex-1 retro-btn bg-vintage-yellow hover:bg-amber-300 text-slate-950 font-cartoon text-sm sm:text-base py-2.5 px-5 rounded-xl flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                      >
                        {submitting ? (
                          <>
                            <span className="material-symbols-outlined text-base animate-spin">
                              progress_activity
                            </span>
                            <span>Confirmando...</span>
                          </>
                        ) : (
                          <>
                            <span className="material-symbols-outlined text-lg">
                              check_circle
                            </span>
                            <span>¡Confirmar mi Turno!</span>
                          </>
                        )}
                      </button>
                    </div>
                  </form>
                )}
              </div>
            )}
          </div>
        </div>
      </main>

      {/* ------------------------------------------------------------- */}
      {/* MODAL PARA CANCELAR TURNO                                     */}
      {/* ------------------------------------------------------------- */}
      {showCancelModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/65">
          <div className="w-full max-w-xs sm:max-w-sm rounded-3xl bg-white p-5 border-[3.5px] border-black shadow-retro-xl space-y-3.5 animate-cartoon-pop">
            <div className="flex items-start gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-amber-100 border-2 border-black flex items-center justify-center shrink-0 shadow-[1px_1px_0px_#000]">
                <span className="material-symbols-outlined text-lg text-red-600">warning</span>
              </div>
              <div>
                <h3 className="font-cartoon text-base text-slate-950">¿Cancelar tu turno?</h3>
                <p className="text-xs font-bold text-slate-700 mt-0.5 leading-snug">
                  Se cancelará tu cita agendada y el horario de las{" "}
                  <strong className="text-slate-950">{activeAppointment?.time} hs</strong> quedará libre.
                </p>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-1">
              <button
                type="button"
                disabled={cancelling}
                onClick={() => setShowCancelModal(false)}
                className="retro-btn bg-white hover:bg-slate-50 px-3.5 py-2 rounded-xl font-bold text-xs cursor-pointer"
              >
                Volver
              </button>
              <button
                type="button"
                disabled={cancelling}
                onClick={handleCancelAppointment}
                className="retro-btn bg-red-500 hover:bg-red-400 text-white px-4 py-2 rounded-xl font-cartoon text-xs cursor-pointer flex items-center justify-center gap-1.5 disabled:opacity-50"
              >
                {cancelling ? (
                  <>
                    <span className="material-symbols-outlined text-xs animate-spin">
                      progress_activity
                    </span>
                    <span>Cancelando...</span>
                  </>
                ) : (
                  <span>Sí, cancelar</span>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
