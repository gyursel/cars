export default function InstallBanner({ dark, iosDevice, dealershipName, onInstall, onDismiss }) {
  return (
    <div
      style={{
        position: 'fixed',
        left: 12,
        right: 12,
        bottom: 12,
        zIndex: 150,
        maxWidth: 440,
        margin: '0 auto',
        background: dark
          ? 'linear-gradient(135deg, rgba(27,31,38,0.98), rgba(10,12,16,0.98))'
          : 'linear-gradient(135deg, #fff7dc, #ffffff)',
        border: '1px solid rgba(201,162,39,0.4)',
        borderRadius: 14,
        padding: '12px 12px 12px 14px',
        display: 'flex',
        alignItems: 'center',
        gap: 12,
        boxShadow: '0 14px 34px rgba(0,0,0,0.3)',
        animation: 'fadeUp 0.4s ease',
      }}
    >
      <div style={{ width: 42, height: 42, borderRadius: 10, background: '#12151A', color: '#E8B830', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, flexShrink: 0 }}>
        🚗
      </div>

      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 13, fontWeight: 600, color: dark ? '#E8B830' : '#12151A' }}>
          Добави {dealershipName} на началния екран
        </div>
        <div style={{ fontSize: 11, color: dark ? '#a8b0ba' : '#5B6470', marginTop: 2, lineHeight: 1.4 }}>
          {iosDevice
            ? 'Тапни бутона Споделяне ⬆️ в Safari, после „Добави към Начален екран“'
            : 'Бърз достъп до автомобилите, без да търсиш браузъра'}
        </div>
      </div>

      {!iosDevice && (
        <button
          onClick={onInstall}
          style={{ background: '#12151A', color: '#E8B830', border: 'none', borderRadius: 8, padding: '8px 12px', fontSize: 12, fontWeight: 600, cursor: 'pointer', flexShrink: 0, whiteSpace: 'nowrap' }}
        >
          Добави
        </button>
      )}

      <button
        onClick={onDismiss}
        style={{ background: 'none', border: 'none', color: dark ? '#8f98a3' : '#5B6470', fontSize: 18, cursor: 'pointer', flexShrink: 0, padding: 4, lineHeight: 1 }}
      >
        ×
      </button>
    </div>
  );
}
