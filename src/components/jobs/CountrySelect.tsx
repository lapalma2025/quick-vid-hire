import { SearchableSelect } from '@/components/ui/searchable-select';
import { KRAJE } from '@/lib/constants';

interface CountrySelectProps {
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
}

export function CountrySelect({ value, onChange, disabled }: CountrySelectProps) {
  return (
    <SearchableSelect
      options={KRAJE}
      value={value}
      onChange={onChange}
      placeholder="Wybierz kraj"
      searchPlaceholder="Szukaj kraju..."
      emptyMessage="Nie znaleziono kraju."
      disabled={disabled}
      allowCustom={true}
      customPlaceholder="Wpisz nazwę kraju..."
    />
  );
}
