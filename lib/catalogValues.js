// Shared parsing for imported and manually entered catalog values.
export const numeric = value => Number(String(value ?? '').replace(/[^\d.,]/g, '').replace(',', '.'));
export const yearOf = car => numeric(car.year || String(car.productionDate || '').match(/\d{4}/)?.[0]);
export const imagesOf = car => [...new Set([car?.image, ...(Array.isArray(car?.images) ? car.images : [])].filter(url => typeof url === 'string' && url.trim()))].slice(0, 15);
