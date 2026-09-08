import { useRef, useState } from 'react';
import { uploadImage } from '../lib/carLotHelpers';

export default function FullGalleryUploader({ value = [], onChange }) {
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
        onClick={() => inputRef.current.click()}
        disabled={uploading || (value || []).length >= 30}
        style={{
          padding: '8px 12px',
          border: '0.5px dashed rgba(140,150,160,0.5)',
          borderRadius: 8,
          background: 'transparent',
          color: uploading ? '#888' : '#C9A227',
          fontSize: 13,
          cursor: uploading ? 'default' : 'pointer',
          width: '100%'
        }}
      >
        {uploading ? '⏳ Качване...' : `📚 Качи снимки на автокъщата (${(value || []).length}/30)`}
      </button>

      <div style={{ fontSize: 11, color: '#6B7280', marginTop: 6, lineHeight: 1.45 }}>
        Показват се в раздел „Галерия на автокъщата“.
      </div>

      {(value || []).length > 0 && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8, marginTop: 10 }}>
          {(value || []).map((url, i) => (
            <div key={url + i} style={{ position: 'relative' }}>
              <img src={url} alt={`Снимка ${i + 1}`} style={{ width: '100%', height: 90, objectFit: 'cover', borderRadius: 8, border: '0.5px solid rgba(140,150,160,0.35)', display: 'block' }} />
              <div style={{ position: 'absolute', left: 5, bottom: 5, background: 'rgba(10,12,16,0.8)', color: '#E8B830', fontSize: 10, padding: '2px 6px', borderRadius: 10 }}>
                #{i + 1}
              </div>
              <button onClick={() => removeImage(i)} style={{ position: 'absolute', top: 4, right: 4, background: 'rgba(200,60,60,0.92)', border: 'none', color: 'white', fontSize: 13, width: 20, height: 20, borderRadius: '50%', lineHeight: '20px', textAlign: 'center', padding: 0, cursor: 'pointer' }}>
                ×
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
