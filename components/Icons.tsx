"use client";

export function FootballIcon({ className = "h-10 w-10" }: { className?: string }) {
  return (
    <svg viewBox="0 0 64 64" className={className} fill="none" aria-hidden>
      <circle cx="32" cy="32" r="22" fill="#f4f0e6" />
      <path
        d="M32 12c-3 6-4 14-4 20s1 14 4 20c3-6 4-14 4-20s-1-14-4-20Z"
        fill="#1b1b1b"
      />
      <path d="M18 24c8 3 20 3 28 0" stroke="#1b1b1b" strokeWidth="3" />
      <path d="M18 40c8-3 20-3 28 0" stroke="#1b1b1b" strokeWidth="3" />
    </svg>
  );
}

export function VolleyballIcon({ className = "h-10 w-10" }: { className?: string }) {
  return (
    <svg viewBox="0 0 64 64" className={className} fill="none" aria-hidden>
      <circle cx="32" cy="32" r="22" fill="#f3f4f6" />
      <path
        d="M16 24c10 8 22 10 32 6"
        stroke="#f97316"
        strokeWidth="4"
        fill="none"
      />
      <path
        d="M18 42c9-6 20-7 30-2"
        stroke="#ea580c"
        strokeWidth="4"
        fill="none"
      />
      <path d="M32 10c-2 10 2 22 12 34" stroke="#fb923c" strokeWidth="4" />
    </svg>
  );
}

export function GoalkeeperMark({ className = "h-8 w-8" }: { className?: string }) {
  return (
    <svg viewBox="0 0 64 64" className={className} fill="none" aria-hidden>
      <rect x="10" y="18" width="44" height="28" rx="6" fill="#f4f0e6" />
      <path d="M18 24h28M18 32h28M18 40h28" stroke="#1b1b1b" strokeWidth="3" />
      <path d="M32 12v8M26 16h12" stroke="#facc15" strokeWidth="4" strokeLinecap="round" />
      <circle cx="32" cy="34" r="10" fill="#facc15" />
      <path
        d="M27 34h10M32 29v10"
        stroke="#1b1b1b"
        strokeWidth="2.5"
        strokeLinecap="round"
      />
    </svg>
  );
}

export function TicketMark({ className = "h-8 w-8" }: { className?: string }) {
  return (
    <svg viewBox="0 0 48 48" className={className} fill="none" aria-hidden>
      <rect x="6" y="12" width="36" height="24" rx="4" fill="#3d9a57" />
      <circle cx="6" cy="24" r="5" fill="#07110e" />
      <circle cx="42" cy="24" r="5" fill="#07110e" />
      <rect x="18" y="18" width="12" height="12" rx="2" fill="#f4f0e6" />
    </svg>
  );
}
