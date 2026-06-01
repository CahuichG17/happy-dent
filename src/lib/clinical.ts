// ─────────────────────────────────────────────────────────────
// Helpers del expediente clínico y de la agenda diaria.
// La agenda combina las citas públicas (appointments) y las
// sesiones clínicas (clinical_sessions) sobre la plantilla de
// horarios de cada doctora, para dibujar el "mapa" del día.
// ─────────────────────────────────────────────────────────────
import { db } from '../db';
import {
  schedules,
  appointments,
  clinicalSessions,
  doctors,
  patients,
  services,
} from '../db/schema';
import { and, eq, inArray } from 'drizzle-orm';

export const CASE_STATUS: Record<string, string> = {
  active: 'En curso',
  completed: 'Completado',
  paused: 'En pausa',
  cancelled: 'Cancelado',
};
export const CASE_STATUS_CLASS: Record<string, string> = {
  active: 'ok',
  completed: 'done',
  paused: 'off',
  cancelled: 'danger',
};

export const SESSION_STATUS: Record<string, string> = {
  planned: 'Programada',
  done: 'Realizada',
  cancelled: 'Cancelada',
  no_show: 'No asistió',
};
export const SESSION_STATUS_CLASS: Record<string, string> = {
  planned: 'off',
  done: 'done',
  cancelled: 'danger',
  no_show: 'danger',
};

export const ATTACHMENT_KIND: Record<string, string> = {
  xray: 'Radiografía',
  photo: 'Foto clínica',
  doc: 'Documento',
};

const BLOCKING_STATUSES = ['pending', 'confirmed', 'done'];
const SESSION_BLOCKING = ['planned', 'done'];

function toMin(t: string): number {
  const [h, m] = t.slice(0, 5).split(':').map(Number);
  return h * 60 + m;
}
function toHHMM(min: number): string {
  return `${String(Math.floor(min / 60)).padStart(2, '0')}:${String(min % 60).padStart(2, '0')}`;
}
function genSlots(start: string, end: string, step: number): string[] {
  const out: string[] = [];
  for (let m = toMin(start); m + step <= toMin(end); m += step) out.push(toHHMM(m));
  return out;
}

export function todayStr(): string {
  const n = new Date();
  return `${n.getFullYear()}-${String(n.getMonth() + 1).padStart(2, '0')}-${String(n.getDate()).padStart(2, '0')}`;
}

export type AgendaSlot = {
  time: string;
  status: 'free' | 'busy';
  kind?: 'appointment' | 'session';
  label?: string;
  patientId?: number | null;
  refId?: number;
};
export type DoctorAgenda = {
  doctorId: number;
  doctorName: string;
  slots: AgendaSlot[];
  busy: number;
  free: number;
};

/**
 * Construye la agenda de un día para todas las doctoras (o una sola).
 * Cruza la plantilla semanal con citas y sesiones ocupadas.
 */
export async function getDayAgenda(dateStr: string, doctorId?: number | null): Promise<DoctorAgenda[]> {
  try {
    const date = new Date(`${dateStr}T00:00:00`);
    if (Number.isNaN(date.getTime())) return [];
    const weekday = date.getDay();

    let docList = await db.select().from(doctors).where(eq(doctors.active, true));
    if (doctorId) docList = docList.filter((d) => d.id === doctorId);
    if (docList.length === 0) return [];

    const scheds = await db
      .select()
      .from(schedules)
      .where(and(eq(schedules.weekday, weekday), eq(schedules.active, true)));

    const appts = await db
      .select({
        id: appointments.id,
        doctorId: appointments.doctorId,
        time: appointments.time,
        patientName: appointments.patientName,
        status: appointments.status,
        serviceTitle: services.titleEs,
      })
      .from(appointments)
      .leftJoin(services, eq(appointments.serviceId, services.id))
      .where(and(eq(appointments.date, dateStr), inArray(appointments.status, BLOCKING_STATUSES)));

    const sess = await db
      .select({
        id: clinicalSessions.id,
        doctorId: clinicalSessions.doctorId,
        time: clinicalSessions.time,
        patientId: clinicalSessions.patientId,
        patientName: patients.name,
        status: clinicalSessions.status,
        seq: clinicalSessions.seq,
      })
      .from(clinicalSessions)
      .leftJoin(patients, eq(clinicalSessions.patientId, patients.id))
      .where(and(eq(clinicalSessions.date, dateStr), inArray(clinicalSessions.status, SESSION_BLOCKING)));

    const result: DoctorAgenda[] = [];
    for (const doc of docList) {
      const blocks = scheds.filter((s) => s.doctorId === doc.id);
      const slots: AgendaSlot[] = [];
      const seen = new Set<string>();
      for (const b of blocks) {
        for (const time of genSlots(b.startTime, b.endTime, b.slotMin)) {
          if (seen.has(time)) continue;
          seen.add(time);
          const appt = appts.find((a) => a.doctorId === doc.id && a.time?.slice(0, 5) === time);
          const cs = sess.find((s) => s.doctorId === doc.id && s.time?.slice(0, 5) === time);
          if (cs) {
            slots.push({
              time,
              status: 'busy',
              kind: 'session',
              label: `${cs.patientName ?? 'Paciente'} · Sesión ${cs.seq}`,
              patientId: cs.patientId,
              refId: cs.id,
            });
          } else if (appt) {
            slots.push({
              time,
              status: 'busy',
              kind: 'appointment',
              label: `${appt.patientName} · ${appt.serviceTitle ?? 'Cita'}`,
              refId: appt.id,
            });
          } else {
            slots.push({ time, status: 'free' });
          }
        }
      }
      slots.sort((a, b) => a.time.localeCompare(b.time));
      result.push({
        doctorId: doc.id,
        doctorName: doc.name,
        slots,
        busy: slots.filter((s) => s.status === 'busy').length,
        free: slots.filter((s) => s.status === 'free').length,
      });
    }
    return result;
  } catch {
    return [];
  }
}
