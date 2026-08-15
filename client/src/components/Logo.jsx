import { Link } from 'react-router-dom';

export default function Logo({ dark = false }) {
  return (
    <Link to="/" className={`logo ${dark ? 'logo--dark' : ''}`} aria-label="TPC Logistics — home">
      <span className="logo__mark">
        <svg viewBox="0 0 64 64" fill="none" aria-hidden="true">
          <rect x="1.5" y="1.5" width="61" height="61" rx="14" fill="#FFB800" />
          <path d="M13 40h25v-7a4 4 0 0 0-4-4h-6v-8a4 4 0 0 0-4-4H17a4 4 0 0 0-4 4v19z" fill="#0A0A0A" />
          <circle cx="20" cy="47" r="4" fill="#0A0A0A" />
          <circle cx="41" cy="47" r="4" fill="#0A0A0A" />
          <path d="M41 20h5l5 6v6h-10z" fill="#0A0A0A" opacity="0.88" />
        </svg>
      </span>
      <span className="logo__word">
        <span className="logo__name">TPC</span>
        <span className="logo__tag">LOGISTICS</span>
      </span>
    </Link>
  );
}
