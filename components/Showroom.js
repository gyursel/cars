import { useEffect, useMemo, useRef, useState } from 'react';

export const BRAND = 'PMSELECT CARS';
export const imagesOf = car => [...new Set([car?.image, ...(car?.images || [])].filter(Boolean))].slice(0, 15);
export const numeric = value => Number(String(value ?? '').replace(/[^\d.,]/g, '').replace(',', '.'));
export const priceOf = value => value !== '' && value != null && Number.isFinite(numeric(value)) && numeric(value) > 0 ? `${numeric(value).toLocaleString('bg-BG')} €` : 'Цена при запитване';
const badges = { new: 'Ново постъпление', leasing: 'Лизинг / Бартер', warranty: 'Гаранция', '4x4': '4 × 4' };

export function Mark({ logo }) { if (logo) return <img className="apex-logo-image" src={logo} alt={BRAND} decoding="async"/>; return <span className="apex-mark">PMSELECT<span>CARS</span></span>; }
function Icon({ name }) {
  const paths = { home: 'M3 11 12 3l9 8M5 10v11h5v-7h4v7h5V10', inventory: 'M3 17V9l3-5h12l3 5v8M3 10h18M6 14h2m8 0h2M5 17v3m14-3v3', contact: 'M5 3h4l2 5-3 2a16 16 0 0 0 6 6l2-3 5 2v4c-9 3-21-9-16-16Z', services: 'M12 3 3 8l9 13 9-13-9-5ZM3 8h18M8 8l4 13 4-13' };
  return <svg width="21" height="21" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d={paths[name] || paths.inventory}/></svg>;
}
const navigation = [['home', 'Начало'], ['inventory', 'Автомобили'], ['services', 'Услуги'], ['contact', 'Контакти']];

export function Showroom({ lot, branding, onOpen, onAdmin, onGallery, activeNav, onNavigate, error }) {
  const [query, setQuery] = useState('');
  const [entered, setEntered] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [onlySaved, setOnlySaved] = useState(false);
  const [saved, setSaved] = useState([]);
  useEffect(() => { try { const value = JSON.parse(localStorage.getItem('apex-saved-cars') || '[]'); if (Array.isArray(value)) setSaved(value); } catch {} }, []);
  const carKey = car => car.catalogId || `${car.name}|${car.year}|${car.image || ''}`;
  function toggleSaved(car) { const key = carKey(car); setSaved(previous => { const next = previous.includes(key) ? previous.filter(v => v !== key) : [...previous, key]; try { localStorage.setItem('apex-saved-cars', JSON.stringify(next)); } catch {} return next; }); }
  function enter() { setEntered(true); setTimeout(() => window.scrollTo({top:0,behavior:'instant'}), 0); }
  const [category, setCategory] = useState('all');
  const [fuel, setFuel] = useState('');
  const [gearbox, setGearbox] = useState('');
  const [maxPrice, setMaxPrice] = useState('');
  const [minYear, setMinYear] = useState('');
  const [maxMileage, setMaxMileage] = useState('');
  const [sort, setSort] = useState('featured');
  const cars = useMemo(() => (lot.sections || []).flatMap((s, si) => (s.cars || []).filter(c => c.visible !== false).map((c, ci) => ({ ...c, sectionLabel: s.label, listKey: `${si}-${ci}` }))), [lot]);
  const filtered = useMemo(() => cars.filter(c =>
    (!onlySaved || saved.includes(carKey(c))) &&
    (category === 'all' || c.sectionLabel === category) &&
    (!query || `${c.name} ${c.desc || ''}`.toLocaleLowerCase('bg').includes(query.trim().toLocaleLowerCase('bg'))) &&
    (!fuel || c.fuel === fuel) && (!gearbox || c.gearbox === gearbox) &&
    (!maxPrice || (numeric(c.price) > 0 && numeric(c.price) <= Number(maxPrice))) &&
    (!minYear || (numeric(c.year || (c.productionDate || '').match(/\d{4}/)?.[0]) >= Number(minYear))) &&
    (!maxMileage || (c.mileage && numeric(c.mileage) <= Number(maxMileage)))
  ).sort((a, b) => sort === 'price-up' ? (numeric(a.price) || Infinity) - (numeric(b.price) || Infinity) : sort === 'price-down' ? numeric(b.price) - numeric(a.price) : sort === 'year' ? numeric(b.year) - numeric(a.year) : Number(!!b.featured) - Number(!!a.featured)), [cars, query, category, fuel, gearbox, maxPrice, minYear, maxMileage, sort, onlySaved, saved]);
  const featured = cars.find(c => c.featured && imagesOf(c).length) || cars.find(c => imagesOf(c).length);
  const hero = lot.introImage || '/apex-hero.webp';
  
  const logo = lot.logoImage ?? branding?.logoImage;
  const video = hero && /\.(mp4|webm|mov)(\?|$)/i.test(hero);
  const navigate = key => { setMenuOpen(false); onNavigate({ key, target: key === 'home' ? null : key }); };
  const reset = () => { setQuery(''); setCategory('all'); setFuel(''); setGearbox(''); setMaxPrice(''); setMinYear(''); setMaxMileage(''); setOnlySaved(false); };
  return <div className={`apex-site ${entered ? 'is-entered' : 'is-intro'}`}>
    <a className="skip-link" href="#inventory">Към автомобилите</a>
    {!entered && <section className={`apex-hero ${hero ? '' : 'no-photo'}`} aria-label="PMSELECT CARS">
      <div className="intro-brand"><Mark logo={logo}/></div>
      {video ? <video className="hero-media" src={hero} muted playsInline controls loop preload="metadata" aria-label="Представяне на автокъщата"/> : <img className="hero-media" src={hero} alt="Луксозен автомобил — атмосферата на PMSELECT CARS" fetchPriority="high" decoding="async"/>}
      <div className="hero-shade"/>
      <div className="hero-editorial"><h1>Луксът, който<br/>се движи с теб</h1><p className="hero-description">Влез в нова ера на шофирането. Подбрани автомобили с характер, оглед и тест драйв на място.</p><button className="button primary intro-explore" onClick={enter}>Разгледай <span>→</span></button></div>
    </section>}
    <div className="collection-screen" hidden={!entered}>
    <header className="apex-header"><button className="square-button" aria-label="Меню" aria-expanded={menuOpen} aria-controls="collection-menu" onClick={() => setMenuOpen(!menuOpen)}>☰</button><button className="brand-button" onClick={() => { setEntered(false); window.scrollTo(0,0); }} aria-label="Към началния екран"><Icon name="home"/></button>{lot.phone ? <a className="square-button call-button" href={`tel:${lot.phone.replace(/\s/g,'')}`} aria-label="Обади се"><Icon name="contact"/></a> : <button className="square-button" onClick={onAdmin} aria-label="Администрация">↗</button>}</header>
    {menuOpen && <nav id="collection-menu" className="collection-menu" aria-label="Меню">{navigation.map(([key,label]) => <button key={key} onClick={() => navigate(key)}>{label}<span>↗</span></button>)}<button onClick={() => { setMenuOpen(false); onAdmin(); }}>Администрация<span>↗</span></button></nav>}
    {featured && !onlySaved && <section className="spotlight" aria-label="Избран автомобил"><div className="spotlight-visual"><button onClick={() => onOpen(featured)} aria-label={`Разгледай ${featured.name}`}><img src={imagesOf(featured)[0]} alt={featured.name} fetchPriority="high"/><span className="spotlight-fade"/></button></div><div className="spotlight-copy"><p className="eyebrow">PMSELECT / SELECTED</p><h2><button onClick={() => onOpen(featured)}>{featured.name}</button></h2>{featured.desc && <p className="spotlight-description">{featured.desc}</p>}<p className="spotlight-price">{priceOf(featured.price)}</p><div className="detail-badges">{(featured.badges || []).map(b => <span key={b}>{badges[b] || b}</span>)}</div></div></section>}
    <div className="collection-ribbon" aria-label="PMSELECT CARS — оглед и тест драйв"><span>PMSELECT CARS</span><i/><span>ТЕСТ ДРАЙВ</span><i/><span>ОГЛЕД НА МЯСТО</span></div>
    {lot.demoExpired ? <div className="apex-empty" role="status">Пробният период е приключил — това е демо версия на приложението.</div> : <>
    <main id="inventory" className="apex-inventory">
      <h2 className="sr-only">{onlySaved ? 'Любими автомобили' : 'Автомобилна селекция'}</h2>
      {error ? <div className="apex-empty" role="alert"><h3>Връзката с каталога е прекъсната</h3><p>Не успяхме да заредим актуалните автомобили.</p><button className="button secondary" onClick={() => location.reload()}>Опитай отново</button></div> : <>
      <div className="category-tabs" aria-label="Категории"><button aria-pressed={category === 'all'} onClick={() => setCategory('all')}>Всички</button>{(lot.sections || []).map((s, i) => <button key={i} aria-pressed={category === s.label} onClick={() => setCategory(s.label)}>{s.label}</button>)}</div>
      <div hidden={!searchOpen} className="search-panel"><div className="filter-toolbar"><label className="search-field"><span aria-hidden="true">⌕</span><input aria-label="Търси марка или модел" placeholder="Марка, модел или ключова дума" value={query} onChange={e => setQuery(e.target.value)}/>{query && <button aria-label="Изчисти търсенето" onClick={() => setQuery('')}>×</button>}</label><label className="sort-field"><span>Подреди по</span><select value={sort} onChange={e => setSort(e.target.value)}><option value="featured">Препоръчани</option><option value="price-up">Цена: възходящо</option><option value="price-down">Цена: низходящо</option><option value="year">Най-нови години</option></select></label></div>
      <details className="advanced-filters"><summary>Филтри <span>Гориво, цена, година и още +</span></summary><div className="filter-grid"><label>Гориво<select value={fuel} onChange={e => setFuel(e.target.value)}><option value="">Всички</option>{[...new Set(cars.map(c => c.fuel).filter(Boolean))].map(v => <option key={v}>{v}</option>)}</select></label><label>Скоростна кутия<select value={gearbox} onChange={e => setGearbox(e.target.value)}><option value="">Всички</option>{[...new Set(cars.map(c => c.gearbox).filter(Boolean))].map(v => <option key={v}>{v}</option>)}</select></label><label>Цена до (€)<input type="number" min="0" value={maxPrice} onChange={e => setMaxPrice(e.target.value)} placeholder="Без ограничение"/></label><label>Година от<input type="number" min="1900" max="2100" value={minYear} onChange={e => setMinYear(e.target.value)} placeholder="Всички години"/></label><label>Пробег до (км)<input type="number" min="0" value={maxMileage} onChange={e => setMaxMileage(e.target.value)} placeholder="Без ограничение"/></label><button className="text-button" onClick={reset}>Изчисти филтрите ↺</button></div></details>
      </div><div className="results-label" aria-live="polite">{filtered.length} {filtered.length === 1 ? 'автомобил' : 'автомобила'}</div>
      <div className="apex-grid">{filtered.map((car, i) => <article className="apex-car" key={car.listKey} style={{ '--delay': `${Math.min(i, 5) * 45}ms` }}><button className="car-link" onClick={() => onOpen(car)} aria-label={`Разгледай ${car.name}`}><div className="car-photo">{imagesOf(car)[0] ? <img src={imagesOf(car)[0]} alt={car.name} loading="lazy" decoding="async" fetchPriority="low"/> : <div className="photo-missing">Снимките предстоят</div>}</div><div className="car-copy"><h3>{car.name}</h3><p className="car-spec-line">{[car.year || car.productionDate, car.fuel].filter(Boolean).join(' • ')}</p><div className="car-bottom"><strong>{priceOf(car.price)}</strong><span className="car-arrow" aria-hidden="true">↗</span></div></div></button><button className="save-car" aria-label={`${saved.includes(carKey(car)) ? 'Премахни от' : 'Добави в'} любими: ${car.name}`} aria-pressed={saved.includes(carKey(car))} onClick={() => toggleSaved(car)}>{saved.includes(carKey(car)) ? '♥' : '♡'}</button>{car.featured && <span className="car-badge">Избран</span>}</article>)}</div>
      {!filtered.length && <div className="apex-empty"><h3>{onlySaved ? 'Все още няма любими' : cars.length ? 'Няма съвпадения' : 'Селекцията се подготвя'}</h3><p>{cars.length ? 'Промени филтрите, за да разгледаш други автомобили.' : 'Свържи се с нас за актуални предложения.'}</p>{cars.length > 0 && <button className="button secondary" onClick={reset}>Изчисти филтрите</button>}</div>}
      </>}
    </main>
    <section id="services" className="apex-services"><div className="section-heading"><div><p className="eyebrow">02 / ЛИЧЕН ПОДХОД</p><h2>Следващата стъпка.<br/><em>С увереност.</em></h2></div><p>От първия въпрос до огледа.<br/>Нека обсъдим какво търсиш.</p></div><div className="services-grid">{[['01', 'Оглед и тест драйв', 'Свържи се с нас, за да уточним удобен час и наличността на избрания автомобил.'], ['02', 'Лизинг и бартер', 'Попитай за възможностите и условията за конкретния автомобил.'], ['03', 'Твоите въпроси', 'Получи информация за оборудването, историята и състоянието преди огледа.']].map(([n, title, copy]) => <article key={n}><span>{n} /</span><h3>{title}</h3><p>{copy}</p><a href="#contact" aria-label={`${title} — свържи се с нас`}>↗</a></article>)}</div>{lot.fullGalleryImages?.length > 0 && <button className="button secondary" onClick={onGallery}>Галерия на автокъщата ↗</button>}</section>
    </>}
    <footer id="contact" className="apex-contact"><p className="eyebrow">03 / ДА ПОГОВОРИМ</p><h2>Твоят следващ<br/><em>автомобил е тук.</em></h2>{lot.phone && <a className="contact-phone" href={`tel:${lot.phone.replace(/\s/g, '')}`}>{lot.phone} ↗</a>}{lot.footerNote && <p className="footer-note">{lot.footerNote}</p>}<div className="footer-bottom"><span>© {new Date().getFullYear()} {BRAND}</span><button className="text-button" onClick={onAdmin}>Администрация ↗</button></div></footer>
    <nav className="apex-bottom-nav" aria-label="Мобилна навигация">
      <button className={!searchOpen && !onlySaved && activeNav !== 'contact' ? 'is-active' : ''} aria-current={!searchOpen && !onlySaved && activeNav !== 'contact' ? 'page' : undefined} onClick={() => { setOnlySaved(false); setSearchOpen(false); navigate('home'); }}><Icon name="home"/><span>Начало</span></button>
      <button className={searchOpen ? 'is-active' : ''} aria-current={searchOpen ? 'page' : undefined} aria-label="Търсене и филтри" onClick={() => { setOnlySaved(false); setSearchOpen(v => !v); onNavigate({ key: 'inventory', target: 'inventory' }); }}><Icon name="inventory"/><span>Търси</span></button>
      <button className={onlySaved ? 'is-active' : ''} aria-current={onlySaved ? 'page' : undefined} aria-label="Любими автомобили" onClick={() => { setSearchOpen(false); setOnlySaved(v => !v); onNavigate({ key: 'inventory', target: 'inventory' }); }}><svg width="21" height="21" viewBox="0 0 24 24" fill={onlySaved ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="1.5" aria-hidden="true"><path d="M12 21S2 15 2 8a5 5 0 0 1 10-1 5 5 0 0 1 10 1c0 7-10 13-10 13Z"/></svg><span>Любими</span></button>
      <button aria-label="Контакти" aria-current={!searchOpen && !onlySaved && activeNav === 'contact' ? 'page' : undefined} className={!searchOpen && !onlySaved && activeNav === 'contact' ? 'is-active' : ''} onClick={() => { setSearchOpen(false); setOnlySaved(false); navigate('contact'); }}><Icon name="contact"/><span>Контакт</span></button>
    </nav>
    </div>
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
  const go = n => { if (photos.length > 1) setCurrent((n + photos.length) % photos.length); };
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
    <header className="detail-header"><button className="text-button" onClick={onBack}>← {preview ? 'Към редактора' : 'Към колекцията'}</button><span>{preview ? 'ПРЕГЛЕД' : 'ДЕТАЙЛИ'}</span></header>
    <div className="detail-layout"><section className="detail-gallery" aria-label="Снимки на автомобила"><div className="detail-main-photo" {...swipe}>{photos.length ? <><button ref={launch} className="photo-expand" onClick={() => setFullscreen(true)} aria-label="Отвори снимката на цял екран"><img key={photos[current]} className="detail-photo-fade" src={photos[current]} alt={`${car.name}, снимка ${current + 1}`} fetchPriority="high" decoding="async"/></button><span className="photo-counter">{String(current + 1).padStart(2, '0')} / {String(photos.length).padStart(2, '0')}</span>{photos.length > 1 && <div className="photo-controls"><button onClick={() => go(current - 1)} aria-label="Предишна снимка">←</button><button onClick={() => go(current + 1)} aria-label="Следваща снимка">→</button></div>}</> : <div className="photo-missing">Няма качени снимки</div>}</div><div className="detail-thumbnails">{photos.map((url, i) => <button key={url + i} onClick={() => setCurrent(i)} aria-label={`Снимка ${i + 1}`} aria-pressed={i === current}><img src={url} alt="" loading="lazy"/></button>)}</div></section>
    <section className="detail-info"><p className="eyebrow">{car.sectionLabel || 'PMSELECT CARS / СЕЛЕКЦИЯТА'}</p><h1>{car.name}</h1><p className="detail-price">{priceOf(car.price)}</p><div className="detail-badges">{(car.badges || []).map(b => <span key={b}>{badges[b] || b}</span>)}</div>
    <div className="detail-tabs" role="tablist" aria-label="Информация за автомобила">{[['overview', 'Преглед'], ['specs', 'Характеристики'], ['description', 'Описание']].map(([key, label], i, tabs) => <button key={key} role="tab" id={`tab-${key}`} aria-controls={`panel-${key}`} aria-selected={tab === key} tabIndex={tab === key ? 0 : -1} onClick={() => setTab(key)} onKeyDown={e => { if (['ArrowRight', 'ArrowLeft', 'Home', 'End'].includes(e.key)) { e.preventDefault(); const n = e.key === 'Home' ? 0 : e.key === 'End' ? 2 : (i + (e.key === 'ArrowRight' ? 1 : 2)) % 3; setTab(tabs[n][0]); document.getElementById(`tab-${tabs[n][0]}`)?.focus(); } }}>{label}</button>)}</div>
    <div role="tabpanel" id={`panel-${tab}`} aria-labelledby={`tab-${tab}`} className="detail-panel">{tab === 'overview' ? <><div className="detail-highlights">{rows.slice(0, 3).map(([label, value]) => <div key={label}><span>{label}</span><strong>{value}</strong></div>)}</div><h2>Описание</h2><p>{car.desc || 'Свържи се с нас за повече информация за автомобила.'}</p></> : tab === 'specs' ? <dl className="specification-list">{rows.length ? rows.map(([label, value]) => <div key={label}><dt>{label}</dt><dd>{value}</dd></div>) : <p>Характеристиките предстои да бъдат добавени.</p>}</dl> : <p className="preserve-lines">{car.additionalInfo || car.desc || 'Няма добавено описание.'}</p>}</div>
    {phone && <div className="detail-action"><span>Уговори своя оглед<small>{phone}</small></span><a className="button primary" href={`tel:${phone.replace(/\s/g, '')}`}>Обади се ↗</a></div>}</section></div>
    {fullscreen && <dialog ref={dialog} className="apex-lightbox" onCancel={e => { e.preventDefault(); setFullscreen(false); }} onKeyDown={e => { if (e.key === 'ArrowLeft') go(current - 1); if (e.key === 'ArrowRight') go(current + 1); }} aria-label={`Галерия — ${car.name}`}><button className="lightbox-close" autoFocus onClick={() => setFullscreen(false)} aria-label="Затвори галерията">×</button><div {...swipe}><img src={photos[current]} alt={`${car.name}, снимка ${current + 1}`}/></div><div className="lightbox-controls"><button onClick={() => go(current - 1)} disabled={photos.length < 2} aria-label="Предишна снимка">←</button><span>{current + 1} / {photos.length}</span><button onClick={() => go(current + 1)} disabled={photos.length < 2} aria-label="Следваща снимка">→</button></div></dialog>}
  </main>;
}

export function ShowroomSkeleton() { return <div className="apex-loading" role="status" aria-label="Зареждане на автомобилите"><Mark/><div className="skeleton-hero"/><p>Подготвяме селекцията…</p><div className="skeleton-grid">{[0, 1, 2].map(i => <div key={i}/>)}</div></div>; }
