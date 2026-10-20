import { isRequestAuthenticated } from '../../lib/auth';
import webpush from 'web-push';
import { db } from '../../lib/firebase';
import { collection, getDocs } from 'firebase/firestore';

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();
  res.setHeader('Cache-Control', 'no-store');
  if (!isRequestAuthenticated(req)) return res.status(401).json({ error: 'Влез в администрацията.' });
  if (!process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || !process.env.VAPID_PRIVATE_KEY) return res.status(503).json({ error: 'Известията не са конфигурирани.' });
  const { dealershipName } = req.body || {};
  try {
    webpush.setVapidDetails('mailto:admin@cars.local', process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY, process.env.VAPID_PRIVATE_KEY);
    const snap = await getDocs(collection(db, 'subscriptions'));
    const payload = JSON.stringify({
      title: dealershipName || 'Автокъща',
      body: 'Има актуализация в автомобилния каталог.',
      url: '/'
    });
    await Promise.allSettled(snap.docs.map(d => webpush.sendNotification(d.data(), payload)));
    return res.status(200).json({ ok: true });
  } catch (e) {
    return res.status(500).json({ ok: false, error: e.message });
  }
}
