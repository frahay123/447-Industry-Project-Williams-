import { useState, useCallback } from 'react';
import { useAuth } from '../../context/AuthContext';

export function useLoginScreen() {
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const onSubmit = useCallback(async () => {
    setError('');
    const result = await login(email, password);
    if (!result.ok) {
      setError(result.error ?? 'Sign-in failed.');
    }
  }, [email, password, login]);

  return {
    email,
    setEmail,
    password,
    setPassword,
    error,
    onSubmit,
  };
}
