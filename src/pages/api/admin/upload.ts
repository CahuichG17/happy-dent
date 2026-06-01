import type { APIRoute } from 'astro';
import { saveUpload } from '../../../lib/uploads';

export const prerender = false;

export const POST: APIRoute = async ({ request }) => {
  const form = await request.formData();
  const file = form.get('file');
  if (!(file instanceof File)) {
    return new Response(JSON.stringify({ error: 'No se recibió archivo' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const result = await saveUpload(file);
  if (!result.ok) {
    return new Response(JSON.stringify({ error: result.error }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  return new Response(JSON.stringify({ url: result.url }), {
    status: 201,
    headers: { 'Content-Type': 'application/json' },
  });
};
