import webpush from 'web-push';
import { db } from '../../lib/firebase';
import { collection, getDocs } from 'firebase/firestore';

webpush.setVapidDetails(
  'mailto:admin@cars.local',
  process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || '',
  process.env.VAPID_PRIVATE_KEY || ''
);

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();
  const { dealershipName } = req.body || {};
  try {
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
