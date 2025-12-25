import { Link } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { StarRating } from "@/components/ui/star-rating";
import { MapPin, Banknote, ArrowRight } from "lucide-react";

interface Worker {
  id: string;
  name: string | null;
  avatar_url: string | null;
  bio: string | null;
  wojewodztwo: string | null;
  miasto: string | null;
  hourly_rate: number | null;
  rating_avg: number;
  rating_count: number;
  categories: { name: string }[];
}

interface WorkerListItemProps {
  worker: Worker;
  isHighlighted?: boolean;
  onHover?: (workerId: string | null) => void;
}

export function WorkerListItem({ worker, isHighlighted, onHover }: WorkerListItemProps) {
  return (
    <Link to={`/worker/${worker.id}`}>
      <Card 
        className={`group p-4 transition-all duration-200 hover:shadow-lg hover:border-primary/30 cursor-pointer ${
          isHighlighted ? 'border-primary shadow-lg ring-2 ring-primary/20' : ''
        }`}
        onMouseEnter={() => onHover?.(worker.id)}
        onMouseLeave={() => onHover?.(null)}
      >
        <div className="flex gap-4">
          {/* Avatar */}
          <Avatar className="h-16 w-16 rounded-xl border-2 border-border shrink-0">
            <AvatarImage src={worker.avatar_url || undefined} alt={worker.name || "Worker"} />
            <AvatarFallback className="bg-primary/10 text-primary text-lg font-semibold rounded-xl">
              {worker.name?.charAt(0)?.toUpperCase() || "W"}
            </AvatarFallback>
          </Avatar>
          
          {/* Content */}
          <div className="flex-1 min-w-0">
            {/* Name & Rating */}
            <div className="flex items-start justify-between gap-2 mb-1.5">
              <h3 className="font-semibold text-foreground truncate group-hover:text-primary transition-colors">
                {worker.name || "Wykonawca"}
              </h3>
              {worker.rating_avg > 0 && (
                <div className="flex items-center gap-1 shrink-0">
                  <StarRating value={worker.rating_avg} size="sm" showValue readonly />
                  <span className="text-xs text-muted-foreground">
                    ({worker.rating_count})
                  </span>
                </div>
              )}
            </div>
            
            {/* Location */}
            {(worker.miasto || worker.wojewodztwo) && (
              <div className="flex items-center gap-1 text-sm text-muted-foreground mb-2">
                <MapPin className="h-3.5 w-3.5" />
                <span className="truncate">
                  {[worker.miasto, worker.wojewodztwo].filter(Boolean).join(", ")}
                </span>
              </div>
            )}
            
            {/* Bio */}
            {worker.bio && (
              <p className="text-sm text-muted-foreground line-clamp-2 mb-2">
                {worker.bio}
              </p>
            )}
            
            {/* Footer: Categories & Rate */}
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-1.5 flex-wrap">
                {worker.categories.slice(0, 2).map((cat, i) => (
                  <Badge key={i} variant="secondary" className="text-xs">
                    {cat.name}
                  </Badge>
                ))}
                {worker.categories.length > 2 && (
                  <Badge variant="outline" className="text-xs">
                    +{worker.categories.length - 2}
                  </Badge>
                )}
              </div>
              
              {worker.hourly_rate && (
                <div className="flex items-center gap-1 text-primary font-semibold text-sm shrink-0">
                  <Banknote className="h-4 w-4" />
                  {worker.hourly_rate} zł/h
                </div>
              )}
            </div>
          </div>
          
          {/* Arrow */}
          <ArrowRight className="h-5 w-5 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity shrink-0 self-center" />
        </div>
      </Card>
    </Link>
  );
}
