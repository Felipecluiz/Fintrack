import type { AuthResponseDTO } from '@fintrack/contracts';

const STORAGE_KEY = 'fintrack.session';

export type Session = AuthResponseDTO;

/** Lê a sessão salva, descartando-a se já tiver expirado. */
export function loadSession(now = new Date()): Session | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const session = JSON.parse(raw) as Session;
    if (!session.token || new Date(session.expiresAt) <= now) {
      localStorage.removeItem(STORAGE_KEY);
      return null;
    }
    return session;
  } catch {
    return null;
  }
}

export function saveSession(session: Session): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(session));
  } catch {
    // Sem persistência (modo privado): a sessão dura até fechar a aba.
  }
}

export function clearSession(): void {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch {
    // nada a limpar
  }
}
