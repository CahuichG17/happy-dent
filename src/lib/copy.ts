// ─────────────────────────────────────────────────────────────
// Textos editables del sitio ("copy").
// TODO el texto estructural del landing (títulos de sección,
// etiquetas, botones, hero, footer, etc.) vive aquí con su valor
// por defecto = exactamente lo que hoy muestra el sitio.
// El admin puede sobrescribir cualquiera desde /admin/textos
// (se guarda en site_settings key 'copy'). Si la DB está vacía o
// caída, se usan estos valores por defecto y el landing NUNCA cambia.
// ─────────────────────────────────────────────────────────────
import { db } from '../db';
import { siteSettings } from '../db/schema';
import { eq } from 'drizzle-orm';

export type CopyItem = {
  key: string;
  label: string;
  es: string;
  en: string;
  multiline?: boolean;
  html?: boolean; // permite <br/> o markup inline (se renderiza con set:html)
};
export type CopyGroup = { id: string; title: string; items: CopyItem[] };

export const COPY_SCHEMA: CopyGroup[] = [
  {
    id: 'nav',
    title: 'Barra de navegación',
    items: [
      { key: 'nav.tagline', label: 'Lema bajo el logo', es: 'ODONTOLOGÍA · CANCÚN', en: 'DENTISTRY · CANCÚN' },
      { key: 'nav.home', label: 'Menú: Inicio', es: 'Inicio', en: 'Home' },
      { key: 'nav.services', label: 'Menú: Servicios', es: 'Servicios', en: 'Services' },
      { key: 'nav.about', label: 'Menú: Nosotros', es: 'Nosotros', en: 'About' },
      { key: 'nav.international', label: 'Menú: Internacional', es: 'Internacional', en: 'International' },
      { key: 'nav.contact', label: 'Menú: Contacto', es: 'Contacto', en: 'Contact' },
      { key: 'nav.book', label: 'Botón Agendar', es: 'Agendar', en: 'Book' },
    ],
  },
  {
    id: 'hero',
    title: 'Portada (Hero)',
    items: [
      { key: 'hero.badge', label: 'Insignia superior', es: 'Dra. Dafne Mondragón · Dra. Cyntia Dzul', en: 'Dr. Dafne Mondragón · Dr. Cyntia Dzul' },
      { key: 'hero.title1', label: 'Título línea 1', es: 'Tu sonrisa,', en: 'Your smile,' },
      { key: 'hero.title2', label: 'Título línea 2 (resaltado)', html: true, es: 'nuestra <span class="highlight">obsesión</span>.', en: 'our <span class="highlight">obsession</span>.' },
      { key: 'hero.description', label: 'Descripción', multiline: true, es: 'Odontología estética premium en Cancún. Diseño de sonrisa, implantes de carga inmediata e Invisalign — con la calidez de un consultorio boutique y la precisión de la tecnología más avanzada del Caribe Mexicano.', en: 'Premium cosmetic dentistry in Cancún. Smile design, same-day implants and Invisalign — delivered in a boutique clinic with world-class technology.' },
      { key: 'hero.cta', label: 'Botón principal', es: 'Agendar mi cita', en: 'Book my visit' },
      { key: 'hero.stat1', label: 'Stat 1', es: 'Sonrisas felices', en: 'Happy smiles' },
      { key: 'hero.stat2', label: 'Stat 2', es: 'Años de práctica', en: 'Years of practice' },
      { key: 'hero.stat3', label: 'Stat 3', es: 'en Google', en: 'on Google' },
      { key: 'hero.card1_title', label: 'Tarjeta 1 título', es: 'Diseño de sonrisa', en: 'Smile design' },
      { key: 'hero.card1_sub', label: 'Tarjeta 1 detalle', es: 'Tecnología 3D', en: '3D technology' },
      { key: 'hero.card2_title', label: 'Tarjeta 2 título', es: 'Calificación', en: 'Rating' },
      { key: 'hero.card3_title', label: 'Tarjeta 3 título', es: 'Tecnología', en: 'Technology' },
      { key: 'hero.card3_sub', label: 'Tarjeta 3 detalle', es: 'Escáner 3D Itero', en: '3D Itero scanner' },
      { key: 'hero.scroll', label: 'Indicador de scroll', es: 'Comienza a explorar', en: 'Start exploring' },
    ],
  },
  {
    id: 'stats',
    title: 'Cifras',
    items: [
      { key: 'stats.s1', label: 'Cifra 1', es: 'Pacientes felices', en: 'Happy patients' },
      { key: 'stats.s2', label: 'Cifra 2', es: 'Años de experiencia', en: 'Years of experience' },
      { key: 'stats.s3', label: 'Cifra 3', es: 'en Google Reviews', en: 'on Google Reviews' },
      { key: 'stats.s4', label: 'Cifra 4', es: 'Tratamientos disponibles', en: 'Treatments available' },
    ],
  },
  {
    id: 'services',
    title: 'Servicios (encabezado)',
    items: [
      { key: 'services.tag', label: 'Etiqueta', es: 'Nuestros Servicios', en: 'Our Services' },
      { key: 'services.title', label: 'Título', html: true, es: 'Tratamientos de<br/>excelencia dental', en: 'Treatments crafted<br/>with precision' },
      { key: 'services.subtitle', label: 'Subtítulo', multiline: true, es: 'Tecnología de punta, especialistas certificados y un consultorio diseñado para que vuelvas siempre con una sonrisa.', en: 'Cutting-edge technology, board-certified specialists and a clinic designed to make you smile every visit.' },
      { key: 'services.cta', label: 'Botón de tarjeta', es: 'Solicitar información', en: 'Request info' },
    ],
  },
  {
    id: 'beforeafter',
    title: 'Antes y después',
    items: [
      { key: 'ba.tag', label: 'Etiqueta', es: 'Resultados Reales', en: 'Real Results' },
      { key: 'ba.title', label: 'Título', html: true, es: 'Antes &amp; después', en: 'Before &amp; after' },
      { key: 'ba.subtitle', label: 'Subtítulo', multiline: true, es: 'Casos reales documentados en consulta — desliza el control para ver la transformación.', en: 'Real cases documented in our clinic — drag the slider to see the transformation.' },
    ],
  },
  {
    id: 'about',
    title: 'Nosotros',
    items: [
      { key: 'about.tag', label: 'Etiqueta', es: 'Conoce al equipo', en: 'Meet the team' },
      { key: 'about.title', label: 'Título', html: true, es: 'Las doctoras detrás<br/>de tu sonrisa', en: 'The doctors behind<br/>your smile' },
      { key: 'about.subtitle', label: 'Subtítulo', multiline: true, es: 'Happy Dent es un consultorio boutique en Cancún donde dos especialistas combinan tecnología de punta, ética profesional y un trato cálido para entregarte resultados naturales.', en: 'Happy Dent is a boutique clinic in Cancún where two specialists combine cutting-edge technology, professional ethics and a warm approach to deliver natural results.' },
      { key: 'about.credential', label: 'Credencial bajo doctora', es: 'Cédula Profesional SEP registrada', en: 'Licensed professional (SEP, Mexico)' },
      { key: 'about.f1_title', label: 'Beneficio 1 título', es: 'Escáner Itero 3D', en: 'Itero 3D scanner' },
      { key: 'about.f1_sub', label: 'Beneficio 1 detalle', es: 'Sin moldes incómodos. Previsualizamos tu sonrisa.', en: 'No uncomfortable molds. We preview your smile.' },
      { key: 'about.f2_title', label: 'Beneficio 2 título', es: 'Atención humana', en: 'Human-first care' },
      { key: 'about.f2_sub', label: 'Beneficio 2 detalle', es: 'Plan personalizado para cada paciente.', en: 'Personalized plan for every patient.' },
      { key: 'about.f3_title', label: 'Beneficio 3 título', es: 'Horarios flexibles', en: 'Flexible hours' },
      { key: 'about.f3_sub', label: 'Beneficio 3 detalle', es: 'Lun-Vie 9-18 · Sáb 9-14', en: 'Mon-Fri 9-18 · Sat 9-14' },
      { key: 'about.f4_title', label: 'Beneficio 4 título', es: 'Bioseguridad', en: 'Biosafety' },
      { key: 'about.f4_sub', label: 'Beneficio 4 detalle', es: 'Esterilización autoclave clase B.', en: 'Class B autoclave sterilization.' },
      { key: 'about.cert_label', label: 'Etiqueta certificaciones', html: true, es: 'Certificaciones &amp; alianzas', en: 'Certifications &amp; partners' },
      { key: 'about.cert_adm', label: 'Certificación ADM', es: 'Asociación Dental Mexicana', en: 'Mexican Dental Association' },
      { key: 'about.cert_invisalign', label: 'Certificación Invisalign', es: 'Provider certificado', en: 'Certified provider' },
      { key: 'about.cert_straumann', label: 'Certificación Straumann', es: 'Implantes certificados', en: 'Certified implants' },
      { key: 'about.cta', label: 'Botón', es: 'Agenda una valoración', en: 'Book a consultation' },
    ],
  },
  {
    id: 'testimonials',
    title: 'Testimonios (encabezado)',
    items: [
      { key: 't.tag', label: 'Etiqueta', es: 'Testimonios', en: 'Testimonials' },
      { key: 't.title', label: 'Título', html: true, es: 'Lo que dicen nuestros<br/>pacientes felices', en: 'What our<br/>happy patients say' },
      { key: 't.subtitle', label: 'Subtítulo', multiline: true, es: 'Cientos de sonrisas transformadas. Reseñas verificadas en Google con 4.9 ★ promedio.', en: 'Hundreds of transformed smiles. Verified Google reviews averaging 4.9 ★.' },
      { key: 't.reviews_word', label: 'Palabra "reseñas"', es: 'reseñas', en: 'reviews' },
    ],
  },
  {
    id: 'video',
    title: 'Video',
    items: [
      { key: 'video.tag', label: 'Etiqueta', es: 'Conoce el consultorio', en: 'Inside the clinic' },
      { key: 'video.title', label: 'Título', html: true, es: 'Un recorrido por<br/>Happy Dent', en: 'Take a tour of<br/>Happy Dent' },
    ],
  },
  {
    id: 'insurance',
    title: 'Seguros y pagos',
    items: [
      { key: 'ins.tag', label: 'Etiqueta', html: true, es: 'Pagos y convenios', en: 'Payments &amp; insurance' },
      { key: 'ins.title', label: 'Título', html: true, es: 'Aceptamos los<br/>principales seguros', en: 'We accept major<br/>insurance plans' },
      { key: 'ins.subtitle', label: 'Subtítulo', multiline: true, es: 'Facturamos directo a aseguradoras nacionales e internacionales. Solicita tu reembolso sin complicaciones.', en: 'We bill national and international carriers directly. Hassle-free reimbursements.' },
      { key: 'ins.banner_title', label: 'Banner título', es: 'Terminal bancaria en consultorio', en: 'In-clinic bank terminal' },
      { key: 'ins.banner_text', label: 'Banner texto', html: true, multiline: true, es: 'Tarjetas de crédito y débito + Meses Sin Intereses (MSI) con bancos participantes.', en: 'Credit &amp; debit cards + Interest-Free Months (MSI) with participating banks.' },
    ],
  },
  {
    id: 'faq',
    title: 'Preguntas frecuentes (encabezado)',
    items: [
      { key: 'faq.tag', label: 'Etiqueta', es: 'Preguntas frecuentes', en: 'Frequently asked' },
      { key: 'faq.title', label: 'Título', html: true, es: 'Resolvemos<br/>tus dudas', en: 'Answers to<br/>your questions' },
    ],
  },
  {
    id: 'tourism',
    title: 'Turismo dental',
    items: [
      { key: 'tour.tag', label: 'Etiqueta', es: 'Turismo dental', en: 'Dental Tourism' },
      { key: 'tour.title', label: 'Título', html: true, es: 'Tu sonrisa nueva +<br/>el Caribe Mexicano', en: 'A new smile +<br/>the Mexican Caribbean' },
      { key: 'tour.subtitle', label: 'Subtítulo', multiline: true, es: 'Combina tratamiento de clase mundial con vacaciones inolvidables. Atención bilingüe, traslado del hotel y agenda flexible para visitantes.', en: 'Combine world-class dental work with an unforgettable vacation. Bilingual care, hotel pickup and flexible scheduling for travelers.' },
      { key: 'tour.i1_title', label: 'Incluye 1 título', es: 'Recogida en hotel', en: 'Hotel pickup' },
      { key: 'tour.i1_sub', label: 'Incluye 1 detalle', es: 'Cancún, Playa del Carmen y Tulum', en: 'Cancún, Playa del Carmen & Tulum' },
      { key: 'tour.i2_title', label: 'Incluye 2 título', es: 'Cotización en 24h', en: '24h quote' },
      { key: 'tour.i2_sub', label: 'Incluye 2 detalle', es: 'Envíanos tu rayografía y obtén plan completo.', en: 'Send us your X-ray for a full treatment plan.' },
      { key: 'tour.i3_title', label: 'Incluye 3 título', es: 'Bilingüe', en: 'Fully bilingual' },
      { key: 'tour.i3_sub', label: 'Incluye 3 detalle', es: 'Español e inglés fluido.', en: 'Spanish & fluent English.' },
      { key: 'tour.i4_title', label: 'Incluye 4 título', es: 'Hoteles aliados', en: 'Partner hotels' },
      { key: 'tour.i4_sub', label: 'Incluye 4 detalle', es: 'Tarifas especiales en hoteles boutique.', en: 'Special rates at boutique hotels.' },
      { key: 'tour.reviews_title', label: 'Título reseñas intl.', es: 'Lo que dicen pacientes internacionales', en: 'What international patients say' },
      { key: 'tour.cta', label: 'Botón', es: 'Pedir cotización internacional', en: 'Get my international quote' },
    ],
  },
  {
    id: 'contact',
    title: 'Contacto',
    items: [
      { key: 'contact.tag', label: 'Etiqueta', es: 'Contacto', en: 'Contact' },
      { key: 'contact.title', label: 'Título', html: true, es: '¿Listo para sonreír?<br/>Hablemos hoy', en: 'Ready to smile?<br/>Let\'s talk today' },
      { key: 'contact.text', label: 'Texto', multiline: true, es: 'Agenda por WhatsApp, llámanos directo o visítanos en nuestro consultorio en Cancún.', en: 'Book by WhatsApp, call us directly or visit our Cancún office.' },
      { key: 'contact.wa_note', label: 'WhatsApp nota', es: 'Respuesta inmediata en horario', en: 'Instant reply during business hours' },
      { key: 'contact.phone_label', label: 'Teléfono etiqueta', es: 'Llámanos', en: 'Call us' },
      { key: 'contact.phone_note', label: 'Teléfono nota', es: 'Atención directa con el equipo', en: 'Direct line to our team' },
      { key: 'contact.email_note', label: 'E-mail nota', es: 'Respondemos en menos de 24h', en: 'We reply within 24h' },
      { key: 'contact.card_title', label: 'Tarjeta título', es: 'Primera consulta', en: 'First consultation' },
      { key: 'contact.card_free', label: 'Tarjeta destacado', es: 'GRATIS', en: 'FREE' },
      { key: 'contact.card_text', label: 'Tarjeta texto', multiline: true, es: 'Valoración completa, plan de tratamiento y cotización transparente — sin compromiso.', en: 'Full evaluation, treatment plan and transparent quote — no commitment.' },
      { key: 'contact.card_cta', label: 'Tarjeta botón', es: 'Agendar ahora', en: 'Book now' },
    ],
  },
  {
    id: 'map',
    title: 'Ubicación / Mapa',
    items: [
      { key: 'map.tag', label: 'Etiqueta', es: 'Visítanos', en: 'Visit us' },
      { key: 'map.title', label: 'Título', html: true, es: 'En Torre Métropoli,<br/>corazón de Cancún', en: 'In Torre Métropoli,<br/>heart of Cancún' },
      { key: 'map.address_label', label: 'Dirección etiqueta', es: 'Dirección', en: 'Address' },
      { key: 'map.phone_label', label: 'Teléfono etiqueta', es: 'Teléfono', en: 'Phone' },
      { key: 'map.hours_label', label: 'Horarios etiqueta', es: 'Horarios', en: 'Hours' },
      { key: 'map.hours_value', label: 'Horarios valor', es: 'Lun-Vie 9:00-18:00 · Sáb 9:00-14:00', en: 'Mon-Fri 9-18 · Sat 9-14' },
      { key: 'map.directions', label: 'Botón cómo llegar', es: 'Cómo llegar', en: 'Get directions' },
      { key: 'map.open', label: 'Botón ver en Google', es: 'Ver en Google', en: 'Open in Google' },
    ],
  },
  {
    id: 'appointment',
    title: 'Formulario de cita (encabezado)',
    items: [
      { key: 'appt.tag', label: 'Etiqueta', es: 'Agenda tu cita', en: 'Book your visit' },
      { key: 'appt.title', label: 'Título', html: true, es: 'Primera consulta<br/><span class="highlight">gratuita</span>', en: 'First consultation<br/><span class="highlight">on us</span>' },
      { key: 'appt.subtitle', label: 'Subtítulo', multiline: true, es: 'Compártenos algunos datos y abriremos WhatsApp con tu solicitud lista para enviar a la doctora.', en: 'Share a few details and we\'ll open WhatsApp with your request pre-filled for the doctor.' },
    ],
  },
  {
    id: 'footer',
    title: 'Pie de página',
    items: [
      { key: 'footer.tagline', label: 'Lema bajo el logo', es: 'ODONTOLOGÍA · CANCÚN', en: 'DENTISTRY · CANCÚN' },
      { key: 'footer.desc', label: 'Descripción', multiline: true, es: 'Tu sonrisa, nuestra obsesión. Odontología de clase mundial en el corazón del Caribe Mexicano.', en: 'Your smile, our obsession. World-class dentistry in the heart of the Mexican Caribbean.' },
      { key: 'footer.col_services', label: 'Columna Servicios', es: 'Servicios', en: 'Services' },
      { key: 'footer.s1', label: 'Servicio 1', es: 'Odontología General', en: 'General Dentistry' },
      { key: 'footer.s2', label: 'Servicio 2', html: true, es: 'Estética &amp; Carillas', en: 'Cosmetic &amp; Veneers' },
      { key: 'footer.s3', label: 'Servicio 3', html: true, es: 'Ortodoncia &amp; Invisalign', en: 'Ortho &amp; Invisalign' },
      { key: 'footer.s4', label: 'Servicio 4', es: 'Implantes Dentales', en: 'Dental Implants' },
      { key: 'footer.s5', label: 'Servicio 5', es: 'Odontopediatría', en: 'Pediatric Dentistry' },
      { key: 'footer.col_clinic', label: 'Columna Clínica', es: 'Clínica', en: 'Clinic' },
      { key: 'footer.c1', label: 'Clínica 1', es: 'Nuestras doctoras', en: 'Our doctors' },
      { key: 'footer.c4', label: 'Clínica: seguros', es: 'Seguros aceptados', en: 'Accepted insurance' },
      { key: 'footer.c5', label: 'Clínica: agendar', es: 'Agendar cita', en: 'Book appointment' },
      { key: 'footer.col_contact', label: 'Columna Contacto', es: 'Contacto', en: 'Contact' },
      { key: 'footer.license', label: 'Aviso de cédulas', es: 'Cédulas Profesionales SEP registradas', en: 'Licensed by SEP México' },
      { key: 'footer.made1', label: 'Hecho con… (1)', es: 'Hecho con', en: 'Made with' },
      { key: 'footer.made2', label: 'Hecho con… (2)', es: 'para tu sonrisa', en: 'for your smile' },
    ],
  },
  {
    id: 'whatsapp',
    title: 'Botón flotante WhatsApp',
    items: [
      { key: 'wa.tooltip', label: 'Tooltip', es: '¡Hablemos por WhatsApp!', en: 'Let\'s chat on WhatsApp!' },
    ],
  },
];

export type CopyMap = Record<string, { es: string; en: string }>;

export const DEFAULT_COPY: CopyMap = Object.fromEntries(
  COPY_SCHEMA.flatMap((g) => g.items.map((i) => [i.key, { es: i.es, en: i.en }])),
);

/**
 * Devuelve el mapa de textos: valores por defecto sobrescritos por
 * lo guardado en la DB (site_settings key 'copy'). Siempre incluye
 * todas las llaves para que los componentes nunca obtengan undefined.
 */
export async function getCopy(): Promise<CopyMap> {
  try {
    const rows = await db.select().from(siteSettings).where(eq(siteSettings.key, 'copy')).limit(1);
    const stored = (rows[0]?.value ?? {}) as CopyMap;
    const merged: CopyMap = {};
    for (const k of Object.keys(DEFAULT_COPY)) {
      merged[k] = {
        es: stored[k]?.es ?? DEFAULT_COPY[k].es,
        en: stored[k]?.en ?? DEFAULT_COPY[k].en,
      };
    }
    return merged;
  } catch {
    return DEFAULT_COPY;
  }
}
