import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import type { L, Lang } from '../types';

interface Prefs {
  lang: Lang;
  large: boolean;
  contrast: boolean;
  low: boolean;
  setLang: (l: Lang) => void;
  setLarge: (v: boolean) => void;
  setContrast: (v: boolean) => void;
  setLow: (v: boolean) => void;
  resetPrefs: () => void;
  t: (s: L) => string;
}

const Ctx = createContext<Prefs | null>(null);

export function PrefsProvider({ children, applyToRoot = true }: { children: ReactNode; applyToRoot?: boolean }) {
  const [lang, setLang] = useState<Lang>('ru');
  const [large, setLarge] = useState(false);
  const [contrast, setContrast] = useState(false);
  const [low, setLow] = useState(false);

  useEffect(() => {
    const root = document.documentElement;
    root.lang = lang;
    if (!applyToRoot) return;
    root.dataset.font = large ? 'large' : 'normal';
    root.dataset.contrast = contrast ? 'high' : 'normal';
    root.dataset.reach = low ? 'low' : 'normal';
  }, [lang, large, contrast, low, applyToRoot]);

  const value = useMemo<Prefs>(
    () => ({
      lang,
      large,
      contrast,
      low,
      setLang,
      setLarge,
      setContrast,
      setLow,
      resetPrefs: () => {
        setLang('ru');
        setLarge(false);
        setContrast(false);
        setLow(false);
      },
      t: (s: L) => s[lang],
    }),
    [lang, large, contrast, low],
  );
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export const usePrefs = () => {
  const v = useContext(Ctx);
  if (!v) throw new Error('PrefsProvider missing');
  return v;
};
