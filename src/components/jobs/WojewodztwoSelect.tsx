import { SearchableSelect } from "@/components/ui/searchable-select";

// Only dolnośląskie - we support Wrocław and 50km radius only
const WOJEWODZTWA_LIMITED = ["dolnośląskie"] as const;

interface WojewodztwoSelectProps {
	value: string;
	onChange: (value: string) => void;
	disabled?: boolean;
}

export function WojewodztwoSelect({
	value,
	onChange,
	disabled,
}: WojewodztwoSelectProps) {
	return (
		<SearchableSelect
			options={WOJEWODZTWA_LIMITED}
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
