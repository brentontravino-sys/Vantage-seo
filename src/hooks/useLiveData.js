import { useEffect, useState, useCallback } from 'react';
import { vizion } from '@/api/vizionClient';

/**
 * Live currency rates via Frankfurter (ECB). No key required.
 * Returns { base, rates, loading, live, error }. `rates` is { USD, EUR, ... }.
 */
export function useCurrencyRates(base = 'USD') {
  const [state, setState] = useState({ base, rates: null, loading: true, live: false, error: null });
  useEffect(() => {
    let alive = true;
    setState((s) => ({ ...s, loading: true }));
    vizion.live
      .currency(base)
      .then((res) => {
        if (!alive) return;
        setState({ base, rates: res.rates || null, loading: false, live: !!res.live, error: res.live ? null : res.error });
      })
      .catch((e) => {
        if (!alive) return;
        setState({ base, rates: null, loading: false, live: false, error: e.message });
      });
    return () => { alive = false; };
  }, [base]);
  return state;
}

/**
 * Convert an amount from USD into the chosen currency using live ECB rates.
 * `usd` is the canonical stored value; display-currency is purely a view concern.
 */
export function convertFromUSD(usd, currency, rates) {
  if (usd == null) return null;
  if (!rates) return usd;
  if (currency === 'USD') return usd;
  const rate = rates[currency]; // rate = 1 USD in `currency`
  return rate != null ? usd * rate : usd;
}

export function formatCurrency(value, currency) {
  if (value == null) return '—';
  try {
    return new Intl.NumberFormat(undefined, { style: 'currency', currency, maximumFractionDigits: 0 }).format(value);
  } catch {
    return `${Math.round(value).toLocaleString()} ${currency}`;
  }
}

/**
 * Live PageSpeed Insights for a URL (real Core Web Vitals + Lighthouse + opportunities).
 * Returns { data, loading, live, error }. `data` is the normalized payload from the backend.
 */
export function usePageSpeed(url, strategy = 'mobile') {
  const [state, setState] = useState({ data: null, loading: !url, live: false, error: null });
  const run = useCallback((u = url, s = strategy) => {
    const target = /^https?:\/\//i.test(u) ? u : `https://${u}`;
    setState((x) => ({ ...x, loading: true, error: null }));
    vizion.live
      .pageSpeed(target, s)
      .then((res) => {
        setState({ data: res, loading: false, live: !!res.live, error: res.live ? null : res.error });
      })
      .catch((e) => setState({ data: null, loading: false, live: false, error: e.message }));
  }, [url, strategy]);

  useEffect(() => {
    if (url) run(url, strategy);
  }, [url, strategy, run]);

  return { ...state, refresh: run };
}
