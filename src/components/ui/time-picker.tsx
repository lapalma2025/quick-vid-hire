import * as React from "react";
import { Clock, X } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";

interface TimePickerProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
}

const hours = Array.from({ length: 24 }, (_, i) => i.toString().padStart(2, '0'));
const minutes = ['00', '15', '30', '45'];

export function TimePicker({ 
  value, 
  onChange, 
  placeholder = "Wybierz godzinę",
  className,
  disabled 
}: TimePickerProps) {
  const [open, setOpen] = React.useState(false);
  const [selectedHour, setSelectedHour] = React.useState<string>('');
  const [selectedMinute, setSelectedMinute] = React.useState<string>('');

  React.useEffect(() => {
    if (value) {
      const [h, m] = value.split(':');
      setSelectedHour(h || '');
      setSelectedMinute(m || '');
    } else {
      setSelectedHour('');
      setSelectedMinute('');
    }
  }, [value]);

  const handleHourSelect = (hour: string) => {
    setSelectedHour(hour);
    if (selectedMinute) {
      onChange(`${hour}:${selectedMinute}`);
      setOpen(false);
    }
  };

  const handleMinuteSelect = (minute: string) => {
    setSelectedMinute(minute);
    if (selectedHour) {
      onChange(`${selectedHour}:${minute}`);
      setOpen(false);
    }
  };

  const handleQuickSelect = (time: string) => {
    onChange(time);
    setOpen(false);
  };

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    onChange('');
    setSelectedHour('');
    setSelectedMinute('');
    setOpen(false);
  };

  const displayValue = value ? value : placeholder;

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          disabled={disabled}
          className={cn(
            "w-full h-11 justify-start text-left font-normal rounded-xl border-primary/20 hover:border-primary/40 hover:bg-primary/5 group",
            !value && "text-muted-foreground",
            className
          )}
        >
          <Clock className="mr-2 h-4 w-4 text-primary" />
          <span className="flex-1">{displayValue}</span>
          {value && (
            <span
              onClick={handleClear}
              className="ml-2 h-5 w-5 rounded-full bg-muted hover:bg-destructive/20 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
            >
              <X className="h-3 w-3 text-muted-foreground hover:text-destructive" />
            </span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0 rounded-xl border-primary/20 shadow-xl" align="start">
        <div className="flex">
          {/* Hours */}
          <div className="border-r border-border">
            <div className="px-3 py-2 text-xs font-semibold text-muted-foreground bg-muted/50 rounded-tl-xl">
              Godzina
            </div>
            <ScrollArea className="h-[200px] w-[70px]">
              <div className="p-1">
                {hours.map((hour) => (
                  <button
                    key={hour}
                    onClick={() => handleHourSelect(hour)}
                    className={cn(
                      "w-full px-3 py-1.5 text-sm rounded-lg transition-all duration-200 text-center",
                      selectedHour === hour
                        ? "bg-primary text-primary-foreground font-medium"
                        : "hover:bg-primary/10 text-foreground"
                    )}
                  >
                    {hour}
                  </button>
                ))}
              </div>
            </ScrollArea>
          </div>
          
          {/* Minutes */}
          <div>
            <div className="px-3 py-2 text-xs font-semibold text-muted-foreground bg-muted/50 rounded-tr-xl">
              Minuta
            </div>
            <ScrollArea className="h-[200px] w-[70px]">
              <div className="p-1">
                {minutes.map((minute) => (
                  <button
                    key={minute}
                    onClick={() => handleMinuteSelect(minute)}
                    className={cn(
                      "w-full px-3 py-1.5 text-sm rounded-lg transition-all duration-200 text-center",
                      selectedMinute === minute
                        ? "bg-primary text-primary-foreground font-medium"
                        : "hover:bg-primary/10 text-foreground"
                    )}
                  >
                    {minute}
                  </button>
                ))}
              </div>
            </ScrollArea>
          </div>
        </div>
        
        {/* Quick select & Clear */}
        <div className="p-2 border-t border-border bg-muted/30 rounded-b-xl">
          <div className="flex gap-1 flex-wrap items-center">
            {['08:00', '12:00', '16:00', '18:00', '20:00'].map((time) => (
              <button
                key={time}
                onClick={() => handleQuickSelect(time)}
                className={cn(
                  "px-2 py-1 text-xs rounded-md transition-all",
                  value === time
                    ? "bg-primary text-primary-foreground"
                    : "bg-background hover:bg-primary/10 border border-border"
                )}
              >
                {time}
              </button>
            ))}
            {value && (
              <button
                onClick={handleClear}
                className="px-2 py-1 text-xs rounded-md bg-destructive/10 text-destructive hover:bg-destructive/20 transition-all ml-auto"
              >
                Wyczyść
              </button>
            )}
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}