import { useEffect, useRef, useState } from 'react';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from './firebase';
import { supabase } from './supabase';

const brandingRef = () => doc(db, 'settings', 'branding');

function applyBranding(heroUrl, logoUrl) {
  const hero = document.querySelector('.lot-hero');
  if (!hero) return;
  hero.style.position = 'relative';

  if (heroUrl) {
    hero.style.setProperty('background-image', `url("${heroUrl}")`, 'important');
    hero.style.setProperty('background-size', 'contain', 'important');
    hero.style.setProperty('background-position', 'center center', 'important');
    hero.style.setProperty('background-repeat', 'no-repeat', 'important');
    hero.style.setProperty('background-color', '#080a0c', 'important');
    hero.style.setProperty('aspect-ratio', '1096 / 442', 'important');
  }

  let img = hero.querySelector('[data-pmselect-admin-logo="true"]');

  // Когато е качен цял готов банер със собствено лого/текст,
  // не наслагваме второ лого върху него.
  if (heroUrl || !logoUrl) {
    if (img) img.remove();
    return;
  }

  if (!img) {
    img = document.createElement('img');
    img.setAttribute('data-pmselect-admin-logo', 'true');
    img.alt = 'PM Select logo';
    Object.assign(img.style, {
      position:'absolute', left:'50%', top:'50%', transform:'translate(-50%, -50%)',
      zIndex:'7', width:'min(70vw, 520px)', maxHeight:'42%', objectFit:'contain',
      pointerEvents:'none', filter:'drop-shadow(0 4px 14px rgba(0,0,0,.7))'
    });
    hero.appendChild(img);
  }
  img.src = logoUrl;
}

export default function LogoManager() {
  const [logoUrl, setLogoUrl] = useState('');
  const [heroUrl, setHeroUrl] = useState('');
  const [adminVisible, setAdminVisible] = useState(false);
  const [uploading, setUploading] = useState('');
  const [message, setMessage] = useState('');
  const logoInputRef = useRef(null);
  const heroInputRef = useRef(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const snap = await getDoc(brandingRef());
        const data = snap.exists() ? snap.data() : {};
        if (!cancelled) { setLogoUrl(data?.logoImage || ''); setHeroUrl(data?.heroImage || ''); }
      } catch (_) {}
    })();
    return () => { cancelled = true; };
  }, []);

  useEffect(() => {
    applyBranding(heroUrl, logoUrl);
    const observer = new MutationObserver(() => {
      setAdminVisible(document.body?.innerText?.includes('Управление на автокъщата') || false);
      applyBranding(heroUrl, logoUrl);
    });
    observer.observe(document.body, { childList:true, subtree:true });
    return () => observer.disconnect();
  }, [heroUrl, logoUrl]);

  async function upload(file, kind) {
    if (!file) return;
    if (!file.type.startsWith('image/')) { setMessage('Избери PNG, JPG или WEBP файл.'); return; }
    setUploading(kind); setMessage('');
    try {
      const safeName = file.name.replace(/[^a-zA-Z0-9.\-_]/g, '_');
      const path = `branding/${kind}_${Date.now()}_${safeName}`;
      const { error } = await supabase.storage.from('vehicles').upload(path, file, { cacheControl:'3600', upsert:false });
      if (error) throw error;
      const { data } = supabase.storage.from('vehicles').getPublicUrl(path);
      const url = data.publicUrl;

      if (kind === 'hero') {
        await setDoc(brandingRef(), { heroImage:url, logoImage:'' }, { merge:true });
        setHeroUrl(url);
        setLogoUrl('');
        setMessage('Главният банер е записан 1:1 ✓');
      } else {
        await setDoc(brandingRef(), { logoImage:url }, { merge:true });
        setLogoUrl(url);
        setMessage('Логото е записано ✓');
      }
    } catch (err) { setMessage(`Грешка: ${err.message || 'неуспешно качване'}`); }
    finally {
      setUploading('');
      if (logoInputRef.current) logoInputRef.current.value='';
      if (heroInputRef.current) heroInputRef.current.value='';
    }
  }

  async function remove(kind) {
    try {
      const field = kind === 'hero' ? 'heroImage' : 'logoImage';
      await setDoc(brandingRef(), { [field]:'' }, { merge:true });
      if (kind === 'hero') { setHeroUrl(''); window.location.reload(); } else setLogoUrl('');
    } catch (err) { setMessage(`Грешка: ${err.message || 'неуспешно премахване'}`); }
  }

  if (!adminVisible) return null;
  const box = { background:'#07090b', border:'1px solid rgba(201,162,39,.25)', borderRadius:8, padding:8, marginBottom:9, textAlign:'center' };
  const button = { flex:1, padding:'9px 10px', borderRadius:7, border:'1px solid #9A7A48', background:'#24211d', color:'#F6E2B8', fontWeight:800, cursor:'pointer' };

  return <div style={{position:'static',width:'100%',maxWidth:420,margin:'0 0 16px',background:'rgba(18,21,26,.98)',border:'1px solid rgba(201,162,39,.55)',borderRadius:12,padding:12,boxShadow:'0 8px 24px rgba(0,0,0,.25)',color:'#fff'}}>
    <div style={{color:'#E8B830',fontSize:11,fontWeight:800,letterSpacing:'.12em',marginBottom:6}}>ГЛАВЕН БАНЕР</div>
    <div style={{color:'#AEB4BC',fontSize:11,lineHeight:1.45,marginBottom:9}}>Качи готовия банер. Показва се 1:1 — без затъмняване, без изсветляване, без допълнително лого и без изрязване.</div>
    {heroUrl && <div style={box}><img src={heroUrl} alt="Текущ банер" style={{maxWidth:'100%',maxHeight:100,objectFit:'contain'}} /></div>}
    <input ref={heroInputRef} type="file" accept="image/png,image/jpeg,image/webp" onChange={e=>upload(e.target.files?.[0],'hero')} style={{display:'none'}} />
    <div style={{display:'flex',gap:8,marginBottom:14}}><button type="button" onClick={()=>heroInputRef.current?.click()} disabled={!!uploading} style={button}>{uploading==='hero'?'Качване...':heroUrl?'Смени банера':'Качи банер'}</button>{heroUrl&&<button type="button" onClick={()=>remove('hero')} style={{...button,flex:'none',border:'1px solid #744',color:'#F0B5B5'}}>Премахни</button>}</div>

    <div style={{color:'#E8B830',fontSize:11,fontWeight:800,letterSpacing:'.12em',marginBottom:6}}>ЛОГО НА БАНЕРА</div>
    <div style={{color:'#AEB4BC',fontSize:11,lineHeight:1.45,marginBottom:9}}>Използва се само ако няма качен цял готов банер.</div>
    {logoUrl && <div style={box}><img src={logoUrl} alt="Текущо лого" style={{maxWidth:'100%',maxHeight:70,objectFit:'contain'}} /></div>}
    <input ref={logoInputRef} type="file" accept="image/png,image/jpeg,image/webp,image/svg+xml" onChange={e=>upload(e.target.files?.[0],'logo')} style={{display:'none'}} />
    <div style={{display:'flex',gap:8}}><button type="button" onClick={()=>logoInputRef.current?.click()} disabled={!!uploading} style={button}>{uploading==='logo'?'Качване...':logoUrl?'Смени логото':'Качи лого'}</button>{logoUrl&&<button type="button" onClick={()=>remove('logo')} style={{...button,flex:'none',border:'1px solid #744',color:'#F0B5B5'}}>Премахни</button>}</div>
    {message&&<div style={{marginTop:8,fontSize:11,color:message.startsWith('Грешка')?'#F19A9A':'#B8D9A8'}}>{message}</div>}
  </div>;
}
