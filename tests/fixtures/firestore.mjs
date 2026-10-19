// Test-only adapters: reads return fixtures; writes stay in browser memory.
export const db = {};
export const lot = {
  dealershipName: 'PMSELECT CARS', phone: '+359000000000', fullGalleryImages: ['/apex-hero.webp', '/qa-fast.svg'],
  sections: [{ label: 'Селекция', cars: [{ catalogId: 'mock-vehicle-1', name: 'BMW 530d Fixture', year: '2022', fuel: 'Дизел', price: '35900', image: '/apex-hero.webp', images: ['/apex-hero.webp', '/qa-fast.svg'] }] }],
};
export const doc = (_, ...parts) => parts.join('/');
export const collection = (_, ...parts) => parts.join('/');
export const increment = value => value;
export async function getDoc(ref) {
  const data = ref === 'lot/daily' ? structuredClone(lot) : ref.startsWith('stats/') ? { count: 1 } : {};
  return { exists: () => true, data: () => data };
}
export async function getDocs() { return { docs: [] }; }
export async function setDoc(ref, data) {
  window.__fixtureWrites = [...(window.__fixtureWrites || []), { ref, data }];
}
