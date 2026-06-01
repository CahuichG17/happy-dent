// @ts-check
import { defineConfig } from 'astro/config';
import node from '@astrojs/node';

// El landing se mantiene estático (prerender por defecto).
// Solo /admin y /api se renderizan bajo demanda (export const prerender = false).
// https://astro.build/config
export default defineConfig({
  site: process.env.PUBLIC_SITE_URL || 'https://happy-dent.example.com',
  output: 'static',
  adapter: node({ mode: 'standalone' }),
});
