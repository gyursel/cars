import { useState, useEffect, useRef, useId } from 'react';
import Head from 'next/head';
import GalleryImage from '../components/GalleryImage';
import { BRAND, Mark, Showroom, CarDetail, ShowroomSkeleton } from '../components/Showroom';
import { db } from '../lib/firebase';
import { doc, getDoc, setDoc, collection, getDocs, increment } from 'firebase/firestore';
import { supabase } from '../lib/supabase';

async function uploadImage(file) {
  if (!['image/jpeg','image/png','image/webp','image/avif','video/mp4','video/quicktime'].includes(file.type)) throw new Error('Избери JPG, PNG, WEBP, AVIF или MP4/MOV.');
  if (file.size > 20 * 1024 * 1024) throw new Error('Максималният размер е 20 MB.');
  const response = await fetch('/api/admin-upload', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ type: file.type, size: file.size }) });
  const upload = await response.json();
  if (!response.ok) throw new Error(upload.error || 'Неуспешна подготовка на качването');
  const { error } = await supabase.storage.from('vehicles').uploadToSignedUrl(upload.path, upload.token, file, { contentType: file.type });
  if (error) throw new Error(error.message || 'Неуспешно качване');
  return upload.publicUrl;
}

function isIOSDevice() {
  if (typeof navigator === 'undefined') return false;
  return /iphone|ipad|ipod/i.test(navigator.userAgent) && !window.MSStream;
}

function isStandaloneMode() {
  if (typeof window === 'undefined') return false;
  return window.matchMedia?.('(display-mode: standalone)').matches || window.navigator.standalone === true;
}

function isVideoUrl(url) {
  if (!url) return false;
  return /\.(mp4|webm|mov)(\?.*)?$/i.test(url) || url.includes('/video/upload/');
}

function cleanCarName(name) {
  if (!name) return name;
  return name
    .replace(/обява/gi, '')
    .replace(/№?\s*\d{6,}/g, '')
    .replace(/\s*[-|:]\s*$/g, '')
    .replace(/^\s*[-|:]\s*/g, '')
    .replace(/\s{2,}/g, ' ')
    .trim() || 'Автомобил';
}

const defaultLot = { dealershipName: BRAND, phone: '', footerNote: '', heroImage: '', fullGalleryImages: [], demoExpired: false, sections: [] };

const BADGE_LABELS = { '4x4': '4x4', leasing: 'Лизинг/Бартер', new: 'Ново постъпление', warranty: 'Гаранция' };

const CAR_CARD_ACCENTS = [
  { border: '#a51c2b', tint: '#FBF6E4' }, // gold
  { border: '#3B6FA0', tint: '#EAF1F8' }, // blue
  { border: '#4E8B5C', tint: '#EAF5EC' }, // green
  { border: '#B0574D', tint: '#FBECE9' }, // terracotta
  { border: '#7A5FB0', tint: '#F1ECFA' }, // violet
  { border: '#3F8E96', tint: '#E9F5F6' }, // teal
];

const TECH_SUGGESTIONS = {
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

function SuggestInput({ value, onChange, placeholder, options = [], style = {}, title }) {
  const rid = useId().replace(/:/g, '');
  const listId = `suggest-${rid}`;
  return (
    <div style={{ position: 'relative', minWidth: 0 }}>
      <input
        value={value || ''}
        onChange={onChange}
        placeholder={placeholder}
        aria-label={placeholder}
        list={listId}
        autoComplete="off"
        title={title || 'Можеш да избереш предложение или да напишеш собствена стойност'}
        style={{ width: '100%', minHeight: 44, padding: '9px 32px 9px 11px', border: '1px solid #cfd4dc', borderRadius: 8, fontSize: 16, background: '#ffffff', color: '#14171f', outline: 'none', ...style }}
      />
      <span aria-hidden="true" style={{ position: 'absolute', right: 11, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none', color: '#a51c2b', fontSize: 11 }}>▼</span>
      <datalist id={listId}>
        {options.map(opt => <option key={opt} value={opt} />)}
      </datalist>
    </div>
  );
}

function getBadgeColors(dark) {
  return {
    '4x4': { bg: dark ? '#0a1e2e' : '#DEEBF3', color: dark ? '#50a8c8' : '#0A3550' },
    leasing: { bg: dark ? '#2e2205' : '#FAF0DA', color: dark ? '#e8b830' : '#634806' },
    new: { bg: dark ? '#1a2e0a' : '#EAF3DE', color: dark ? '#7ec850' : '#27500A' },
    warranty: { bg: dark ? '#2e0a0a' : '#FAECE7', color: dark ? '#e86060' : '#712B13' },
  };
}

function ImageUploader({ value, onChange, allowVideo = false }) {
  const inputRef = useRef();
  const [uploading, setUploading] = useState(false);

  async function handleFile(e) {
    const file = e.target.files[0];
    if (!file) return;

    setUploading(true);

    try {
      const url = await uploadImage(file);
      onChange(url);
    } catch (err) {
      alert('Грешка при качване: ' + err.message);
    }

    setUploading(false);
    e.target.value = '';
  }

  const valueIsVideo = allowVideo && isVideoUrl(value);

  return (
    <div style={{ marginTop: 8 }}>
      <input ref={inputRef} type="file" accept={allowVideo ? 'image/*,video/mp4,video/quicktime' : 'image/*'} onChange={handleFile} style={{ display: 'none' }} />

      {value ? (
        <div style={{ position: 'relative', display: 'inline-block' }}>
          {valueIsVideo ? (
            <video src={value} muted playsInline style={{ width: 120, height: 84, objectFit: 'cover', borderRadius: 10, border: '1px solid rgba(140,150,160,0.4)', display: 'block' }} />
          ) : (
            <img src={value} alt="" style={{ width: 120, height: 84, objectFit: 'cover', borderRadius: 10, border: '1px solid rgba(140,150,160,0.4)', display: 'block' }} />
          )}
          <button type="button" onClick={() => inputRef.current.click()} style={{ position: 'absolute', bottom: 4, left: 4, background: 'rgba(10,12,16,0.88)', border: '1px solid rgba(255,255,255,0.2)', color: '#f4f0ec', fontSize: 11, minHeight: 28, padding: '3px 8px', borderRadius: 6, cursor: 'pointer' }}>
            Смени
          </button>
          <button type="button" onClick={() => onChange('')} aria-label="Премахни файла" style={{ position: 'absolute', top: 4, right: 4, background: 'rgba(208,24,36,0.92)', border: 'none', color: 'white', fontSize: 15, width: 28, height: 28, minHeight: 28, borderRadius: '50%', lineHeight: '28px', textAlign: 'center', padding: 0, cursor: 'pointer' }}>
            ×
          </button>
        </div>
      ) : (
        <button type="button" onClick={() => inputRef.current.click()} disabled={uploading}
          style={{ minHeight: 44, padding: '10px 16px', border: '1px dashed rgba(165,28,43,0.45)', borderRadius: 10, background: 'rgba(165,28,43,0.04)', color: uploading ? '#888' : '#a51c2b', fontSize: 13, fontWeight: 600, cursor: uploading ? 'default' : 'pointer' }}>
          {uploading ? '⏳ Качване...' : allowVideo ? '📷 Добави снимка/видео' : '📷 Добави снимка'}
        </button>
      )}
    </div>
  );
}

function FullGalleryUploader({ value = [], onChange }) {
  const inputRef = useRef();
  const [uploading, setUploading] = useState(false);

  async function handleFiles(e) {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;

    const current = Array.isArray(value) ? value : [];
    const freeSlots = Math.max(0, 30 - current.length);
    const selected = files.slice(0, freeSlots);

    if (!selected.length) {
      alert('Можеш да качиш максимум 30 файла за галерията на автокъщата.');
      e.target.value = '';
      return;
    }

    setUploading(true);

    try {
      const urls = [];
      for (const file of selected) urls.push(await uploadImage(file));
      onChange([...current, ...urls].slice(0, 30));
    } catch (err) {
      alert('Грешка при качване: ' + err.message);
    }

    setUploading(false);
    e.target.value = '';
  }

  function removeImage(index) {
    const next = [...(Array.isArray(value) ? value : [])];
    next.splice(index, 1);
    onChange(next);
  }

  return (
    <div style={{ marginTop: 10 }}>
      <input ref={inputRef} type="file" accept="image/*" multiple onChange={handleFiles} style={{ display: 'none' }} />

      <button
        type="button"
        onClick={() => inputRef.current.click()}
        disabled={uploading || (value || []).length >= 30}
        style={{
          minHeight: 44,
          padding: '10px 14px',
          border: '1px dashed rgba(165,28,43,0.45)',
          borderRadius: 10,
          background: 'rgba(165,28,43,0.04)',
          color: uploading ? '#888' : '#a51c2b',
          fontSize: 13,
          fontWeight: 600,
          cursor: uploading ? 'default' : 'pointer',
          width: '100%'
        }}
      >
        {uploading ? '⏳ Качване...' : `📚 Качи снимки на автокъщата (${(value || []).length}/30)`}
      </button>

      <div style={{ fontSize: 12, color: '#5B6470', marginTop: 6, lineHeight: 1.5 }}>
        Показват се в раздел „Галерия на автокъщата“.
      </div>

      {(value || []).length > 0 && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(110px, 1fr))', gap: 10, marginTop: 10 }}>
          {(value || []).map((url, i) => (
            <div key={url + i} style={{ position: 'relative' }}>
              <img src={url} alt={`Снимка ${i + 1}`} style={{ width: '100%', height: 92, objectFit: 'cover', borderRadius: 10, border: '1px solid rgba(140,150,160,0.35)', display: 'block' }} />
              <div style={{ position: 'absolute', left: 6, bottom: 6, background: 'rgba(10,12,16,0.84)', color: '#f4f0ec', fontSize: 11, padding: '2px 7px', borderRadius: 10 }}>
                #{i + 1}
              </div>
              <button type="button" onClick={() => removeImage(i)} aria-label={`Премахни снимка ${i + 1}`} style={{ position: 'absolute', top: 4, right: 4, background: 'rgba(208,24,36,0.92)', border: 'none', color: 'white', fontSize: 14, width: 26, height: 26, minHeight: 26, borderRadius: '50%', lineHeight: '26px', textAlign: 'center', padding: 0, cursor: 'pointer' }}>
                ×
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}


function getCarImages(car) {
  const images = Array.isArray(car?.images) ? car.images.filter(Boolean) : [];
  if (car?.image && !images.includes(car.image)) images.unshift(car.image);
  return images.slice(0, 15);
}

function CarGalleryUploader({ value = [], onChange }) {
  const inputRef = useRef();
  const [uploading, setUploading] = useState(false);
  const images = Array.isArray(value) ? value.filter(Boolean).slice(0, 15) : [];

  async function handleFiles(e) {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;

    const freeSlots = Math.max(0, 15 - images.length);
    const selected = files.slice(0, freeSlots);

    if (!selected.length) {
      alert('Можеш да качиш максимум 15 снимки за един автомобил.');
      e.target.value = '';
      return;
    }

    setUploading(true);
    try {
      const urls = [];
      for (const file of selected) urls.push(await uploadImage(file));
      onChange([...images, ...urls].slice(0, 15));
    } catch (err) {
      alert('Грешка при качване: ' + err.message);
    }
    setUploading(false);
    e.target.value = '';
  }

  function removeImage(index) {
    const next = [...images];
    next.splice(index, 1);
    onChange(next);
  }

  function makeCover(index) {
    if (index === 0) return;
    const next = [...images];
    const [picked] = next.splice(index, 1);
    next.unshift(picked);
    onChange(next);
  }

  return (
    <div style={{ marginTop: 12 }}>
      <input ref={inputRef} type="file" accept="image/*" multiple onChange={handleFiles} style={{ display: 'none' }} />
      <button
        type="button"
        onClick={() => inputRef.current.click()}
        disabled={uploading || images.length >= 15}
        style={{ width: '100%', minHeight: 44, padding: '10px 14px', border: '1px dashed rgba(165,28,43,0.45)', borderRadius: 10, background: 'rgba(165,28,43,0.04)', color: uploading ? '#888' : '#a51c2b', fontSize: 13, fontWeight: 600, cursor: uploading ? 'default' : 'pointer' }}
      >
        {uploading ? '⏳ Качване...' : `📷 Снимки на автомобила (${images.length}/15)`}
      </button>
      <div style={{ fontSize: 12, color: '#5B6470', marginTop: 6 }}>
        Първата снимка е основната снимка в каталога. Натисни „Основна“ на друга снимка, за да я смениш.
      </div>
      {images.length > 0 && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(108px, 1fr))', gap: 10, marginTop: 10 }}>
          {images.map((url, i) => (
            <div key={url + i} style={{ position: 'relative', minWidth: 0 }}>
              <img src={url} alt={`Автомобил ${i + 1}`} style={{ width: '100%', height: 86, objectFit: 'cover', borderRadius: 9, border: i === 0 ? '2px solid #d81e28' : '1px solid rgba(140,150,160,0.35)', display: 'block' }} />
              <button type="button" onClick={() => removeImage(i)} title="Изтрий снимката" aria-label={`Изтрий снимка ${i + 1}`} style={{ position: 'absolute', top: 4, right: 4, width: 24, height: 24, minHeight: 24, borderRadius: '50%', border: 'none', background: 'rgba(208,24,36,.94)', color: '#fff', cursor: 'pointer', lineHeight: '24px', padding: 0 }}>×</button>
              <button type="button" aria-label={`Премести снимка ${i + 1} наляво`} disabled={i === 0} onClick={() => { const next = [...images]; [next[i - 1], next[i]] = [next[i], next[i - 1]]; onChange(next); }} style={{ position: 'absolute', top: 4, left: 4, background: 'rgba(10,12,16,0.86)', color: 'white', border: 0, borderRadius: 5, minHeight: 24, padding: '2px 7px', fontSize: 12 }}>←</button>
              <button type="button" onClick={() => makeCover(i)} disabled={i === 0} style={{ position: 'absolute', left: 4, bottom: 4, border: 'none', borderRadius: 6, minHeight: 24, padding: '2px 7px', fontSize: 10, fontWeight: 600, cursor: i === 0 ? 'default' : 'pointer', background: i === 0 ? '#d81e28' : 'rgba(10,12,16,.86)', color: '#ffffff' }}>
                {i === 0 ? 'Основна' : 'Направи основна'}
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function CarPickerModal({ catalog, loading, search, onSearch, onAdd, onClose }) {
  const q = search.trim().toLowerCase();
  const filtered = q ? catalog.filter(c => (c.name || '').toLowerCase().includes(q)) : catalog;

  useEffect(() => {
    const onKey = e => {
      if (e.key === 'Escape') onClose?.();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Каталог с автомобили"
      onClick={onClose}
      style={{ position: 'fixed', inset: 0, background: 'rgba(6,8,12,0.72)', backdropFilter: 'blur(8px)', zIndex: 300, display: 'flex', alignItems: 'flex-end', justifyContent: 'center' }}
    >
      <div
        onClick={e => e.stopPropagation()}
        style={{ background: '#F5F6F8', width: '100%', maxWidth: 520, maxHeight: '84vh', borderRadius: '22px 22px 0 0', display: 'flex', flexDirection: 'column', overflow: 'hidden', boxShadow: '0 -16px 48px rgba(0,0,0,0.45)' }}
      >
        <div style={{ padding: '1.1rem 1.25rem 0.9rem', borderBottom: '1px solid rgba(140,150,160,0.28)' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
            <div style={{ fontSize: 16, fontWeight: 700, color: '#12151A' }}>📚 Каталог с автомобили</div>
            <button type="button" onClick={onClose} aria-label="Затвори каталога" style={{ background: 'none', border: 'none', color: '#5B6470', fontSize: 24, width: 44, height: 44, cursor: 'pointer', lineHeight: 1, padding: 0 }}>×</button>
          </div>

          <input
            autoFocus
            value={search}
            onChange={e => onSearch(e.target.value)}
            placeholder="Търси по марка/модел..." aria-label="Търси по марка/модел..."
            style={{ width: '100%', minHeight: 44, padding: '10px 14px', border: '1px solid rgba(140,150,160,0.4)', borderRadius: 10, fontSize: 16, outline: 'none', background: 'white', color: '#12151A' }}
          />
        </div>

        <div style={{ overflowY: 'auto', padding: '0.6rem 1.25rem 1.5rem' }}>
          {loading && (
            <div style={{ textAlign: 'center', color: '#a51c2b', fontSize: 13, padding: '1.75rem 0' }}>⏳ Зареждане...</div>
          )}

          {!loading && filtered.length === 0 && (
            <div style={{ textAlign: 'center', color: '#5B6470', fontSize: 13, padding: '1.75rem 0', lineHeight: 1.6 }}>
              {catalog.length === 0
                ? 'Каталогът е още празен. Добави автомобил ръчно и запази — той ще се появи тук за бъдеща употреба.'
                : 'Няма автомобил с това име.'}
            </div>
          )}

          {filtered.map(c => (
            <div key={c.id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 0', borderBottom: '1px solid rgba(140,150,160,0.18)' }}>
              {c.image ? (
                <img src={c.image} alt="" style={{ width: 52, height: 52, borderRadius: 10, objectFit: 'cover', flexShrink: 0 }} />
              ) : (
                <div style={{ width: 52, height: 52, borderRadius: 10, background: '#e6e8eb', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18 }}>🚗</div>
              )}

              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 14, fontWeight: 600, color: '#12151A', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {cleanCarName(c.name)}
                </div>
                <div style={{ fontSize: 12, color: '#5B6470', marginTop: 2 }}>
                  {c.category ? `${c.category} · ` : ''}{c.price ? `${c.price} €` : ''}
                </div>
              </div>

              <button
                type="button"
                onClick={() => onAdd(c)}
                style={{ background: '#12151A', color: '#f4f0ec', border: 'none', borderRadius: 8, minHeight: 44, padding: '8px 14px', fontSize: 13, fontWeight: 600, cursor: 'pointer', flexShrink: 0 }}
              >
                + Добави
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function InstallBanner({ dark, iosDevice, dealershipName, onInstall, onDismiss }) {
  return (
    <div
      style={{
        position: 'fixed',
        left: 12,
        right: 12,
        bottom: 94,
        zIndex: 150,
        maxWidth: 460,
        margin: '0 auto',
        background: 'rgba(18, 22, 31, 0.92)',
        backdropFilter: 'blur(16px)',
        border: '1px solid rgba(255, 255, 255, 0.14)',
        borderRadius: 16,
        padding: '14px 14px 14px 16px',
        display: 'flex',
        alignItems: 'center',
        gap: 12,
        boxShadow: '0 20px 44px rgba(0,0,0,0.55)',
      }}
    >
      <div style={{ width: 44, height: 44, borderRadius: 12, background: 'rgba(216, 30, 40, 0.18)', border: '1px solid rgba(216, 30, 40, 0.35)', color: '#f4f0ec', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, flexShrink: 0 }}>
        🚗
      </div>

      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 13, fontWeight: 700, color: '#f4f5f7' }}>
          Добави {dealershipName} на началния екран
        </div>
        <div style={{ fontSize: 11.5, color: '#a6aebc', marginTop: 3, lineHeight: 1.45 }}>
          {iosDevice
            ? 'Тапни бутона Споделяне ⬆️ в Safari, после „Добави към Начален екран“'
            : 'Бърз достъп до автомобилите, без да търсиш браузъра'}
        </div>
      </div>

      {!iosDevice && (
        <button
          type="button"
          onClick={onInstall}
          style={{ background: '#d81e28', color: '#ffffff', border: 'none', borderRadius: 10, minHeight: 44, padding: '8px 14px', fontSize: 12, fontWeight: 700, cursor: 'pointer', flexShrink: 0, whiteSpace: 'nowrap' }}
        >
          Добави
        </button>
      )}

      <button
        type="button"
        aria-label="Затвори банера"
        onClick={onDismiss}
        style={{ background: 'none', border: 'none', color: '#a6aebc', fontSize: 20, width: 44, height: 44, cursor: 'pointer', flexShrink: 0, padding: 0, lineHeight: 1 }}
      >
        ×
      </button>
    </div>
  );
}

export default function Home() {
  const [lot, setLot] = useState(null);
  const [screen, setScreen] = useState('lot');
  const [password, setPassword] = useState('');
  const [loginError, setLoginError] = useState(false);
  const [toast, setToast] = useState('');
  const [adminLot, setAdminLot] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const dark = true;
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
  const collectionReturn = useRef(null);
  const restoreCollection = useRef(false);
  const [loadError, setLoadError] = useState(false);
  const [branding, setBranding] = useState({});
  const [loginBusy, setLoginBusy] = useState(false);
  const [preview, setPreview] = useState(false);
  const [dirty, setDirty] = useState(false);
  const [newPass1, setNewPass1] = useState('');
  const [newPass2, setNewPass2] = useState('');
  const [passSaving, setPassSaving] = useState(false);
  const [passMsg, setPassMsg] = useState('');
  const [pmImporting, setPmImporting] = useState(false);
  const [pmImportMsg, setPmImportMsg] = useState('');

  useEffect(() => {
    if (window.location.hash === '#admin') setScreen('login');

    async function loadLot() {
      try {
        const snap = await Promise.race([getDoc(doc(db, 'lot', 'daily')), new Promise((_, reject) => setTimeout(() => reject(new Error('timeout')), 12000))]);

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
          setLot({ ...defaultLot, ...data, sections: Array.isArray(data.sections) ? data.sections : [] });
        } else {
          setLot(defaultLot);
        }
      } catch (e) {
        setLoadError(true);
        setLot(defaultLot);
      }

      setLoading(false);
    }

    loadLot();

    getDoc(doc(db, 'settings', 'branding')).then(snap => { if (snap.exists()) setBranding(snap.data()); }).catch(() => {});
  }, []);

  useEffect(() => {
    const openAdminHash = () => {
      if (window.location.hash === '#admin') setScreen(current => current === 'admin' ? current : 'login');
    };
    window.addEventListener('hashchange', openAdminHash);
    return () => window.removeEventListener('hashchange', openAdminHash);
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

  function showToast(msg) {
    setToast(msg);
    setTimeout(() => setToast(''), 2500);
  }

  async function doLogin() {
    if (loginBusy) return;
    setLoginBusy(true); setLoginError(false);
    try {
      if (loadError) throw new Error('Зареди успешно каталога преди редактиране, за да избегнеш презаписване на данни.');
      const res = await fetch('/api/login', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ password }) });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Неуспешен вход');
      setAdminLot(JSON.parse(JSON.stringify(lot))); setDirty(false); setPassword(''); setScreen('admin');
    } catch (error) { setLoginError(error.message); }
    finally { setLoginBusy(false); }
  }

  async function logout() {
    if (dirty && !confirm('Има незапазени промени. Да излезем ли без запис?')) return;
    await fetch('/api/logout', { method: 'POST' });
    setAdminLot(null); setDirty(false); setScreen('lot');
  }

  useEffect(() => {
    if (!adminLot) return;
    setDirty(JSON.stringify(adminLot) !== JSON.stringify(lot));
  }, [adminLot, lot]);

  useEffect(() => {
    const warn = event => { if (dirty) { event.preventDefault(); event.returnValue = ''; } };
    window.addEventListener('beforeunload', warn);
    return () => window.removeEventListener('beforeunload', warn);
  }, [dirty]);

  useEffect(() => {
    if (screen === 'lot' && restoreCollection.current) {
      restoreCollection.current = false;
      window.scrollTo({ top: collectionReturn.current?.top || 0, behavior: 'instant' });
      collectionReturn.current?.opener?.focus({ preventScroll: true });
    } else if (screen === 'car' || screen === 'admin' || screen === 'login') {
      window.scrollTo({ top: 0, behavior: 'instant' });
    }
  }, [screen]);

  useEffect(() => {
    const onPopState = () => {
      if (preview || !['lot', 'car'].includes(screen)) return;
      if (history.state?.pmselectVehicle && selectedCar) setScreen('car');
      else if (screen === 'car') { restoreCollection.current = true; setScreen('lot'); }
    };
    window.addEventListener('popstate', onPopState);
    return () => window.removeEventListener('popstate', onPopState);
  }, [screen, preview, selectedCar]);

  function openVehicle(car) {
    collectionReturn.current = { top: window.scrollY, opener: document.activeElement };
    history.pushState({ ...history.state, pmselectVehicle: true }, '', '#vehicle');
    setSelectedCar(car); setPreview(false); setScreen('car');
  }

  function closeVehicle() {
    if (preview) { setScreen('admin'); return; }
    if (history.state?.pmselectVehicle) history.back();
    else { restoreCollection.current = true; setScreen('lot'); }
  }

  async function changePassword() {
    setPassMsg('');

    if (!newPass1 || newPass1.length < 12) {
      setPassMsg('Паролата трябва да е поне 12 символа.');
      return;
    }

    if (newPass1 !== newPass2) {
      setPassMsg('Паролите не съвпадат.');
      return;
    }

    setPassSaving(true);

    try {
      const res = await fetch('/api/admin-password', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ password: newPass1 }) });
      if (!res.ok) throw new Error('Неуспешен запис');
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
        dealershipName: adminLot.dealershipName,
        phone: data.phone || adminLot.phone,
        sections: data.sections
      };
      setAdminLot(importedLot);
      setPmImportMsg(`Заредени в черновата са ${data.count || 0} автомобила. Натисни „Запази“, за да публикуваш. За всяка обява са взети до 15 налични снимки и цялото описание от Mobile.bg.`);
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

      const response = await fetch('/api/admin-lot', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ lot: m }) });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || 'Неуспешен запис');
      Object.assign(m, result.lot);
      setLot(m);
      setAdminLot(m);
      showToast('Автокъщата е записана ✓');
      setDirty(false);
    } catch (e) {
      showToast(e.message || 'Грешка при записване!');
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
    if (!Array.isArray(c.badges)) c.badges = [];
    const idx = c.badges.indexOf(badge);

    if (idx > -1) c.badges.splice(idx, 1);
    else c.badges.push(badge);

    setAdminLot(m);
  }

  function deleteCar(si, ci) {
    if (!confirm('Да премахнем ли автомобила от тази селекция? Промяната влиза в сила след запис.')) return;
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
    if (!confirm('Да премахнем ли категорията и автомобилите в нея от селекцията?')) return;
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

  if (loading) return <ShowroomSkeleton />;

  return (
    <>
      <Head>
        <title>{selectedCar && screen === 'car' ? `${selectedCar.name} | ${BRAND}` : `${BRAND} — Автомобили с характер`}</title>
        <meta name="description" content="PMSELECT CARS — автомобилна селекция, детайлни предложения и личен подход към следващия ти автомобил." />
        <meta property="og:title" content={BRAND} />
        <meta property="og:type" content="website" />
        <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />
        <meta name="theme-color" content={dark ? '#0d0f12' : '#12151A'} />
        <link rel="manifest" href="/manifest.json" />
      </Head>

      {lot && <div hidden={screen !== 'lot'}><Showroom lot={lot} branding={branding} error={loadError} visible={screen === 'lot'} onAdmin={() => { setPassword(''); setLoginError(false); setScreen(adminLot ? 'admin' : 'login'); }} onGallery={() => { setGalleryPage(0); setScreen('gallery'); }} onOpen={openVehicle} /></div>}
      {screen === 'car' && selectedCar && <CarDetail key={selectedCar.listKey || selectedCar.name} car={selectedCar} phone={preview ? adminLot?.phone : lot?.phone} preview={preview} onBack={closeVehicle} />}

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
          <div style={{ background: '#07080b', minHeight: '100svh', display: 'flex', flexDirection: 'column' }}>
            <div style={{ position: 'sticky', top: 0, zIndex: 20, background: 'rgba(12,15,22,0.88)', backdropFilter: 'blur(16px)', borderBottom: '1px solid rgba(255,255,255,0.1)', padding: '0.85rem 1.25rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10 }}>
              <button type="button" onClick={() => setScreen('lot')} style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.16)', color: '#f4f5f7', minHeight: 44, padding: '8px 16px', borderRadius: 12, fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>
                ← Назад
              </button>

              <div style={{ textAlign: 'center' }}>
                <div style={{ color: '#f4f5f7', fontSize: 13, fontWeight: 700, letterSpacing: '0.14em', textTransform: 'uppercase' }}>
                  Галерия на шоурума
                </div>
                <div style={{ color: '#a6aebc', fontSize: 11.5, marginTop: 2 }}>
                  Снимка {galleryPage + 1} от {total}
                </div>
              </div>

              <div style={{ width: 78 }} />
            </div>

            <div
              style={{ flex: 1, position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px 16px', overflow: 'hidden' }}
              onTouchStart={onTouchStart}
              onTouchEnd={onTouchEnd}
            >
              {total > 1 && (
                <button
                  type="button"
                  onClick={() => goTo(galleryPage - 1)}
                  aria-label="Предишна снимка"
                  style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', zIndex: 5, width: 46, height: 46, borderRadius: 14, border: '1px solid rgba(255,255,255,0.18)', background: 'rgba(12,15,22,0.75)', color: '#f4f5f7', fontSize: 20, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', backdropFilter: 'blur(10px)' }}
                >
                  ‹
                </button>
              )}

              <div
                style={{
                  maxWidth: 880,
                  width: '100%',
                  borderRadius: 22,
                  overflow: 'hidden',
                  background: '#11141d',
                  boxShadow: '0 28px 70px rgba(0,0,0,0.7), 0 1px 0 rgba(255,255,255,0.14) inset',
                  border: '1px solid rgba(255,255,255,0.12)',
                  aspectRatio: '4 / 3'
                }}
              >
                <GalleryImage src={pages[galleryPage]} alt={`Снимка ${galleryPage + 1}`} />
              </div>

              {total > 1 && (
                <button
                  type="button"
                  onClick={() => goTo(galleryPage + 1)}
                  aria-label="Следваща снимка"
                  style={{ position: 'absolute', right: 14, top: '50%', transform: 'translateY(-50%)', zIndex: 5, width: 46, height: 46, borderRadius: 14, border: '1px solid rgba(255,255,255,0.18)', background: 'rgba(12,15,22,0.75)', color: '#f4f5f7', fontSize: 20, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', backdropFilter: 'blur(10px)' }}
                >
                  ›
                </button>
              )}
            </div>

            {total > 1 && (
              <div style={{ display: 'flex', justifyContent: 'center', gap: 8, padding: '8px 16px 28px', flexWrap: 'wrap', maxWidth: 560, margin: '0 auto' }}>
                {pages.map((_, i) => (
                  <button
                    type="button"
                    key={i}
                    onClick={() => goTo(i)}
                    aria-label={`Снимка ${i + 1}`}
                    style={{
                      width: i === galleryPage ? 26 : 10,
                      height: 10,
                      minHeight: 10,
                      borderRadius: 5,
                      border: 'none',
                      cursor: 'pointer',
                      transition: 'width 0.25s ease, background 0.25s ease',
                      background: i === galleryPage ? '#d81e28' : 'rgba(255,255,255,0.22)'
                    }}
                  />
                ))}
              </div>
            )}
          </div>
        );
      })()}

      {screen === 'login' && <main className="apex-login"><div className="apex-login-card"><Mark/><form onSubmit={e => { e.preventDefault(); doLogin(); }}><h1>Добре дошъл.</h1><p>Вход в администрацията на PMSELECT CARS.</p><label>Парола<input autoComplete="current-password" type="password" value={password} onChange={e => setPassword(e.target.value)} required /></label><button className="button primary" disabled={loginBusy}>{loginBusy ? 'Проверка…' : 'Влез в администрацията ↗'}</button>{loginError && <p role="alert">{loginError}</p>}<button type="button" className="text-button" onClick={() => setScreen('lot')}>← Назад към автомобилите</button></form></div></main>}

      {screen === 'admin' && adminLot && (
        <div className="apex-admin" style={{ background: '#F3F5F8', minHeight: '100vh' }}>
          <div className="admin-topbar" style={{ background: '#0c0e14', color: '#f4f5f7', padding: '0.9rem 1.25rem', display: 'flex', alignItems: 'center', gap: 12, borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
            <button type="button" onClick={() => setScreen('lot')} style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.2)', color: '#f4f5f7', minHeight: 44, padding: '8px 14px', borderRadius: 10, fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>
              ← Автомобили
            </button>
            <span style={{ fontSize: 15, fontWeight: 700 }}>Управление на автокъщата</span>
            <button type="button" className="text-button" onClick={logout} style={{ minHeight: 44, padding: '8px 12px', color: '#ff7b84', fontWeight: 600 }}>Изход</button>
            <span style={{ marginLeft: 'auto', fontSize: 12.5, fontWeight: 600, color: '#a6aebc', background: 'rgba(255,255,255,0.06)', padding: '6px 12px', borderRadius: 999 }}>
              👁 Днес: {todayViews === null ? '…' : todayViews}
            </span>
          </div>

          <div style={{ padding: '1.5rem 1.25rem' }}>
            <div className="admin-branding" style={{ marginBottom: '1.5rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 10, marginBottom: 14 }}>
                <div style={{ fontSize: 11.5, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: '#a51c2b' }}>
                  Настройки на автокъщата
                </div>
                <button
                  type="button"
                  onClick={importPmSelect}
                  disabled={pmImporting}
                  style={{ background: '#14171f', color: '#f4f5f7', border: '1px solid rgba(255,255,255,0.15)', borderRadius: 10, minHeight: 44, padding: '8px 14px', fontSize: 12.5, fontWeight: 600, cursor: pmImporting ? 'wait' : 'pointer' }}
                >
                  {pmImporting ? '⏳ Импортиране от Mobile.bg...' : '🔄 Импортирай от PM SELECT Mobile.bg'}
                </button>
              </div>

              {pmImportMsg && (
                <div style={{ fontSize: 12.5, padding: '10px 12px', borderRadius: 8, marginBottom: 12, background: pmImportMsg.startsWith('Грешка') ? '#fdecea' : '#edf7ed', color: pmImportMsg.startsWith('Грешка') ? '#b71c1c' : '#1b5e20' }}>
                  {pmImportMsg}
                </div>
              )}

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 10, marginBottom: 10 }}>
                <input
                  value={adminLot.dealershipName}
                  onChange={e => setAdminLot({ ...adminLot, dealershipName: e.target.value })}
                  placeholder="Име на автокъщата" aria-label="Име на автокъщата"
                  style={{ width: '100%', minHeight: 44, padding: '10px 12px', border: '1px solid #cfd4dc', borderRadius: 10, fontSize: 16, background: 'white', outline: 'none' }}
                />

                <input
                  value={adminLot.phone || ''}
                  onChange={e => setAdminLot({ ...adminLot, phone: e.target.value })}
                  placeholder="Телефон за връзка" aria-label="Телефон за връзка"
                  style={{ width: '100%', minHeight: 44, padding: '10px 12px', border: '1px solid #cfd4dc', borderRadius: 10, fontSize: 16, background: 'white', outline: 'none' }}
                />
              </div>

              <input
                value={adminLot.footerNote}
                onChange={e => setAdminLot({ ...adminLot, footerNote: e.target.value })}
                placeholder="Бележка в долната част" aria-label="Бележка в долната част"
                style={{ width: '100%', minHeight: 44, padding: '10px 12px', border: '1px solid #cfd4dc', borderRadius: 10, fontSize: 16, background: 'white', outline: 'none' }}
              />

              <label style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 12, minHeight: 44, padding: '10px 14px', border: '1px solid #d5d9e0', borderRadius: 10, background: adminLot.demoExpired ? '#fff4f4' : '#f8f9fb', cursor: 'pointer' }}>
                <input
                  type="checkbox"
                  checked={!!adminLot.demoExpired}
                  onChange={e => setAdminLot({ ...adminLot, demoExpired: e.target.checked })}
                />
                <span style={{ fontSize: 13.5, color: '#14171f', fontWeight: 500 }}>
                  Покажи на сайта, че пробният период е приключил (демо версия)
                </span>
              </label>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: 14, marginTop: 16 }}>
                <div className="admin-subcard">
                  <div style={{ fontSize: 11.5, fontWeight: 700, color: '#a51c2b', marginBottom: 4 }}>ФОН НА ХЕДЪРА (СНИМКА ИЛИ MP4)</div>
                  <p style={{ fontSize: 12, color: '#5b6470', marginBottom: 8 }}>Опционално видео или широкоформатен банер за началната секция.</p>
                  <ImageUploader value={adminLot.heroImage || ''} onChange={url => setAdminLot({ ...adminLot, heroImage: url })} allowVideo />
                </div>

                <div className="admin-subcard">
                  <div style={{ fontSize: 11.5, fontWeight: 700, color: '#a51c2b', marginBottom: 4 }}>НАЧАЛЕН ЕКРАН (HERO ВИЗУАЛ)</div>
                  <p style={{ fontSize: 12, color: '#5b6470', marginBottom: 8 }}>Основна фотография за 3D сцената на началния екран.</p>
                  <ImageUploader value={adminLot.introImage || ''} onChange={url => setAdminLot({ ...adminLot, introImage: url })}/>
                </div>

                <div className="admin-subcard">
                  <div style={{ fontSize: 11.5, fontWeight: 700, color: '#a51c2b', marginBottom: 4 }}>ЛОГО И НАСЛЕДЕН БАНЕР</div>
                  <p style={{ fontSize: 12, color: '#5b6470', marginBottom: 8 }}>Допълнителен банер или лого в настройките на автокъщата.</p>
                  <ImageUploader value={adminLot.logoImage ?? branding.logoImage ?? ''} onChange={url => setAdminLot({ ...adminLot, logoImage: url })}/>
                </div>
              </div>

              <div style={{ marginTop: 16 }}>
                <div style={{ fontSize: 11.5, fontWeight: 700, color: '#a51c2b', marginBottom: 6 }}>ГАЛЕРИЯ НА АВТОКЪЩАТА — ДО 30 СНИМКИ</div>
                <FullGalleryUploader value={adminLot.fullGalleryImages || []} onChange={imgs => setAdminLot({ ...adminLot, fullGalleryImages: imgs })} />
              </div>
            </div>

            <div className="admin-branding" style={{ marginBottom: '1.5rem' }}>
              <div style={{ fontSize: 11.5, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: '#a51c2b', marginBottom: 12 }}>
                Смяна на парола за админ
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 10, marginBottom: 10 }}>
                <input
                  type="password"
                  value={newPass1}
                  onChange={e => setNewPass1(e.target.value)}
                  placeholder="Нова парола" aria-label="Нова парола"
                  style={{ width: '100%', minHeight: 44, padding: '10px 12px', border: '1px solid #cfd4dc', borderRadius: 10, fontSize: 16, background: '#ffffff', outline: 'none' }}
                />

                <input
                  type="password"
                  value={newPass2}
                  onChange={e => setNewPass2(e.target.value)}
                  placeholder="Потвърди новата парола" aria-label="Потвърди новата парола"
                  style={{ width: '100%', minHeight: 44, padding: '10px 12px', border: '1px solid #cfd4dc', borderRadius: 10, fontSize: 16, background: '#ffffff', outline: 'none' }}
                />
              </div>

              {passMsg && (
                <div style={{ fontSize: 12.5, fontWeight: 600, color: passMsg.includes('успешно') ? '#2e7d32' : '#c0392b', marginBottom: 10 }}>
                  {passMsg}
                </div>
              )}

              <button
                type="button"
                onClick={changePassword}
                disabled={passSaving}
                style={{ background: '#14171f', color: '#f4f5f7', border: 'none', minHeight: 44, padding: '10px 18px', borderRadius: 10, fontSize: 13.5, fontWeight: 600, cursor: 'pointer', opacity: passSaving ? 0.6 : 1 }}
              >
                {passSaving ? 'Запис...' : 'Смени паролата'}
              </button>
            </div>

            {adminLot.sections.length === 0 && <button type="button" className="button primary" onClick={() => addSectionAfter(-1)}>+ Първа категория</button>}
            {adminLot.sections.map((sec, si) => (
              <div key={si} style={{ marginBottom: '2rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
                  <div style={{ flex: 1 }}>
                    <SuggestInput
                      value={sec.label}
                      onChange={e => updateSectionLabel(si, e.target.value)}
                      placeholder="Категория" aria-label="Категория"
                      options={TECH_SUGGESTIONS.category}
                      style={{ fontSize: 14, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: '#a51c2b', background: 'white' }}
                    />
                  </div>

                  <button
                    type="button"
                    onClick={() => deleteSection(si)}
                    title="Изтрий категорията"
                    aria-label={`Изтрий категория ${sec.label}`}
                    style={{ background: '#ffffff', border: '1px solid #e0e4eb', borderRadius: 10, color: '#d81e28', fontSize: 20, width: 44, height: 44, cursor: 'pointer' }}
                  >
                    ×
                  </button>
                </div>

                {sec.cars.map((c, ci) => {
                  const accent = CAR_CARD_ACCENTS[ci % CAR_CARD_ACCENTS.length];
                  return (
                  <div key={ci} className="admin-car" style={{ background: '#ffffff', border: '1px solid #dfe3ea', borderLeft: `4px solid ${accent.border}`, borderRadius: 14, padding: '1.1rem 1.25rem', marginBottom: 14 }}>
                    <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '.06em', color: accent.border, marginBottom: 6 }}>
                      КОЛА {ci + 1}{c.name ? ` · ${c.name}` : ''}
                    </div>
                    <div className="admin-publication">
                      <label><input type="checkbox" checked={c.visible !== false} onChange={e => updateCar(si, ci, 'visible', e.target.checked)}/>Публична обява</label>
                      <label><input type="checkbox" checked={!!c.featured} onChange={e => updateCar(si, ci, 'featured', e.target.checked)}/>Избран автомобил</label>
                      <button type="button" className="text-button" onClick={() => { setSelectedCar({ ...c, sectionLabel: sec.label }); setPreview(true); setScreen('car'); }} style={{ fontWeight: 700, color: '#a51c2b', minHeight: 44, padding: '8px 12px' }}>Преглед ↗</button>
                    </div>
                    <div style={{ display: 'flex', gap: 8, marginBottom: 10, alignItems: 'center', flexWrap: 'wrap' }}>
                      <input
                        value={c.name}
                        onChange={e => updateCar(si, ci, 'name', e.target.value)}
                        placeholder="Марка и модел" aria-label="Марка и модел"
                        style={{ flex: '1 1 200px', minHeight: 44, padding: '9px 12px', border: '1px solid #cfd4dc', borderRadius: 8, fontSize: 16, background: '#ffffff', outline: 'none' }}
                      />

                      <input
                        value={c.price}
                        onChange={e => updateCar(si, ci, 'price', e.target.value)}
                        placeholder="Цена €" aria-label="Цена €"
                        style={{ width: 120, minHeight: 44, padding: '9px 12px', border: '1px solid #cfd4dc', borderRadius: 8, fontSize: 16, background: '#ffffff', outline: 'none' }}
                      />

                      <button type="button" onClick={() => deleteCar(si, ci)} aria-label={`Изтрий автомобил ${c.name || ci + 1}`} style={{ background: '#fff5f5', border: '1px solid #f5c2c7', borderRadius: 8, color: '#d81e28', fontSize: 20, width: 44, height: 44, cursor: 'pointer' }}>
                        ×
                      </button>
                    </div>

                    <input
                      value={c.desc}
                      onChange={e => updateCar(si, ci, 'desc', e.target.value)}
                      placeholder="Описание (екстри, състояние)" aria-label="Описание (екстри, състояние)"
                      style={{ width: '100%', minHeight: 44, padding: '9px 12px', border: '1px solid #cfd4dc', borderRadius: 8, fontSize: 16, background: '#ffffff', outline: 'none', marginBottom: 10, display: 'block' }}
                    />

                    <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '.08em', color: '#1f2937', margin: '12px 0 4px' }}>ТЕХНИЧЕСКИ ДАННИ</div>
                    <div style={{ fontSize: 12, color: '#5b6470', marginBottom: 8 }}>Натисни върху поле и избери от падащите предложения. Можеш и да въведеш собствена стойност.</div>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(190px, 1fr))', gap: 8, marginBottom: 12 }}>
                      <SuggestInput value={c.productionDate || ''} onChange={e => updateCar(si, ci, 'productionDate', e.target.value)} placeholder="Дата на производство (напр. Май 2018)" aria-label="Дата на производство (напр. Май 2018)" options={TECH_SUGGESTIONS.productionDate} />
                      <SuggestInput value={c.engine || ''} onChange={e => updateCar(si, ci, 'engine', e.target.value)} placeholder="Двигател" aria-label="Двигател" options={TECH_SUGGESTIONS.engine} />
                      <SuggestInput value={c.power || ''} onChange={e => updateCar(si, ci, 'power', e.target.value)} placeholder="Мощност (напр. 265 к.с.)" aria-label="Мощност (напр. 265 к.с.)" options={TECH_SUGGESTIONS.power} />
                      <SuggestInput value={c.euroStandard || ''} onChange={e => updateCar(si, ci, 'euroStandard', e.target.value)} placeholder="Евростандарт" aria-label="Евростандарт" options={TECH_SUGGESTIONS.euroStandard} />
                      <SuggestInput value={c.displacement || ''} onChange={e => updateCar(si, ci, 'displacement', e.target.value)} placeholder="Кубатура" aria-label="Кубатура" options={TECH_SUGGESTIONS.displacement} />
                      <SuggestInput value={c.gearbox || ''} onChange={e => updateCar(si, ci, 'gearbox', e.target.value)} placeholder="Скоростна кутия" aria-label="Скоростна кутия" options={TECH_SUGGESTIONS.gearbox} />
                      <SuggestInput value={c.year || ''} onChange={e => updateCar(si, ci, 'year', e.target.value)} placeholder="Година" aria-label="Година" options={TECH_SUGGESTIONS.year} />
                      <SuggestInput value={c.mileage || ''} onChange={e => updateCar(si, ci, 'mileage', e.target.value)} placeholder="Пробег" aria-label="Пробег" options={TECH_SUGGESTIONS.mileage} />
                      <SuggestInput value={c.fuel || ''} onChange={e => updateCar(si, ci, 'fuel', e.target.value)} placeholder="Гориво" aria-label="Гориво" options={TECH_SUGGESTIONS.fuel} />
                      <SuggestInput value={c.color || ''} onChange={e => updateCar(si, ci, 'color', e.target.value)} placeholder="Цвят" aria-label="Цвят" options={TECH_SUGGESTIONS.color} />
                    </div>

                    <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '.08em', color: '#1f2937', margin: '12px 0 6px' }}>ДОПЪЛНИТЕЛНА ИНФОРМАЦИЯ</div>
                    <textarea
                      value={c.additionalInfo || ''}
                      onChange={e => updateCar(si, ci, 'additionalInfo', e.target.value)}
                      placeholder={'Напиши подробно описание, екстри, лизинг, бартер, контакти и друга информация...'}
                      rows={8}
                      style={{ width: '100%', padding: '10px 12px', border: '1px solid #cfd4dc', borderRadius: 8, fontSize: 16, background: '#ffffff', outline: 'none', resize: 'vertical', lineHeight: 1.55, marginBottom: 10 }}
                    />

                    <CarGalleryUploader value={getCarImages(c)} onChange={images => updateCarImages(si, ci, images)} />

                    <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 12 }}>
                      {['4x4', 'leasing', 'new', 'warranty'].map(b => {
                        const bc = getBadgeColors(false);
                        const emoji = b === '4x4' ? '🛞' : b === 'leasing' ? '🤝' : b === 'new' ? '✨' : '🛡';

                        return (
                          <button
                            type="button"
                            key={b}
                            onClick={() => toggleBadge(si, ci, b)}
                            style={{
                              fontSize: 12,
                              fontWeight: 600,
                              minHeight: 40,
                              padding: '6px 14px',
                              borderRadius: 999,
                              border: (c.badges || []).includes(b) ? `1.5px solid ${bc[b].color}` : '1px solid #cfd4dc',
                              background: (c.badges || []).includes(b) ? bc[b].bg : 'white',
                              color: (c.badges || []).includes(b) ? bc[b].color : '#4b5563',
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

                <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                  <button
                    type="button"
                    onClick={() => addCar(si)}
                    style={{ flex: '1 1 180px', minHeight: 44, padding: '10px 14px', border: '1px dashed rgba(165,28,43,0.5)', borderRadius: 10, background: 'rgba(165,28,43,0.04)', color: '#a51c2b', fontSize: 13.5, fontWeight: 600, cursor: 'pointer' }}
                  >
                    + Нов автомобил
                  </button>

                  <button
                    type="button"
                    onClick={() => openPicker(si)}
                    style={{ flex: '1 1 180px', minHeight: 44, padding: '10px 14px', border: '1px solid #14171f', borderRadius: 10, background: '#14171f', color: '#f4f5f7', fontSize: 13.5, fontWeight: 600, cursor: 'pointer' }}
                  >
                    📚 От каталога
                  </button>
                </div>

                <button
                  type="button"
                  onClick={() => addSectionAfter(si)}
                  style={{ width: '100%', marginTop: 10, minHeight: 44, padding: '9px 14px', border: '1px dashed rgba(140,150,160,0.5)', borderRadius: 10, background: 'transparent', color: '#a51c2b', fontSize: 12.5, fontWeight: 600, cursor: 'pointer' }}
                >
                  + Нова категория след „{sec.label}“
                </button>
              </div>
            ))}

          </div>
          <div className="admin-savebar"><span role="status">{dirty ? 'Има незапазени промени' : 'Всички промени са запазени'}</span><button className="button primary" onClick={saveLot} disabled={saving || !dirty}>{saving ? 'Записване…' : 'Запази промените ↗'}</button></div>
        </div>
      )}

      {screen === 'lot' && showInstallBanner && lot && (
        <InstallBanner
          dark={dark}
          iosDevice={iosDevice}
          dealershipName={BRAND}
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
        <div className="toast" role="status">
          {toast}
        </div>
      )}
    </>
  );
}
