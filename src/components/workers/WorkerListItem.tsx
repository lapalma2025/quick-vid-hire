import { Link } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { StarRating } from "@/components/ui/star-rating";
import { MapPin, Banknote, ArrowRight, CheckCircle2 } from "lucide-react";
import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from "@/components/ui/hover-card";
import { cn } from "@/lib/utils";
import { getCategoryColorClasses, findMainCategoryForSubcategory } from "@/components/shared/CategoryBadges";

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
  completed_jobs_count?: number;
}

interface WorkerListItemProps {
  worker: Worker;
  isHighlighted?: boolean;
  onHover?: (workerId: string | null) => void;
}

const MAX_VISIBLE_CATEGORIES = 1;

export function WorkerListItem({ worker, isHighlighted, onHover }: WorkerListItemProps) {
  const firstCategory = worker.categories[0];
  const hiddenCategories = worker.categories.slice(MAX_VISIBLE_CATEGORIES);
  const hasHiddenCategories = hiddenCategories.length > 0;
  const isNewWorker = (worker.completed_jobs_count ?? 0) === 0;
  const completedCount = worker.completed_jobs_count ?? 0;

  return (
    <Link to={`/worker/${worker.id}`}>
      <Card 
        className={`group p-4 transition-all duration-200 hover:shadow-lg hover:border-primary/30 cursor-pointer h-[160px] flex flex-col ${
          isHighlighted ? 'border-primary shadow-lg ring-2 ring-primary/20' : ''
        }`}
        onMouseEnter={() => onHover?.(worker.id)}
        onMouseLeave={() => onHover?.(null)}
      >
        <div className="flex gap-4 flex-1 min-h-0">
          {/* Avatar */}
          <Avatar className="h-14 w-14 rounded-xl border-2 border-border shrink-0">
            <AvatarImage src={worker.avatar_url || undefined} alt={worker.name || "Worker"} />
            <AvatarFallback className="bg-primary/10 text-primary text-lg font-semibold rounded-xl">
              {worker.name?.charAt(0)?.toUpperCase() || "W"}
            </AvatarFallback>
          </Avatar>
          
          {/* Content */}
          <div className="flex-1 min-w-0 flex flex-col">
            {/* Name & Badges */}
            <div className="flex items-start justify-between gap-2 mb-1">
              <div className="flex items-center gap-2 min-w-0">
                <h3 className="font-semibold text-foreground truncate group-hover:text-primary transition-colors text-sm">
                  {worker.name || "Wykonawca"}
                </h3>
                {isNewWorker && (
                  <Badge className="bg-gradient-to-r from-emerald-400 to-teal-500 text-white text-[10px] px-1.5 py-0 h-4 shrink-0 border-0">
                    Nowy
                  </Badge>
                )}
              </div>
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
              <div className="flex items-center gap-1 text-xs text-muted-foreground mb-1.5">
                <MapPin className="h-3 w-3 shrink-0" />
                <span className="truncate">
                  {[worker.miasto, worker.wojewodztwo].filter(Boolean).join(", ")}
                </span>
              </div>
            )}
            
            {/* Completed jobs count */}
            {completedCount > 0 && (
              <div className="flex items-center gap-1 text-xs text-muted-foreground mb-1">
                <CheckCircle2 className="h-3 w-3 text-success" />
                <span>{completedCount} {completedCount === 1 ? 'ukończone zlecenie' : completedCount < 5 ? 'ukończone zlecenia' : 'ukończonych zleceń'}</span>
              </div>
            )}

            {/* Bio - single line with ellipsis */}
            {worker.bio && (
              <p className="text-xs text-muted-foreground line-clamp-1 mb-auto">
                {worker.bio}
              </p>
            )}
            
            {/* Footer: Categories & Rate - always at bottom */}
            <div className="flex items-center justify-between gap-2 mt-auto pt-2">
              <div className="flex items-center gap-1 min-w-0 flex-1 overflow-hidden">
                {firstCategory && (
                  <Badge 
                    variant="outline" 
                    className={cn(
                      "text-xs shrink-0 gap-1",
                      getCategoryColorClasses(firstCategory.name, 'subtle')
                    )}
                  >
                    {(() => {
                      const mainCat = findMainCategoryForSubcategory(firstCategory.name);
                      const Icon = mainCat?.icon;
                      return Icon ? <Icon className="h-2.5 w-2.5" /> : null;
                    })()}
                    {firstCategory.name}
                  </Badge>
                )}
                {hasHiddenCategories && (
                  <HoverCard openDelay={120} closeDelay={80}>
                    <HoverCardTrigger asChild>
                      <Badge
                        variant="outline"
                        className="text-xs shrink-0 cursor-help"
                        onClick={(e) => e.preventDefault()}
                      >
                        +{hiddenCategories.length}
                      </Badge>
                    </HoverCardTrigger>
                    <HoverCardContent side="top" className="w-auto max-w-[280px] p-3">
                      <p className="text-xs font-medium text-muted-foreground mb-2">
                        Pozostałe specjalizacje:
                      </p>
                      <div className="flex flex-wrap gap-1.5">
                        {hiddenCategories.map((cat, i) => (
                          <Badge 
                            key={i} 
                            variant="outline" 
                            className={cn(
                              "text-xs gap-1",
                              getCategoryColorClasses(cat.name, 'subtle')
                            )}
                          >
                            {(() => {
                              const mainCat = findMainCategoryForSubcategory(cat.name);
                              const Icon = mainCat?.icon;
                              return Icon ? <Icon className="h-2.5 w-2.5" /> : null;
                            })()}
                            {cat.name}
                          </Badge>
                        ))}
                      </div>
                    </HoverCardContent>
                  </HoverCard>
                )}
              </div>
              
              {worker.hourly_rate && (
                <div className="flex items-center gap-1 text-primary font-semibold text-xs shrink-0">
                  <Banknote className="h-3.5 w-3.5" />
                  {worker.hourly_rate} zł/h
                </div>
              )}
            </div>
          </div>
          
          {/* Arrow */}
          <ArrowRight className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity shrink-0 self-center" />
        </div>
      </Card>
    </Link>
  );
}
