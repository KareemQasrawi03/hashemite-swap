'use client';

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { deleteListing, fetchListings, markSwapped } from '@/lib/data';
import { MESSAGES, type MsgKey } from '@/lib/i18n';
import { LS } from '@/lib/storage';
import type { Lang, Listing, Lookups, Named, Theme } from '@/lib/types';

type Tokens = Record<string, string>;

type AppCtx = {
  configured: boolean;
  lang: Lang;
  setLang: (l: Lang) => void;
  theme: Theme;
  setTheme: (t: Theme) => void;
  t: (k: MsgKey, vars?: Record<string, string | number>) => string;
  nm: (o: Named) => string;
  pick: (l: Listing, field: 'title' | 'description' | 'want') => string;
  lookups: Lookups;
  listings: Listing[];
  loaded: boolean;
  loadErr: boolean;
  refresh: () => Promise<void>;
  isMine: (id: string) => boolean;
  myIds: () => string[];
  addToken: (id: string, token: string) => void;
  /** Removes one of my listings; with swapped=true it is recorded as a completed swap instead of deleted. */
  removeListing: (id: string, swapped?: boolean) => Promise<void>;
  toastMsg: string | null;
  toast: (msg: string) => void;
  addOpen: boolean;
  openAdd: () => void;
  closeAdd: () => void;
};

const Ctx = createContext<AppCtx | null>(null);

export function useApp(): AppCtx {
  const c = useContext(Ctx);
  if (!c) throw new Error('useApp must be used inside <AppProvider>');
  return c;
}

function applyLangToDom(l: Lang) {
  const r = document.documentElement;
  r.lang = l;
  r.dir = l === 'ar' ? 'rtl' : 'ltr';
}

export default function AppProvider({
  lookups,
  configured,
  children,
}: {
  lookups: Lookups;
  configured: boolean;
  children: ReactNode;
}) {
  const [lang, setLangState] = useState<Lang>('ar');
  const [theme, setThemeState] = useState<Theme>('light');
  const [rows, setRows] = useState<Listing[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [loadErr, setLoadErr] = useState(false);
  const [tokens, setTokens] = useState<Tokens>({});
  const tokensRef = useRef<Tokens>({});
  const [toastMsg, setToastMsg] = useState<string | null>(null);
  const toastTimer = useRef<ReturnType<typeof setTimeout>>(undefined);
  const [addOpen, setAddOpen] = useState(false);
  const opener = useRef<HTMLElement | null>(null);

  // Restore per-browser preferences after hydration.
  useEffect(() => {
    const l = LS.get<string>('hu.lang', 'ar');
    if (l === 'ar' || l === 'en') {
      setLangState(l);
      applyLangToDom(l);
    }
    const th = LS.get<string>('hu.theme', 'light');
    if (th === 'light' || th === 'dark' || th === 'auto') setThemeState(th);
    const tk = LS.get<unknown>('hu.tokens', {});
    if (tk && typeof tk === 'object' && !Array.isArray(tk)) {
      tokensRef.current = tk as Tokens;
      setTokens(tk as Tokens);
    }
  }, []);

  const writeTokens = useCallback((next: Tokens) => {
    tokensRef.current = next;
    setTokens(next);
    LS.set('hu.tokens', next);
  }, []);

  const setLang = useCallback((l: Lang) => {
    setLangState(l);
    LS.set('hu.lang', l);
    applyLangToDom(l);
  }, []);

  const setTheme = useCallback((th: Theme) => {
    setThemeState(th);
    LS.set('hu.theme', th);
    if (th === 'auto') document.documentElement.removeAttribute('data-theme');
    else document.documentElement.setAttribute('data-theme', th);
  }, []);

  const t = useCallback(
    (k: MsgKey, vars?: Record<string, string | number>) => {
      let s = MESSAGES[lang][k] ?? k;
      if (vars) for (const x in vars) s = s.replace('{' + x + '}', String(vars[x]));
      return s;
    },
    [lang],
  );
  const nm = useCallback((o: Named) => (lang === 'en' ? o.name_en : o.name_ar) || o.name_ar, [lang]);
  const pick = useCallback(
    (l: Listing, field: 'title' | 'description' | 'want') => (lang === 'en' && l[`${field}_en`]) || l[field] || '',
    [lang],
  );

  const refresh = useCallback(async () => {
    if (!configured) return;
    try {
      setRows(await fetchListings());
      setLoaded(true);
      setLoadErr(false);
    } catch {
      setLoadErr(true);
    }
  }, [configured]);

  useEffect(() => {
    refresh();
    const id = setInterval(() => {
      if (!document.hidden) refresh();
    }, 45000);
    const onVis = () => {
      if (!document.hidden) refresh();
    };
    document.addEventListener('visibilitychange', onVis);
    return () => {
      clearInterval(id);
      document.removeEventListener('visibilitychange', onVis);
    };
  }, [refresh]);

  // Example listings only fill the board until someone posts a real one.
  const listings = useMemo(() => {
    const real = rows.filter((r) => !r.is_example);
    return real.length ? real : rows;
  }, [rows]);

  const isMine = useCallback((id: string) => Boolean(tokens[id]), [tokens]);
  const myIds = useCallback(() => Object.keys(tokensRef.current), []);
  const addToken = useCallback(
    (id: string, token: string) => writeTokens({ ...tokensRef.current, [id]: token }),
    [writeTokens],
  );
  const removeListing = useCallback(
    async (id: string, swapped = false) => {
      const token = tokensRef.current[id] || '';
      if (swapped) await markSwapped(id, token);
      else await deleteListing(id, token);
      const next = { ...tokensRef.current };
      delete next[id];
      writeTokens(next);
    },
    [writeTokens],
  );

  const toast = useCallback((msg: string) => {
    setToastMsg(msg);
    clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToastMsg(null), 2800);
  }, []);

  const openAdd = useCallback(() => {
    opener.current = document.activeElement as HTMLElement | null;
    setAddOpen(true);
  }, []);
  const closeAdd = useCallback(() => {
    setAddOpen(false);
    const el = opener.current;
    if (el && el.isConnected) setTimeout(() => el.focus(), 0);
  }, []);

  const value: AppCtx = {
    configured, lang, setLang, theme, setTheme, t, nm, pick, lookups,
    listings, loaded, loadErr, refresh, isMine, myIds, addToken, removeListing,
    toastMsg, toast, addOpen, openAdd, closeAdd,
  };

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}
