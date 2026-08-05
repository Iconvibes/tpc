import { Link } from 'react-router-dom';

export default function Logo() {
  return (
    <Link to="/" className="logo" aria-label="TPC Logistics — home">
      <span className="logo__mark">
        <svg viewBox="0 0 64 64" fill="none" aria-hidden="true">
          <path d="M6 38h34v-9a5 5 0 0 0-5-5h-9V16a5 5 0 0 0-5-5H12a5 5 0 0 0-5 5v22z" fill="currentColor" />
          <circle cx="17" cy="48" r="6" fill="#eaf2fb" />
          <circle cx="46" cy="48" r="6" fill="#eaf2fb" />
          <path d="M45 22h7l7 9v7H45z" fill="currentColor" opacity="0.85" />
        </svg>
      </span>
      <span>
        <span className="logo__name">
          TPC<span> Logistics</span>
        </span>
        <span className="logo__tag">Delivering Excellence</span>
      </span>
    </Link>
  );
}
