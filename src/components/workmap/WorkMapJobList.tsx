import { JobMarker } from "@/hooks/useVehicleData";
import { Link } from "react-router-dom";
import { MapPin, Briefcase, Zap } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

interface WorkMapJobListProps {
  jobs: JobMarker[];
  isLoading: boolean;
}

export function WorkMapJobList({ jobs, isLoading }: WorkMapJobListProps) {
  if (isLoading) {
    return (
      <div className="p-5 space-y-4">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="p-4 rounded-xl border border-border/50 space-y-3 bg-card">
            <Skeleton className="h-5 w-4/5" />
            <Skeleton className="h-4 w-2/3" />
            <div className="flex gap-2">
              <Skeleton className="h-6 w-20 rounded-full" />
              <Skeleton className="h-6 w-16 rounded-full" />
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
          <Briefcase className="h-8 w-8 text-muted-foreground/50" />
        </div>
        <p className="text-muted-foreground font-medium">Brak ofert w wybranej kategorii</p>
        <p className="text-sm text-muted-foreground/70 mt-1">Zmień filtry, aby zobaczyć więcej</p>
      </div>
    );
  }

  return (
    <div className="p-4 space-y-3">
      {jobs.map((job) => (
        <Link
          key={job.id}
          to={`/jobs/${job.id}`}
          className="block p-4 rounded-xl border border-border/50 bg-card hover:bg-secondary/30 hover:border-primary/20 transition-all duration-200 group hover:shadow-md"
        >
          {/* Badges */}
          <div className="flex items-center gap-2 mb-2.5">
            {job.urgent && (
              <span className="inline-flex items-center gap-1 px-2.5 py-1 text-[11px] font-bold uppercase bg-gradient-to-r from-red-500 to-red-600 text-white rounded-full shadow-sm">
                <Zap className="h-3 w-3" />
                Pilne
              </span>
            )}
            {job.category && (
              <span className="px-2.5 py-1 text-[11px] font-semibold bg-secondary text-secondary-foreground rounded-full">
                {job.category}
              </span>
            )}
          </div>

          {/* Title */}
          <h3 className="font-semibold text-[15px] text-foreground leading-snug mb-2.5 group-hover:text-primary transition-colors line-clamp-2">
            {job.title}
          </h3>
          
          {/* Location */}
          <div className="flex items-center gap-2 text-sm text-muted-foreground mb-3">
            <MapPin className="h-3.5 w-3.5 flex-shrink-0" />
            <span className="truncate">
              {job.miasto}{job.district ? `, ${job.district}` : ''}
            </span>
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between pt-2.5 border-t border-border/50">
            {job.budget ? (
              <span className="text-base font-bold text-emerald-600">
                {job.budget} zł
              </span>
            ) : (
              <span className="text-sm text-muted-foreground">Do negocjacji</span>
            )}
            <span className="text-xs font-medium text-primary opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1">
              Zobacz szczegóły
              <span className="group-hover:translate-x-0.5 transition-transform">→</span>
            </span>
          </div>
        </Link>
      ))}
    </div>
  );
}
