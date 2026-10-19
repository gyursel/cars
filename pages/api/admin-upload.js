import { createClient } from '@supabase/supabase-js';
import crypto from 'crypto';
import { isRequestAuthenticated } from '../../lib/auth';
const types = { 'image/jpeg': 'jpg', 'image/png': 'png', 'image/webp': 'webp', 'image/avif': 'avif', 'video/mp4': 'mp4', 'video/quicktime': 'mov' };
export default async function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store');
  if (req.method !== 'POST') return res.status(405).json({ error: 'Методът не е позволен.' });
  if (!isRequestAuthenticated(req)) return res.status(401).json({ error: 'Влез отново в администрацията.' });
  const { type, size } = req.body || {};
  if (!types[type] || !Number.isInteger(size) || size < 1 || size > 20 * 1024 * 1024) return res.status(400).json({ error: 'Неподдържан файл или размер над 20 MB.' });
  if (!process.env.SUPABASE_SERVICE_ROLE_KEY) return res.status(503).json({ error: 'Качването изисква сървърна настройка SUPABASE_SERVICE_ROLE_KEY.' });
  try {
    const client = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://wyzlvhjdghoiqrymkues.supabase.co', process.env.SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false } });
    const path = `apex/${crypto.randomUUID()}.${types[type]}`;
    const { data, error } = await client.storage.from('vehicles').createSignedUploadUrl(path);
    if (error) throw error;
    return res.status(200).json({ path, token: data.token, publicUrl: client.storage.from('vehicles').getPublicUrl(path).data.publicUrl });
  } catch { return res.status(500).json({ error: 'Неуспешна подготовка на качването.' }); }
}
