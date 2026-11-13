// La clínica está en Cancún: UTC-5 todo el año (sin horario de verano).
const TZ = 'America/Cancun';
const OFFSET = '-05:00';

export function nowCancun(): { date: string; minutes: number; hour: number } {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: TZ, year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', hour12: false,
  }).formatToParts(new Date());
  const g = (t: string) => parts.find((p) => p.type === t)?.value ?? '0';
  const hour = Number(g('hour')) % 24;
  return { date: `${g('year')}-${g('month')}-${g('day')}`, minutes: hour * 60 + Number(g('minute')), hour };
}

/** Fecha/hora de una cita (hora local de Cancún) como instante UTC (ms). */
export function apptInstant(date: string, time: string): number {
  return Date.parse(`${date}T${time.slice(0, 5)}:00${OFFSET}`);
}

export function addDays(date: string, n: number): string {
  const d = new Date(`${date}T12:00:00Z`);
  d.setUTCDate(d.getUTCDate() + n);
  return d.toISOString().slice(0, 10);
}

export function longDate(date: string): string {
  return new Date(`${date}T12:00:00Z`).toLocaleDateString('es-MX', {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC',
  });
}

export function hhmm12(time: string): string {
  const [h, m] = time.slice(0, 5).split(':').map(Number);
  const ap = h >= 12 ? 'p. m.' : 'a. m.';
  return `${h % 12 || 12}:${String(m).padStart(2, '0')} ${ap}`;
}
