// ─────────────────────────────────────────────────────────────
// Motor de disponibilidad de citas.
//
// Principio (por petición de la clínica): el paciente NUNCA elige
// doctora por foto/apariencia. Elige servicio + horario disponible
// y el sistema asigna la doctora por DISPONIBILIDAD, de forma interna.
// Las citas nunca se aceptan solas: entran como 'pending' y la
// doctora las confirma manualmente.
// ─────────────────────────────────────────────────────────────
import { db } from '../db';
import { schedules, scheduleExceptions, appointments, doctors, doctorServices } from '../db/schema';
import { and, eq, inArray } from 'drizzle-orm';

// Estados que ocupan un espacio (bloquean el slot).
const BLOCKING_STATUSES = ['pending', 'confirmed'];

function toMin(t: string): number {
  const [h, m] = t.slice(0, 5).split(':').map(Number);
  return h * 60 + m;
}
function toHHMM(min: number): string {
  const h = Math.floor(min / 60);
  const m = min % 60;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
}
function genSlots(start: string, end: string, step: number): string[] {
  const s = toMin(start);
  const e = toMin(end);
  const out: string[] = [];
  for (let m = s; m + step <= e; m += step) out.push(toHHMM(m));
  return out;
}

export type Availability = {
  times: string[]; // horarios disponibles (al menos una doctora libre)
  doctorsByTime: Record<string, number[]>; // interno: doctoras libres por horario
};

/**
 * Calcula los horarios disponibles para una fecha dada (YYYY-MM-DD),
 * opcionalmente filtrando por las doctoras que ofrecen un servicio.
 * No expone qué doctora atiende: solo si el horario está libre.
 */
export async function getAvailability(dateStr: string, serviceId?: number | null): Promise<Availability> {
  const empty: Availability = { times: [], doctorsByTime: {} };
  try {
    const date = new Date(`${dateStr}T00:00:00`);
    if (Number.isNaN(date.getTime())) return empty;
    const weekday = date.getDay(); // 0=Domingo … 6=Sábado

    // 1) Doctoras activas (opcionalmente las que ofrecen el servicio).
    let activeDoctors = await db.select().from(doctors).where(eq(doctors.active, true));
    if (serviceId) {
      const links = await db
        .select({ doctorId: doctorServices.doctorId })
        .from(doctorServices)
        .where(eq(doctorServices.serviceId, serviceId));
      const allowed = new Set(links.map((l) => l.doctorId));
      // Si hay vínculos definidos, se respeta; si no hay ninguno, no filtramos.
      if (allowed.size > 0) activeDoctors = activeDoctors.filter((d) => allowed.has(d.id));
    }
    if (activeDoctors.length === 0) return empty;
    const doctorIds = activeDoctors.map((d) => d.id);

    // 2) Plantilla semanal del día.
    const scheds = await db
      .select()
      .from(schedules)
      .where(and(eq(schedules.weekday, weekday), eq(schedules.active, true)));

    // 3) Excepciones de esa fecha (cierres / horarios especiales).
    const exceptions = await db
      .select()
      .from(scheduleExceptions)
      .where(eq(scheduleExceptions.date, dateStr));

    // 4) Citas ya ocupadas ese día.
    const booked = await db
      .select({ doctorId: appointments.doctorId, time: appointments.time })
      .from(appointments)
      .where(and(eq(appointments.date, dateStr), inArray(appointments.status, BLOCKING_STATUSES)));

    // Para hoy, descartar horarios ya pasados.
    const now = new Date();
    const isToday = dateStr === `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
    const nowMin = now.getHours() * 60 + now.getMinutes();

    const doctorsByTime: Record<string, Set<number>> = {};

    for (const doc of activeDoctors) {
      const ex = exceptions.find((e) => e.doctorId === doc.id);
      if (ex && ex.closed) continue; // doctora cerrada ese día

      // Bloques de atención: excepción con horario especial, o la plantilla semanal.
      let blocks: { startTime: string; endTime: string; slotMin: number }[];
      if (ex && !ex.closed && ex.startTime && ex.endTime) {
        blocks = [{ startTime: ex.startTime, endTime: ex.endTime, slotMin: 30 }];
      } else {
        blocks = scheds
          .filter((s) => s.doctorId === doc.id)
          .map((s) => ({ startTime: s.startTime, endTime: s.endTime, slotMin: s.slotMin }));
      }

      for (const b of blocks) {
        for (const time of genSlots(b.startTime, b.endTime, b.slotMin)) {
          if (isToday && toMin(time) <= nowMin) continue; // ya pasó
          const taken = booked.some((a) => a.doctorId === doc.id && a.time.slice(0, 5) === time);
          if (taken) continue;
          (doctorsByTime[time] ??= new Set()).add(doc.id);
        }
      }
    }

    const result: Record<string, number[]> = {};
    for (const [time, set] of Object.entries(doctorsByTime)) result[time] = [...set];
    const times = Object.keys(result).sort();
    return { times, doctorsByTime: result };
  } catch {
    return empty;
  }
}

/**
 * Elige la doctora para un horario por disponibilidad y carga del día
 * (la que tenga menos citas ese día), nunca por apariencia.
 * Devuelve el id de doctora o null si el horario ya no está libre.
 */
export async function pickDoctorForSlot(
  dateStr: string,
  time: string,
  serviceId?: number | null,
): Promise<number | null> {
  const { doctorsByTime } = await getAvailability(dateStr, serviceId);
  const candidates = doctorsByTime[time];
  if (!candidates || candidates.length === 0) return null;
  if (candidates.length === 1) return candidates[0];

  // Repartir carga: la doctora con menos citas ese día.
  const dayAppts = await db
    .select({ doctorId: appointments.doctorId })
    .from(appointments)
    .where(and(eq(appointments.date, dateStr), inArray(appointments.status, BLOCKING_STATUSES)));
  const load = new Map<number, number>();
  for (const id of candidates) load.set(id, 0);
  for (const a of dayAppts) {
    if (a.doctorId != null && load.has(a.doctorId)) load.set(a.doctorId, (load.get(a.doctorId) ?? 0) + 1);
  }
  return [...load.entries()].sort((a, b) => a[1] - b[1])[0][0];
}
