import assert from 'node:assert/strict';
import test from 'node:test';
import { carKey, selectCars } from '../lib/showroomCollection.mjs';

const cars = [
  { catalogId: 'suv', name: 'Audi Q7', sectionLabel: 'SUV', price: '24 999', year: '2016', fuel: 'Дизел', mileage: '172 500' },
  { catalogId: 'sedan', name: 'BMW M5', sectionLabel: 'Седани', price: '34 999', year: '2013', fuel: 'Бензин', mileage: '150 000' },
  { catalogId: 'unknown', name: 'BMW 320', sectionLabel: 'Седани', price: '', productionDate: '01.2022', fuel: 'Дизел' },
];
const options = { mode: 'home', category: 'all', query: '', fuel: '', gearbox: '', maxPrice: '', minYear: '', maxMileage: '', sort: 'featured', saved: [] };
const select = changes => selectCars(cars, { ...options, ...changes }).map(car => car.catalogId);

test('home categories, search and favourites retain independent scopes', () => {
  assert.deepEqual(select({ category: 'SUV', query: 'BMW', fuel: 'Бензин' }), ['suv']);
  assert.deepEqual(select({ mode: 'search', category: 'SUV', query: '  bMw M5  ' }), ['sedan']);
  assert.deepEqual(select({ mode: 'saved', category: 'SUV', query: 'no match', maxPrice: '1', saved: ['sedan'] }), ['sedan']);
  assert.deepEqual(select({ mode: 'saved', saved: [] }), []);
});

test('combined search filters exclude unknown prices/mileage and support imported dates', () => {
  assert.deepEqual(select({ mode: 'search', fuel: 'Дизел', maxPrice: '25000', maxMileage: '180000' }), ['suv']);
  assert.deepEqual(select({ mode: 'search', minYear: '2020' }), ['unknown']);
  assert.deepEqual(select({ mode: 'search', sort: 'price-up' }), ['suv', 'sedan', 'unknown']);
  assert.deepEqual(select({ mode: 'search', query: 'missing' }), []);
  assert.deepEqual(cars.map(car => car.catalogId), ['suv', 'sedan', 'unknown']);
  assert.equal(carKey({ name: 'BMW', year: '2022', image: 'photo' }), 'BMW|2022|photo');
});
