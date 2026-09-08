import { createSessionToken, buildSessionCookie } from '../../lib/auth';

export default function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, error: 'Методът не е позволен' });
  }

  const adminPassword = process.env.ADMIN_PASSWORD;

  if (!adminPassword) {
    console.error('ADMIN_PASSWORD не е зададена в Environment Variables.');
    return res.status(500).json({ success: false, error: 'Администраторският достъп не е конфигуриран.' });
  }

  try {
    const { password } = req.body || {};

    if (typeof password === 'string' && password === adminPassword) {
      const token = createSessionToken();
      res.setHeader('Set-Cookie', buildSessionCookie(token));
      return res.status(200).json({ success: true });
    }

    return res.status(401).json({ success: false, error: 'Грешна парола!' });
  } catch (error) {
    return res.status(500).json({ success: false, error: 'Сървърна грешка.' });
  }
}
