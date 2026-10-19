import { serverDatabase } from '../../lib/serverDatabase';
import { isRequestAuthenticated } from '../../lib/auth';

export default async function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store');
  if (req.method !== 'POST') return res.status(405).json({ error: 'Методът не е позволен.' });
  if (!isRequestAuthenticated(req)) return res.status(401).json({ error: 'Сесията е изтекла. Влез отново.' });
  const lot = req.body?.lot;
  if (!lot || !Array.isArray(lot.sections) || typeof lot.dealershipName !== 'string') return res.status(400).json({ error: 'Невалидни данни за автокъщата.' });
  if (lot.sections.some(s => !s || !Array.isArray(s.cars) || s.cars.some(c => !c || typeof c !== 'object'))) return res.status(400).json({ error: 'Невалидни категории или автомобили.' });
  const count = lot.sections.reduce((n, s) => n + (Array.isArray(s.cars) ? s.cars.length : 1000), 0);
  if (count > 450) return res.status(400).json({ error: 'Максимум 450 автомобила в един запис.' });
  for (const section of lot.sections) {
    if (typeof section.label !== 'string' || !section.label.trim()) return res.status(400).json({ error: 'Всяка категория трябва да има име.' });
    for (const car of section.cars) {
      if (typeof car.name !== 'string' || !car.name.trim()) return res.status(400).json({ error: 'Попълни име на всеки автомобил.' });
      if (car.price && (!/^\d+(?:[.,]\d{1,2})?$/.test(String(car.price).replace(/\s/g, '')) || Number(String(car.price).replace(/\s/g, '').replace(',', '.')) < 0)) return res.status(400).json({ error: `Невалидна цена: ${car.name}` });
      if (car.images && (!Array.isArray(car.images) || car.images.length > 15 || car.images.some(url => typeof url !== 'string' || !/^https:\/\//.test(url)))) return res.status(400).json({ error: 'Невалидна галерия.' });
      if (car.catalogId && (typeof car.catalogId !== 'string' || car.catalogId.includes('/'))) return res.status(400).json({ error: 'Невалиден идентификатор.' });
    }
  }
  try {
    // One atomic batch: catalog and published collection cannot diverge on failure.
    const db = serverDatabase();
    const batch = db.batch();
    for (const section of lot.sections) for (const car of section.cars) {
      const ref = car.catalogId ? db.collection('cars').doc(car.catalogId) : db.collection('cars').doc();
      car.catalogId = ref.id;
      batch.set(ref, { ...car, category: section.label }, { merge: true });
    }
    batch.set(db.collection('lot').doc('daily'), lot);
    await batch.commit();
    return res.status(200).json({ lot });
  } catch (error) {
    console.error('Saving dealership failed:', error.code || 'unknown');
    return res.status(500).json({ error: 'Записът не успя. Промените са запазени в редактора — опитай отново.' });
  }
}
export const config = { api: { bodyParser: { sizeLimit: '2mb' } } };
