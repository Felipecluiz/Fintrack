import { Link } from 'react-router-dom';

export function Brand({ to = '/' }: { to?: string }) {
  return (
    <Link to={to} className="brand">
      <span className="brand__mark" aria-hidden>
        <svg viewBox="0 0 32 32" width="28" height="28">
          <rect width="32" height="32" rx="8" fill="currentColor" />
          <path
            d="M9 21l5-6 4 3 5-7"
            stroke="white"
            strokeWidth="2.5"
            fill="none"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </span>
      Fintrack
    </Link>
  );
}
