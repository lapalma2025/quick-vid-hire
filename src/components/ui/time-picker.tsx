import * as React from "react";
import { Clock } from "lucide-react";
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
    // If minute is already selected, update the value and close
    if (selectedMinute) {
      onChange(`${hour}:${selectedMinute}`);
      setOpen(false);
    }
  };

  const handleMinuteSelect = (minute: string) => {
    setSelectedMinute(minute);
    // If hour is already selected, update the value and close
    if (selectedHour) {
      onChange(`${selectedHour}:${minute}`);
      setOpen(false);
    }
  };

  const handleQuickSelect = (time: string) => {
    onChange(time);
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
            "w-full h-11 justify-start text-left font-normal rounded-xl border-primary/20 hover:border-primary/40 hover:bg-primary/5",
            !value && "text-muted-foreground",
            className
          )}
        >
          <Clock className="mr-2 h-4 w-4 text-primary" />
          {displayValue}
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
        
        {/* Quick select */}
        <div className="p-2 border-t border-border bg-muted/30 rounded-b-xl">
          <div className="flex gap-1 flex-wrap">
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
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}