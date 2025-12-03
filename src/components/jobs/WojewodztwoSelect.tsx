import { SearchableSelect } from '@/components/ui/searchable-select';
import { WOJEWODZTWA } from '@/lib/constants';

interface WojewodztwoSelectProps {
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
}

export function WojewodztwoSelect({ value, onChange, disabled }: WojewodztwoSelectProps) {
  return (
    <SearchableSelect
      options={WOJEWODZTWA}
      value={value}
      onChange={onChange}
      placeholder="Wybierz województwo"
      searchPlaceholder="Szukaj województwa..."
      emptyMessage="Nie znaleziono województwa."
      disabled={disabled}
      allowCustom={false}
    />
  );
}