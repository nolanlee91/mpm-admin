// Shared palette (matches the app/audit dark theme) + a couple of style helpers.
export const C = {
  bg: '#0B0E14', surface: '#161B22', surfaceHi: '#1E2530', surfaceHigh: '#252D3A',
  border: '#21262D', text: '#E6EDF3', muted: '#7D8590',
  primary: '#54e98a', blue: '#92ccff', amber: '#ffb347', red: '#f47067',
}

export const btn = (variant = 'primary') => ({
  border: 'none', borderRadius: 9, padding: '10px 14px', fontSize: '0.82rem',
  fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit',
  ...(variant === 'primary'
    ? { background: 'linear-gradient(135deg,#67f09a,#54e98a,#2db866)', color: '#061a0e' }
    : variant === 'ghost'
      ? { background: C.surfaceHigh, color: C.text, border: `1px solid ${C.border}` }
      : { background: 'transparent', color: C.red, border: '1px solid rgba(244,112,103,0.35)' }),
})

export const input = {
  width: '100%', background: C.surfaceHi, color: C.text, border: `1px solid ${C.border}`,
  borderRadius: 8, padding: '9px 11px', fontSize: '0.84rem', fontFamily: 'inherit',
}
