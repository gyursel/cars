export const defaultLot = {
  dealershipName: 'PM SELECT AUTOMOTIVE',
  phone: '+359 899 225 640',
  footerNote: 'Всички автомобили се предлагат с оглед и тест драйв на място.\nВъзможност за лизинг и бартер.',
  heroImage: '',
  fullGalleryImages: [],
  demoExpired: false,
  sections: [
    {
      label: 'Джипове / SUV',
      cars: [
        { name: 'BMW X5 30d', desc: 'Full extras, 3x S-line, keyless, панорама', price: '19999', year: '2018', productionDate: 'Май 2018', mileage: '240 000 км', fuel: 'Дизел', engine: 'Дизелов', power: '265 к.с.', euroStandard: 'Евро 6', displacement: '3000 см³', gearbox: 'Автоматична', color: 'Черен', additionalInfo: '', badges: ['4x4'], image: '', images: [] },
        { name: 'Land Rover Discovery HSE', desc: 'Terrain Response, Meridian, 7 места', price: '14999', year: '2015', mileage: '230 000 км', fuel: 'Дизел', power: '256 к.с.', gearbox: 'Автоматична', badges: ['4x4', 'leasing'], image: '', images: [] }
      ]
    },
    {
      label: 'Седани',
      cars: [
        { name: 'Mercedes-Benz C 300 4-MATIC', desc: 'Mild Hybrid, MBUX, 360° камера', price: '32500', year: '2022', mileage: '85 780 км', fuel: 'Бензин хибрид', power: '258 к.с.', gearbox: 'Автоматична', badges: ['new'], image: '', images: [] },
        { name: 'Audi A6 3.0 TDI Quattro', desc: 'S-line, Bose, Full LED', price: '12799', year: '2012', mileage: '250 000 км', fuel: 'Дизел', power: '245 к.с.', gearbox: 'Автоматична', badges: ['leasing'], image: '', images: [] }
      ]
    },
    {
      label: 'Спортни',
      cars: [
        { name: 'BMW M5 F10', desc: 'Пълна история, чипован, нови вериги', price: '34999', year: '2013', mileage: '150 000 км', fuel: 'Бензин', power: '560 к.с.', gearbox: 'Автоматична', badges: ['warranty'], image: '', images: [] }
      ]
    }
  ]
};

export const BADGE_LABELS = { '4x4': '4x4', leasing: 'Лизинг/Бартер', new: 'Ново постъпление', warranty: 'Гаранция' };

export const CAR_CARD_ACCENTS = [
  { border: '#C9A227', tint: '#FBF6E4' }, // gold
  { border: '#3B6FA0', tint: '#EAF1F8' }, // blue
  { border: '#4E8B5C', tint: '#EAF5EC' }, // green
  { border: '#B0574D', tint: '#FBECE9' }, // terracotta
  { border: '#7A5FB0', tint: '#F1ECFA' }, // violet
  { border: '#3F8E96', tint: '#E9F5F6' }, // teal
];

export const TECH_SUGGESTIONS = {
  productionDate: Array.from({ length: 37 }, (_, yi) => 2026 - yi).flatMap(y => ['Януари','Февруари','Март','Април','Май','Юни','Юли','Август','Септември','Октомври','Ноември','Декември'].map(m => `${m} ${y}`)),
  engine: ['Дизелов','Бензинов','Хибриден','Plug-in хибрид','Електрически'],
  power: ['90 к.с.','110 к.с.','120 к.с.','130 к.с.','140 к.с.','150 к.с.','163 к.с.','170 к.с.','184 к.с.','190 к.с.','204 к.с.','218 к.с.','231 к.с.','245 к.с.','258 к.с.','265 к.с.','286 к.с.','300 к.с.','340 к.с.','360 к.с.','400 к.с.','450 к.с.','560 к.с.'],
  euroStandard: ['Евро 3','Евро 4','Евро 5','Евро 6','Евро 6d','Евро 6d-TEMP'],
  displacement: ['1000 см³','1200 см³','1400 см³','1500 см³','1600 см³','1800 см³','2000 см³','2200 см³','2500 см³','2700 см³','2800 см³','3000 см³','3200 см³','3500 см³','4000 см³','4400 см³','5000 см³'],
  gearbox: ['Автоматична','Ръчна','Полуавтоматична','CVT'],
  year: Array.from({ length: 37 }, (_, i) => String(2026 - i)),
  mileage: ['0 км','10 000 км','25 000 км','50 000 км','75 000 км','100 000 км','125 000 км','150 000 км','175 000 км','200 000 км','225 000 км','250 000 км','300 000 км'],
  fuel: ['Дизел','Бензин','Бензин хибрид','Дизел хибрид','Plug-in хибрид','Електричество','Газ/Бензин','Метан/Бензин'],
  color: ['Черен','Черен металик','Бял','Бял перла','Сив','Сив металик','Сребрист','Син','Син металик','Червен','Зелен','Кафяв','Бежов','Златист','Оранжев','Жълт','Лилав'],
  category: ['Седан','Комби','Хечбек','SUV','Джип','Купе','Кабрио','Миниван','Пикап','Ван','Лимузина']
};
