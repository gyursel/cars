// Public display filters only; never modifies catalog records.
export const numeric = value => Number(String(value ?? '').replace(/[^\d.,]/g, '').replace(',', '.'));
export const carKey = car => car.catalogId || `${car.name}|${car.year}|${car.image || ''}`;

export function selectCars(cars, { mode, category, query, fuel, gearbox, maxPrice, minYear, maxMileage, sort, saved }) {
  const search = mode === 'search';
  const result = cars.filter(car => {
    if (mode === 'saved') return saved.includes(carKey(car));
    if (!search) return category === 'all' || car.sectionLabel === category;
    const term = query.trim().toLocaleLowerCase('bg');
    return (!term || `${car.name} ${car.desc || ''}`.toLocaleLowerCase('bg').includes(term)) &&
      (!fuel || car.fuel === fuel) && (!gearbox || car.gearbox === gearbox) &&
      (!maxPrice || (numeric(car.price) > 0 && numeric(car.price) <= Number(maxPrice))) &&
      (!minYear || numeric(car.year || (car.productionDate || '').match(/\d{4}/)?.[0]) >= Number(minYear)) &&
      (!maxMileage || (car.mileage && numeric(car.mileage) <= Number(maxMileage)));
  });
  return result.sort((a, b) => search && sort === 'price-up' ? (numeric(a.price) || Infinity) - (numeric(b.price) || Infinity) :
    search && sort === 'price-down' ? numeric(b.price) - numeric(a.price) :
    search && sort === 'year' ? numeric(b.year) - numeric(a.year) : Number(!!b.featured) - Number(!!a.featured));
}
