// ─────────────────────────────────────────────────────────────
// Lectura de contenido del sitio desde la base de datos.
// Cada helper tiene un *fallback* a los valores originales para que
// el landing NUNCA se rompa si la DB está vacía o no disponible.
// El markup de los componentes se mantiene idéntico.
// ─────────────────────────────────────────────────────────────
import { db } from '../db';
import { doctors, services, testimonials, faqs, videos, siteSettings } from '../db/schema';
import { asc, eq } from 'drizzle-orm';

// ─────────────── Iconos originales de los servicios ───────────────
const SERVICE_ICONS = {
  general: `<svg viewBox="0 0 48 48" fill="none"><circle cx="24" cy="24" r="20" stroke="currentColor" stroke-width="2"/><path d="M24 14v20M14 24h20" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>`,
  cosmetic: `<svg viewBox="0 0 48 48" fill="none"><path d="M24 6l4 12h12l-10 7 4 13-10-8-10 8 4-13-10-7h12z" stroke="currentColor" stroke-width="2" stroke-linejoin="round"/></svg>`,
  ortho: `<svg viewBox="0 0 48 48" fill="none"><rect x="8" y="12" width="32" height="24" rx="4" stroke="currentColor" stroke-width="2"/><path d="M16 20v8M24 18v12M32 22v6" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>`,
  implant: `<svg viewBox="0 0 48 48" fill="none"><circle cx="24" cy="24" r="8" stroke="currentColor" stroke-width="2"/><path d="M24 8v6M24 34v6M8 24h6M34 24h6M13 13l4.2 4.2M30.8 30.8l4.2 4.2M13 35l4.2-4.2M30.8 17.2L35 13" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>`,
  endo: `<svg viewBox="0 0 48 48" fill="none"><path d="M24 10C18 10 14 16 14 22s6 14 10 18c4-4 10-12 10-18s-4-12-10-12z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>`,
  pediatric: `<svg viewBox="0 0 48 48" fill="none"><path d="M24 8c-4 0-8 4-8 8s4 10 8 16c4-6 8-12 8-16s-4-8-8-8z" stroke="currentColor" stroke-width="2" stroke-linecap="round"/><path d="M16 26c-2-2-5 0-3 6s9 10 11 10 11-4 11-10-1-8-3-6" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>`,
};

// ─────────────── Tipos públicos (shape usado por los componentes) ───────────────
export type DoctorVM = {
  name: string;
  spec_es: string;
  spec_en: string;
  bio_es: string;
  bio_en: string;
  photo: string;
};

export type ServiceVM = {
  icon: string;
  title_es: string;
  title_en: string;
  desc_es: string;
  desc_en: string;
  features_es: string[];
  features_en: string[];
};

export type TestimonialVM = {
  name: string;
  role_es: string;
  role_en: string;
  text_es: string;
  text_en: string;
  rating: number;
  avatar: string;
};

export type FaqVM = { q_es: string; q_en: string; a_es: string; a_en: string };

export type VideoVM = { id: string; title: string; platform: string; url: string };

// ─────────────── Fallbacks (contenido original del landing) ───────────────
const FALLBACK_DOCTORS: DoctorVM[] = [
  { name: 'Dra. Dafne Mondragón', spec_es: 'Odontología Estética · Ortodoncia', spec_en: 'Cosmetic Dentistry · Orthodontics', bio_es: 'Cirujana Dentista enfocada en diseño de sonrisa, carillas y ortodoncia invisible. Atención meticulosa, cálida y orientada a resultados naturales.', bio_en: 'DDS focused on smile design, veneers and clear aligners. Meticulous, warm and results-driven care.', photo: 'dra-dafne-ruby.jpeg' },
  { name: 'Dra. Cyntia Dzul', spec_es: 'Endodoncia · Odontopediatría', spec_en: 'Endodontics · Pediatric Dentistry', bio_es: 'Especialista en tratamientos de conducto con microscopía y atención dental infantil libre de miedo. Precisión clínica con trato humano.', bio_en: 'Specialist in microscope-assisted root canals and fear-free pediatric care. Clinical precision with a human touch.', photo: 'Dra-Cynthia-Dzul.jpeg' },
];

const FALLBACK_SERVICES: ServiceVM[] = [
  { icon: SERVICE_ICONS.general, title_es: 'Odontología General', title_en: 'General Dentistry', desc_es: 'Revisiones, limpiezas y cuidado preventivo de alto estándar para mantener tu salud bucal en óptimas condiciones.', desc_en: 'Check-ups, professional cleanings and preventive care to keep your oral health at its best.', features_es: ['Limpieza dental', 'Diagnóstico digital', 'Prevención'], features_en: ['Cleaning', 'Digital diagnosis', 'Prevention'] },
  { icon: SERVICE_ICONS.cosmetic, title_es: 'Estética Dental', title_en: 'Cosmetic Dentistry', desc_es: 'Blanqueamiento profesional, carillas de porcelana y diseño digital de sonrisa para resultados naturales y deslumbrantes.', desc_en: 'Professional whitening, porcelain veneers and digital smile design for natural, jaw-dropping results.', features_es: ['Blanqueamiento', 'Carillas', 'Diseño digital'], features_en: ['Whitening', 'Veneers', 'Digital design'] },
  { icon: SERVICE_ICONS.ortho, title_es: 'Ortodoncia · Invisalign', title_en: 'Orthodontics · Invisalign', desc_es: 'Brackets estéticos e Invisalign con planeación 3D Itero para alinear tus dientes sin que nadie lo note.', desc_en: 'Aesthetic braces and Invisalign with 3D Itero planning — straighten your teeth invisibly.', features_es: ['Brackets', 'Invisalign', 'Retenedores'], features_en: ['Braces', 'Invisalign', 'Retainers'] },
  { icon: SERVICE_ICONS.implant, title_es: 'Implantes Dentales', title_en: 'Dental Implants', desc_es: 'Implantes de titanio Straumann® con coronas de zirconio. Resultados permanentes que se ven y sienten naturales.', desc_en: 'Straumann® titanium implants with zirconia crowns. Permanent results that look and feel natural.', features_es: ['Implante + corona', 'Carga inmediata', 'Garantía'], features_en: ['Implant + crown', 'Same-day load', 'Warranty'] },
  { icon: SERVICE_ICONS.endo, title_es: 'Endodoncia', title_en: 'Endodontics', desc_es: 'Tratamientos de conducto con microscopía y rotatorios de última generación. Sin dolor, sin miedo.', desc_en: 'Root canal therapy with microscopy and latest-gen rotary tools. Painless, fear-free.', features_es: ['Microscopio', 'Sin dolor', '1 sola sesión'], features_en: ['Microscope', 'Painless', 'Single visit'] },
  { icon: SERVICE_ICONS.pediatric, title_es: 'Odontopediatría', title_en: 'Pediatric Dentistry', desc_es: 'Cuidado dental especializado para los más pequeños, en un ambiente divertido y libre de miedos.', desc_en: 'Specialized dental care for kids in a fun, fear-free environment.', features_es: ['Niños y bebés', 'Prevención', 'Selladores'], features_en: ['Kids & babies', 'Prevention', 'Sealants'] },
];

const FALLBACK_TESTIMONIALS: TestimonialVM[] = [
  { name: 'María García López', role_es: 'Paciente desde 2020', role_en: 'Patient since 2020', text_es: 'Increíble experiencia. El equipo de Happy Dent me hizo sentir como en casa. Mi sonrisa nunca se había visto tan bien. ¡100% recomendado!', text_en: 'Incredible experience. The Happy Dent team made me feel at home. My smile has never looked better. 100% recommended!', rating: 5, avatar: 'MG' },
  { name: 'Carlos Rodríguez', role_es: 'Paciente desde 2019', role_en: 'Patient since 2019', text_es: 'Después de años con miedo al dentista, en Happy Dent encontré un lugar donde me siento seguro. La ortodoncia cambió mi vida.', text_en: 'After years of fearing the dentist, at Happy Dent I found a place where I feel safe. Orthodontics changed my life.', rating: 5, avatar: 'CR' },
  { name: 'Ana Martínez Ruiz', role_es: 'Mamá de 2 pacientes', role_en: 'Mother of 2 patients', text_es: 'Llevé a mis hijos y fue maravilloso. El área de odontopediatría es fantástica, ahora ¡piden ir al dentista!', text_en: 'I brought my kids and it was wonderful. The pediatric area is fantastic — now they ask to visit the dentist!', rating: 5, avatar: 'AM' },
  { name: 'Roberto Sánchez', role_es: 'Paciente desde 2018', role_en: 'Patient since 2018', text_es: 'Los implantes que me colocaron se ven y se sienten naturales. Tecnología de primer nivel. No podría estar más satisfecho.', text_en: 'My implants look and feel completely natural. Top-tier technology. I couldn\'t be more satisfied.', rating: 5, avatar: 'RS' },
  { name: 'Laura Fernández', role_es: 'Diseño de sonrisa', role_en: 'Smile design', text_es: 'El blanqueamiento superó todas mis expectativas. Resultado espectacular y proceso muy cómodo. ¡Mi nueva sonrisa me encanta!', text_en: 'Whitening exceeded all my expectations. Spectacular result and very comfortable process. I love my new smile!', rating: 5, avatar: 'LF' },
  { name: 'Diego Hernández', role_es: 'Paciente desde 2021', role_en: 'Patient since 2021', text_es: 'Profesionalismo, calidez humana y resultados excepcionales. Happy Dent es mi clínica de confianza. Siempre los recomiendo.', text_en: 'Professionalism, warmth and exceptional results. Happy Dent is my trusted clinic. I always recommend them.', rating: 5, avatar: 'DH' },
];

const FALLBACK_FAQS: FaqVM[] = [
  { q_es: '¿La primera consulta tiene costo?', q_en: 'Is the first consultation free?', a_es: 'La primera valoración es completamente gratuita. Incluye revisión clínica, plan de tratamiento personalizado y cotización transparente.', a_en: 'Your first evaluation is completely free. It includes clinical review, a personalized treatment plan and a transparent quote.' },
  { q_es: '¿Aceptan pacientes internacionales?', q_en: 'Do you accept international patients?', a_es: 'Sí. Atendemos en inglés y coordinamos tu agenda con los tiempos de tu viaje. Ofrecemos descuentos especiales por dental tourism.', a_en: 'Yes. We speak fluent English and coordinate your schedule with your travel plans. Special dental tourism rates available.' },
  { q_es: '¿Cómo es el proceso de un implante dental?', q_en: 'What is the dental implant process like?', a_es: 'Trabajamos con implantes Straumann® y coronas de zirconio. Iniciamos con un escaneo 3D Itero, seguido de la colocación del implante y la corona definitiva. El plan completo se entrega tras la valoración inicial sin costo.', a_en: 'We use Straumann® implants with zirconia crowns. We start with a 3D Itero scan, followed by implant placement and the final crown. Your full plan is delivered after the free initial evaluation.' },
  { q_es: '¿Manejan meses sin intereses?', q_en: 'Do you offer interest-free monthly plans?', a_es: 'Sí. Aceptamos todas las tarjetas de crédito en terminal bancaria con Meses Sin Intereses (MSI) a 3, 6, 9 y 12 meses con bancos participantes.', a_en: 'Yes. We accept all credit cards via our in-clinic bank terminal with Interest-Free Months (MSI) at 3, 6, 9 and 12 months with participating banks.' },
  { q_es: '¿Es doloroso un tratamiento de conducto?', q_en: 'Are root canals painful?', a_es: 'No. Trabajamos con microscopio dental y anestesia computarizada — la mayoría de los pacientes reportan no sentir ninguna molestia.', a_en: 'No. We use dental microscopy and computer-assisted anesthesia — most patients report zero discomfort.' },
  { q_es: '¿Atienden niños?', q_en: 'Do you treat children?', a_es: '¡Por supuesto! Nuestra área de odontopediatría está diseñada para que los pequeños vivan una experiencia divertida y sin miedo.', a_en: 'Absolutely! Our pediatric area is designed so kids enjoy a fun, fear-free experience.' },
  { q_es: '¿Cuánto tarda un diseño de sonrisa?', q_en: 'How long does a smile makeover take?', a_es: 'Entre 2 y 4 visitas dependiendo del caso. Con tecnología 3D Itero previsualizamos el resultado antes de comenzar.', a_en: 'Typically 2-4 visits depending on the case. With 3D Itero we preview your result before starting.' },
];

// ─────────────── Visibilidad de secciones ───────────────
export type Sections = Record<string, boolean>;
export const SECTION_KEYS = [
  'stats', 'servicios', 'beforeafter', 'nosotros', 'testimonios',
  'video', 'insurance', 'faq', 'tourism', 'agenda', 'contacto', 'mapa',
] as const;
const DEFAULT_SECTIONS: Sections = Object.fromEntries(SECTION_KEYS.map((k) => [k, true]));

// ─────────────── Utilidades ───────────────
function stripSlash(url: string | null | undefined): string {
  if (!url) return '';
  return url.replace(/^\//, '');
}

function youtubeId(url: string): string {
  const m = url.match(/(?:youtu\.be\/|v=|embed\/|shorts\/)([\w-]{6,})/);
  return m ? m[1] : url;
}

// ─────────────── Helpers de lectura ───────────────
export async function getDoctors(): Promise<DoctorVM[]> {
  try {
    const rows = await db.select().from(doctors).where(eq(doctors.active, true)).orderBy(asc(doctors.order), asc(doctors.id));
    if (!rows.length) return FALLBACK_DOCTORS;
    return rows.map((d) => ({
      name: d.name,
      spec_es: d.specEs,
      spec_en: d.specEn,
      bio_es: d.bioEs,
      bio_en: d.bioEn,
      photo: stripSlash(d.photoUrl),
    }));
  } catch {
    return FALLBACK_DOCTORS;
  }
}

export async function getServices(): Promise<ServiceVM[]> {
  try {
    const rows = await db.select().from(services).where(eq(services.active, true)).orderBy(asc(services.order), asc(services.id));
    if (!rows.length) return FALLBACK_SERVICES;
    return rows.map((s) => ({
      icon: s.icon ?? '',
      title_es: s.titleEs,
      title_en: s.titleEn,
      desc_es: s.descEs,
      desc_en: s.descEn,
      features_es: s.featuresEs ?? [],
      features_en: s.featuresEn ?? [],
    }));
  } catch {
    return FALLBACK_SERVICES;
  }
}

export async function getTestimonials(): Promise<TestimonialVM[]> {
  try {
    const rows = await db.select().from(testimonials).where(eq(testimonials.approved, true)).orderBy(asc(testimonials.order), asc(testimonials.id));
    if (!rows.length) return FALLBACK_TESTIMONIALS;
    return rows.map((t) => ({
      name: t.name,
      role_es: t.roleEs,
      role_en: t.roleEn,
      text_es: t.textEs,
      text_en: t.textEn,
      rating: t.rating,
      avatar: t.avatar ?? '',
    }));
  } catch {
    return FALLBACK_TESTIMONIALS;
  }
}

export async function getFaqs(): Promise<FaqVM[]> {
  try {
    const rows = await db.select().from(faqs).where(eq(faqs.active, true)).orderBy(asc(faqs.order), asc(faqs.id));
    if (!rows.length) return FALLBACK_FAQS;
    return rows.map((f) => ({ q_es: f.qEs, q_en: f.qEn, a_es: f.aEs, a_en: f.aEn }));
  } catch {
    return FALLBACK_FAQS;
  }
}

export async function getVideos(): Promise<VideoVM[]> {
  try {
    const rows = await db.select().from(videos).where(eq(videos.active, true)).orderBy(asc(videos.order), asc(videos.id));
    return rows.map((v) => ({ id: youtubeId(v.url), title: v.title, platform: v.platform, url: v.url }));
  } catch {
    return [];
  }
}

export async function getSections(): Promise<Sections> {
  try {
    const rows = await db.select().from(siteSettings).where(eq(siteSettings.key, 'sections')).limit(1);
    if (!rows.length) return DEFAULT_SECTIONS;
    const stored = rows[0].value as Sections;
    return { ...DEFAULT_SECTIONS, ...stored };
  } catch {
    return DEFAULT_SECTIONS;
  }
}

// ─────────────── Configuración del sitio ───────────────
export type SiteConfig = {
  phone: string;
  whatsapp: string;
  email: string;
  address: string;
  facebook: string;
  instagram: string;
  tiktok: string;
  ga4: string;
  metaPixel: string;
  clarity: string;
};

// Valores por defecto = lo que hoy está en el landing (no cambia nada visualmente).
export const DEFAULT_CONFIG: SiteConfig = {
  phone: '+529983229592',
  whatsapp: '529983229592',
  email: 'hola@happydent-cancun.mx',
  address: 'Torre Métropoli, Cancún, Q. Roo',
  facebook: '',
  instagram: '',
  tiktok: '',
  ga4: '',
  metaPixel: '',
  clarity: '',
};

export async function getConfig(): Promise<SiteConfig> {
  try {
    const rows = await db.select().from(siteSettings).where(eq(siteSettings.key, 'config')).limit(1);
    if (!rows.length) return DEFAULT_CONFIG;
    const stored = rows[0].value as Partial<SiteConfig>;
    return { ...DEFAULT_CONFIG, ...stored };
  } catch {
    return DEFAULT_CONFIG;
  }
}
