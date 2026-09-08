import { useEffect, useState } from 'react';
import { BADGE_LABELS } from '../lib/carLotData';

export default function CarCard({ c, dark, badgeColors, index, onOpen }) {
  const [visible, setVisible] = useState(false);
  useEffect(() => { const t=setTimeout(()=>setVisible(true),80+index*45); return()=>clearTimeout(t); },[index]);
  const specs = [
    ['▣', c.productionDate || c.year], ['◷', c.mileage], ['⛽', c.fuel],
    ['⚡', c.power], ['▤', c.gearbox], ['◇', c.euroStandard || c.category]
  ].filter(([,v])=>v);
  return <article className="lux-car" onClick={onOpen} role="button" tabIndex={0} onKeyDown={e=>(e.key==='Enter'||e.key===' ')&&onOpen?.()} style={{opacity:visible?1:0,transform:visible?'none':'translateY(18px)'}}>
    <div className="lux-photo-wrap">
      {(c.image||c.images?.[0]) ? <img className="lux-photo" src={c.image||c.images?.[0]} alt={c.name}/> : <div className="lux-photo lux-placeholder">PM SELECT</div>}
      {c.badges?.[0] && <span className="lux-tag">{BADGE_LABELS[c.badges[0]]||c.badges[0]}</span>}
      <span className="lux-heart">♡</span>
    </div>
    <div className="lux-car-body">
      <div className="lux-car-head"><h3>{c.name}</h3><strong>{Number(c.price||0).toLocaleString('bg-BG')} €</strong></div>
      <div className="lux-specs">{specs.map(([i,v],n)=><div key={n}><span>{i}</span>{v}</div>)}</div>
      <button className="lux-more" type="button">ВИЖ ОЩЕ <span>→</span></button>
    </div>
  </article>;
}
