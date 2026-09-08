import { useRef, useState } from 'react';
import { uploadImage } from '../lib/carLotHelpers';

export default function CarGalleryUploader({ value = [], onChange }) {
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
    <div style={{ marginTop: 10 }}>
      <input ref={inputRef} type="file" accept="image/*" multiple onChange={handleFiles} style={{ display: 'none' }} />
      <button
        onClick={() => inputRef.current.click()}
        disabled={uploading || images.length >= 15}
        style={{ width: '100%', padding: '8px 12px', border: '0.5px dashed rgba(140,150,160,0.5)', borderRadius: 8, background: 'transparent', color: uploading ? '#888' : '#C9A227', fontSize: 12, cursor: uploading ? 'default' : 'pointer' }}
      >
        {uploading ? '⏳ Качване...' : `📷 Снимки на автомобила (${images.length}/15)`}
      </button>
      <div style={{ fontSize: 10.5, color: '#6B7280', marginTop: 5 }}>
        Първата снимка е основната снимка в каталога. Натисни „Основна“ на друга снимка, за да я смениш.
      </div>
      {images.length > 0 && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(92px, 1fr))', gap: 8, marginTop: 9 }}>
          {images.map((url, i) => (
            <div key={url + i} style={{ position: 'relative', minWidth: 0 }}>
              <img src={url} alt={`Автомобил ${i + 1}`} style={{ width: '100%', height: 78, objectFit: 'cover', borderRadius: 7, border: i === 0 ? '2px solid #C9A227' : '0.5px solid rgba(140,150,160,0.35)', display: 'block' }} />
              <button onClick={() => removeImage(i)} title="Изтрий снимката" style={{ position: 'absolute', top: 3, right: 3, width: 19, height: 19, borderRadius: '50%', border: 'none', background: 'rgba(200,60,60,.94)', color: '#fff', cursor: 'pointer', lineHeight: '19px', padding: 0 }}>×</button>
              <button onClick={() => makeCover(i)} disabled={i === 0} style={{ position: 'absolute', left: 3, bottom: 3, border: 'none', borderRadius: 5, padding: '2px 5px', fontSize: 9, cursor: i === 0 ? 'default' : 'pointer', background: i === 0 ? '#C9A227' : 'rgba(10,12,16,.82)', color: i === 0 ? '#12151A' : '#E8B830' }}>
                {i === 0 ? 'Основна' : 'Направи основна'}
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
