import { useState } from 'react';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { MIASTA_BY_WOJEWODZTWO } from '@/lib/constants';

interface CitySelectProps {
  wojewodztwo: string;
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
}

const CUSTOM_OPTION = '__CUSTOM__';

export function CitySelect({ wojewodztwo, value, onChange, disabled }: CitySelectProps) {
  const miasta = wojewodztwo ? MIASTA_BY_WOJEWODZTWO[wojewodztwo] || [] : [];
  const [showCustomInput, setShowCustomInput] = useState(false);
  const [customCity, setCustomCity] = useState('');

  // Check if current value is custom (not in the list)
  const isCustomValue = value && !miasta.includes(value) && value !== '';

  const handleSelectChange = (selected: string) => {
    if (selected === CUSTOM_OPTION) {
      setShowCustomInput(true);
      setCustomCity('');
    } else {
      setShowCustomInput(false);
      onChange(selected);
    }
  };

  const handleCustomInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    setCustomCity(newValue);
    onChange(newValue);
  };

  if (showCustomInput || isCustomValue) {
    return (
      <div className="flex gap-2">
        <Input
          placeholder="Wpisz nazwę miejscowości"
          value={isCustomValue ? value : customCity}
          onChange={handleCustomInputChange}
          disabled={disabled}
          className="flex-1"
        />
        <button
          type="button"
          onClick={() => {
            setShowCustomInput(false);
            onChange('');
          }}
          className="text-sm text-muted-foreground hover:text-foreground px-2"
        >
          Lista
        </button>
      </div>
    );
  }

  return (
    <Select value={value} onValueChange={handleSelectChange} disabled={disabled}>
      <SelectTrigger>
        <SelectValue placeholder="Wybierz miasto" />
      </SelectTrigger>
      <SelectContent>
        {miasta.map((m) => (
          <SelectItem key={m} value={m}>{m}</SelectItem>
        ))}
        <SelectItem value={CUSTOM_OPTION} className="text-primary">
          + Inne miasto...
        </SelectItem>
      </SelectContent>
    </Select>
  );
}
