import { useState, useCallback } from 'react';
import { useAuth } from '../../context/AuthContext';

export function useLoginScreen() {
  const { login } = useAuth();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const onSubmit = useCallback(async () => {
    setError('');
    const result = await login(username, password);
    if (!result.ok) {
      setError(result.error ?? 'Sign-in failed.');
    }
  }, [username, password, login]);

  return {
    username,
    setUsername,
    password,
    setPassword,
    error,
    onSubmit,
  };
}
