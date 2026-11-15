import { useMutation } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { useAuth } from './AuthProvider';

/** AC-502: entra com a conta demo e abre o app. */
export function useDemoLogin() {
  const { loginAsDemo } = useAuth();
  const navigate = useNavigate();
  return useMutation({
    mutationFn: loginAsDemo,
    onSuccess: () => navigate('/app'),
  });
}
