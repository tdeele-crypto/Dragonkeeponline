import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import * as Localization from 'expo-localization';
import { api } from '@/utils/api';
import { t as translate, type Language, type WeightUnit, type TimeFormat } from '@/i18n/translations';

/** Detect a sensible default language from the device/system locale.
 * Falls back to English for any locale that isn't Danish. */
function detectDeviceLanguage(): Language {
  try {
    const locales = Localization.getLocales();
    const code = locales?.[0]?.languageCode?.toLowerCase();
    return code === 'da' ? 'da' : 'en';
  } catch {
    return 'en';
  }
}

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
  lightSummerStart: string;
  lightWinterStart: string;
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
  const [language, setLanguage] = useState<Language>(detectDeviceLanguage);
  const [weightUnit, setWeightUnit] = useState<WeightUnit>('g');
  const [timeFormat, setTimeFormat] = useState<TimeFormat>('12h');
  const [lightSummerStart, setLightSummerStart] = useState('03-01');
  const [lightWinterStart, setLightWinterStart] = useState('09-01');

  const refresh = useCallback(async () => {
    try {
      const data = await api.get('/admin/settings');
      setBannerImage(data.banner_image_base64 || null);
      setBannerText(data.banner_text || '');
      setBannerBgColor(data.banner_bg_color || null);
      setHeadingColor(data.heading_color || null);
      setAppBgColor(data.app_bg_color || null);
      setPageTitleColor(data.page_title_color || null);
      setWeightUnit((data.weight_unit as WeightUnit) || 'g');
      setTimeFormat((data.time_format as TimeFormat) || '12h');
      setLightSummerStart(data.light_summer_start || '03-01');
      setLightWinterStart(data.light_winter_start || '09-01');

      if (data.language === 'en' || data.language === 'da') {
        // Language was already explicitly chosen before (either by the user
        // or a previous auto-detection) - always respect that stored value.
        setLanguage(data.language);
      } else {
        // First run: no language preference stored yet - use the device's
        // system language, then persist it so it only auto-detects once.
        const detected = detectDeviceLanguage();
        setLanguage(detected);
        api.put('/admin/settings', { language: detected }).catch(() => {});
      }
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
        lightSummerStart,
        lightWinterStart,
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
