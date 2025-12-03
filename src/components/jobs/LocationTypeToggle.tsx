import { cn } from '@/lib/utils';
import { MapPin, Globe } from 'lucide-react';

interface LocationTypeToggleProps {
  isForeign: boolean;
  onChange: (isForeign: boolean) => void;
  className?: string;
}

export function LocationTypeToggle({ isForeign, onChange, className }: LocationTypeToggleProps) {
  return (
    <div className={cn("grid grid-cols-2 gap-3", className)}>
      <button
        type="button"
        onClick={() => onChange(false)}
        className={cn(
          "relative flex flex-col items-center gap-2 p-4 rounded-2xl border-2 transition-all duration-300",
          "hover:border-primary/50 hover:bg-primary/5",
          !isForeign 
            ? "border-primary bg-primary/10 shadow-lg shadow-primary/20" 
            : "border-border bg-card"
        )}
      >
        <div className={cn(
          "w-12 h-12 rounded-xl flex items-center justify-center transition-colors",
          !isForeign ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
        )}>
          <MapPin className="h-6 w-6" />
        </div>
        <div className="text-center">
          <p className={cn(
            "font-semibold transition-colors",
            !isForeign ? "text-primary" : "text-foreground"
          )}>
            Polska
          </p>
          <p className="text-xs text-muted-foreground">
            Zlecenia krajowe
          </p>
        </div>
        {!isForeign && (
          <div className="absolute -top-1 -right-1 w-4 h-4 bg-primary rounded-full flex items-center justify-center">
            <div className="w-2 h-2 bg-primary-foreground rounded-full" />
          </div>
        )}
      </button>

      <button
        type="button"
        onClick={() => onChange(true)}
        className={cn(
          "relative flex flex-col items-center gap-2 p-4 rounded-2xl border-2 transition-all duration-300",
          "hover:border-primary/50 hover:bg-primary/5",
          isForeign 
            ? "border-primary bg-primary/10 shadow-lg shadow-primary/20" 
            : "border-border bg-card"
        )}
      >
        <div className={cn(
          "w-12 h-12 rounded-xl flex items-center justify-center transition-colors",
          isForeign ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
        )}>
          <Globe className="h-6 w-6" />
        </div>
        <div className="text-center">
          <p className={cn(
            "font-semibold transition-colors",
            isForeign ? "text-primary" : "text-foreground"
          )}>
            Zagranica
          </p>
          <p className="text-xs text-muted-foreground">
            Zlecenia międzynarodowe
          </p>
        </div>
        {isForeign && (
          <div className="absolute -top-1 -right-1 w-4 h-4 bg-primary rounded-full flex items-center justify-center">
            <div className="w-2 h-2 bg-primary-foreground rounded-full" />
          </div>
        )}
      </button>
    </div>
  );
}
