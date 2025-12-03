import { SearchableSelect } from '@/components/ui/searchable-select';
import { MIASTA_BY_KRAJ } from '@/lib/constants';

interface ForeignCitySelectProps {
  country: string;
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
}

export function ForeignCitySelect({ country, value, onChange, disabled }: ForeignCitySelectProps) {
  const miasta = country ? MIASTA_BY_KRAJ[country] || [] : [];

  return (
    <SearchableSelect
      options={miasta}
      value={value}
      onChange={onChange}
      placeholder="Wybierz lub wpisz miasto"
      searchPlaceholder="Szukaj miasta..."
      emptyMessage="Nie znaleziono miasta."
      disabled={disabled || !country}
      allowCustom={true}
      customPlaceholder="Wpisz nazwę miasta..."
    />
  );
}
