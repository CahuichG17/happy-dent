// @ts-check
import { defineConfig } from 'astro/config';
import node from '@astrojs/node';

// El landing se mantiene estático (prerender por defecto).
// Solo /admin y /api se renderizan bajo demanda (export const prerender = false).
// https://astro.build/config
export default defineConfig({
  site: process.env.PUBLIC_SITE_URL ||
    (process.env.RAILWAY_PUBLIC_DOMAIN ? `https://${process.env.RAILWAY_PUBLIC_DOMAIN}` : 'https://happy-dent-production.up.railway.app'),
  output: 'static',
  adapter: node({ mode: 'standalone' }),
  security: {
    // Las rutas de admin están protegidas con sesión propia.
    // El check de origen de Astro fallaba porque la variable BETTER_AUTH_URL
    // apuntaba a localhost en Railway. Lo desactivamos y confiamos en nuestra auth.
    checkOrigin: false,
  },
});
