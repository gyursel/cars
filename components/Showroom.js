import { useEffect, useMemo, useRef, useState } from 'react';

export const BRAND = 'APEX DRIVE BULGARIA';
export const imagesOf = car => [...new Set([car?.image, ...(car?.images || [])].filter(Boolean))].slice(0, 15);
export const numeric = value => Number(String(value ?? '').replace(/[^\d.,]/g, '').replace(',', '.'));
export const priceOf = value => value !== '' && value != null && Number.isFinite(numeric(value)) && numeric(value) > 0 ? `${numeric(value).toLocaleString('bg-BG')} €` : 'Цена при запитване';
const badges = { new: 'Ново постъпление', leasing: 'Лизинг / Бартер', warranty: 'Гаранция', '4x4': '4 × 4' };

export function Mark({ logo }) { if (logo) return <img className="apex-logo-image" src={logo} alt={BRAND}/>; return <span className="apex-mark">APEX<span>DRIVE BULGARIA</span></span>; }
function Icon({ name }) {
  const paths = { home: 'M3 11 12 3l9 8M5 10v11h5v-7h4v7h5V10', inventory: 'M3 17V9l3-5h12l3 5v8M3 10h18M6 14h2m8 0h2M5 17v3m14-3v3', contact: 'M5 3h4l2 5-3 2a16 16 0 0 0 6 6l2-3 5 2v4c-9 3-21-9-16-16Z', services: 'M12 3 3 8l9 13 9-13-9-5ZM3 8h18M8 8l4 13 4-13' };
  return <svg width="21" height="21" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d={paths[name] || paths.inventory}/></svg>;
}
const navigation = [['home', 'Начало'], ['inventory', 'Автомобили'], ['services', 'Услуги'], ['contact', 'Контакти']];

export function Showroom({ lot, branding, onOpen, onAdmin, onGallery, activeNav, onNavigate, error }) {
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState('all');
  const [fuel, setFuel] = useState('');
  const [gearbox, setGearbox] = useState('');
  const [maxPrice, setMaxPrice] = useState('');
  const [minYear, setMinYear] = useState('');
  const [maxMileage, setMaxMileage] = useState('');
  const [sort, setSort] = useState('featured');
  const cars = useMemo(() => (lot.sections || []).flatMap((s, si) => (s.cars || []).filter(c => c.visible !== false).map((c, ci) => ({ ...c, sectionLabel: s.label, listKey: `${si}-${ci}` }))), [lot]);
  const filtered = useMemo(() => cars.filter(c =>
    (category === 'all' || c.sectionLabel === category) &&
    (!query || `${c.name} ${c.desc || ''}`.toLocaleLowerCase('bg').includes(query.trim().toLocaleLowerCase('bg'))) &&
    (!fuel || c.fuel === fuel) && (!gearbox || c.gearbox === gearbox) &&
    (!maxPrice || (numeric(c.price) > 0 && numeric(c.price) <= Number(maxPrice))) &&
    (!minYear || (numeric(c.year || (c.productionDate || '').match(/\d{4}/)?.[0]) >= Number(minYear))) &&
    (!maxMileage || (c.mileage && numeric(c.mileage) <= Number(maxMileage)))
  ).sort((a, b) => sort === 'price-up' ? (numeric(a.price) || Infinity) - (numeric(b.price) || Infinity) : sort === 'price-down' ? numeric(b.price) - numeric(a.price) : sort === 'year' ? numeric(b.year) - numeric(a.year) : Number(!!b.featured) - Number(!!a.featured)), [cars, query, category, fuel, gearbox, maxPrice, minYear, maxMileage, sort]);
  const featured = cars.find(c => c.featured && imagesOf(c).length) || cars.find(c => imagesOf(c).length);
  const hero = lot.heroImage || branding?.heroImage || imagesOf(featured)[0];
  const logo = lot.logoImage ?? branding?.logoImage;
  const video = hero && /\.(mp4|webm|mov)(\?|$)/i.test(hero);
  const navigate = key => onNavigate({ key, target: key === 'home' ? null : key });
  const reset = () => { setQuery(''); setCategory('all'); setFuel(''); setGearbox(''); setMaxPrice(''); setMinYear(''); setMaxMileage(''); };
  return <div className="apex-site">
    <a className="skip-link" href="#inventory">Към автомобилите</a>
    <header className="apex-header"><a href="#" aria-label={`${BRAND} — начало`} onClick={e => { e.preventDefault(); navigate('home'); }}><Mark logo={logo}/></a><nav aria-label="Основна навигация">{navigation.slice(1).map(([key, label]) => <a key={key} href={`#${key}`}>{label}</a>)}</nav><button className="text-button admin-link" onClick={onAdmin} aria-label="Вход в администрацията">Админ ↗</button></header>
    <section className={`apex-hero ${hero ? '' : 'no-photo'}`} aria-label="APEX DRIVE BULGARIA">
      {hero && (video ? <video className="hero-media" src={hero} muted playsInline controls loop preload="metadata" aria-label="Представяне на автокъщата"/> : <img className="hero-media" src={hero} alt={lot.heroImage || branding?.heroImage ? 'APEX DRIVE BULGARIA — автомобилна селекция' : featured?.name || ''} fetchPriority="high"/>)}
      <div className="hero-shade"/>
      <div className="hero-editorial"><p className="eyebrow"><span/> СЕЛЕКЦИЯ С ХАРАКТЕР</p><h1>Не просто път.<br/><em>Твоят</em> път.</h1><p className="hero-description">Автомобилът е личен избор.<br/>Открий този, който говори на твоя език.</p><div className="hero-actions"><a className="button primary" href="#inventory">Разгледай автомобилите <span>↗</span></a><a className="button ghost" href="#contact">Свържи се с нас</a></div></div>
      <div className="hero-caption"><span>APEX / THE DRIVE COLLECTION</span><span>{featured ? featured.name : 'DRIVE YOUR OWN STORY'} <span className="red-dot"/></span></div>
    </section>
    {lot.demoExpired ? <div className="apex-empty" role="status">Пробният период е приключил — това е демо версия на приложението.</div> : <>
    <main id="inventory" className="apex-inventory">
      <div className="section-heading"><div><p className="eyebrow">01 / АВТОМОБИЛИТЕ</p><h2>Отличителен характер.<br/><em>Точният избор.</em></h2></div><p className="collection-count">{String(cars.length).padStart(2, '0')}<span>автомобила в селекцията</span></p></div>
      {error ? <div className="apex-empty" role="alert"><h3>Връзката с каталога е прекъсната</h3><p>Не успяхме да заредим актуалните автомобили.</p><button className="button secondary" onClick={() => location.reload()}>Опитай отново</button></div> : <>
      <div className="category-tabs" aria-label="Категории"><button aria-pressed={category === 'all'} onClick={() => setCategory('all')}>Всички</button>{(lot.sections || []).map((s, i) => <button key={i} aria-pressed={category === s.label} onClick={() => setCategory(s.label)}>{s.label}</button>)}</div>
      <div className="filter-toolbar"><label className="search-field"><span aria-hidden="true">⌕</span><input aria-label="Търси марка или модел" placeholder="Марка, модел или ключова дума" value={query} onChange={e => setQuery(e.target.value)}/>{query && <button aria-label="Изчисти търсенето" onClick={() => setQuery('')}>×</button>}</label><label className="sort-field"><span>Подреди по</span><select value={sort} onChange={e => setSort(e.target.value)}><option value="featured">Препоръчани</option><option value="price-up">Цена: възходящо</option><option value="price-down">Цена: низходящо</option><option value="year">Най-нови години</option></select></label></div>
      <details className="advanced-filters"><summary>Филтри <span>Гориво, цена, година и още +</span></summary><div className="filter-grid"><label>Гориво<select value={fuel} onChange={e => setFuel(e.target.value)}><option value="">Всички</option>{[...new Set(cars.map(c => c.fuel).filter(Boolean))].map(v => <option key={v}>{v}</option>)}</select></label><label>Скоростна кутия<select value={gearbox} onChange={e => setGearbox(e.target.value)}><option value="">Всички</option>{[...new Set(cars.map(c => c.gearbox).filter(Boolean))].map(v => <option key={v}>{v}</option>)}</select></label><label>Цена до (€)<input type="number" min="0" value={maxPrice} onChange={e => setMaxPrice(e.target.value)} placeholder="Без ограничение"/></label><label>Година от<input type="number" min="1900" max="2100" value={minYear} onChange={e => setMinYear(e.target.value)} placeholder="Всички години"/></label><label>Пробег до (км)<input type="number" min="0" value={maxMileage} onChange={e => setMaxMileage(e.target.value)} placeholder="Без ограничение"/></label><button className="text-button" onClick={reset}>Изчисти филтрите ↺</button></div></details>
      <div className="results-label" aria-live="polite">{filtered.length} {filtered.length === 1 ? 'автомобил' : 'автомобила'}</div>
      <div className="apex-grid">{filtered.map((car, i) => <article className="apex-car" key={car.listKey} style={{ '--delay': `${Math.min(i, 5) * 45}ms` }}><button className="car-link" onClick={() => onOpen(car)} aria-label={`Разгледай ${car.name}`}><div className="car-photo">{imagesOf(car)[0] ? <img src={imagesOf(car)[0]} alt={car.name} loading="lazy" decoding="async"/> : <div className="photo-missing">Снимките предстоят</div>}{car.featured || car.badges?.length ? <span className="car-badge">{car.featured ? 'Избран автомобил' : badges[car.badges[0]] || car.badges[0]}</span> : null}<span className="car-arrow">↗</span></div><div className="car-copy"><p className="eyebrow">{car.sectionLabel}</p><h3>{car.name}</h3><p className="car-spec-line">{[car.year || car.productionDate, car.fuel, car.gearbox].filter(Boolean).join(' / ')}</p><div className="car-bottom"><strong>{priceOf(car.price)}</strong><span>{car.mileage || 'Разгледай →'}</span></div></div></button></article>)}</div>
      {!filtered.length && <div className="apex-empty"><h3>{cars.length ? 'Няма съвпадения' : 'Селекцията се подготвя'}</h3><p>{cars.length ? 'Промени филтрите, за да разгледаш други автомобили.' : 'Свържи се с нас за актуални предложения.'}</p>{cars.length > 0 && <button className="button secondary" onClick={reset}>Изчисти филтрите</button>}</div>}
      </>}
    </main>
    <section id="services" className="apex-services"><div className="section-heading"><div><p className="eyebrow">02 / ЛИЧЕН ПОДХОД</p><h2>Следващата стъпка.<br/><em>С увереност.</em></h2></div><p>От първия въпрос до огледа.<br/>Нека обсъдим какво търсиш.</p></div><div className="services-grid">{[['01', 'Оглед и тест драйв', 'Свържи се с нас, за да уточним удобен час и наличността на избрания автомобил.'], ['02', 'Лизинг и бартер', 'Попитай за възможностите и условията за конкретния автомобил.'], ['03', 'Твоите въпроси', 'Получи информация за оборудването, историята и състоянието преди огледа.']].map(([n, title, copy]) => <article key={n}><span>{n} /</span><h3>{title}</h3><p>{copy}</p><a href="#contact" aria-label={`${title} — свържи се с нас`}>↗</a></article>)}</div>{lot.fullGalleryImages?.length > 0 && <button className="button secondary" onClick={onGallery}>Галерия на автокъщата ↗</button>}</section>
    </>}
    <footer id="contact" className="apex-contact"><p className="eyebrow">03 / ДА ПОГОВОРИМ</p><h2>Твоят следващ<br/><em>автомобил е тук.</em></h2>{lot.phone && <a className="contact-phone" href={`tel:${lot.phone.replace(/\s/g, '')}`}>{lot.phone} ↗</a>}{lot.footerNote && <p className="footer-note">{lot.footerNote}</p>}<div className="footer-bottom"><Mark logo={logo}/><span>© {new Date().getFullYear()} {BRAND}</span><button className="text-button" onClick={onAdmin}>Администрация ↗</button></div></footer>
    <nav className="apex-bottom-nav" aria-label="Мобилна навигация">{navigation.map(([key, label]) => <button key={key} aria-current={activeNav === key ? 'page' : undefined} onClick={() => navigate(key)}><Icon name={key}/><span>{label}</span></button>)}</nav>
  </div>;
}

export function CarDetail({ car, phone, onBack, preview = false }) {
  const [current, setCurrent] = useState(0);
  const [tab, setTab] = useState('overview');
  const [fullscreen, setFullscreen] = useState(false);
  const dialog = useRef(null);
  const touch = useRef(null);
  const launch = useRef(null);
  const photos = imagesOf(car);
  const go = n => setCurrent((n + photos.length) % photos.length);
  useEffect(() => {
    if (!fullscreen) return;
    const old = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    dialog.current?.showModal();
    return () => { document.body.style.overflow = old; launch.current?.focus(); };
  }, [fullscreen]);
  const rows = [['Производство', car.productionDate || car.year], ['Пробег', car.mileage], ['Двигател', car.engine || car.fuel], ['Мощност', car.power], ['Скоростна кутия', car.gearbox], ['Евростандарт', car.euroStandard], ['Кубатура', car.displacement], ['Цвят', car.color]] .filter(([, value]) => value);
  const swipe = { onTouchStart: e => { touch.current = e.touches[0].clientX; }, onTouchEnd: e => { if (touch.current !== null && photos.length > 1) { const delta = e.changedTouches[0].clientX - touch.current; if (Math.abs(delta) > 45) go(current + (delta < 0 ? 1 : -1)); } touch.current = null; } };
  return <main className="apex-detail">
    <header className="detail-header"><button className="text-button" onClick={onBack}>← {preview ? 'Към редактора' : 'Към колекцията'}</button><Mark/><span>{preview ? 'ПРЕГЛЕД' : 'THE COLLECTION'}</span></header>
    <div className="detail-layout"><section className="detail-gallery" aria-label="Снимки на автомобила"><div className="detail-main-photo" {...swipe}>{photos.length ? <><button ref={launch} className="photo-expand" onClick={() => setFullscreen(true)} aria-label="Отвори снимката на цял екран"><img src={photos[current]} alt={`${car.name}, снимка ${current + 1}`} fetchPriority="high"/></button><span className="photo-counter">{String(current + 1).padStart(2, '0')} / {String(photos.length).padStart(2, '0')}</span>{photos.length > 1 && <div className="photo-controls"><button onClick={() => go(current - 1)} aria-label="Предишна снимка">←</button><button onClick={() => go(current + 1)} aria-label="Следваща снимка">→</button></div>}</> : <div className="photo-missing">Няма качени снимки</div>}</div><div className="detail-thumbnails">{photos.map((url, i) => <button key={url + i} onClick={() => setCurrent(i)} aria-label={`Снимка ${i + 1}`} aria-pressed={i === current}><img src={url} alt="" loading="lazy"/></button>)}</div></section>
    <section className="detail-info"><p className="eyebrow">{car.sectionLabel || 'APEX / СЕЛЕКЦИЯТА'}</p><h1>{car.name}</h1><p className="detail-price">{priceOf(car.price)}</p><div className="detail-badges">{(car.badges || []).map(b => <span key={b}>{badges[b] || b}</span>)}</div>
    <div className="detail-tabs" role="tablist" aria-label="Информация за автомобила">{[['overview', 'Преглед'], ['specs', 'Характеристики'], ['description', 'Описание']].map(([key, label], i, tabs) => <button key={key} role="tab" id={`tab-${key}`} aria-controls={`panel-${key}`} aria-selected={tab === key} tabIndex={tab === key ? 0 : -1} onClick={() => setTab(key)} onKeyDown={e => { if (['ArrowRight', 'ArrowLeft', 'Home', 'End'].includes(e.key)) { e.preventDefault(); const n = e.key === 'Home' ? 0 : e.key === 'End' ? 2 : (i + (e.key === 'ArrowRight' ? 1 : 2)) % 3; setTab(tabs[n][0]); document.getElementById(`tab-${tabs[n][0]}`)?.focus(); } }}>{label}</button>)}</div>
    <div role="tabpanel" id={`panel-${tab}`} aria-labelledby={`tab-${tab}`} className="detail-panel">{tab === 'overview' ? <><div className="detail-highlights">{rows.slice(0, 3).map(([label, value]) => <div key={label}><span>{label}</span><strong>{value}</strong></div>)}</div><h2>С характер във всеки детайл.</h2><p>{car.desc || 'Свържи се с нас за повече информация за автомобила.'}</p></> : tab === 'specs' ? <dl className="specification-list">{rows.length ? rows.map(([label, value]) => <div key={label}><dt>{label}</dt><dd>{value}</dd></div>) : <p>Характеристиките предстои да бъдат добавени.</p>}</dl> : <p className="preserve-lines">{car.additionalInfo || car.desc || 'Няма добавено описание.'}</p>}</div>
    {phone && <div className="detail-action"><span>Уговори своя оглед<small>{phone}</small></span><a className="button primary" href={`tel:${phone.replace(/\s/g, '')}`}>Обади се ↗</a></div>}</section></div>
    {fullscreen && <dialog ref={dialog} className="apex-lightbox" onCancel={e => { e.preventDefault(); setFullscreen(false); }} onKeyDown={e => { if (e.key === 'ArrowLeft') go(current - 1); if (e.key === 'ArrowRight') go(current + 1); }} aria-label={`Галерия — ${car.name}`}><button className="lightbox-close" autoFocus onClick={() => setFullscreen(false)} aria-label="Затвори галерията">×</button><div {...swipe}><img src={photos[current]} alt={`${car.name}, снимка ${current + 1}`}/></div><div className="lightbox-controls"><button onClick={() => go(current - 1)} disabled={photos.length < 2} aria-label="Предишна снимка">←</button><span>{current + 1} / {photos.length}</span><button onClick={() => go(current + 1)} disabled={photos.length < 2} aria-label="Следваща снимка">→</button></div></dialog>}
  </main>;
}

export function ShowroomSkeleton() { return <div className="apex-loading" role="status" aria-label="Зареждане на автомобилите"><Mark/><div className="skeleton-hero"/><p>Подготвяме селекцията…</p><div className="skeleton-grid">{[0, 1, 2].map(i => <div key={i}/>)}</div></div>; }
