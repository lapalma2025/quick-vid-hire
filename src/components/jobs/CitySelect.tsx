import { SearchableSelect } from '@/components/ui/searchable-select';
import { MIASTA_BY_WOJEWODZTWO } from '@/lib/constants';

interface CitySelectProps {
  wojewodztwo: string;
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
}

export function CitySelect({ wojewodztwo, value, onChange, disabled }: CitySelectProps) {
  const miasta = wojewodztwo ? MIASTA_BY_WOJEWODZTWO[wojewodztwo] || [] : [];

  return (
    <SearchableSelect
      options={miasta}
      value={value}
      onChange={onChange}
      placeholder="Wybierz lub wpisz miasto"
      searchPlaceholder="Szukaj miasta..."
      emptyMessage="Nie znaleziono miasta."
      disabled={disabled || !wojewodztwo}
      allowCustom={true}
      customPlaceholder="Wpisz nazwę miejscowości..."
    />
  );
}