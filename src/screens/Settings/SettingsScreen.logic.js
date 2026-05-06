import { useState, useCallback } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import { useAuth } from '../../context/AuthContext';
import { apiFetch } from '../../api/client';
import { ROLE_IDS } from '../../constants/roles';

export function useSettings() {
  const { session, apiSession } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [saveError, setSaveError] = useState('');
  const [saveSuccess, setSaveSuccess] = useState('');
  
  const [warehouse1Name, setWarehouse1Name] = useState('');
  const [warehouse2Name, setWarehouse2Name] = useState('');
  const [sesFromEmail, setSesFromEmail] = useState('');

  /** Only Administrator (built-in or assigned) may edit warehouse names. */
  const isAdmin = session?.roleId === ROLE_IDS.ADMINISTRATOR;

  const load = useCallback(async () => {
    if (!apiSession) return;
    setLoading(true);
    setError('');
    try {
      const data = await apiFetch('/api/settings', {}, apiSession);
      if (data) {
        setWarehouse1Name(data.warehouse1_name || '');
        setWarehouse2Name(data.warehouse2_name || '');
        setSesFromEmail(data.ses_from_email || '');
      }
    } catch (e) {
      setError(e.message || 'Failed to load settings.');
    } finally {
      setLoading(false);
    }
  }, [apiSession]);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  const saveSettings = useCallback(async () => {
    setSaveError('');
    setSaveSuccess('');
    try {
      await apiFetch(
        '/api/settings',
        {
          method: 'PUT',
          body: {
            warehouse1_name: warehouse1Name.trim(),
            warehouse2_name: warehouse2Name.trim(),
            ses_from_email: sesFromEmail.trim(),
          },
        },
        apiSession
      );
      setSaveSuccess('Settings saved successfully!');
      setTimeout(() => setSaveSuccess(''), 3000);
    } catch (e) {
      setSaveError(e.message || 'Failed to save settings.');
    }
  }, [warehouse1Name, warehouse2Name, sesFromEmail, apiSession]);

  return {
    isAdmin,
    loading,
    error,
    saveError,
    saveSuccess,
    warehouse1Name,
    setWarehouse1Name,
    warehouse2Name,
    setWarehouse2Name,
    sesFromEmail,
    setSesFromEmail,
    saveSettings,
  };
}
