export function SunIcon(props) {
  return (
    <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.6" {...props}>
      <circle cx="10" cy="10" r="3.2" />
      <path
        strokeLinecap="round"
        d="M10 1.8v2M10 16.2v2M3.5 3.5l1.4 1.4M15.1 15.1l1.4 1.4M1.8 10h2M16.2 10h2M3.5 16.5l1.4-1.4M15.1 4.9l1.4-1.4"
      />
    </svg>
  )
}

export function MoonIcon(props) {
  return (
    <svg viewBox="0 0 20 20" fill="currentColor" {...props}>
      <path d="M17 11.5A7 7 0 0 1 8.5 3a7 7 0 1 0 8.5 8.5Z" />
    </svg>
  )
}

export function FlagIcon(props) {
  return (
    <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.6" {...props}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 18V3.2c3.7-2 7.3 2 11-.1v9c-3.7 2.1-7.3-1.9-11 .1" />
    </svg>
  )
}

// The flag as a drawn shape rather than 🇳🇬 — regional-indicator emoji fall back
// to bare letters or tofu on Windows and most Linux browsers.
export function NigeriaFlagIcon(props) {
  return (
    <svg viewBox="0 0 18 12" {...props}>
      <rect width="18" height="12" rx="1.5" fill="#fff" />
      <path d="M0 1.5A1.5 1.5 0 0 1 1.5 0H6v12H1.5A1.5 1.5 0 0 1 0 10.5ZM12 0h4.5A1.5 1.5 0 0 1 18 1.5v9a1.5 1.5 0 0 1-1.5 1.5H12Z" fill="#008751" />
      <rect x="0.35" y="0.35" width="17.3" height="11.3" rx="1.2" fill="none" stroke="#00000018" strokeWidth="0.7" />
    </svg>
  )
}
