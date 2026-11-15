/**
 * Lista de origens permitidas no CORS. Aceita curinga de subdomínio,
 * ex.: "https://*.fintrack-web-0ff.pages.dev" cobre previews do Pages
 * (main.…, a0fd57cc.…) sem liberar qualquer site.
 */
export function createOriginMatcher(allowedOrigins: string) {
  const patterns = allowedOrigins
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean)
    .map(toRegExp);

  return (origin: string): boolean => patterns.some((pattern) => pattern.test(origin));
}

function toRegExp(origin: string): RegExp {
  const escaped = origin.replace(/[.+?^${}()|[\]\\]/g, '\\$&');
  // "*" vale exatamente um rótulo de subdomínio (letras, números e hífen).
  return new RegExp(`^${escaped.replace(/\*/g, '[a-z0-9-]+')}$`, 'i');
}
