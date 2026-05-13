import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAuth } from './AuthContext';
import { apiFetch } from '../api/client';

const STORAGE_PROJECT_ID = 'mec2_selected_project_id';

const ProjectContext = createContext(null);

export function ProjectProvider({ children }) {
  const { session, apiSession } = useAuth();
  const [projects, setProjects] = useState([]);
  const [selectedProjectId, setSelectedProjectIdState] = useState(null);
  const [loading, setLoading] = useState(false);
  const [ready, setReady] = useState(false);

  const refreshProjects = useCallback(async () => {
    if (!apiSession) {
      setProjects([]);
      return [];
    }
    const rows = await apiFetch('/api/projects', {}, apiSession);
    const list = Array.isArray(rows) ? rows : [];
    setProjects(list);
    return list;
  }, [apiSession]);

  useEffect(() => {
    if (!session?.token) {
      setProjects([]);
      setSelectedProjectIdState(null);
      setReady(true);
      return;
    }

    let cancelled = false;
    (async () => {
      setReady(false);
      setLoading(true);
      try {
        const stored = await AsyncStorage.getItem(STORAGE_PROJECT_ID);
        const parsed = stored ? parseInt(stored, 10) : null;
        const storedId = Number.isFinite(parsed) ? parsed : null;
        const list = await refreshProjects();
        if (cancelled) return;
        if (storedId && list.some((p) => p.id === storedId)) {
          setSelectedProjectIdState(storedId);
        } else {
          setSelectedProjectIdState(null);
          if (storedId) await AsyncStorage.removeItem(STORAGE_PROJECT_ID);
        }
      } catch {
        if (!cancelled) {
          setProjects([]);
          setSelectedProjectIdState(null);
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
          setReady(true);
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [session?.token, refreshProjects]);

  useEffect(() => {
    if (selectedProjectId == null || projects.length === 0) return;
    const ok = projects.some((p) => p.id === selectedProjectId);
    if (!ok) {
      setSelectedProjectIdState(null);
      AsyncStorage.removeItem(STORAGE_PROJECT_ID);
    }
  }, [projects, selectedProjectId]);

  const setSelectedProjectId = useCallback(async (id) => {
    setSelectedProjectIdState(id);
    if (id == null) {
      await AsyncStorage.removeItem(STORAGE_PROJECT_ID);
    } else {
      await AsyncStorage.setItem(STORAGE_PROJECT_ID, String(id));
    }
  }, []);

  const selectedProject = useMemo(
    () => projects.find((p) => p.id === selectedProjectId) ?? null,
    [projects, selectedProjectId],
  );

  const value = useMemo(
    () => ({
      ready,
      loading,
      projects,
      selectedProjectId,
      selectedProject,
      setSelectedProjectId,
      refreshProjects,
    }),
    [
      ready,
      loading,
      projects,
      selectedProjectId,
      selectedProject,
      setSelectedProjectId,
      refreshProjects,
    ],
  );

  return (
    <ProjectContext.Provider value={value}>{children}</ProjectContext.Provider>
  );
}

export function useProject() {
  const ctx = useContext(ProjectContext);
  if (!ctx) {
    throw new Error('useProject must be used within ProjectProvider');
  }
  return ctx;
}
