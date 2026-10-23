"use client";

import { useEffect, useState, useMemo } from "react";

interface Appointment {
  id: string;
  summary: string;
  clientName: string;
  service: string;
  phone: string;
  notes: string;
  start: string;
  end: string;
  date: string;
  time: string;
  deposit: number;
  estimatedTotal: number;
  htmlLink?: string;
}

const PIN_STORAGE_KEY = "starbnails_admin_pin";
const SESSION_STORAGE_KEY = "starbnails_admin_auth";

export default function AdminPage() {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [hasStoredPin, setHasStoredPin] = useState<boolean>(false);
  const [inputPin, setInputPin] = useState<string>("");
  const [confirmPin, setConfirmPin] = useState<string>("");
  const [isSettingPin, setIsSettingPin] = useState<boolean>(false);
  const [authError, setAuthError] = useState<string>("");

  // Datos
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [filterDate, setFilterDate] = useState<string>(""); // vacío = todos los próximos
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [activeTab, setActiveTab] = useState<"hoy" | "semana" | "todos">("hoy");
  const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null);
  const [actionLoading, setActionLoading] = useState<boolean>(false);

  // Inicializar verificación de PIN en localStorage
  useEffect(() => {
    const savedPin = localStorage.getItem(PIN_STORAGE_KEY);
    const sessionAuth = sessionStorage.getItem(SESSION_STORAGE_KEY);

    if (!savedPin) {
      setIsSettingPin(true);
    } else {
      setHasStoredPin(true);
      if (sessionAuth === "true") {
        setIsAuthenticated(true);
      }
    }
  }, []);

  // Cargar turnos cuando está autenticado
  const fetchAppointments = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/appointments", { cache: "no-store" });
      const data = await res.json();
      if (data.success && Array.isArray(data.appointments)) {
        setAppointments(data.appointments);
      }
    } catch (err) {
      console.error("Error al cargar turnos de admin:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isAuthenticated) {
      fetchAppointments();
    }
  }, [isAuthenticated]);

  // Manejador de PIN
  const handlePinSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError("");

    if (isSettingPin) {
      if (inputPin.length < 4) {
        setAuthError("El PIN debe tener al menos 4 números.");
        return;
      }
      if (inputPin !== confirmPin) {
        setAuthError("Los PINs no coinciden.");
        return;
      }
      localStorage.setItem(PIN_STORAGE_KEY, inputPin);
      sessionStorage.setItem(SESSION_STORAGE_KEY, "true");
      setIsSettingPin(false);
      setHasStoredPin(true);
      setIsAuthenticated(true);
      setInputPin("");
      setConfirmPin("");
    } else {
      const savedPin = localStorage.getItem(PIN_STORAGE_KEY);
      if (inputPin === savedPin) {
        sessionStorage.setItem(SESSION_STORAGE_KEY, "true");
        setIsAuthenticated(true);
        setInputPin("");
      } else {
        setAuthError("PIN incorrecto. Intenta de nuevo.");
      }
    }
  };

  const handleLogout = () => {
    sessionStorage.removeItem(SESSION_STORAGE_KEY);
    setIsAuthenticated(false);
  };

  // Cancelar un turno desde el panel
  const handleCancelAppointment = async (appId: string, phone: string) => {
    if (!confirm("¿Segura que deseas cancelar este turno? Se liberará en Google Calendar.")) {
      return;
    }
    setActionLoading(true);
    try {
      const res = await fetch("/api/book", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ eventId: appId, phone }),
      });
      if (res.ok) {
        setSelectedAppointment(null);
        await fetchAppointments();
      } else {
        alert("No se pudo cancelar el turno.");
      }
    } catch (err) {
      alert("Error al cancelar.");
    } finally {
      setActionLoading(false);
    }
  };

  // Filtrado de turnos
  const todayISO = useMemo(() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
  }, []);

  const filteredAppointments = useMemo(() => {
    return appointments.filter((app) => {
      // Búsqueda por texto (nombre, servicio, teléfono)
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        const matchesName = app.clientName.toLowerCase().includes(query);
        const matchesService = app.service.toLowerCase().includes(query);
        const matchesPhone = app.phone.includes(query);
        if (!matchesName && !matchesService && !matchesPhone) return false;
      }

      // Filtro por pestaña rápida
      if (activeTab === "hoy") {
        return app.date === todayISO;
      }
      if (activeTab === "semana") {
        const appDate = new Date(`${app.date}T00:00:00`);
        const now = new Date();
        const diffTime = appDate.getTime() - now.getTime();
        const diffDays = diffTime / (1000 * 3600 * 24);
        return diffDays >= -1 && diffDays <= 7;
      }

      return true; // todos
    });
  }, [appointments, searchQuery, activeTab, todayISO]);

  // Cálculos financieros estilo Naranja X
  const metrics = useMemo(() => {
    const todayList = appointments.filter((a) => a.date === todayISO);
    const todayDeposits = todayList.reduce((acc, a) => acc + (a.deposit || 5000), 0);
    const todayTotal = todayList.reduce((acc, a) => acc + (a.estimatedTotal || 13000), 0);

    const weekList = appointments.filter((a) => {
      const appDate = new Date(`${a.date}T00:00:00`);
      const now = new Date();
      const diffTime = appDate.getTime() - now.getTime();
      const diffDays = diffTime / (1000 * 3600 * 24);
      return diffDays >= -1 && diffDays <= 7;
    });
    const weekTotal = weekList.reduce((acc, a) => acc + (a.estimatedTotal || 13000), 0);

    return {
      todayCount: todayList.length,
      todayDeposits,
      todayTotal,
      weekCount: weekList.length,
      weekTotal,
    };
  }, [appointments, todayISO]);

  // Pantalla de Login / Configuración de PIN
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-[#F6F7F9] flex flex-col justify-between font-sans">
        {/* Cabecera Naranja X */}
        <div className="bg-[#FF5500] px-6 pt-12 pb-20 text-white rounded-b-[32px] shadow-sm text-center">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-white/20 backdrop-blur-sm mb-3">
            <span className="material-symbols-outlined text-3xl text-white">fingerprint</span>
          </div>
          <h1 className="text-2xl font-black tracking-tight">StarbNails Admin</h1>
          <p className="text-sm font-medium text-white/90 mt-1">Acceso exclusivo para el salón</p>
        </div>

        {/* Tarjeta flotante de PIN */}
        <div className="flex-1 px-4 -mt-10 max-w-sm mx-auto w-full">
          <div className="bg-white rounded-[24px] p-6 shadow-[0_8px_30px_rgb(0,0,0,0.06)] border border-slate-100">
            <h2 className="text-lg font-bold text-slate-800 text-center">
              {isSettingPin ? "Crea tu PIN de acceso" : "Ingresá tu PIN de seguridad"}
            </h2>
            <p className="text-xs text-slate-500 text-center mt-1 mb-6">
              {isSettingPin
                ? "Este PIN se guardará seguro en tu celular para ingresar siempre sin volver a escribir claves largas."
                : "Ingresá los 4 números para ver tu agenda y señas."}
            </p>

            <form onSubmit={handlePinSubmit} className="space-y-4">
              <div>
                <input
                  type="password"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  maxLength={6}
                  value={inputPin}
                  onChange={(e) => setInputPin(e.target.value)}
                  placeholder="PIN de acceso"
                  autoFocus
                  required
                  className="w-full text-center text-3xl tracking-[0.5em] font-black py-3 px-4 rounded-2xl bg-slate-50 border-2 border-slate-200 focus:border-[#FF5500] focus:bg-white focus:outline-none transition-all text-slate-800"
                />
              </div>

              {isSettingPin && (
                <div>
                  <input
                    type="password"
                    inputMode="numeric"
                    pattern="[0-9]*"
                    maxLength={6}
                    value={confirmPin}
                    onChange={(e) => setConfirmPin(e.target.value)}
                    placeholder="Repetí el PIN"
                    required
                    className="w-full text-center text-3xl tracking-[0.5em] font-black py-3 px-4 rounded-2xl bg-slate-50 border-2 border-slate-200 focus:border-[#FF5500] focus:bg-white focus:outline-none transition-all text-slate-800"
                  />
                </div>
              )}

              {authError && (
                <div className="text-xs font-bold text-red-500 text-center bg-red-50 py-2 rounded-xl border border-red-200">
                  {authError}
                </div>
              )}

              <button
                type="submit"
                className="w-full bg-[#FF5500] hover:bg-[#e04b00] active:scale-[0.98] text-white font-bold py-3.5 px-4 rounded-2xl transition-all shadow-md shadow-orange-500/20 text-sm mt-2"
              >
                {isSettingPin ? "Guardar PIN y entrar" : "Ingresar"}
              </button>
            </form>
          </div>
        </div>

        {/* Footer */}
        <div className="py-6 text-center text-xs text-slate-400">
          StarbNails © Gestión protegida en tu dispositivo
        </div>
      </div>
    );
  }

  // Dashboard Administrador estilo Naranja X
  return (
    <div className="min-h-screen bg-[#F4F5F8] text-slate-900 font-sans pb-24">
      {/* ----------------------------------------------------------------- */}
      {/* HEADER ESTILO NARANJA X (Fondo naranja vibrante + Saludo + Balance) */}
      {/* ----------------------------------------------------------------- */}
      <div className="bg-[#FF5500] text-white pt-6 pb-20 px-5 rounded-b-[36px] shadow-sm relative overflow-hidden">
        {/* Decoración sutil de fondo */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full blur-2xl pointer-events-none" />

        {/* Barra superior con saludo y cerrar sesión */}
        <div className="flex items-center justify-between mb-5 relative z-10">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-white text-[#FF5500] flex items-center justify-center font-black text-lg shadow-sm">
              SB
            </div>
            <div>
              <div className="text-xs font-medium text-white/80">StarbNails</div>
              <h2 className="text-base font-extrabold tracking-tight">Hola, Ana 👋</h2>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={fetchAppointments}
              className="w-9 h-9 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center text-white transition-all"
              title="Actualizar agenda"
            >
              <span className={`material-symbols-outlined text-lg ${loading ? "animate-spin" : ""}`}>
                refresh
              </span>
            </button>
            <button
              onClick={handleLogout}
              className="w-9 h-9 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center text-white transition-all"
              title="Salir"
            >
              <span className="material-symbols-outlined text-lg">logout</span>
            </button>
          </div>
        </div>

        {/* Tarjeta de Métricas / Balances estilo Naranja X */}
        <div className="bg-white text-slate-900 rounded-[28px] p-5 shadow-[0_10px_35px_rgb(0,0,0,0.08)]">
          <div className="flex items-center justify-between text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">
            <span>Señas del día ({todayISO})</span>
            <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
              {metrics.todayCount} turnos hoy
            </span>
          </div>

          <div className="flex items-baseline gap-1 mt-1">
            <span className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight">
              ${metrics.todayDeposits.toLocaleString("es-AR")}
            </span>
            <span className="text-xs font-bold text-slate-400">en señas</span>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
            <div>
              <span className="text-slate-400 block font-medium">Facturación estimada hoy:</span>
              <span className="font-extrabold text-slate-800 text-sm">
                ${metrics.todayTotal.toLocaleString("es-AR")}
              </span>
            </div>
            <div className="text-right">
              <span className="text-slate-400 block font-medium">Próximos 7 días:</span>
              <span className="font-extrabold text-[#FF5500] text-sm">
                {metrics.weekCount} turnos (${metrics.weekTotal.toLocaleString("es-AR")})
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* ----------------------------------------------------------------- */}
      {/* CUERPO PRINCIPAL: FILTROS + LISTA DE CLIENTAS ESTILO FINTECH      */}
      {/* ----------------------------------------------------------------- */}
      <div className="max-w-2xl mx-auto px-4 -mt-10 relative z-10 space-y-4">
        {/* Barra de Búsqueda rápida */}
        <div className="bg-white rounded-2xl p-2 shadow-sm border border-slate-100 flex items-center gap-2">
          <span className="material-symbols-outlined text-slate-400 ml-2">search</span>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Buscar por clienta, servicio o celular..."
            className="w-full text-sm font-medium py-1.5 bg-transparent focus:outline-none text-slate-800 placeholder-slate-400"
          />
          {searchQuery && (
            <button onClick={() => setSearchQuery("")} className="text-slate-400 hover:text-slate-600 mr-2 text-xs font-bold">
              ✕
            </button>
          )}
        </div>

        {/* Pestañas estilo pastillas Naranja X */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setActiveTab("hoy")}
            className={`flex-1 py-2.5 px-3 rounded-2xl text-xs font-extrabold transition-all text-center ${
              activeTab === "hoy"
                ? "bg-[#FF5500] text-white shadow-sm shadow-orange-500/20"
                : "bg-white text-slate-600 hover:bg-slate-50 border border-slate-200/60"
            }`}
          >
            Hoy ({metrics.todayCount})
          </button>
          <button
            onClick={() => setActiveTab("semana")}
            className={`flex-1 py-2.5 px-3 rounded-2xl text-xs font-extrabold transition-all text-center ${
              activeTab === "semana"
                ? "bg-[#FF5500] text-white shadow-sm shadow-orange-500/20"
                : "bg-white text-slate-600 hover:bg-slate-50 border border-slate-200/60"
            }`}
          >
            Esta Semana ({metrics.weekCount})
          </button>
          <button
            onClick={() => setActiveTab("todos")}
            className={`flex-1 py-2.5 px-3 rounded-2xl text-xs font-extrabold transition-all text-center ${
              activeTab === "todos"
                ? "bg-[#FF5500] text-white shadow-sm shadow-orange-500/20"
                : "bg-white text-slate-600 hover:bg-slate-50 border border-slate-200/60"
            }`}
          >
            Todos ({appointments.length})
          </button>
        </div>

        {/* Lista de Transacciones / Turnos */}
        <div className="space-y-2.5">
          <div className="flex items-center justify-between px-1">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">
              {activeTab === "hoy"
                ? "Turnos de Hoy"
                : activeTab === "semana"
                ? "Turnos de los Próximos 7 Días"
                : "Todos los Turnos Agendados"}
            </h3>
            <span className="text-xs font-semibold text-slate-400">
              {filteredAppointments.length} {filteredAppointments.length === 1 ? "reserva" : "reservas"}
            </span>
          </div>

          {loading ? (
            <div className="bg-white rounded-3xl p-8 text-center border border-slate-100 shadow-sm">
              <div className="w-8 h-8 rounded-full border-3 border-[#FF5500] border-t-transparent animate-spin mx-auto mb-2" />
              <p className="text-xs font-bold text-slate-500">Consultando Google Calendar...</p>
            </div>
          ) : filteredAppointments.length === 0 ? (
            <div className="bg-white rounded-3xl p-8 text-center border border-slate-100 shadow-sm">
              <span className="material-symbols-outlined text-4xl text-slate-300 mb-1">event_available</span>
              <p className="text-sm font-bold text-slate-700">No hay turnos para este filtro</p>
              <p className="text-xs text-slate-400 mt-0.5">Los turnos que reserven tus clientas aparecerán aquí.</p>
            </div>
          ) : (
            filteredAppointments.map((app) => (
              <div
                key={app.id}
                onClick={() => setSelectedAppointment(app)}
                className="bg-white rounded-[22px] p-4 shadow-sm border border-slate-100 hover:border-orange-200 transition-all flex items-center justify-between gap-3 cursor-pointer active:scale-[0.99]"
              >
                {/* Avatar + Info */}
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-12 h-12 rounded-2xl bg-orange-50 text-[#FF5500] flex items-center justify-center font-black text-sm shrink-0 border border-orange-100">
                    {app.clientName.substring(0, 2).toUpperCase()}
                  </div>

                  <div className="min-w-0">
                    <h4 className="text-sm font-extrabold text-slate-900 truncate">
                      {app.clientName}
                    </h4>
                    <p className="text-xs font-semibold text-[#FF5500] truncate">
                      {app.service}
                    </p>
                    <div className="flex items-center gap-2 mt-0.5 text-[11px] text-slate-400 font-medium">
                      <span className="flex items-center gap-0.5">
                        <span className="material-symbols-outlined text-[13px]">calendar_today</span>
                        {app.date}
                      </span>
                      <span>•</span>
                      <span className="flex items-center gap-0.5 font-bold text-slate-700">
                        <span className="material-symbols-outlined text-[13px]">schedule</span>
                        {app.time} hs
                      </span>
                    </div>
                  </div>
                </div>

                {/* Importe + Botón WhatsApp */}
                <div className="text-right shrink-0">
                  <div className="text-sm font-black text-slate-900">
                    ${app.estimatedTotal.toLocaleString("es-AR")}
                  </div>
                  <div className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full inline-block mt-0.5">
                    Seña: ${app.deposit.toLocaleString("es-AR")}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* ----------------------------------------------------------------- */}
      {/* MODAL DETALLE DE CLIENTA / TURNO (Estilo Bottom Sheet Naranja X) */}
      {/* ----------------------------------------------------------------- */}
      {selectedAppointment && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/50 backdrop-blur-xs">
          <div className="bg-white w-full max-w-md rounded-t-[32px] sm:rounded-[32px] p-6 shadow-2xl space-y-4 animate-in fade-in slide-in-from-bottom-6">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-[#FF5500]" />
                <h3 className="font-extrabold text-base text-slate-900">Detalle del Turno</h3>
              </div>
              <button
                onClick={() => setSelectedAppointment(null)}
                className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 hover:text-slate-800 text-xs font-bold"
              >
                ✕
              </button>
            </div>

            {/* Ficha clienta */}
            <div className="bg-slate-50 rounded-2xl p-4 space-y-2 text-xs">
              <div className="flex justify-between">
                <span className="text-slate-400 font-semibold">Clienta:</span>
                <span className="font-black text-slate-900 text-sm">{selectedAppointment.clientName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400 font-semibold">Servicio:</span>
                <span className="font-extrabold text-[#FF5500]">{selectedAppointment.service}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400 font-semibold">Fecha y Hora:</span>
                <span className="font-bold text-slate-800">{selectedAppointment.date} a las {selectedAppointment.time} hs</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400 font-semibold">Teléfono / WhatsApp:</span>
                <span className="font-bold text-slate-800">{selectedAppointment.phone || "No especificado"}</span>
              </div>
              {selectedAppointment.notes && (
                <div className="pt-1 border-t border-slate-200">
                  <span className="text-slate-400 font-semibold block mb-0.5">Notas adicionales:</span>
                  <span className="text-slate-700 italic">{selectedAppointment.notes}</span>
                </div>
              )}
            </div>

            {/* Acciones principales */}
            <div className="space-y-2 pt-1">
              {selectedAppointment.phone && (
                <a
                  href={`https://wa.me/549${selectedAppointment.phone.replace(/\D/g, "")}?text=${encodeURIComponent(
                    `Hola ${selectedAppointment.clientName}! Te escribo de StarbNails por tu turno del ${selectedAppointment.date} a las ${selectedAppointment.time} hs.`
                  )}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full bg-[#25D366] hover:bg-[#20ba59] active:scale-[0.98] text-white font-extrabold py-3.5 px-4 rounded-2xl flex items-center justify-center gap-2 text-sm shadow-sm transition-all"
                >
                  <span className="material-symbols-outlined text-lg">chat</span>
                  <span>Escribir por WhatsApp</span>
                </a>
              )}

              <button
                type="button"
                disabled={actionLoading}
                onClick={() => handleCancelAppointment(selectedAppointment.id, selectedAppointment.phone)}
                className="w-full bg-red-50 hover:bg-red-100 text-red-600 font-bold py-3 px-4 rounded-2xl flex items-center justify-center gap-1.5 text-xs transition-all disabled:opacity-50"
              >
                <span className="material-symbols-outlined text-base">delete</span>
                <span>{actionLoading ? "Cancelando..." : "Cancelar turno y liberar horario"}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
