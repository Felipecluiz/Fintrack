import type { LoginInput, RegisterInput, UserDTO } from '@fintrack/contracts';
import { useQueryClient } from '@tanstack/react-query';
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import { setAuthToken, setUnauthorizedHandler } from '../../shared/api/httpClient';
import { useToast } from '../../shared/ui/Toaster';
import { authApi, DEMO_CREDENTIALS } from './api';
import { clearSession, loadSession, saveSession, type Session } from './session';

interface AuthContextValue {
  user: UserDTO | null;
  login: (input: LoginInput) => Promise<void>;
  register: (input: RegisterInput, humanToken?: string) => Promise<void>;
  loginAsDemo: () => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

function restoreSession(): Session | null {
  const session = loadSession();
  setAuthToken(session?.token ?? null);
  return session;
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const queryClient = useQueryClient();
  const notify = useToast();
  const [session, setSession] = useState<Session | null>(restoreSession);

  /**
   * Troca de usuário = dados em cache descartados, para nunca mostrar dados de
   * outra conta. Usa `removeQueries` e não `clear`: `clear` também apaga o cache
   * de mutations e "reseta" o login/cadastro que ainda está em andamento.
   */
  const startSession = useCallback(
    (next: Session) => {
      saveSession(next);
      setAuthToken(next.token);
      queryClient.removeQueries();
      setSession(next);
    },
    [queryClient],
  );

  const logout = useCallback(() => {
    clearSession();
    setAuthToken(null);
    queryClient.removeQueries();
    setSession(null);
  }, [queryClient]);

  // AC-504: qualquer 401 numa requisição autenticada encerra a sessão.
  useEffect(() => {
    setUnauthorizedHandler(() => {
      logout();
      notify('Sua sessão expirou. Entre novamente.', 'error');
    });
    return () => setUnauthorizedHandler(null);
  }, [logout, notify]);

  const value = useMemo<AuthContextValue>(
    () => ({
      user: session?.user ?? null,
      login: async (input) => startSession(await authApi.login(input)),
      register: async (input, humanToken) =>
        startSession(await authApi.register(input, humanToken)),
      loginAsDemo: async () => startSession(await authApi.login(DEMO_CREDENTIALS)),
      logout,
    }),
    [session, startSession, logout],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used inside <AuthProvider>');
  return context;
}
