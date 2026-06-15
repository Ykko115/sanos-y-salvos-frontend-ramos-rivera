import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getToken } from '../js/auth';

export function useSessionGuard() {
  const navigate = useNavigate();
  useEffect(() => {
    const check = () => {
      if (!getToken()) navigate('/');
    };
    check();
    const id = setInterval(check, 10000);
    return () => clearInterval(id);
  }, [navigate]);
}
