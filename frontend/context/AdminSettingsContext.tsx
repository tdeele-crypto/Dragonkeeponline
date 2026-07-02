import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { api } from '@/utils/api';

interface AdminSettingsValue {
  bannerImage: string | null;
  bannerText: string;
  bannerBgColor: string | null;
  headingColor: string | null;
  refresh: () => Promise<void>;
}

const AdminSettingsContext = createContext<AdminSettingsValue | null>(null);

export function AdminSettingsProvider({ children }: { children: React.ReactNode }) {
  const [bannerImage, setBannerImage] = useState<string | null>(null);
  const [bannerText, setBannerText] = useState('');
  const [bannerBgColor, setBannerBgColor] = useState<string | null>(null);
  const [headingColor, setHeadingColor] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    try {
      const data = await api.get('/admin/settings');
      setBannerImage(data.banner_image_base64 || null);
      setBannerText(data.banner_text || '');
      setBannerBgColor(data.banner_bg_color || null);
      setHeadingColor(data.heading_color || null);
    } catch (e) {
      // Banner is optional decoration - fail silently.
      console.log('Kunne ikke hente banner-indstillinger:', e);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return (
    <AdminSettingsContext.Provider value={{ bannerImage, bannerText, bannerBgColor, headingColor, refresh }}>
      {children}
    </AdminSettingsContext.Provider>
  );
}

export function useAdminSettings() {
  const ctx = useContext(AdminSettingsContext);
  if (!ctx) throw new Error('useAdminSettings must be used within AdminSettingsProvider');
  return ctx;
}
