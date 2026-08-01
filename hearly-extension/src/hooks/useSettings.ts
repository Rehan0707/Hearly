import { useEffect, useState } from 'react';
import type { AppSettings } from '@/utils/types';
import { loadAppSettings, saveAppSettings } from '@/services/storageService';
import { SPEAKER_SIMILARITY_THRESHOLD } from '@/config/constants';

const defaultSettings: AppSettings = {
  language: 'en',
  notifyNewVersions: true,
  notifyEmails: false,
  hearlyActive: false,
  transcriptEnabled: true,
  similarityThreshold: SPEAKER_SIMILARITY_THRESHOLD,
  groqApiKey: (import.meta.env.VITE_GROQ_API_KEY as string | undefined) ?? '',
  geminiApiKey: '',
};

export function useSettings() {
  const [settings, setSettings] = useState<AppSettings>(defaultSettings);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    void loadAppSettings().then((partial) => {
      setSettings({ ...defaultSettings, ...partial });
      setReady(true);
    });
  }, []);

  const update = async (next: AppSettings) => {
    setSettings(next);
    await saveAppSettings(next);
  };

  return { settings, ready, update };
}
