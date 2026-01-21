import { JobMarker } from "@/hooks/useVehicleData";
import { Link } from "react-router-dom";
import { MapPin, Zap, Bookmark } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { CategoryIcon } from "@/components/jobs/CategoryIcon";
import { useSavedJobs } from "@/hooks/useSavedJobs";
import { cn } from "@/lib/utils";
import { findMainCategoryForSubcategory } from "@/components/shared/CategoryBadges";

interface WorkMapJobListProps {
  jobs: JobMarker[];
  isLoading: boolean;
}

export function WorkMapJobList({ jobs, isLoading }: WorkMapJobListProps) {
  const { isJobSaved, toggleSaveJob } = useSavedJobs();

  if (isLoading) {
    return (
      <div className="divide-y divide-border/40">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="p-4 space-y-3">
            <div className="flex gap-4">
              <Skeleton className="h-12 w-12 rounded-lg flex-shrink-0" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-5 w-4/5" />
                <Skeleton className="h-4 w-2/3" />
              </div>
              <Skeleton className="h-5 w-24" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (jobs.length === 0) {
    return (
      <div className="p-10 text-center">
        <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-muted/50 flex items-center justify-center">
          <MapPin className="h-8 w-8 text-muted-foreground/50" />
        </div>
        <p className="text-muted-foreground font-medium">Brak ofert w wybranej kategorii</p>
        <p className="text-sm text-muted-foreground/70 mt-1">Zmień filtry, aby zobaczyć więcej</p>
      </div>
    );
  }

  return (
    <div className="divide-y divide-border/40">
      {jobs.map((job) => {
        const saved = isJobSaved(job.id);
        
        return (
          <Link
            key={job.id}
            to={`/jobs/${job.id}`}
            className="flex items-start gap-4 p-4 hover:bg-secondary/40 transition-colors group"
          >
            {/* Category Icon */}
            <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-primary/10 to-primary/5 border border-border/50 flex items-center justify-center flex-shrink-0">
              <CategoryIcon 
                name={job.category || "Inne"} 
                className="h-5 w-5 text-primary"
              />
            </div>

            {/* Content */}
            <div className="flex-1 min-w-0">
              {/* Title */}
              <h3 className="font-semibold text-[15px] text-foreground leading-snug group-hover:text-primary transition-colors line-clamp-1 pr-2">
                {job.title}
              </h3>

              {/* Meta Row */}
              <div className="flex items-center gap-2 mt-1.5 text-sm text-muted-foreground">
                <span className="flex items-center gap-1">
                  <MapPin className="h-3.5 w-3.5" />
                  <span className="truncate max-w-[140px]">
                    {job.miasto}{job.district ? `, ${job.district}` : ''}
                  </span>
                </span>
              </div>

              {/* Tags Row */}
              <div className="flex items-center gap-2 mt-2 flex-wrap">
                {job.urgent && (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 text-[10px] font-bold uppercase bg-red-500/10 text-red-600 rounded border border-red-500/20">
                    <Zap className="h-2.5 w-2.5" />
                    Pilne
                  </span>
                )}
                {job.category && (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 text-[10px] font-medium rounded border bg-muted/50 text-muted-foreground border-border/60">
                    {(() => {
                      const mainCat = findMainCategoryForSubcategory(job.category);
                      const Icon = mainCat?.icon;
                      return Icon ? <Icon className="h-2.5 w-2.5" /> : null;
                    })()}
                    {job.category}
                  </span>
                )}
              </div>
            </div>

            {/* Right Side - Price & Actions */}
            <div className="flex flex-col items-end gap-2 flex-shrink-0">
              {job.budget ? (
                <span className="text-sm font-bold text-emerald-600 whitespace-nowrap">
                  {job.budget} zł
                </span>
              ) : (
                <span className="text-xs text-muted-foreground">Do negocjacji</span>
              )}
              <button 
                className={cn(
                  "p-1.5 transition-colors",
                  saved 
                    ? "text-primary hover:text-primary/80" 
                    : "text-muted-foreground/50 hover:text-primary"
                )}
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  toggleSaveJob(job.id);
                }}
              >
                <Bookmark 
                  className={cn("h-4 w-4", saved && "fill-current")} 
                />
              </button>
            </div>
          </Link>
        );
      })}
    </div>
  );
}
