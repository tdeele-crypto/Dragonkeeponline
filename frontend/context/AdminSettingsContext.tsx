import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { api } from '@/utils/api';
import { t as translate, type Language, type WeightUnit, type TimeFormat } from '@/i18n/translations';

interface AdminSettingsValue {
  bannerImage: string | null;
  bannerText: string;
  bannerBgColor: string | null;
  headingColor: string | null;
  appBgColor: string | null;
  pageTitleColor: string | null;
  language: Language;
  weightUnit: WeightUnit;
  timeFormat: TimeFormat;
  t: (key: string, vars?: Record<string, string | number>) => string;
  refresh: () => Promise<void>;
}

const AdminSettingsContext = createContext<AdminSettingsValue | null>(null);

export function AdminSettingsProvider({ children }: { children: React.ReactNode }) {
  const [bannerImage, setBannerImage] = useState<string | null>(null);
  const [bannerText, setBannerText] = useState('');
  const [bannerBgColor, setBannerBgColor] = useState<string | null>(null);
  const [headingColor, setHeadingColor] = useState<string | null>(null);
  const [appBgColor, setAppBgColor] = useState<string | null>(null);
  const [pageTitleColor, setPageTitleColor] = useState<string | null>(null);
  const [language, setLanguage] = useState<Language>('en');
  const [weightUnit, setWeightUnit] = useState<WeightUnit>('g');
  const [timeFormat, setTimeFormat] = useState<TimeFormat>('12h');

  const refresh = useCallback(async () => {
    try {
      const data = await api.get('/admin/settings');
      setBannerImage(data.banner_image_base64 || null);
      setBannerText(data.banner_text || '');
      setBannerBgColor(data.banner_bg_color || null);
      setHeadingColor(data.heading_color || null);
      setAppBgColor(data.app_bg_color || null);
      setPageTitleColor(data.page_title_color || null);
      setLanguage((data.language as Language) || 'en');
      setWeightUnit((data.weight_unit as WeightUnit) || 'g');
      setTimeFormat((data.time_format as TimeFormat) || '12h');
    } catch (e) {
      // Settings are optional decoration/preferences - fail silently.
      console.log('Could not load admin settings:', e);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const t = useMemo(
    () => (key: string, vars?: Record<string, string | number>) => translate(key, language, vars),
    [language]
  );

  return (
    <AdminSettingsContext.Provider
      value={{
        bannerImage,
        bannerText,
        bannerBgColor,
        headingColor,
        appBgColor,
        pageTitleColor,
        language,
        weightUnit,
        timeFormat,
        t,
        refresh,
      }}
    >
      {children}
    </AdminSettingsContext.Provider>
  );
}

export function useAdminSettings() {
  const ctx = useContext(AdminSettingsContext);
  if (!ctx) throw new Error('useAdminSettings must be used within AdminSettingsProvider');
  return ctx;
}
