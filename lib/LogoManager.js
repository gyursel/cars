import { useEffect, useRef, useState } from 'react';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from './firebase';
import { supabase } from './supabase';

const brandingRef = () => doc(db, 'settings', 'branding');

function applyLogoToHero(url) {
  const hero = document.querySelector('.lot-hero');
  if (!hero) return;

  hero.style.position = 'relative';
  let img = hero.querySelector('[data-pmselect-admin-logo="true"]');

  if (!url) {
    if (img) img.remove();
    return;
  }

  if (!img) {
    img = document.createElement('img');
    img.setAttribute('data-pmselect-admin-logo', 'true');
    img.alt = 'PM Select logo';
    Object.assign(img.style, {
      position: 'absolute',
      left: '50%',
      top: '50%',
      transform: 'translate(-50%, -50%)',
      zIndex: '7',
      width: 'min(70vw, 520px)',
      maxHeight: '42%',
      objectFit: 'contain',
      pointerEvents: 'none',
      filter: 'drop-shadow(0 4px 14px rgba(0,0,0,.7))'
    });
    hero.appendChild(img);
  }

  img.src = url;
}

export default function LogoManager() {
  const [logoUrl, setLogoUrl] = useState('');
  const [adminVisible, setAdminVisible] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState('');
  const inputRef = useRef(null);

  useEffect(() => {
    let cancelled = false;

    async function loadBranding() {
      try {
        const snap = await getDoc(brandingRef());
        const url = snap.exists() ? (snap.data()?.logoImage || '') : '';
        if (!cancelled) setLogoUrl(url);
      } catch (_) {}
    }

    loadBranding();
    return () => { cancelled = true; };
  }, []);

  useEffect(() => {
    applyLogoToHero(logoUrl);

    const observer = new MutationObserver(() => {
      const isAdmin = document.body?.innerText?.includes('Управление на автокъщата') || false;
      setAdminVisible(isAdmin);
      applyLogoToHero(logoUrl);
    });

    observer.observe(document.body, { childList: true, subtree: true });
    return () => observer.disconnect();
  }, [logoUrl]);

  async function uploadLogo(file) {
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      setMessage('Избери PNG, JPG или WEBP файл.');
      return;
    }

    setUploading(true);
    setMessage('');

    try {
      const safeName = file.name.replace(/[^a-zA-Z0-9.\-_]/g, '_');
      const path = `branding/${Date.now()}_${safeName}`;
      const { error } = await supabase.storage.from('vehicles').upload(path, file, {
        cacheControl: '3600',
        upsert: false
      });
      if (error) throw error;

      const { data } = supabase.storage.from('vehicles').getPublicUrl(path);
      const url = data.publicUrl;
      await setDoc(brandingRef(), { logoImage: url }, { merge: true });
      setLogoUrl(url);
      setMessage('Логото е записано ✓');
    } catch (err) {
      setMessage(`Грешка: ${err.message || 'неуспешно качване'}`);
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = '';
    }
  }

  async function removeLogo() {
    try {
      await setDoc(brandingRef(), { logoImage: '' }, { merge: true });
      setLogoUrl('');
      setMessage('Логото е премахнато.');
    } catch (err) {
      setMessage(`Грешка: ${err.message || 'неуспешно премахване'}`);
    }
  }

  if (!adminVisible) return null;

  return (
    <div style={{
      position: 'fixed',
      right: 14,
      bottom: 14,
      zIndex: 9999,
      width: 'min(330px, calc(100vw - 28px))',
      background: 'rgba(18,21,26,.98)',
      border: '1px solid rgba(201,162,39,.55)',
      borderRadius: 12,
      padding: 12,
      boxShadow: '0 16px 40px rgba(0,0,0,.35)',
      color: '#fff'
    }}>
      <div style={{ color: '#E8B830', fontSize: 11, fontWeight: 800, letterSpacing: '.12em', marginBottom: 6 }}>
        ЛОГО НА ГОРНИЯ БАНЕР
      </div>
      <div style={{ color: '#AEB4BC', fontSize: 11, lineHeight: 1.45, marginBottom: 9 }}>
        Качи собствено лого. Най-добре PNG с прозрачен фон. То ще се показва центрирано върху банера и на телефон, и на компютър.
      </div>

      {logoUrl && (
        <div style={{ background: '#07090b', border: '1px solid rgba(201,162,39,.25)', borderRadius: 8, padding: 8, marginBottom: 9, textAlign: 'center' }}>
          <img src={logoUrl} alt="Текущо лого" style={{ maxWidth: '100%', maxHeight: 80, objectFit: 'contain' }} />
        </div>
      )}

      <input
        ref={inputRef}
        type="file"
        accept="image/png,image/jpeg,image/webp,image/svg+xml"
        onChange={e => uploadLogo(e.target.files?.[0])}
        style={{ display: 'none' }}
      />

      <div style={{ display: 'flex', gap: 8 }}>
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={uploading}
          style={{ flex: 1, padding: '9px 10px', borderRadius: 7, border: '1px solid #9A7A48', background: '#24211d', color: '#F6E2B8', fontWeight: 800, cursor: uploading ? 'default' : 'pointer' }}
        >
          {uploading ? 'Качване...' : logoUrl ? 'Смени логото' : 'Качи лого'}
        </button>

        {logoUrl && (
          <button
            type="button"
            onClick={removeLogo}
            style={{ padding: '9px 10px', borderRadius: 7, border: '1px solid #744', background: '#241718', color: '#F0B5B5', fontWeight: 700, cursor: 'pointer' }}
          >
            Премахни
          </button>
        )}
      </div>

      {message && <div style={{ marginTop: 8, fontSize: 11, color: message.startsWith('Грешка') ? '#F19A9A' : '#B8D9A8' }}>{message}</div>}
    </div>
  );
}
