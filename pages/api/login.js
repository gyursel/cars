import crypto from 'crypto';
import { serverDatabase } from '../../lib/serverDatabase';
import { createSessionToken, buildSessionCookie } from '../../lib/auth';
const attempts = new Map();
function equal(a, b) {
  const aa = crypto.createHash('sha256').update(a).digest();
  const bb = crypto.createHash('sha256').update(b).digest();
  return crypto.timingSafeEqual(aa, bb);
}
export default async function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store');
  if (req.method !== 'POST') return res.status(405).json({ error: 'Методът не е позволен.' });
  if (!process.env.SESSION_SECRET || process.env.SESSION_SECRET.length < 32) return res.status(503).json({ error: 'Администраторският достъп изисква SESSION_SECRET (поне 32 символа) на сървъра.' });
  const ip = String(req.headers['x-forwarded-for'] || req.socket.remoteAddress || '').split(',')[0].trim();
  const now = Date.now();
  for (const [key, item] of attempts) if (item.until < now) attempts.delete(key);
  const attempt = attempts.get(ip) || { count: 0, until: now + 15 * 60 * 1000 };
  if (attempt.count >= 10) { res.setHeader('Retry-After', '900'); return res.status(429).json({ error: 'Твърде много опити. Опитай след 15 минути.' }); }
  const password = req.body?.password;
  if (typeof password !== 'string' || password.length > 128) return res.status(400).json({ error: 'Невалидна парола.' });
  attempt.count++; attempts.set(ip, attempt);
  try {
    const snap = await serverDatabase().collection('settings').doc('admin').get();
    const data = snap.exists ? snap.data() : {};
    let valid = false;
    if (data.passwordHash && data.passwordSalt) valid = equal(crypto.scryptSync(password, data.passwordSalt, 64).toString('hex'), data.passwordHash);
    else if (process.env.ADMIN_PASSWORD) valid = equal(password, process.env.ADMIN_PASSWORD);
    else return res.status(503).json({ error: 'Задай ADMIN_PASSWORD на сървъра, за да активираш администрацията.' });
    if (!valid) return res.status(401).json({ error: 'Грешна парола.' });
    attempts.delete(ip);
    res.setHeader('Set-Cookie', buildSessionCookie(createSessionToken()));
    return res.status(200).json({ success: true });
  } catch { return res.status(503).json({ error: 'Неуспешна връзка с администрацията. Опитай отново.' }); }
}
