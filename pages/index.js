import { useState, useEffect } from 'react';
import Head from 'next/head';
import { db } from '../lib/firebase';
import { doc, getDoc, setDoc, collection, getDocs, addDoc, increment } from 'firebase/firestore';
import { isIOSDevice, isStandaloneMode, getCarImages, getBadgeColors } from '../lib/carLotHelpers';
import { defaultLot, BADGE_LABELS } from '../lib/carLotData';
import SuggestInput from '../components/SuggestInput';
import ImageUploader from '../components/ImageUploader';
import FullGalleryUploader from '../components/FullGalleryUploader';
import CarGalleryUploader from '../components/CarGalleryUploader';
import CarCard from '../components/CarCard';
import CarPickerModal from '../components/CarPickerModal';
import InstallBanner from '../components/InstallBanner';
import { TECH_SUGGESTIONS, CAR_CARD_ACCENTS } from '../lib/carLotData';

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://pmselect.vercel.app';

export default function Home() {
  const [lot, setLot] = useState(null);
  const [screen, setScreen] = useState('lot');
  const [password, setPassword] = useState('');
  const [loginError, setLoginError] = useState(false);
  const [toast, setToast] = useState('');
  const [adminLot, setAdminLot] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [dark, setDark] = useState(true);
  const [headerVisible, setHeaderVisible] = useState(false);
  const [catalog, setCatalog] = useState([]);
  const [catalogLoading, setCatalogLoading] = useState(false);
  const [pickerSection, setPickerSection] = useState(null);
  const [pickerSearch, setPickerSearch] = useState('');
  const [installPromptEvent, setInstallPromptEvent] = useState(null);
  const [showInstallBanner, setShowInstallBanner] = useState(false);
  const [iosDevice, setIosDevice] = useState(false);
  const [todayViews, setTodayViews] = useState(null);
  const [galleryPage, setGalleryPage] = useState(0);
  const [selectedCar, setSelectedCar] = useState(null);
  const [carPhotoPage, setCarPhotoPage] = useState(0);
  const [currentPass, setCurrentPass] = useState(process.env.NEXT_PUBLIC_ADMIN_PASS || '1234');
  const [newPass1, setNewPass1] = useState('');
  const [newPass2, setNewPass2] = useState('');
  const [passSaving, setPassSaving] = useState(false);
  const [passMsg, setPassMsg] = useState('');
  const [pmImporting, setPmImporting] = useState(false);
  const [pmImportMsg, setPmImportMsg] = useState('');
  const badgeColors = getBadgeColors(dark);

  useEffect(() => {
    const saved = localStorage.getItem('lot_dark');
    if (saved !== null) setDark(saved === '1');

    async function loadLot() {
      try {
        const snap = await getDoc(doc(db, 'lot', 'daily'));

        if (snap.exists()) {
          const data = snap.data();
          if (!Array.isArray(data.fullGalleryImages)) data.fullGalleryImages = [];
          if (Array.isArray(data.sections)) {
            data.sections = data.sections.map(sec => ({
              ...sec,
              cars: (sec.cars || []).map(c => {
                const images = getCarImages(c);
                return {
                  productionDate: '', engine: '', euroStandard: '', displacement: '', color: '', additionalInfo: '',
                  ...c, images, image: images[0] || c.image || ''
                };
              })
            }));
          }
          setLot(data);
        } else {
          setLot(defaultLot);
        }
      } catch (e) {
        setLot(defaultLot);
      }

      setLoading(false);
      setTimeout(() => setHeaderVisible(true), 50);
    }

    loadLot();

    async function loadPassword() {
      try {
        const snap = await getDoc(doc(db, 'settings', 'admin'));
        if (snap.exists() && snap.data().password) {
          setCurrentPass(snap.data().password);
        }
      } catch (e) {
        console.error('Грешка при зареждане на паролата:', e);
      }
    }

    loadPassword();
  }, []);

  useEffect(() => {
    async function trackView() {
      const now = new Date();
      const todayKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
      const ref = doc(db, 'stats', todayKey);
      const sessionFlag = `lot_viewed_${todayKey}`;

      try {
        if (!sessionStorage.getItem(sessionFlag)) {
          await setDoc(ref, { count: increment(1), date: todayKey }, { merge: true });
          sessionStorage.setItem(sessionFlag, '1');
        }

        const snap = await getDoc(ref);
        setTodayViews(snap.exists() ? (snap.data().count || 0) : 0);
      } catch (e) {
        console.error('Грешка при брояча на посещения:', e);
        setTodayViews(0);
      }
    }

    trackView();
  }, []);

  useEffect(() => {
    if (isStandaloneMode()) return;

    const dismissedAt = localStorage.getItem('lot_install_dismissed');
    if (dismissedAt && Date.now() - parseInt(dismissedAt, 10) < 14 * 24 * 60 * 60 * 1000) return;

    const visits = parseInt(localStorage.getItem('lot_visits') || '0', 10) + 1;
    localStorage.setItem('lot_visits', String(visits));

    if (isIOSDevice()) {
      setIosDevice(true);
      if (visits >= 2) setShowInstallBanner(true);
      return;
    }

    function handleBeforeInstallPrompt(e) {
      e.preventDefault();
      setInstallPromptEvent(e);
      if (visits >= 2) setShowInstallBanner(true);
    }

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    return () => window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
  }, []);

  async function handleInstallClick() {
    if (!installPromptEvent) return;

    installPromptEvent.prompt();
    const choice = await installPromptEvent.userChoice;

    setShowInstallBanner(false);
    setInstallPromptEvent(null);

    if (choice.outcome !== 'accepted') {
      localStorage.setItem('lot_install_dismissed', String(Date.now()));
    }
  }

  function dismissInstallBanner() {
    setShowInstallBanner(false);
    localStorage.setItem('lot_install_dismissed', String(Date.now()));
  }

  function toggleDark() {
    const next = !dark;
    setDark(next);
    localStorage.setItem('lot_dark', next ? '1' : '0');
  }

  function showToast(msg) {
    setToast(msg);
    setTimeout(() => setToast(''), 2500);
  }

  function doLogin() {
    if (password === currentPass) {
      setAdminLot(JSON.parse(JSON.stringify(lot)));
      setScreen('admin');
      setLoginError(false);
    } else {
      setLoginError(true);
    }
  }

  async function changePassword() {
    setPassMsg('');

    if (!newPass1 || newPass1.length < 4) {
      setPassMsg('Паролата трябва да е поне 4 символа.');
      return;
    }

    if (newPass1 !== newPass2) {
      setPassMsg('Паролите не съвпадат.');
      return;
    }

    setPassSaving(true);

    try {
      await setDoc(doc(db, 'settings', 'admin'), { password: newPass1 }, { merge: true });
      setCurrentPass(newPass1);
      setNewPass1('');
      setNewPass2('');
      setPassMsg('Паролата е сменена успешно.');
      showToast('Паролата е сменена ✓');
    } catch (e) {
      console.error('Грешка при смяна на паролата:', e);
      setPassMsg('Грешка при запис. Опитай отново.');
    }

    setPassSaving(false);
  }

  async function importPmSelect() {
    if (!confirm('Да заредя ли текущите автомобили от PM SELECT mobile.bg? Текущите категории в админ панела ще бъдат заменени.')) return;
    setPmImporting(true);
    setPmImportMsg('');
    try {
      const res = await fetch('/api/import-pmselect');
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || 'Грешка при импортиране');
      if (!data?.sections?.length) throw new Error('Не са намерени автомобили');
      const importedLot = {
        ...adminLot,
        dealershipName: data.dealershipName || adminLot.dealershipName,
        phone: data.phone || adminLot.phone,
        sections: data.sections
      };
      await setDoc(doc(db, 'lot', 'daily'), importedLot);
      setAdminLot(importedLot);
      setLot(importedLot);
      setPmImportMsg(`Импортирани и записани са ${data.count || 0} автомобила във Firebase. За всяка обява са взети до 15 налични снимки и цялото описание от Mobile.bg.`);
      showToast(`Импортирани ${data.count || 0} автомобила ✓`);
    } catch (e) {
      console.error(e);
      setPmImportMsg('Грешка: ' + (e.message || 'Неуспешно импортиране'));
    }
    setPmImporting(false);
  }

  async function saveLot() {
    setSaving(true);

    try {
      const m = JSON.parse(JSON.stringify(adminLot));

      for (const sec of m.sections) {
        for (const c of sec.cars) {
          if (!c.name || !c.name.trim()) continue;

          const catalogData = {
            name: c.name,
            desc: c.desc || '',
            price: c.price || '',
            year: c.year || '',
            mileage: c.mileage || '',
            fuel: c.fuel || '',
            power: c.power || '',
            gearbox: c.gearbox || '',
            productionDate: c.productionDate || '',
            engine: c.engine || '',
            euroStandard: c.euroStandard || '',
            displacement: c.displacement || '',
            color: c.color || '',
            additionalInfo: c.additionalInfo || '',
            badges: c.badges || [],
            image: getCarImages(c)[0] || '',
            images: getCarImages(c),
            category: sec.label
          };

          if (c.catalogId) {
            await setDoc(doc(db, 'cars', c.catalogId), catalogData, { merge: true });
          } else {
            const ref = await addDoc(collection(db, 'cars'), catalogData);
            c.catalogId = ref.id;
          }
        }
      }

      await setDoc(doc(db, 'lot', 'daily'), m);
      setLot(m);
      setAdminLot(m);
      showToast('Автокъщата е записана ✓');
      setTimeout(() => setScreen('lot'), 1200);
    } catch (e) {
      showToast('Грешка при записване!');
    }

    setSaving(false);
  }

  async function loadCatalog() {
    setCatalogLoading(true);

    try {
      const snap = await getDocs(collection(db, 'cars'));
      const list = snap.docs.map(docSnap => ({ id: docSnap.id, ...docSnap.data() }));
      list.sort((a, b) => (a.name || '').localeCompare(b.name || '', 'bg'));
      setCatalog(list);
    } catch (e) {
      showToast('Грешка при зареждане на каталога');
    }

    setCatalogLoading(false);
  }

  function openPicker(si) {
    setPickerSearch('');
    setPickerSection(si);
    loadCatalog();
  }

  function addCarFromCatalog(si, car) {
    const m = JSON.parse(JSON.stringify(adminLot));

    m.sections[si].cars.push({
      name: car.name || '',
      desc: car.desc || '',
      price: car.price || '',
      year: car.year || '',
      mileage: car.mileage || '',
      fuel: car.fuel || '',
      power: car.power || '',
      gearbox: car.gearbox || '',
      productionDate: car.productionDate || '',
      engine: car.engine || '',
      euroStandard: car.euroStandard || '',
      displacement: car.displacement || '',
      color: car.color || '',
      additionalInfo: car.additionalInfo || '',
      badges: car.badges || [],
      image: getCarImages(car)[0] || '',
      images: getCarImages(car),
      catalogId: car.id
    });

    setAdminLot(m);
    showToast(`„${car.name}“ добавен ✓`);
  }

  function updateCar(si, ci, field, val) {
    const m = JSON.parse(JSON.stringify(adminLot));
    m.sections[si].cars[ci][field] = val;
    setAdminLot(m);
  }

  function updateCarImages(si, ci, images) {
    const m = JSON.parse(JSON.stringify(adminLot));
    const clean = (Array.isArray(images) ? images : []).filter(Boolean).slice(0, 15);
    m.sections[si].cars[ci].images = clean;
    m.sections[si].cars[ci].image = clean[0] || '';
    setAdminLot(m);
  }

  function toggleBadge(si, ci, badge) {
    const m = JSON.parse(JSON.stringify(adminLot));
    const c = m.sections[si].cars[ci];
    const idx = c.badges.indexOf(badge);

    if (idx > -1) c.badges.splice(idx, 1);
    else c.badges.push(badge);

    setAdminLot(m);
  }

  function deleteCar(si, ci) {
    const m = JSON.parse(JSON.stringify(adminLot));
    m.sections[si].cars.splice(ci, 1);
    setAdminLot(m);
  }

  function addCar(si) {
    const m = JSON.parse(JSON.stringify(adminLot));
    m.sections[si].cars.push({ name: '', desc: '', price: '', year: '', mileage: '', fuel: '', power: '', gearbox: '', productionDate: '', engine: '', euroStandard: '', displacement: '', color: '', additionalInfo: '', badges: [], image: '', images: [] });
    setAdminLot(m);
  }

  function addSectionAfter(si) {
    const m = JSON.parse(JSON.stringify(adminLot));
    m.sections.splice(si + 1, 0, { label: 'Нова категория', cars: [] });
    setAdminLot(m);
  }

  function deleteSection(si) {
    const m = JSON.parse(JSON.stringify(adminLot));
    m.sections.splice(si, 1);
    setAdminLot(m);
  }

  function updateSectionLabel(si, label) {
    const m = JSON.parse(JSON.stringify(adminLot));
    m.sections[si].label = label;
    setAdminLot(m);
  }

  const bg = dark ? '#0d0f12' : '#F5F6F7';
  const cardBg = dark ? '#1b1f26' : 'white';
  const textMain = dark ? '#F1F3F5' : '#12151A';
  const textSub = dark ? '#a8b0ba' : '#5B6470';
  const border = dark ? 'rgba(140,150,160,0.18)' : 'rgba(140,150,160,0.28)';

  if (loading) return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: '#0d0f12' }}>
      <style>{`@keyframes pulse { 0%,100%{opacity:0.4;transform:scale(0.95)} 50%{opacity:1;transform:scale(1.05)} } @keyframes spin { to{transform:rotate(360deg)} }`}</style>
      <div style={{ fontSize: 32, animation: 'pulse 1.5s ease infinite' }}>🚗</div>
      <div style={{ marginTop: 16, color: '#C9A227', fontSize: 11, letterSpacing: '0.2em', textTransform: 'uppercase' }}>Зареждане</div>
      <div style={{ marginTop: 12, width: 32, height: 32, border: '2px solid rgba(201,162,39,0.2)', borderTop: '2px solid #C9A227', borderRadius: '50%', animation: 'spin 0.9s linear infinite' }} />
    </div>
  );

  return (
    <>
      <Head>
        <title>{lot?.dealershipName || 'Автокъща'} — Автомобили във Варна</title>
        <meta name="description" content={`${lot?.dealershipName || 'Автокъща'} — автомобилен каталог във Варна. ${lot?.footerNote ? lot.footerNote.replace(/\n/g, ' ') : 'Оглед и тест драйв на място, възможност за лизинг и бартер.'}`} />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <meta name="theme-color" content={dark ? '#0d0f12' : '#12151A'} />
        <link rel="manifest" href="/manifest.json" />
        <link rel="canonical" href={SITE_URL} />

        <meta property="og:type" content="website" />
        <meta property="og:locale" content="bg_BG" />
        <meta property="og:title" content={`${lot?.dealershipName || 'Автокъща'} — Автомобили във Варна`} />
        <meta property="og:description" content={`Автомобилен каталог във Варна. ${lot?.footerNote ? lot.footerNote.replace(/\n/g, ' ') : 'Оглед и тест драйв на място, възможност за лизинг и бартер.'}`} />
        <meta property="og:url" content={SITE_URL} />
        <meta property="og:image" content={`${SITE_URL}/pm-select-hero.png`} />
        <meta property="og:site_name" content={lot?.dealershipName || 'Автокъща'} />

        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content={`${lot?.dealershipName || 'Автокъща'} — Автомобили във Варна`} />
        <meta name="twitter:description" content={`Автомобилен каталог във Варна. ${lot?.footerNote ? lot.footerNote.replace(/\n/g, ' ') : 'Оглед и тест драйв на място, възможност за лизинг и бартер.'}`} />
        <meta name="twitter:image" content={`${SITE_URL}/pm-select-hero.png`} />
      </Head>

      <style>{`
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; background: ${bg}; transition: background 0.3s; }
        input, button, select { font-family: inherit; }

        @keyframes fadeDown {
          from { opacity: 0; transform: translateY(-12px); }
          to { opacity: 1; transform: translateY(0); }
        }

        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }

        /* НАПЪЛНО ПРЕМИУМ ДИЗАЙН ЗА НАЧАЛНАТА СТРАНИЦА */
        .lux-top { background: #080a0c; border-bottom: 1px solid rgba(210,171,83,.35); color: #eee; }
        .lux-top-inner { max-width: 1180px; margin: auto; padding: 9px 28px; display: flex; gap: 28px; align-items: center; font-size: 12px; }
        .lux-top-inner .spacer { flex: 1; }
        .lux-contact { color: #e0b85c; }
        
        .lot-hero {
          min-height: 520px;
          background: url('/pm-select-hero.png') center/cover no-repeat;
          position: relative;
          display: flex;
          align-items: flex-end;
          padding-bottom: 40px;
        }

        .lux-inventory { max-width: 1180px; margin: auto; padding: 40px 28px 60px; }
        .lux-section-title { display: flex; align-items: center; gap: 18px; margin-bottom: 24px; color: #f5f5f5; font-size: 22px; font-weight: 700; letter-spacing: .08em; }
        .lux-section-title:after { content: ''; height: 1px; flex: 1; background: linear-gradient(90deg, #b9913e, transparent); }

        .lux-grid { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 20px; }
        
        .lux-footer-banner { max-width: 1180px; margin: 0 auto 40px; border-top: 1px solid #6c562c; border-bottom: 1px solid #6c562c; padding: 32px 28px; color: #ddd; display: flex; justify-content: space-between; align-items: center; background: rgba(11,13,15,0.6); }
        .lux-footer-banner b { font-family: Georgia, serif; color: #e2b75b; font-size: 24px; }
        .lux-cta { background: linear-gradient(100deg, #d8bc8a, #f0ddbb, #c69f64); border: 0; color: #090909; font-weight: 800; letter-spacing: .04em; padding: 14px 24px; border-radius: 4px; text-decoration: none; display: inline-block; }
        
        .lux-footer { border-top: 1px solid #282b30; padding: 30px 24px; color: #889098; text-align: center; font-size: 12px; background: #07090b; }

        @media(max-width:900px){
          .lux-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); }
          .lux-top-inner span:not(:first-child) { display: none; }
        }
        @media(max-width:600px){
          .lot-hero { min-height: 380px !important; background-image: url(/pm-select-hero-mobile.png) !important; background-size: cover !important; background-position: center center !important; }
          .lux-grid { grid-template-columns: 1fr; }
          .lux-inventory { padding: 24px 14px; }
          .lux-footer-banner { flex-direction: column; gap: 16px; align-items: flex-start; margin: 0 14px 30px; }
        }

        button:not(:disabled), .lux-cta, a[href^="tel:"] {
          transition: transform 0.28s cubic-bezier(0.34, 1.56, 0.64, 1), filter 0.2s ease, box-shadow 0.2s ease;
          will-change: transform;
        }
        button:not(:disabled):active, .lux-cta:active, a[href^="tel:"]:active {
          transform: scale(0.93);
          filter: brightness(0.9);
        }
      `}</style>

      {screen === 'lot' && lot && (
        <div style={{ background: '#080a0c', minHeight: '100vh' }}>
          {lot.demoExpired && (
            <div style={{ position: 'sticky', top: 0, zIndex: 50, background: '#C9302C', color: 'white', textAlign: 'center', padding: '12px 16px', fontSize: 14, fontWeight: 700, letterSpacing: '.02em' }}>
              ⚠ Пробният период е приключил — това е демо версия на приложението.
            </div>
          )}
          
          <div className="lux-top">
            <div className="lux-top-inner">
              <span className="lux-contact">☎ {lot.phone}</span>
              <span>✉ office@pmselect.bg</span>
              <span>⌖ Варна, България</span>
              <span className="spacer" />
              <span>f　◎　♪</span>
            </div>
          </div>

          <section className="lot-hero" aria-label="PM SELECT AUTOMOTIVE — КАЧЕСТВО • КОРЕКТНОСТ • ДОВЕРИЕ">
            <button 
              onClick={() => { setPassword(''); setLoginError(false); setScreen('login'); }} 
              style={{ position: 'absolute', right: 14, bottom: 14, zIndex: 8, background: 'rgba(11,13,15,0.85)', border: '1px solid #8b6d32', color: '#d8ad52', padding: '8px 12px', borderRadius: 6, cursor: 'pointer' }}
            >
              ⚙ Админ
            </button>
          </section>

          {!lot.demoExpired && (
            <>
              <main id="inventory" className="lux-inventory">
                <div className="lux-section-title">АКТУАЛНИ ПРЕДЛОЖЕНИЯ</div>
                {(lot.sections || []).map((sec, si) => (
                  <section key={si} style={{ marginBottom: 36 }}>
                    <div style={{ color: '#d7ad51', fontSize: 12, fontWeight: 700, letterSpacing: '.14em', margin: '0 0 14px', textTransform: 'uppercase' }}>
                      {sec.label}
                    </div>
                    <div className="lux-grid">
                      {sec.cars.map((c, ci) => (
                        <CarCard 
                          key={ci} 
                          c={c} 
                          dark={true} 
                          badgeColors={badgeColors} 
                          index={ci} 
                          onOpen={() => { setSelectedCar({...c, sectionLabel: sec.label}); setCarPhotoPage(0); setScreen('car'); }} 
                        />
                      ))}
                    </div>
                  </section>
                ))}
              </main>

              <div className="lux-footer-banner">
                <div><b>“</b> Автомобили за хора, които не правят компромис със стила.</div>
                <a href={`tel:${(lot.phone || '').replace(/\s/g, '')}`} className="lux-cta">СВЪРЖЕТЕ СЕ С НАС　→</a>
              </div>

              <footer className="lux-footer">
                ⌖ Варна, България　　☎ {lot.phone}　　✉ office@pmselect.bg<br/><br/>
                © 2026 PM SELECT AUTOMOTIVE · Качество. Коректност. Доверие.
              </footer>
            </>
          )}
        </div>
      )}

      {screen === 'car' && selectedCar && (() => {
        const photos = getCarImages(selectedCar);
        const total = photos.length;
        const current = total ? ((carPhotoPage % total) + total) % total : 0;
        const goTo = (n) => total && setCarPhotoPage(((n % total) + total) % total);
        const technicalRows = [
          ['Дата на производство', selectedCar.productionDate || selectedCar.year],
          ['Двигател', selectedCar.engine || selectedCar.fuel],
          ['Мощност', selectedCar.power],
          ['Евростандарт', selectedCar.euroStandard],
          ['Кубатура [куб.см]', selectedCar.displacement],
          ['Скоростна кутия', selectedCar.gearbox],
          ['Категория', selectedCar.category || selectedCar.sectionLabel],
          ['Пробег [км]', selectedCar.mileage],
          ['Цвят', selectedCar.color]
        ].filter(([, v]) => v);

        return (
          <div style={{ background: bg, minHeight: '100vh', color: textMain }}>
            <div style={{ position: 'sticky', top: 0, zIndex: 20, background: dark ? 'rgba(13,15,18,.94)' : 'rgba(245,246,247,.94)', backdropFilter: 'blur(10px)', borderBottom: `1px solid ${border}`, padding: '0.8rem 1rem', display: 'flex', alignItems: 'center', gap: 10 }}>
              <button onClick={() => { setScreen('lot'); setSelectedCar(null); }} style={{ background: 'none', border: '1px solid rgba(201,162,39,.45)', color: '#C9A227', padding: '7px 12px', borderRadius: 8, fontSize: 13, cursor: 'pointer' }}>← Назад</button>
              <div style={{ minWidth: 0, flex: 1 }}>
                <div style={{ fontSize: 14, fontWeight: 800, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{selectedCar.name}</div>
                <div style={{ fontSize: 11, color: textSub }}>Детайли за автомобила</div>
              </div>
            </div>

            <div style={{ maxWidth: 760, margin: '0 auto', padding: '14px 14px 32px' }}>
              {total > 0 ? (
                <>
                  <div style={{ position: 'relative', borderRadius: 14, overflow: 'hidden', background: '#090b0e', border: '1px solid rgba(201,162,39,.3)' }}>
                    <img src={photos[current]} alt={`${selectedCar.name} - снимка ${current + 1}`} style={{ width: '100%', maxHeight: 520, objectFit: 'contain', display: 'block', background: '#090b0e' }} />
                    {total > 1 && <>
                      <button onClick={() => goTo(current - 1)} aria-label="Предишна снимка" style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', width: 42, height: 42, borderRadius: '50%', border: '1px solid rgba(232,184,48,.42)', background: 'rgba(6,7,10,.65)', color: '#E8B830', fontSize: 24, cursor: 'pointer' }}>‹</button>
                      <button onClick={() => goTo(current + 1)} aria-label="Следваща снимка" style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', width: 42, height: 42, borderRadius: '50%', border: '1px solid rgba(232,184,48,.42)', background: 'rgba(6,7,10,.65)', color: '#E8B830', fontSize: 24, cursor: 'pointer' }}>›</button>
                    </>}
                    <div style={{ position: 'absolute', right: 10, bottom: 10, background: 'rgba(6,7,10,.72)', color: '#E8B830', padding: '4px 8px', borderRadius: 20, fontSize: 11 }}>{current + 1} / {total}</div>
                  </div>

                  {total > 1 && (
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(74px, 1fr))', gap: 7, marginTop: 8 }}>
                      {photos.map((url, i) => (
                        <button key={url + i} onClick={() => setCarPhotoPage(i)} style={{ border: i === current ? '2px solid #C9A227' : `1px solid ${border}`, borderRadius: 8, overflow: 'hidden', padding: 0, background: '#111', cursor: 'pointer' }}>
                          <img src={url} alt={`Миниатюра ${i + 1}`} style={{ width: '100%', height: 64, objectFit: 'cover', display: 'block' }} />
                        </button>
                      ))}
                    </div>
                  )}
                </>
              ) : (
                <div style={{ height: 240, borderRadius: 14, background: cardBg, border: `1px solid ${border}`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: textSub, fontSize: 14 }}>Няма качени снимки</div>
              )}

              <div style={{ marginTop: 16, background: cardBg, border: `1px solid ${border}`, borderRadius: 14, padding: '1rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, alignItems: 'flex-start', flexWrap: 'wrap' }}>
                  <div style={{ fontSize: 22, fontWeight: 850 }}>{selectedCar.name}</div>
                  <div style={{ fontSize: 23, fontWeight: 900, color: '#C9A227' }}>{Number(selectedCar.price || 0).toLocaleString('bg-BG')} €</div>
                </div>
                {selectedCar.desc && <div style={{ marginTop: 8, color: textSub, fontSize: 13, lineHeight: 1.6 }}>{selectedCar.desc}</div>}

                {technicalRows.length > 0 && (
                  <div style={{ marginTop: 18, border: `1px solid ${border}`, borderRadius: 12, overflow: 'hidden' }}>
                    <div style={{ padding: '14px 16px 10px', fontSize: 20, fontWeight: 900 }}>Технически данни</div>
                    <div style={{ padding: '0 12px 12px' }}>
                      {technicalRows.map(([label, value], i) => (
                        <div key={label} style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) minmax(0, 1fr)', gap: 14, padding: '11px 12px', background: i % 2 === 0 ? (dark ? 'rgba(255,255,255,.045)' : '#EEF2F8') : 'transparent', alignItems: 'center' }}>
                          <div style={{ fontSize: 14, color: textMain }}>{label}</div>
                          <div style={{ fontSize: 14, fontWeight: 800 }}>{value}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {selectedCar.additionalInfo && (
                  <div style={{ marginTop: 18, border: `1px solid ${border}`, borderRadius: 12, padding: '16px' }}>
                    <div style={{ fontSize: 20, fontWeight: 900, marginBottom: 10 }}>Допълнителна информация</div>
                    <div style={{ whiteSpace: 'pre-wrap', fontSize: 14, lineHeight: 1.75, color: textMain }}>{selectedCar.additionalInfo}</div>
                  </div>
                )}

                {selectedCar.badges?.length > 0 && (
                  <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginTop: 13 }}>
                    {selectedCar.badges.map(b => <span key={b} style={{ fontSize: 10, padding: '3px 8px', borderRadius: 20, fontWeight: 700, background: badgeColors[b]?.bg, color: badgeColors[b]?.color }}>{BADGE_LABELS[b]}</span>)}
                  </div>
                )}

                {lot.phone && (
                  <a href={`tel:${lot.phone.replace(/\s/g, '')}`} style={{ marginTop: 16, display: 'block', width: '100%', textAlign: 'center', textDecoration: 'none', background: '#C9A227', color: '#12151A', padding: '12px 14px', borderRadius: 10, fontSize: 14, fontWeight: 800 }}>📞 Обади се за автомобила</a>
                )}
              </div>
            </div>
          </div>
        );
      })()}

      {screen === 'gallery' && lot && (() => {
        const pages = lot.fullGalleryImages || [];
        const total = pages.length;
        const goTo = (n) => setGalleryPage(((n % total) + total) % total);
        let touchStartX = null;

        function onTouchStart(e) { touchStartX = e.touches[0].clientX; }
        function onTouchEnd(e) {
          if (touchStartX === null) return;
          const dx = e.changedTouches[0].clientX - touchStartX;
          if (dx > 40) goTo(galleryPage - 1);
          else if (dx < -40) goTo(galleryPage + 1);
          touchStartX = null;
        }

        return (
          <div style={{ background: '#06070a', minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
            <div style={{ position: 'sticky', top: 0, zIndex: 20, background: 'rgba(6,7,10,0.85)', backdropFilter: 'blur(10px)', borderBottom: '1px solid rgba(201,162,39,0.25)', padding: '0.9rem 1.1rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10 }}>
              <button onClick={() => setScreen('lot')} style={{ background: 'none', border: '1px solid rgba(232,184,48,0.3)', color: '#E8B830', padding: '7px 12px', borderRadius: 8, fontSize: 13, cursor: 'pointer' }}>
                ← Назад
              </button>

              <div style={{ textAlign: 'center' }}>
                <div style={{ color: '#E8B830', fontSize: 13, fontWeight: 700, letterSpacing: '0.14em', textTransform: 'uppercase' }}>
                  Галерия
                </div>
                <div style={{ color: 'rgba(232,184,48,0.55)', fontSize: 11, marginTop: 2, letterSpacing: '0.05em' }}>
                  Снимка {galleryPage + 1} от {total}
                </div>
              </div>

              <div style={{ width: 68 }} />
            </div>

            <div
              style={{ flex: 1, position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '18px 14px', overflow: 'hidden' }}
              onTouchStart={onTouchStart}
              onTouchEnd={onTouchEnd}
            >
              {total > 1 && (
                <button
                  onClick={() => goTo(galleryPage - 1)}
                  aria-label="Предишна снимка"
                  style={{ position: 'absolute', left: 8, top: '50%', transform: 'translateY(-50%)', zIndex: 5, width: 40, height: 40, borderRadius: '50%', border: '1px solid rgba(232,184,48,0.3)', background: 'rgba(6,7,10,0.55)', color: '#E8B830', fontSize: 18, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', backdropFilter: 'blur(6px)' }}
                >
                  ‹
                </button>
              )}

              <div
                key={galleryPage}
                style={{
                  maxWidth: 560,
                  width: '100%',
                  borderRadius: 16,
                  overflow: 'hidden',
                  background: '#12151a',
                  boxShadow: '0 24px 60px rgba(0,0,0,0.6), 0 2px 0 rgba(232,184,48,0.06) inset',
                  border: '1px solid rgba(201,162,39,0.35)',
                  animation: 'fadeUp 0.35s ease both'
                }}
              >
                <img src={pages[galleryPage]} alt={`Снимка ${galleryPage + 1}`} style={{ width: '100%', display: 'block' }} />
              </div>

              {total > 1 && (
                <button
                  onClick={() => goTo(galleryPage + 1)}
                  aria-label="Следваща снимка"
                  style={{ position: 'absolute', right: 8, top: '50%', transform: 'translateY(-50%)', zIndex: 5, width: 40, height: 40, borderRadius: '50%', border: '1px solid rgba(232,184,48,0.3)', background: 'rgba(6,7,10,0.55)', color: '#E8B830', fontSize: 18, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', backdropFilter: 'blur(6px)' }}
                >
                  ›
                </button>
              )}
            </div>

            {total > 1 && (
              <div style={{ display: 'flex', justifyContent: 'center', gap: 6, padding: '4px 0 22px', flexWrap: 'wrap', maxWidth: 480, margin: '0 auto' }}>
                {pages.map((_, i) => (
                  <button
                    key={i}
                    onClick={() => goTo(i)}
                    aria-label={`Снимка ${i + 1}`}
                    style={{
                      width: i === galleryPage ? 20 : 6,
                      height: 6,
                      borderRadius: 3,
                      border: 'none',
                      cursor: 'pointer',
                      transition: 'width 0.25s ease, background 0.25s ease',
                      background: i === galleryPage ? '#E8B830' : 'rgba(232,184,48,0.28)'
                    }}
                  />
                ))}
              </div>
            )}
          </div>
        );
      })()}

      {screen === 'login' && (
        <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '2rem', background: bg }}>
          <div style={{ fontSize: 18, fontWeight: 600, color: textMain, marginBottom: 4 }}>Вход в администрацията</div>
          <div style={{ fontSize: 13, color: textSub, marginBottom: '1.5rem' }}>Въведете паролата за управление</div>

          <input
            type="password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && doLogin()}
            placeholder="Парола"
            style={{ width: '100%', maxWidth: 320, padding: '10px 14px', border: `0.5px solid ${border}`, borderRadius: 8, fontSize: 14, marginBottom: 10, outline: 'none', background: cardBg, color: textMain }}
          />

          <button onClick={doLogin} style={{ width: '100%', maxWidth: 320, padding: 11, background: '#12151A', color: '#E8B830', border: 'none', borderRadius: 8, fontSize: 14, fontWeight: 600, cursor: 'pointer' }}>
            Влез
          </button>

          {loginError && <div style={{ color: '#E24B4A', fontSize: 12, marginTop: 8 }}>Грешна парола</div>}

          <button onClick={() => setScreen('lot')} style={{ marginTop: '1rem', background: 'none', border: 'none', color: textSub, fontSize: 13, cursor: 'pointer' }}>
            ← Назад към автомобилите
          </button>
        </div>
      )}

      {screen === 'admin' && adminLot && (
        <div style={{ background: '#F5F6F7', minHeight: '100vh' }}>
          <div style={{ background: '#12151A', color: '#E8B830', padding: '1.25rem', display: 'flex', alignItems: 'center', gap: 10 }}>
            <button onClick={() => setScreen('lot')} style={{ background: 'none', border: '0.5px solid rgba(232,184,48,0.35)', color: 'rgba(232,184,48,0.85)', padding: '5px 10px', borderRadius: 4, fontSize: 12, cursor: 'pointer' }}>
              ← Автомобили
            </button>
            <span style={{ fontSize: 15, fontWeight: 600 }}>Управление на автокъщата</span>
            <span style={{ marginLeft: 'auto', fontSize: 12, color: 'rgba(232,184,48,0.8)' }}>
              👁 Днес: {todayViews === null ? '…' : todayViews}
            </span>
          </div>

          <div style={{ padding: '1.25rem' }}>
            <div style={{ marginBottom: '1.5rem' }}>
              <div style={{ fontSize: 11, fontWeight: 600, letterSpacing: '0.12em', textTransform: 'uppercase', color: '#C9A227', marginBottom: 10 }}>
                Автокъща
              </div>

              <input
                value={adminLot.dealershipName}
                onChange={e => setAdminLot({ ...adminLot, dealershipName: e.target.value })}
                placeholder="Име на автокъщата"
                style={{ width: '100%', padding: '8px 12px', border: '0.5px solid rgba(140,150,160,0.3)', borderRadius: 8, fontSize: 14, background: 'white', outline: 'none', marginBottom: 8 }}
              />

              <input
                value={adminLot.phone || ''}
                onChange={e => setAdminLot({ ...adminLot, phone: e.target.value })}
                placeholder="Телефон за връзка"
                style={{ width: '100%', padding: '8px 12px', border: '0.5px solid rgba(140,150,160,0.3)', borderRadius: 8, fontSize: 14, background: 'white', outline: 'none', marginBottom: 8 }}
              />

              <input
                value={adminLot.footerNote}
                onChange={e => setAdminLot({ ...adminLot, footerNote: e.target.value })}
                placeholder="Бележка в долната част"
                style={{ width: '100%', padding: '8px 12px', border: '0.5px solid rgba(140,150,160,0.3)', borderRadius: 8, fontSize: 14, background: 'white', outline: 'none' }}
              />

              <label style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 12, padding: '10px 12px', border: '0.5px solid rgba(201,162,39,0.4)', borderRadius: 8, background: adminLot.demoExpired ? '#FBF6E4' : 'white', cursor: 'pointer' }}>
                <input
                  type="checkbox"
                  checked={!!adminLot.demoExpired}
                  onChange={e => setAdminLot({ ...adminLot, demoExpired: e.target.checked })}
                />
                <span style={{ fontSize: 13, color: '#12151A' }}>
                  Покажи на сайта, че пробният период е приключил (демо версия)
                </span>
              </label>

              <div style={{ marginTop: 10 }}>
                <div style={{ fontSize: 11, color: '#C9A227', marginBottom: 6 }}>ФОН НА ХЕДЪРА (СНИМКА ИЛИ MP4)</div>
                <ImageUploader value={adminLot.heroImage || ''} onChange={url => setAdminLot({ ...adminLot, heroImage: url })} allowVideo />
              </div>

              <div style={{ marginTop: 14 }}>
                <div style={{ fontSize: 11, color: '#C9A227', marginBottom: 6 }}>ГАЛЕРИЯ НА АВТОКЪЩАТА — ДО 30 СНИМКИ</div>
                <FullGalleryUploader value={adminLot.fullGalleryImages || []} onChange={imgs => setAdminLot({ ...adminLot, fullGalleryImages: imgs })} />
              </div>
            </div>

            <div style={{ marginBottom: '1.5rem', background: 'white', border: '1px solid rgba(201,162,39,0.35)', borderRadius: 10, padding: '0.9rem 1rem' }}>
              <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: '#C9A227', marginBottom: 8 }}>
                Импорт от PM SELECT mobile.bg
              </div>
              <div style={{ fontSize: 12, color: '#59616B', lineHeight: 1.55, marginBottom: 10 }}>
                Зарежда всички текущи обяви, техническите данни, допълнителната информация и до 15 налични снимки за автомобил. Снимките остават свързани към оригиналните публични URL адреси на обявите.
              </div>
              <button
                onClick={importPmSelect}
                disabled={pmImporting}
                style={{ background: '#12151A', color: '#E8B830', border: 'none', padding: '9px 14px', borderRadius: 8, fontSize: 13, fontWeight: 700, cursor: pmImporting ? 'default' : 'pointer', opacity: pmImporting ? 0.6 : 1 }}
              >
                {pmImporting ? '⏳ Импортиране...' : '↻ Зареди автомобилите от PM Select'}
              </button>
              {pmImportMsg && (
                <div style={{ marginTop: 9, fontSize: 12, lineHeight: 1.5, color: pmImportMsg.startsWith('Грешка') ? '#c0392b' : '#2e7d32' }}>
                  {pmImportMsg}
                </div>
              )}
            </div>

            <div style={{ marginBottom: '1.5rem', background: 'white', border: '0.5px solid rgba(140,150,160,0.3)', borderRadius: 10, padding: '0.9rem 1rem' }}>
              <div style={{ fontSize: 11, fontWeight: 600, letterSpacing: '0.12em', textTransform: 'uppercase', color: '#C9A227', marginBottom: 10 }}>
                Смяна на парола за админ
              </div>

              <input
                type="password"
                value={newPass1}
                onChange={e => setNewPass1(e.target.value)}
                placeholder="Нова парола"
                style={{ width: '100%', padding: '8px 12px', border: '0.5px solid rgba(140,150,160,0.3)', borderRadius: 8, fontSize: 14, background: '#F9FAFA', outline: 'none', marginBottom: 8 }}
              />

              <input
                type="password"
                value={newPass2}
                onChange={e => setNewPass2(e.target.value)}
                placeholder="Потвърди новата парола"
                style={{ width: '100%', padding: '8px 12px', border: '0.5px solid rgba(140,150,160,0.3)', borderRadius: 8, fontSize: 14, background: '#F9FAFA', outline: 'none', marginBottom: 8 }}
              />

              {passMsg && (
                <div style={{ fontSize: 12, color: passMsg.includes('успешно') ? '#2e7d32' : '#c0392b', marginBottom: 8 }}>
                  {passMsg}
                </div>
              )}

              <button
                onClick={changePassword}
                disabled={passSaving}
                style={{ background: '#12151A', color: '#E8B830', border: 'none', padding: '8px 16px', borderRadius: 8, fontSize: 13, cursor: 'pointer', opacity: passSaving ? 0.6 : 1 }}
              >
                {passSaving ? 'Запис...' : 'Смени паролата'}
              </button>
            </div>

            {adminLot.sections.map((sec, si) => (
              <div key={si} style={{ marginBottom: '1.5rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
                  <div style={{ flex: 1 }}>
                    <SuggestInput
                      value={sec.label}
                      onChange={e => updateSectionLabel(si, e.target.value)}
                      placeholder="Категория"
                      options={TECH_SUGGESTIONS.category}
                      style={{ fontSize: 12, fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#C9A227', background: 'white' }}
                    />
                  </div>

                  <button
                    onClick={() => deleteSection(si)}
                    title="Изтрий категорията"
                    style={{ background: 'none', border: 'none', color: '#E24B4A', fontSize: 18, opacity: 0.6, padding: '0 4px', cursor: 'pointer' }}
                  >
                    ×
                  </button>
                </div>

                {sec.cars.map((c, ci) => {
                  const accent = CAR_CARD_ACCENTS[ci % CAR_CARD_ACCENTS.length];
                  return (
                  <div key={ci} style={{ background: accent.tint, border: '0.5px solid rgba(140,150,160,0.3)', borderLeft: `4px solid ${accent.border}`, borderRadius: 10, padding: '0.75rem 1rem', marginBottom: 8 }}>
                    <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: '.06em', color: accent.border, marginBottom: 6 }}>
                      КОЛА {ci + 1}{c.name ? ` · ${c.name}` : ''}
                    </div>
                    <div style={{ display: 'flex', gap: 8, marginBottom: 6 }}>
                      <input
                        value={c.name}
                        onChange={e => updateCar(si, ci, 'name', e.target.value)}
                        placeholder="Марка и модел"
                        style={{ flex: 1, padding: '6px 8px', border: '0.5px solid rgba(140,150,160,0.3)', borderRadius: 4, fontSize: 13, background: '#F9FAFA', outline: 'none' }}
                      />

                      <input
                        value={c.price}
                        onChange={e => updateCar(si, ci, 'price', e.target.value)}
                        placeholder="Цена €"
                        style={{ width: 80, padding: '6px 8px', border: '0.5px solid rgba(140,150,160,0.3)', borderRadius: 4, fontSize: 13, background: '#F9FAFA', outline: 'none' }}
                      />

                      <button onClick={() => deleteCar(si, ci)} style={{ background: 'none', border: 'none', color: '#E24B4A', fontSize: 20, opacity: 0.6, padding: '0 4px', cursor: 'pointer' }}>
                        ×
                      </button>
                    </div>

                    <input
                      value={c.desc}
                      onChange={e => updateCar(si, ci, 'desc', e.target.value)}
                      placeholder="Описание (екстри, състояние)"
                      style={{ width: '100%', padding: '6px 8px', border: '0.5px solid rgba(140,150,160,0.3)', borderRadius: 4, fontSize: 13, background: '#F9FAFA', outline: 'none', marginBottom: 6, display: 'block' }}
                    />

                    <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: '.08em', color: '#7D6A20', margin: '8px 0 3px' }}>ТЕХНИЧЕСКИ ДАННИ</div>
                    <div style={{ fontSize: 10.5, color: '#7A8088', marginBottom: 7 }}>Натисни върху поле и избери от падащите предложения. Можеш и да въведеш собствена стойност.</div>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 6, marginBottom: 8 }}>
                      <SuggestInput value={c.productionDate || ''} onChange={e => updateCar(si, ci, 'productionDate', e.target.value)} placeholder="Дата на производство (напр. Май 2018)" options={TECH_SUGGESTIONS.productionDate} />
                      <SuggestInput value={c.engine || ''} onChange={e => updateCar(si, ci, 'engine', e.target.value)} placeholder="Двигател" options={TECH_SUGGESTIONS.engine} />
                      <SuggestInput value={c.power || ''} onChange={e => updateCar(si, ci, 'power', e.target.value)} placeholder="Мощност (напр. 265 к.с.)" options={TECH_SUGGESTIONS.power} />
                      <SuggestInput value={c.euroStandard || ''} onChange={e => updateCar(si, ci, 'euroStandard', e.target.value)} placeholder="Евростандарт" options={TECH_SUGGESTIONS.euroStandard} />
                      <SuggestInput value={c.displacement || ''} onChange={e => updateCar(si, ci, 'displacement', e.target.value)} placeholder="Кубатура" options={TECH_SUGGESTIONS.displacement} />
                      <SuggestInput value={c.gearbox || ''} onChange={e => updateCar(si, ci, 'gearbox', e.target.value)} placeholder="Скоростна кутия" options={TECH_SUGGESTIONS.gearbox} />
                      <SuggestInput value={c.year || ''} onChange={e => updateCar(si, ci, 'year', e.target.value)} placeholder="Година" options={TECH_SUGGESTIONS.year} />
                      <SuggestInput value={c.mileage || ''} onChange={e => updateCar(si, ci, 'mileage', e.target.value)} placeholder="Пробег" options={TECH_SUGGESTIONS.mileage} />
                      <SuggestInput value={c.fuel || ''} onChange={e => updateCar(si, ci, 'fuel', e.target.value)} placeholder="Гориво" options={TECH_SUGGESTIONS.fuel} />
                      <SuggestInput value={c.color || ''} onChange={e => updateCar(si, ci, 'color', e.target.value)} placeholder="Цвят" options={TECH_SUGGESTIONS.color} />
                    </div>

                    <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: '.08em', color: '#7D6A20', margin: '10px 0 6px' }}>ДОПЪЛНИТЕЛНА ИНФОРМАЦИЯ</div>
                    <textarea
                      value={c.additionalInfo || ''}
                      onChange={e => updateCar(si, ci, 'additionalInfo', e.target.value)}
                      placeholder={'Напиши подробно описание, екстри, лизинг, бартер, контакти и друга информация...'}
                      rows={10}
                      style={{ width: '100%', padding: '9px 10px', border: '0.5px solid rgba(140,150,160,0.3)', borderRadius: 6, fontSize: 13, background: '#F9FAFA', outline: 'none', resize: 'vertical', lineHeight: 1.5, marginBottom: 8 }}
                    />

                    <CarGalleryUploader value={getCarImages(c)} onChange={images => updateCarImages(si, ci, images)} />

                    <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginTop: 8 }}>
                      {['4x4', 'leasing', 'new', 'warranty'].map(b => {
                        const bc = getBadgeColors(false);
                        const emoji = b === '4x4' ? '🛞' : b === 'leasing' ? '🤝' : b === 'new' ? '✨' : '🛡';

                        return (
                          <button
                            key={b}
                            onClick={() => toggleBadge(si, ci, b)}
                            style={{
                              fontSize: 10,
                              padding: '3px 9px',
                              borderRadius: 20,
                              border: c.badges.includes(b) ? `0.5px solid ${bc[b].color}` : '0.5px solid rgba(140,150,160,0.3)',
                              background: c.badges.includes(b) ? bc[b].bg : 'white',
                              color: c.badges.includes(b) ? bc[b].color : '#5B6470',
                              cursor: 'pointer'
                            }}
                          >
                            {emoji} {BADGE_LABELS[b]}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                  );
                })}

                <div style={{ display: 'flex', gap: 8 }}>
                  <button
                    onClick={() => addCar(si)}
                    style={{ flex: 1, padding: 8, border: '0.5px dashed rgba(140,150,160,0.4)', borderRadius: 8, background: 'transparent', color: '#C9A227', fontSize: 13, cursor: 'pointer' }}
                  >
                    + Нов автомобил
                  </button>

                  <button
                    onClick={() => openPicker(si)}
                    style={{ flex: 1, padding: 8, border: '0.5px solid rgba(140,150,160,0.5)', borderRadius: 8, background: '#12151A', color: '#E8B830', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}
                  >
                    📚 От каталога
                  </button>
                </div>

                <button
                  onClick={() => addSectionAfter(si)}
                  style={{ width: '100%', marginTop: 8, padding: 7, border: '0.5px dashed rgba(140,150,160,0.4)', borderRadius: 8, background: 'transparent', color: '#C9A227', fontSize: 12, cursor: 'pointer' }}
                >
                  + Нова категория след „{sec.label}“
                </button>
              </div>
            ))}

            <button
              onClick={saveLot}
              disabled={saving}
              style={{ width: '100%', padding: 13, background: saving ? '#555' : '#12151A', color: '#E8B830', border: 'none', borderRadius: 10, fontSize: 15, fontWeight: 700, letterSpacing: '0.04em', marginTop: '0.5rem', cursor: saving ? 'default' : 'pointer' }}
            >
              {saving ? 'Записване...' : '💾 Запази автокъщата'}
            </button>
          </div>
        </div>
      )}

      {screen === 'lot' && showInstallBanner && lot && (
        <InstallBanner
          dark={dark}
          iosDevice={iosDevice}
          dealershipName={lot.dealershipName}
          onInstall={handleInstallClick}
          onDismiss={dismissInstallBanner}
        />
      )}

      {pickerSection !== null && (
        <CarPickerModal
          catalog={catalog}
          loading={catalogLoading}
          search={pickerSearch}
          onSearch={setPickerSearch}
          onAdd={car => addCarFromCatalog(pickerSection, car)}
          onClose={() => setPickerSection(null)}
        />
      )}

      {toast && (
        <div style={{ position: 'fixed', bottom: '1rem', left: '50%', transform: 'translateX(-50%)', background: '#12151A', color: '#E8B830', padding: '10px 20px', borderRadius: 8, fontSize: 13, zIndex: 99, whiteSpace: 'nowrap', animation: 'fadeUp 0.3s ease' }}>
          {toast}
        </div>
      )}
    </>
  );
}
