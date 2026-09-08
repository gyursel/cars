import { useId } from 'react';

export default function SuggestInput({ value, onChange, placeholder, options = [], style = {}, title }) {
  const rid = useId().replace(/:/g, '');
  const listId = `suggest-${rid}`;
  return (
    <div style={{ position: 'relative', minWidth: 0 }}>
      <input
        value={value || ''}
        onChange={onChange}
        placeholder={placeholder}
        list={listId}
        autoComplete="off"
        title={title || 'Можеш да избереш предложение или да напишеш собствена стойност'}
        style={{ width: '100%', padding: '7px 30px 7px 8px', border: '0.5px solid rgba(140,150,160,0.3)', borderRadius: 4, fontSize: 13, background: '#F9FAFA', outline: 'none', ...style }}
      />
      <span aria-hidden="true" style={{ position: 'absolute', right: 9, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none', color: '#8A7425', fontSize: 11 }}>▼</span>
      <datalist id={listId}>
        {options.map(opt => <option key={opt} value={opt} />)}
      </datalist>
    </div>
  );
}
