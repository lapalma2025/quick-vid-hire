import * as React from "react";
import { Check, ChevronsUpDown, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Input } from "@/components/ui/input";

interface SearchableSelectProps {
  options: readonly string[] | string[];
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  searchPlaceholder?: string;
  emptyMessage?: string;
  disabled?: boolean;
  allowCustom?: boolean;
  customPlaceholder?: string;
  className?: string;
}

export function SearchableSelect({
  options,
  value,
  onChange,
  placeholder = "Wybierz...",
  searchPlaceholder = "Szukaj...",
  emptyMessage = "Nie znaleziono.",
  disabled = false,
  allowCustom = false,
  customPlaceholder = "Wpisz własną wartość...",
  className,
}: SearchableSelectProps) {
  const [open, setOpen] = React.useState(false);
  const [showCustomInput, setShowCustomInput] = React.useState(false);
  const [searchQuery, setSearchQuery] = React.useState("");

  // Check if current value is custom (not in the list)
  const isCustomValue = value && !options.includes(value);

  // Filter options based on search query
  const filteredOptions = React.useMemo(() => {
    if (!searchQuery) return options;
    return options.filter((option) =>
      option.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [options, searchQuery]);

  const handleSelect = (selectedValue: string) => {
    if (selectedValue === "__custom__") {
      setShowCustomInput(true);
      setOpen(false);
      return;
    }
    onChange(selectedValue === value ? "" : selectedValue);
    setOpen(false);
    setSearchQuery("");
  };

  const handleCustomInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    onChange(e.target.value);
  };

  const switchToList = () => {
    setShowCustomInput(false);
    if (isCustomValue) {
      onChange("");
    }
  };

  if (showCustomInput || isCustomValue) {
    return (
      <div className={cn("flex gap-2", className)}>
        <Input
          placeholder={customPlaceholder}
          value={value}
          onChange={handleCustomInput}
          disabled={disabled}
          className="flex-1 h-11 rounded-xl"
        />
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={switchToList}
          className="h-11 px-3 text-muted-foreground hover:text-foreground"
        >
          <X className="h-4 w-4 mr-1" />
          Lista
        </Button>
      </div>
    );
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          disabled={disabled}
          className={cn(
            "w-full justify-between h-11 rounded-xl font-normal bg-background",
            !value && "text-muted-foreground",
            className
          )}
        >
          {value || placeholder}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[--radix-popover-trigger-width] p-0 bg-popover border border-border shadow-xl rounded-xl" align="start">
        <Command className="bg-transparent">
          <CommandInput
            placeholder={searchPlaceholder}
            value={searchQuery}
            onValueChange={setSearchQuery}
            className="h-11"
          />
          <CommandList className="max-h-[300px]">
            <CommandEmpty className="py-6 text-center text-sm text-muted-foreground">
              {emptyMessage}
              {allowCustom && searchQuery && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="mt-2 text-primary"
                  onClick={() => {
                    onChange(searchQuery);
                    setOpen(false);
                    setSearchQuery("");
                  }}
                >
                  Użyj "{searchQuery}"
                </Button>
              )}
            </CommandEmpty>
            <CommandGroup>
              {filteredOptions.map((option) => (
                <CommandItem
                  key={option}
                  value={option}
                  onSelect={() => handleSelect(option)}
                  className="cursor-pointer rounded-lg"
                >
                  <Check
                    className={cn(
                      "mr-2 h-4 w-4",
                      value === option ? "opacity-100 text-primary" : "opacity-0"
                    )}
                  />
                  {option}
                </CommandItem>
              ))}
              {allowCustom && (
                <CommandItem
                  value="__custom__"
                  onSelect={() => handleSelect("__custom__")}
                  className="cursor-pointer text-primary rounded-lg border-t border-border mt-1 pt-2"
                >
                  <span className="text-primary font-medium">+ Wpisz własną wartość...</span>
                </CommandItem>
              )}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}