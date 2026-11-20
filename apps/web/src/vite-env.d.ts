/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_API_URL?: string;
  /** Chave pública (sitekey) do Cloudflare Turnstile. Vazia = verificação desligada. */
  readonly VITE_TURNSTILE_SITE_KEY?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
