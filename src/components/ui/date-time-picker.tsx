import * as React from "react";
import { format } from "date-fns";
import { pl } from "date-fns/locale";
import { CalendarIcon, Clock, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { ScrollArea } from "@/components/ui/scroll-area";

interface DateTimePickerProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
}

const hours = Array.from({ length: 24 }, (_, i) => i.toString().padStart(2, '0'));
const minutes = ['00', '15', '30', '45'];

// Helper to format date as local datetime-local string (YYYY-MM-DDTHH:mm)
const formatLocalDateTime = (date: Date): string => {
  const year = date.getFullYear();
  const month = (date.getMonth() + 1).toString().padStart(2, '0');
  const day = date.getDate().toString().padStart(2, '0');
  const hours = date.getHours().toString().padStart(2, '0');
  const mins = date.getMinutes().toString().padStart(2, '0');
  return `${year}-${month}-${day}T${hours}:${mins}`;
};

// Helper to parse local datetime string
const parseLocalDateTime = (value: string): Date | undefined => {
  if (!value) return undefined;
  const [datePart, timePart] = value.split('T');
  if (!datePart) return undefined;
  const [year, month, day] = datePart.split('-').map(Number);
  const [hours, mins] = (timePart || '12:00').split(':').map(Number);
  return new Date(year, month - 1, day, hours || 0, mins || 0);
};

export function DateTimePicker({
  value,
  onChange,
  placeholder = "Wybierz datę i godzinę",
  className,
  disabled
}: DateTimePickerProps) {
  const [dateOpen, setDateOpen] = React.useState(false);
  const [timeOpen, setTimeOpen] = React.useState(false);
  
  // Parse value to date and time (local time, not UTC)
  const dateValue = parseLocalDateTime(value);
  const timeValue = value ? value.split('T')[1]?.slice(0, 5) || '' : '';

  const handleDateSelect = (date: Date | undefined) => {
    if (date) {
      const currentTime = timeValue || '12:00';
      const [h, m] = currentTime.split(':');
      date.setHours(parseInt(h), parseInt(m));
      onChange(formatLocalDateTime(date));
    }
    setDateOpen(false);
  };

  const handleTimeChange = (time: string, shouldClose: boolean) => {
    if (dateValue) {
      const [h, m] = time.split(':');
      const newDate = new Date(dateValue);
      newDate.setHours(parseInt(h), parseInt(m));
      onChange(formatLocalDateTime(newDate));
    } else {
      // If no date selected, use today
      const today = new Date();
      const [h, m] = time.split(':');
      today.setHours(parseInt(h), parseInt(m));
      onChange(formatLocalDateTime(today));
    }
    if (shouldClose) {
      setTimeOpen(false);
    }
  };

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    onChange('');
  };

  return (
    <div className={cn("flex gap-2", className)}>
      {/* Date Picker */}
      <Popover open={dateOpen} onOpenChange={setDateOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            disabled={disabled}
            className={cn(
              "flex-1 h-11 justify-start text-left font-normal rounded-xl border-primary/20 hover:border-primary/40 hover:bg-primary/5 transition-all duration-200 group",
              !dateValue && "text-muted-foreground"
            )}
          >
            <CalendarIcon className="mr-2 h-4 w-4 text-primary" />
            <span className="flex-1">
              {dateValue ? format(dateValue, "d MMMM yyyy", { locale: pl }) : "Wybierz datę"}
            </span>
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0 rounded-xl border-primary/20 shadow-xl" align="start">
          <Calendar
            mode="single"
            selected={dateValue}
            onSelect={handleDateSelect}
            disabled={(date) => date < new Date(new Date().setHours(0, 0, 0, 0))}
            initialFocus
            locale={pl}
            className="p-3 pointer-events-auto"
            classNames={{
              months: "flex flex-col sm:flex-row space-y-4 sm:space-x-4 sm:space-y-0",
              month: "space-y-4",
              caption: "flex justify-center pt-1 relative items-center",
              caption_label: "text-sm font-semibold text-foreground",
              nav: "space-x-1 flex items-center",
              nav_button: cn(
                "h-8 w-8 bg-transparent p-0 opacity-70 hover:opacity-100 rounded-lg hover:bg-primary/10 transition-all duration-200 inline-flex items-center justify-center border border-primary/20"
              ),
              nav_button_previous: "absolute left-1",
              nav_button_next: "absolute right-1",
              table: "w-full border-collapse space-y-1",
              head_row: "flex",
              head_cell: "text-muted-foreground rounded-md w-9 font-medium text-[0.75rem] uppercase",
              row: "flex w-full mt-2",
              cell: cn(
                "h-9 w-9 text-center text-sm p-0 relative rounded-lg",
                "[&:has([aria-selected])]:bg-primary/10 first:[&:has([aria-selected])]:rounded-l-lg last:[&:has([aria-selected])]:rounded-r-lg",
                "focus-within:relative focus-within:z-20"
              ),
              day: cn(
                "h-9 w-9 p-0 font-normal rounded-lg transition-all duration-200",
                "hover:bg-primary/10 hover:text-primary",
                "aria-selected:opacity-100"
              ),
              day_range_end: "day-range-end",
              day_selected: "bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground focus:bg-primary focus:text-primary-foreground font-medium shadow-md",
              day_today: "bg-primary/20 text-primary font-semibold",
              day_outside: "text-muted-foreground opacity-50",
              day_disabled: "text-muted-foreground opacity-30 cursor-not-allowed",
              day_range_middle: "aria-selected:bg-primary/10 aria-selected:text-foreground",
              day_hidden: "invisible",
            }}
          />
        </PopoverContent>
      </Popover>

      {/* Time Picker */}
      <Popover open={timeOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            disabled={disabled}
            onClick={() => setTimeOpen(true)}
            className={cn(
              "w-[140px] h-11 justify-start text-left font-normal rounded-xl border-primary/20 hover:border-primary/40 hover:bg-primary/5 transition-all duration-200 group",
              !timeValue && "text-muted-foreground"
            )}
          >
            <Clock className="mr-2 h-4 w-4 text-primary" />
            <span className="flex-1">{timeValue || "Godzina"}</span>
          </Button>
        </PopoverTrigger>
        <PopoverContent 
          className="w-auto p-0 rounded-xl border-primary/20 shadow-xl" 
          align="start"
          onOpenAutoFocus={(e) => e.preventDefault()}
          onCloseAutoFocus={(e) => e.preventDefault()}
          onPointerDownOutside={() => setTimeOpen(false)}
          onEscapeKeyDown={() => setTimeOpen(false)}
          onFocusOutside={(e) => e.preventDefault()}
          onInteractOutside={(e) => e.preventDefault()}
        >
          <TimeSelector 
            value={timeValue} 
            onChange={(time) => {
              handleTimeChange(time, false);
            }}
            onComplete={(time) => {
              handleTimeChange(time, true);
            }}
          />
        </PopoverContent>
      </Popover>

      {/* Clear button */}
      {value && (
        <Button
          variant="ghost"
          size="icon"
          onClick={handleClear}
          className="h-11 w-11 rounded-xl hover:bg-destructive/10 hover:text-destructive transition-all duration-200"
        >
          <X className="h-4 w-4" />
        </Button>
      )}
    </div>
  );
}

// Internal Time Selector component
function TimeSelector({ 
  value, 
  onChange,
  onComplete
}: { 
  value: string; 
  onChange: (time: string) => void;
  onComplete: (time: string) => void;
}) {
  const [selectedHour, setSelectedHour] = React.useState<string>(() => {
    if (value) {
      const [h] = value.split(':');
      return h || '';
    }
    return '';
  });
  const [selectedMinute, setSelectedMinute] = React.useState<string>(() => {
    if (value) {
      const [, m] = value.split(':');
      return m || '';
    }
    return '';
  });

  const handleHourSelect = (hour: string) => {
    setSelectedHour(hour);
    // If minute already selected, complete the selection
    if (selectedMinute) {
      onComplete(`${hour}:${selectedMinute}`);
    }
  };

  const handleMinuteSelect = (minute: string) => {
    setSelectedMinute(minute);
    // If hour already selected, complete the selection
    if (selectedHour) {
      onComplete(`${selectedHour}:${minute}`);
    }
  };

  const handleQuickSelect = (time: string) => {
    const [h, m] = time.split(':');
    setSelectedHour(h);
    setSelectedMinute(m);
    onComplete(time);
  };

  return (
    <div>
      <div className="flex">
        {/* Hours */}
        <div className="border-r border-border/50">
          <div className="px-4 py-2 text-xs font-semibold text-primary bg-primary/5 rounded-tl-xl">
            Godzina
          </div>
          <ScrollArea className="h-[200px] w-[80px]">
            <div className="p-1.5">
              {hours.map((hour) => (
                <button
                  key={hour}
                  type="button"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    handleHourSelect(hour);
                  }}
                  className={cn(
                    "w-full px-3 py-2 text-sm rounded-lg transition-all duration-200 text-center font-medium",
                    selectedHour === hour
                      ? "bg-primary text-primary-foreground shadow-md"
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
          <div className="px-4 py-2 text-xs font-semibold text-primary bg-primary/5 rounded-tr-xl">
            Minuta
          </div>
          <ScrollArea className="h-[200px] w-[80px]">
            <div className="p-1.5">
              {minutes.map((minute) => (
                <button
                  key={minute}
                  type="button"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    handleMinuteSelect(minute);
                  }}
                  className={cn(
                    "w-full px-3 py-2 text-sm rounded-lg transition-all duration-200 text-center font-medium",
                    selectedMinute === minute
                      ? "bg-primary text-primary-foreground shadow-md"
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
      <div className="p-3 border-t border-border/50 bg-muted/30 rounded-b-xl">
        <p className="text-xs text-muted-foreground mb-2 font-medium">Szybki wybór:</p>
        <div className="flex gap-1.5 flex-wrap">
          {['08:00', '10:00', '12:00', '14:00', '16:00', '18:00', '20:00'].map((time) => (
            <button
              key={time}
              type="button"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                handleQuickSelect(time);
              }}
              className={cn(
                "px-3 py-1.5 text-xs rounded-lg font-medium transition-all duration-200",
                value === time
                  ? "bg-primary text-primary-foreground shadow-md"
                  : "bg-background hover:bg-primary/10 border border-primary/20 text-foreground"
              )}
            >
              {time}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}