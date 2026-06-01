import 'dotenv/config';
import { db } from './index';
import {
  doctors,
  services,
  doctorServices,
  testimonials,
  faqs,
  siteSettings,
} from './schema';

const ICONS = {
  general: `<svg viewBox="0 0 48 48" fill="none"><circle cx="24" cy="24" r="20" stroke="currentColor" stroke-width="2"/><path d="M24 14v20M14 24h20" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>`,
  cosmetic: `<svg viewBox="0 0 48 48" fill="none"><path d="M24 6l4 12h12l-10 7 4 13-10-8-10 8 4-13-10-7h12z" stroke="currentColor" stroke-width="2" stroke-linejoin="round"/></svg>`,
  ortho: `<svg viewBox="0 0 48 48" fill="none"><rect x="8" y="12" width="32" height="24" rx="4" stroke="currentColor" stroke-width="2"/><path d="M16 20v8M24 18v12M32 22v6" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>`,
  implant: `<svg viewBox="0 0 48 48" fill="none"><circle cx="24" cy="24" r="8" stroke="currentColor" stroke-width="2"/><path d="M24 8v6M24 34v6M8 24h6M34 24h6M13 13l4.2 4.2M30.8 30.8l4.2 4.2M13 35l4.2-4.2M30.8 17.2L35 13" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>`,
  endo: `<svg viewBox="0 0 48 48" fill="none"><path d="M24 10C18 10 14 16 14 22s6 14 10 18c4-4 10-12 10-18s-4-12-10-12z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>`,
  pediatric: `<svg viewBox="0 0 48 48" fill="none"><path d="M24 8c-4 0-8 4-8 8s4 10 8 16c4-6 8-12 8-16s-4-8-8-8z" stroke="currentColor" stroke-width="2" stroke-linecap="round"/><path d="M16 26c-2-2-5 0-3 6s9 10 11 10 11-4 11-10-1-8-3-6" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>`,
};

async function seed() {
  console.log('🌱 Sembrando datos iniciales…');

  // ── Doctoras (typo corregido: Cyntia → Cynthia) ──
  const insertedDoctors = await db
    .insert(doctors)
    .values([
      {
        slug: 'dra-dafne-mondragon',
        name: 'Dra. Dafne Mondragón',
        specEs: 'Odontología Estética · Ortodoncia',
        specEn: 'Cosmetic Dentistry · Orthodontics',
        bioEs: 'Cirujana Dentista enfocada en diseño de sonrisa, carillas y ortodoncia invisible. Atención meticulosa, cálida y orientada a resultados naturales.',
        bioEn: 'DDS focused on smile design, veneers and clear aligners. Meticulous, warm and results-driven care.',
        initials: 'DM',
        photoUrl: '/dra-dafne-ruby.jpeg',
        order: 0,
      },
      {
        slug: 'dra-cynthia-dzul',
        name: 'Dra. Cynthia Dzul',
        specEs: 'Endodoncia · Odontopediatría',
        specEn: 'Endodontics · Pediatric Dentistry',
        bioEs: 'Especialista en tratamientos de conducto con microscopía y atención dental infantil libre de miedo. Precisión clínica con trato humano.',
        bioEn: 'Specialist in microscope-assisted root canals and fear-free pediatric care. Clinical precision with a human touch.',
        initials: 'CD',
        photoUrl: '/Dra-Cynthia-Dzul.jpeg',
        order: 1,
      },
    ])
    .returning();

  // ── Servicios ──
  const insertedServices = await db
    .insert(services)
    .values([
      {
        slug: 'odontologia-general',
        titleEs: 'Odontología General',
        titleEn: 'General Dentistry',
        descEs: 'Revisiones, limpiezas y cuidado preventivo de alto estándar para mantener tu salud bucal en óptimas condiciones.',
        descEn: 'Check-ups, professional cleanings and preventive care to keep your oral health at its best.',
        icon: ICONS.general,
        featuresEs: ['Limpieza dental', 'Diagnóstico digital', 'Prevención'],
        featuresEn: ['Cleaning', 'Digital diagnosis', 'Prevention'],
        order: 0,
      },
      {
        slug: 'estetica-dental',
        titleEs: 'Estética Dental',
        titleEn: 'Cosmetic Dentistry',
        descEs: 'Blanqueamiento profesional, carillas de porcelana y diseño digital de sonrisa para resultados naturales y deslumbrantes.',
        descEn: 'Professional whitening, porcelain veneers and digital smile design for natural, jaw-dropping results.',
        icon: ICONS.cosmetic,
        featuresEs: ['Blanqueamiento', 'Carillas', 'Diseño digital'],
        featuresEn: ['Whitening', 'Veneers', 'Digital design'],
        order: 1,
      },
      {
        slug: 'ortodoncia-invisalign',
        titleEs: 'Ortodoncia · Invisalign',
        titleEn: 'Orthodontics · Invisalign',
        descEs: 'Brackets estéticos e Invisalign con planeación 3D Itero para alinear tus dientes sin que nadie lo note.',
        descEn: 'Aesthetic braces and Invisalign with 3D Itero planning — straighten your teeth invisibly.',
        icon: ICONS.ortho,
        featuresEs: ['Brackets', 'Invisalign', 'Retenedores'],
        featuresEn: ['Braces', 'Invisalign', 'Retainers'],
        order: 2,
      },
      {
        slug: 'implantes-dentales',
        titleEs: 'Implantes Dentales',
        titleEn: 'Dental Implants',
        descEs: 'Implantes de titanio Straumann® con coronas de zirconio. Resultados permanentes que se ven y sienten naturales.',
        descEn: 'Straumann® titanium implants with zirconia crowns. Permanent results that look and feel natural.',
        icon: ICONS.implant,
        featuresEs: ['Implante + corona', 'Carga inmediata', 'Garantía'],
        featuresEn: ['Implant + crown', 'Same-day load', 'Warranty'],
        order: 3,
      },
      {
        slug: 'endodoncia',
        titleEs: 'Endodoncia',
        titleEn: 'Endodontics',
        descEs: 'Tratamientos de conducto con microscopía y rotatorios de última generación. Sin dolor, sin miedo.',
        descEn: 'Root canal therapy with microscopy and latest-gen rotary tools. Painless, fear-free.',
        icon: ICONS.endo,
        featuresEs: ['Microscopio', 'Sin dolor', '1 sola sesión'],
        featuresEn: ['Microscope', 'Painless', 'Single visit'],
        order: 4,
      },
      {
        slug: 'odontopediatria',
        titleEs: 'Odontopediatría',
        titleEn: 'Pediatric Dentistry',
        descEs: 'Cuidado dental especializado para los más pequeños, en un ambiente divertido y libre de miedos.',
        descEn: 'Specialized dental care for kids in a fun, fear-free environment.',
        icon: ICONS.pediatric,
        featuresEs: ['Niños y bebés', 'Prevención', 'Selladores'],
        featuresEn: ['Kids & babies', 'Prevention', 'Sealants'],
        order: 5,
      },
    ])
    .returning();

  // ── Asignación servicio ↔ doctora ──
  const bySlug = (slug: string) => insertedServices.find((s) => s.slug === slug)!.id;
  const dafne = insertedDoctors[0].id;
  const cynthia = insertedDoctors[1].id;
  await db.insert(doctorServices).values([
    { doctorId: dafne, serviceId: bySlug('odontologia-general') },
    { doctorId: dafne, serviceId: bySlug('estetica-dental') },
    { doctorId: dafne, serviceId: bySlug('ortodoncia-invisalign') },
    { doctorId: dafne, serviceId: bySlug('implantes-dentales') },
    { doctorId: cynthia, serviceId: bySlug('odontologia-general') },
    { doctorId: cynthia, serviceId: bySlug('endodoncia') },
    { doctorId: cynthia, serviceId: bySlug('odontopediatria') },
  ]);

  // ── Testimonios ──
  await db.insert(testimonials).values([
    { name: 'María García López', roleEs: 'Paciente desde 2020', roleEn: 'Patient since 2020', textEs: 'Increíble experiencia. El equipo de Happy Dent me hizo sentir como en casa. Mi sonrisa nunca se había visto tan bien. ¡100% recomendado!', textEn: 'Incredible experience. The Happy Dent team made me feel at home. My smile has never looked better. 100% recommended!', rating: 5, avatar: 'MG', order: 0 },
    { name: 'Carlos Rodríguez', roleEs: 'Paciente desde 2019', roleEn: 'Patient since 2019', textEs: 'Después de años con miedo al dentista, en Happy Dent encontré un lugar donde me siento seguro. La ortodoncia cambió mi vida.', textEn: 'After years of fearing the dentist, at Happy Dent I found a place where I feel safe. Orthodontics changed my life.', rating: 5, avatar: 'CR', order: 1 },
    { name: 'Ana Martínez Ruiz', roleEs: 'Mamá de 2 pacientes', roleEn: 'Mother of 2 patients', textEs: 'Llevé a mis hijos y fue maravilloso. El área de odontopediatría es fantástica, ahora ¡piden ir al dentista!', textEn: 'I brought my kids and it was wonderful. The pediatric area is fantastic — now they ask to visit the dentist!', rating: 5, avatar: 'AM', order: 2 },
    { name: 'Roberto Sánchez', roleEs: 'Paciente desde 2018', roleEn: 'Patient since 2018', textEs: 'Los implantes que me colocaron se ven y se sienten naturales. Tecnología de primer nivel. No podría estar más satisfecho.', textEn: 'My implants look and feel completely natural. Top-tier technology. I couldn\'t be more satisfied.', rating: 5, avatar: 'RS', order: 3 },
    { name: 'Laura Fernández', roleEs: 'Diseño de sonrisa', roleEn: 'Smile design', textEs: 'El blanqueamiento superó todas mis expectativas. Resultado espectacular y proceso muy cómodo. ¡Mi nueva sonrisa me encanta!', textEn: 'Whitening exceeded all my expectations. Spectacular result and very comfortable process. I love my new smile!', rating: 5, avatar: 'LF', order: 4 },
    { name: 'Diego Hernández', roleEs: 'Paciente desde 2021', roleEn: 'Patient since 2021', textEs: 'Profesionalismo, calidez humana y resultados excepcionales. Happy Dent es mi clínica de confianza. Siempre los recomiendo.', textEn: 'Professionalism, warmth and exceptional results. Happy Dent is my trusted clinic. I always recommend them.', rating: 5, avatar: 'DH', order: 5 },
  ]);

  // ── FAQ ──
  await db.insert(faqs).values([
    { qEs: '¿La primera consulta tiene costo?', qEn: 'Is the first consultation free?', aEs: 'La primera valoración es completamente gratuita. Incluye revisión clínica, plan de tratamiento personalizado y cotización transparente.', aEn: 'Your first evaluation is completely free. It includes clinical review, a personalized treatment plan and a transparent quote.', order: 0 },
    { qEs: '¿Aceptan pacientes internacionales?', qEn: 'Do you accept international patients?', aEs: 'Sí. Atendemos en inglés y coordinamos tu agenda con los tiempos de tu viaje. Ofrecemos descuentos especiales por dental tourism.', aEn: 'Yes. We speak fluent English and coordinate your schedule with your travel plans. Special dental tourism rates available.', order: 1 },
    { qEs: '¿Cómo es el proceso de un implante dental?', qEn: 'What is the dental implant process like?', aEs: 'Trabajamos con implantes Straumann® y coronas de zirconio. Iniciamos con un escaneo 3D Itero, seguido de la colocación del implante y la corona definitiva. El plan completo se entrega tras la valoración inicial sin costo.', aEn: 'We use Straumann® implants with zirconia crowns. We start with a 3D Itero scan, followed by implant placement and the final crown. Your full plan is delivered after the free initial evaluation.', order: 2 },
    { qEs: '¿Manejan meses sin intereses?', qEn: 'Do you offer interest-free monthly plans?', aEs: 'Sí. Aceptamos todas las tarjetas de crédito en terminal bancaria con Meses Sin Intereses (MSI) a 3, 6, 9 y 12 meses con bancos participantes.', aEn: 'Yes. We accept all credit cards via our in-clinic bank terminal with Interest-Free Months (MSI) at 3, 6, 9 and 12 months with participating banks.', order: 3 },
    { qEs: '¿Es doloroso un tratamiento de conducto?', qEn: 'Are root canals painful?', aEs: 'No. Trabajamos con microscopio dental y anestesia computarizada — la mayoría de los pacientes reportan no sentir ninguna molestia.', aEn: 'No. We use dental microscopy and computer-assisted anesthesia — most patients report zero discomfort.', order: 4 },
    { qEs: '¿Atienden niños?', qEn: 'Do you treat children?', aEs: '¡Por supuesto! Nuestra área de odontopediatría está diseñada para que los pequeños vivan una experiencia divertida y sin miedo.', aEn: 'Absolutely! Our pediatric area is designed so kids enjoy a fun, fear-free experience.', order: 5 },
    { qEs: '¿Cuánto tarda un diseño de sonrisa?', qEn: 'How long does a smile makeover take?', aEs: 'Entre 2 y 4 visitas dependiendo del caso. Con tecnología 3D Itero previsualizamos el resultado antes de comenzar.', aEn: 'Typically 2-4 visits depending on the case. With 3D Itero we preview your result before starting.', order: 6 },
  ]);

  // ── Configuración del sitio ──
  await db.insert(siteSettings).values([
    { key: 'contact', value: { phone: '+52-998-322-9592', whatsapp: '529983229592', email: 'hola@happydent-cancun.mx' } },
    { key: 'social', value: { facebook: '', instagram: '', tiktok: '', google: '' } },
    { key: 'hours', value: { weekdays: { open: '09:00', close: '18:00' }, saturday: { open: '09:00', close: '14:00' }, sunday: null } },
    { key: 'seo', value: { titleEs: 'Happy Dent Cancún | Dentistas', titleEn: 'Happy Dent Cancún | Dentists', gaId: '', metaPixelId: '', clarityId: '' } },
  ]);

  console.log('✅ Seed completado.');
  process.exit(0);
}

seed().catch((err) => {
  console.error('❌ Error en el seed:', err);
  process.exit(1);
});
