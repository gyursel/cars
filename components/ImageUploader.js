import { useRef, useState } from 'react';
import { uploadImage, isVideoUrl } from '../lib/carLotHelpers';

export default function ImageUploader({ value, onChange, allowVideo = false }) {
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
            <video src={value} muted playsInline style={{ width: 90, height: 65, objectFit: 'cover', borderRadius: 6, border: '0.5px solid rgba(140,150,160,0.35)', display: 'block' }} />
          ) : (
            <img src={value} alt="" style={{ width: 90, height: 65, objectFit: 'cover', borderRadius: 6, border: '0.5px solid rgba(140,150,160,0.35)', display: 'block' }} />
          )}
          <button onClick={() => inputRef.current.click()} style={{ position: 'absolute', bottom: 3, right: 3, background: 'rgba(10,12,16,0.85)', border: 'none', color: '#E8B830', fontSize: 10, padding: '2px 6px', borderRadius: 4, cursor: 'pointer' }}>
            Смени
          </button>
          <button onClick={() => onChange('')} style={{ position: 'absolute', top: 3, right: 3, background: 'rgba(200,60,60,0.9)', border: 'none', color: 'white', fontSize: 13, width: 18, height: 18, borderRadius: '50%', lineHeight: '18px', textAlign: 'center', padding: 0, cursor: 'pointer' }}>
            ×
          </button>
        </div>
      ) : (
        <button onClick={() => inputRef.current.click()} disabled={uploading}
          style={{ padding: '5px 12px', border: '0.5px dashed rgba(140,150,160,0.5)', borderRadius: 6, background: 'transparent', color: uploading ? '#888' : '#C9A227', fontSize: 12, cursor: uploading ? 'default' : 'pointer' }}>
          {uploading ? '⏳ Качване...' : allowVideo ? '📷 Добави снимка/видео' : '📷 Добави снимка'}
        </button>
      )}
    </div>
  );
}
