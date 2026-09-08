export default function CarPickerModal({ catalog, loading, search, onSearch, onAdd, onClose }) {
  const q = search.trim().toLowerCase();
  const filtered = q ? catalog.filter(c => (c.name || '').toLowerCase().includes(q)) : catalog;

  return (
    <div
      onClick={onClose}
      style={{ position: 'fixed', inset: 0, background: 'rgba(6,8,10,0.6)', zIndex: 300, display: 'flex', alignItems: 'flex-end', justifyContent: 'center' }}
    >
      <div
        onClick={e => e.stopPropagation()}
        style={{ background: '#F5F6F7', width: '100%', maxWidth: 480, maxHeight: '82vh', borderRadius: '18px 18px 0 0', display: 'flex', flexDirection: 'column', overflow: 'hidden', boxShadow: '0 -12px 40px rgba(0,0,0,0.4)' }}
      >
        <div style={{ padding: '1rem 1.1rem 0.75rem', borderBottom: '0.5px solid rgba(140,150,160,0.28)' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
            <div style={{ fontSize: 15, fontWeight: 600, color: '#12151A' }}>📚 Каталог с автомобили</div>
            <button onClick={onClose} style={{ background: 'none', border: 'none', color: '#5B6470', fontSize: 22, cursor: 'pointer', lineHeight: 1, padding: 0 }}>×</button>
          </div>

          <input
            autoFocus
            value={search}
            onChange={e => onSearch(e.target.value)}
            placeholder="Търси по марка/модел..."
            style={{ width: '100%', padding: '9px 12px', border: '0.5px solid rgba(140,150,160,0.4)', borderRadius: 8, fontSize: 14, outline: 'none', background: 'white' }}
          />
        </div>

        <div style={{ overflowY: 'auto', padding: '0.5rem 1.1rem 1.25rem' }}>
          {loading && (
            <div style={{ textAlign: 'center', color: '#C9A227', fontSize: 13, padding: '1.75rem 0' }}>⏳ Зареждане...</div>
          )}

          {!loading && filtered.length === 0 && (
            <div style={{ textAlign: 'center', color: '#5B6470', fontSize: 13, padding: '1.75rem 0', lineHeight: 1.6 }}>
              {catalog.length === 0
                ? 'Каталогът е още празен. Добави автомобил ръчно и запази — той ще се появи тук за бъдеща употреба.'
                : 'Няма автомобил с това име.'}
            </div>
          )}

          {filtered.map(c => (
            <div key={c.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 0', borderBottom: '0.5px solid rgba(140,150,160,0.18)' }}>
              {c.image ? (
                <img src={c.image} alt="" style={{ width: 46, height: 46, borderRadius: 8, objectFit: 'cover', flexShrink: 0 }} />
              ) : (
                <div style={{ width: 46, height: 46, borderRadius: 8, background: '#e6e8eb', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18 }}>🚗</div>
              )}

              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 13, fontWeight: 600, color: '#12151A', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {c.name}
                </div>
                <div style={{ fontSize: 11, color: '#5B6470' }}>
                  {c.category ? `${c.category} · ` : ''}{c.price ? `${c.price} €` : ''}
                </div>
              </div>

              <button
                onClick={() => onAdd(c)}
                style={{ background: '#12151A', color: '#E8B830', border: 'none', borderRadius: 6, padding: '7px 12px', fontSize: 12, fontWeight: 500, cursor: 'pointer', flexShrink: 0 }}
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
