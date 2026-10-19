export type Slot = {
  time: string; // "09:00"
  isoStart: string; // ISO string de inicio
  isoEnd: string; // ISO string de fin
  available: boolean;
};

export type SlotsResponse = {
  date: string;
  timezone: string;
  slots: Slot[];
};

export type BookingPayload = {
  date: string; // YYYY-MM-DD
  time: string; // HH:mm
  name: string;
  phone: string;
  service?: string;
  notes?: string;
};

export type UserAppointment = {
  eventId: string;
  date: string;
  time: string;
  name: string;
  phone: string;
  service?: string;
  notes?: string;
  createdAt: string;
};