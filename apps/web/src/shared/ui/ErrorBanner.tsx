import { describeError } from '../lib/describeError';

export function ErrorBanner({ error }: { error: unknown }) {
  if (!error) return null;
  const { title, detail } = describeError(error);
  return (
    <div className="banner banner--error" role="alert">
      <strong>{title}</strong>
      {detail && <span className="banner__detail">{detail}</span>}
    </div>
  );
}
