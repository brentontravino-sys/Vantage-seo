import React from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/ui/select';
import { useCurrencyRates } from '@/hooks/useLiveData';
import { Globe } from 'lucide-react';

// Common currencies (Frankfurter supports 30+, these are the useful subset)
const CURRENCIES = [
  { code: 'USD', label: 'US Dollar' },
  { code: 'EUR', label: 'Euro' },
  { code: 'GBP', label: 'British Pound' },
  { code: 'ZAR', label: 'South African Rand' },
  { code: 'AUD', label: 'Australian Dollar' },
  { code: 'CAD', label: 'Canadian Dollar' },
  { code: 'INR', label: 'Indian Rupee' },
  { code: 'JPY', label: 'Japanese Yen' },
  { code: 'BRL', label: 'Brazilian Real' },
  { code: 'CHF', label: 'Swiss Franc' },
  { code: 'SGD', label: 'Singapore Dollar' },
];

/**
 * Currency switcher backed by LIVE ECB rates (Frankfurter API).
 * Persists the chosen currency in localStorage so it's remembered across sessions.
 */
export default function CurrencySwitcher({ value, onChange }) {
  const { rates, live, loading } = useCurrencyRates('USD');
  const current = value || localStorage.getItem('vizion_currency') || 'USD';

  const handleChange = (next) => {
    localStorage.setItem('vizion_currency', next);
    onChange?.(next, rates);
  };

  return (
    <Select value={current} onValueChange={handleChange}>
      <SelectTrigger className="h-9 w-[140px] gap-2">
        <Globe className="h-4 w-4 text-muted-foreground" />
        <SelectValue placeholder="Currency" />
      </SelectTrigger>
      <SelectContent>
        {CURRENCIES.map((c) => (
          <SelectItem key={c.code} value={c.code}>
            {c.code} · {c.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
