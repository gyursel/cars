import crypto from 'crypto';
import { serverDatabase } from '../../lib/serverDatabase';
import { isRequestAuthenticated, createSessionToken, buildSessionCookie } from '../../lib/auth';
export default async function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store');
  if (req.method !== 'POST') return res.status(405).json({ error: 'Методът не е позволен.' });
  if (!isRequestAuthenticated(req)) return res.status(401).json({ error: 'Необходим е вход.' });
  const password = req.body?.password;
  if (typeof password !== 'string' || password.length < 12 || password.length > 128) return res.status(400).json({ error: 'Паролата трябва да е между 12 и 128 символа.' });
  try {
    const salt = crypto.randomBytes(16).toString('hex');
    const hash = crypto.scryptSync(password, salt, 64).toString('hex');
    // Replaces the legacy plaintext password rather than merging it back in.
    await serverDatabase().collection('settings').doc('admin').set({ passwordHash: hash, passwordSalt: salt });
    res.setHeader('Set-Cookie', buildSessionCookie(createSessionToken()));
    return res.status(200).json({ success: true });
  } catch { return res.status(500).json({ error: 'Неуспешна смяна на паролата.' }); }
}
