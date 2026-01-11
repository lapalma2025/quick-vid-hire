import { JobMarker } from "@/hooks/useVehicleData";
import { Link } from "react-router-dom";
import { MapPin, Briefcase, Clock, Zap } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

interface WorkMapJobListProps {
  jobs: JobMarker[];
  isLoading: boolean;
}

export function WorkMapJobList({ jobs, isLoading }: WorkMapJobListProps) {
  if (isLoading) {
    return (
      <div className="p-4 space-y-3">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="p-3 rounded-lg border border-border/50 space-y-2">
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-3 w-1/2" />
            <Skeleton className="h-3 w-1/3" />
          </div>
        ))}
      </div>
    );
  }

  if (jobs.length === 0) {
    return (
      <div className="p-8 text-center">
        <Briefcase className="h-12 w-12 mx-auto text-muted-foreground/50 mb-3" />
        <p className="text-muted-foreground">Brak ofert w wybranej kategorii</p>
      </div>
    );
  }

  return (
    <div className="divide-y divide-border/50">
      {jobs.map((job) => (
        <Link
          key={job.id}
          to={`/jobs/${job.id}`}
          className="block p-4 hover:bg-secondary/50 transition-colors group"
        >
          <div className="flex items-start gap-3">
            {/* Icon */}
            <div className={`
              p-2 rounded-lg flex-shrink-0 mt-0.5
              ${job.urgent 
                ? 'bg-destructive/10 text-destructive' 
                : 'bg-primary/10 text-primary'
              }
            `}>
              {job.urgent ? (
                <Zap className="h-4 w-4" />
              ) : (
                <Briefcase className="h-4 w-4" />
              )}
            </div>

            {/* Content */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <h3 className="font-medium text-foreground truncate group-hover:text-primary transition-colors">
                  {job.title}
                </h3>
                {job.urgent && (
                  <span className="px-1.5 py-0.5 text-[10px] font-semibold uppercase bg-destructive text-destructive-foreground rounded">
                    Pilne
                  </span>
                )}
              </div>
              
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground mb-1.5">
                <MapPin className="h-3 w-3" />
                <span className="truncate">
                  {job.miasto}{job.district ? `, ${job.district}` : ''}
                </span>
              </div>

              <div className="flex items-center gap-3 text-xs">
                {job.category && (
                  <span className="px-2 py-0.5 bg-secondary rounded-full text-secondary-foreground">
                    {job.category}
                  </span>
                )}
                {job.budget && (
                  <span className="font-medium text-primary">
                    {job.budget} zł
                  </span>
                )}
              </div>
            </div>

            {/* Arrow */}
            <span className="text-muted-foreground group-hover:text-primary transition-colors">
              →
            </span>
          </div>
        </Link>
      ))}
    </div>
  );
}
