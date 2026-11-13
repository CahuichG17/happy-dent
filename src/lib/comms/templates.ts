// Variables, render y catálogo de plantillas/automatizaciones por defecto.

export const VARIABLES: { key: string; desc: string }[] = [
  { key: 'paciente', desc: 'Nombre del paciente' },
  { key: 'fecha', desc: 'Fecha de la cita (ej. viernes, 13 de noviembre de 2026)' },
  { key: 'hora', desc: 'Hora de la cita (ej. 4:30 p. m.)' },
  { key: 'servicio', desc: 'Tratamiento solicitado' },
  { key: 'doctora', desc: 'Nombre de la doctora' },
  { key: 'clinica', desc: 'Happy Dent' },
  { key: 'telefono', desc: 'Teléfono de la clínica' },
  { key: 'direccion', desc: 'Dirección de la clínica' },
  { key: 'agendar', desc: 'Enlace para agendar' },
  { key: 'opinion', desc: 'Enlace para dejar opinión (si existe)' },
];

export function renderTemplate(tpl: string, vars: Record<string, string>): string {
  return tpl.replace(/\{\{\s*([a-z_]+)\s*\}\}/gi, (_, k: string) => vars[k.toLowerCase()] ?? '');
}

export const TRIGGERS: Record<string, { label: string; timed: boolean; after?: boolean; hint: string }> = {
  appointment_created: { label: 'Cuando llega una solicitud de cita', timed: false, hint: 'Se envía al instante, cuando alguien agenda desde el sitio.' },
  appointment_confirmed: { label: 'Cuando confirmo una cita', timed: false, hint: 'Al marcar la cita como confirmada.' },
  appointment_cancelled: { label: 'Cuando cancelo una cita', timed: false, hint: 'Al marcar la cita como cancelada.' },
  reminder_before: { label: 'Recordatorio antes de la cita', timed: true, hint: 'Se envía X tiempo antes de la hora de la cita (solo citas confirmadas).' },
  followup_after: { label: 'Seguimiento después de la cita', timed: true, after: true, hint: 'Se envía X tiempo después de la hora de la cita (citas confirmadas o atendidas).' },
  birthday: { label: 'Cumpleaños del paciente', timed: false, hint: 'Se envía a las 9:00 a. m. a pacientes con correo y fecha de nacimiento.' },
};

type Default = {
  tplName: string; channel: 'email' | 'whatsapp'; subject: string; body: string;
  name: string; trigger: string; recipient: 'patient' | 'doctor'; offsetMin: number;
};

export const DEFAULTS: Default[] = [
  {
    name: 'Aviso a la doctora: nueva solicitud', trigger: 'appointment_created', recipient: 'doctor', offsetMin: 0, channel: 'email',
    tplName: 'Nueva solicitud (para mí)',
    subject: 'Nueva solicitud de cita: {{paciente}}',
    body: 'Hola {{doctora}},\n\nllegó una nueva solicitud de cita:\n\nPaciente: {{paciente}}\nServicio: {{servicio}}\nFecha: {{fecha}}\nHora: {{hora}}\n\nEntra al panel para confirmarla.',
  },
  {
    name: 'Recibimos tu solicitud', trigger: 'appointment_created', recipient: 'patient', offsetMin: 0, channel: 'email',
    tplName: 'Solicitud recibida',
    subject: 'Recibimos tu solicitud de cita — {{clinica}}',
    body: 'Hola {{paciente}},\n\nrecibimos tu solicitud de cita para el {{fecha}} a las {{hora}}. En breve te confirmamos por este medio o por WhatsApp.\n\nGracias por elegirnos.',
  },
  {
    name: 'Cita confirmada', trigger: 'appointment_confirmed', recipient: 'patient', offsetMin: 0, channel: 'email',
    tplName: 'Cita confirmada',
    subject: 'Tu cita está confirmada — {{fecha}}',
    body: 'Hola {{paciente}},\n\ntu cita quedó confirmada:\n\n{{fecha}} a las {{hora}}\nServicio: {{servicio}}\nDoctora: {{doctora}}\nDirección: {{direccion}}\n\nSi necesitas reprogramar, escríbenos al {{telefono}}.',
  },
  {
    name: 'Recordatorio 24 h antes', trigger: 'reminder_before', recipient: 'patient', offsetMin: 1440, channel: 'email',
    tplName: 'Recordatorio de cita',
    subject: 'Mañana es tu cita en {{clinica}}',
    body: 'Hola {{paciente}},\n\nte recordamos tu cita de mañana, {{fecha}}, a las {{hora}} con {{doctora}}.\n\nDirección: {{direccion}}\n\n¿Necesitas cambiarla? Escríbenos al {{telefono}}.',
  },
  {
    name: 'Recordatorio por WhatsApp (2 h antes)', trigger: 'reminder_before', recipient: 'patient', offsetMin: 120, channel: 'whatsapp',
    tplName: 'Recordatorio WhatsApp',
    subject: '',
    body: 'Hola {{paciente}} 👋 te esperamos hoy a las {{hora}} en {{clinica}}. {{direccion}}. ¡Nos vemos pronto!',
  },
  {
    name: 'Gracias por tu visita', trigger: 'followup_after', recipient: 'patient', offsetMin: 1440, channel: 'email',
    tplName: 'Seguimiento post-consulta',
    subject: '¿Cómo te sentiste en tu cita?',
    body: 'Hola {{paciente}},\n\ngracias por visitarnos. Esperamos que te hayas sentido muy bien. Si tienes alguna molestia o duda sobre tu tratamiento, responde este correo o escríbenos al {{telefono}}.\n\nTu opinión nos ayuda mucho.',
  },
  {
    name: 'Feliz cumpleaños', trigger: 'birthday', recipient: 'patient', offsetMin: 0, channel: 'email',
    tplName: 'Cumpleaños',
    subject: '¡Feliz cumpleaños, {{paciente}}! 🎂',
    body: 'Hola {{paciente}},\n\nen {{clinica}} te deseamos un día lleno de sonrisas. ¡Feliz cumpleaños!',
  },
];
