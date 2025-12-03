import { useState } from 'react';
import { Star, StarHalf } from 'lucide-react';
import { cn } from '@/lib/utils';

interface StarRatingProps {
  value: number;
  onChange?: (value: number) => void;
  readonly?: boolean;
  size?: 'sm' | 'md' | 'lg';
  showValue?: boolean;
}

export function StarRating({ 
  value, 
  onChange, 
  readonly = false, 
  size = 'md',
  showValue = false 
}: StarRatingProps) {
  const [hoverValue, setHoverValue] = useState<number | null>(null);
  
  const displayValue = hoverValue ?? value;
  
  const sizeClasses = {
    sm: 'h-4 w-4',
    md: 'h-6 w-6',
    lg: 'h-8 w-8',
  };

  const handleClick = (starIndex: number, isHalf: boolean) => {
    if (readonly || !onChange) return;
    const newValue = isHalf ? starIndex + 0.5 : starIndex + 1;
    onChange(newValue);
  };

  const handleMouseMove = (e: React.MouseEvent, starIndex: number) => {
    if (readonly) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const isHalf = x < rect.width / 2;
    setHoverValue(isHalf ? starIndex + 0.5 : starIndex + 1);
  };

  return (
    <div className="flex items-center gap-1">
      <div 
        className={cn("flex", !readonly && "cursor-pointer")}
        onMouseLeave={() => setHoverValue(null)}
      >
        {[0, 1, 2, 3, 4].map((starIndex) => {
          const isFull = displayValue >= starIndex + 1;
          const isHalf = !isFull && displayValue >= starIndex + 0.5;
          
          return (
            <div
              key={starIndex}
              className="relative"
              onMouseMove={(e) => handleMouseMove(e, starIndex)}
              onClick={(e) => {
                const rect = e.currentTarget.getBoundingClientRect();
                const x = e.clientX - rect.left;
                const isHalfClick = x < rect.width / 2;
                handleClick(starIndex, isHalfClick);
              }}
            >
              {/* Background star (empty) */}
              <Star className={cn(sizeClasses[size], "text-muted-foreground/30")} />
              
              {/* Filled star */}
              {isFull && (
                <Star 
                  className={cn(
                    sizeClasses[size], 
                    "absolute top-0 left-0 fill-warning text-warning"
                  )} 
                />
              )}
              
              {/* Half star */}
              {isHalf && (
                <div className="absolute top-0 left-0 overflow-hidden" style={{ width: '50%' }}>
                  <Star 
                    className={cn(
                      sizeClasses[size], 
                      "fill-warning text-warning"
                    )} 
                  />
                </div>
              )}
            </div>
          );
        })}
      </div>
      {showValue && (
        <span className="ml-2 font-medium text-foreground">
          {value > 0 ? value.toFixed(1) : '—'}
        </span>
      )}
    </div>
  );
}