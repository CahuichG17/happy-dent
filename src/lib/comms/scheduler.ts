// Planificador interno: revisa cada minuto si hay mensajes por enviar.
// Solo corre en producción (en desarrollo no, para no enviar correos reales
// desde una laptop conectada a la DB de producción). Se puede apagar con
// ENABLE_SCHEDULER=off, y existe /api/cron/tick para dispararlo desde fuera.
import { tick } from './engine';

const g = globalThis as unknown as { __hdScheduler?: boolean };

export function startScheduler(): void {
  if (g.__hdScheduler) return;
  if (!import.meta.env.PROD || process.env.ENABLE_SCHEDULER === 'off') return;
  if (!(process.env.DATABASE_URL || import.meta.env?.DATABASE_URL)) return;
  g.__hdScheduler = true;

  const run = () => tick().catch((e) => console.error('[comms] tick error', e));
  // unref: nunca impide que el proceso termine (por ejemplo durante el build).
  setTimeout(run, 20_000).unref?.();
  setInterval(run, 60_000).unref?.();
  console.log('[comms] scheduler activo (cada 60 s)');
}
