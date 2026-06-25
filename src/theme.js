// Shared palette (matches the app/audit dark theme) + style helpers.
export const C = {
  bg: '#0B0E14', surface: '#161B22', surfaceHi: '#1E2530', surfaceHigh: '#252D3A',
  border: '#21262D', text: '#E6EDF3', muted: '#7D8590',
  primary: '#54e98a', blue: '#92ccff', amber: '#ffb347', red: '#f47067',
}

// A soft, slightly raised panel — used for every section.
export const card = {
  background: 'linear-gradient(180deg, #171C24 0%, #14181f 100%)',
  border: `1px solid ${C.border}`,
  borderRadius: 14,
  padding: '18px 20px',
  boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.03), 0 10px 30px rgba(0,0,0,0.28)',
}

// Section header: a small accent bar + title + optional hint underneath.
export function sectionTitle(label) {
  return { display: 'flex', alignItems: 'center', gap: 9, fontSize: '0.98rem', fontWeight: 700, margin: 0 }
}
export const accentBar = { width: 4, height: 16, borderRadius: 3, background: 'linear-gradient(180deg,#67f09a,#2db866)', flexShrink: 0 }

export const btn = (variant = 'primary') => ({
  border: 'none', borderRadius: 9, padding: '10px 14px', fontSize: '0.82rem',
  fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit', letterSpacing: '0.01em',
  ...(variant === 'primary'
    ? { background: 'linear-gradient(135deg,#67f09a,#54e98a,#2db866)', color: '#061a0e', boxShadow: '0 4px 14px rgba(84,233,138,0.22)' }
    : variant === 'ghost'
      ? { background: C.surfaceHigh, color: C.text, border: `1px solid ${C.border}` }
      : { background: 'transparent', color: C.red, border: '1px solid rgba(244,112,103,0.35)' }),
})

export const input = {
  width: '100%', background: C.surfaceHi, color: C.text, border: `1px solid ${C.border}`,
  borderRadius: 9, padding: '10px 12px', fontSize: '0.84rem', fontFamily: 'inherit',
}
