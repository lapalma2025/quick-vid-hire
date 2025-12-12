import { Link } from 'react-router-dom';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { MapPin, Clock, Calendar, Banknote, Globe, Users, Star, Zap, ChevronRight } from 'lucide-react';
import { format, formatDistanceToNow } from 'date-fns';
import { pl } from 'date-fns/locale';
import { CategoryIcon } from './CategoryIcon';

interface Job {
  id: string;
  title: string;
  description: string | null;
  wojewodztwo: string;
  miasto: string;
  is_foreign?: boolean | null;
  country?: string | null;
  start_time: string | null;
  duration_hours: number | null;
  budget: number | null;
  budget_type: string | null;
  urgent: boolean;
  status: string;
  created_at: string;
  category?: { name: string; icon: string } | null;
  job_images?: { image_url: string }[];
  allows_group?: boolean | null;
  min_workers?: number | null;
  max_workers?: number | null;
  is_highlighted?: boolean | null;
  is_promoted?: boolean | null;
  promotion_expires_at?: string | null;
}

interface JobCardProps {
  job: Job;
}

export const JobCard = ({ job }: JobCardProps) => {
  const firstImage = job.job_images?.[0]?.image_url;
  
  // Check if promotion is still active
  const isPromotionActive = job.is_promoted && 
    (!job.promotion_expires_at || new Date(job.promotion_expires_at) > new Date());
  
  // Calculate remaining promotion time
  const getPromotionTimeLeft = () => {
    if (!job.promotion_expires_at) return null;
    const expiresAt = new Date(job.promotion_expires_at);
    if (expiresAt <= new Date()) return null;
    return formatDistanceToNow(expiresAt, { locale: pl, addSuffix: false });
  };
  
  const promotionTimeLeft = getPromotionTimeLeft();

  // Dynamic card classes based on premium options
  const getCardClasses = () => {
    const base = "group relative overflow-hidden rounded-2xl border transition-all duration-300 hover:shadow-xl hover:-translate-y-1";
    
    if (job.is_highlighted) {
      return `${base} border-amber-300/80 dark:border-amber-500/50 bg-gradient-to-br from-amber-50 via-white to-orange-50/50 dark:from-amber-950/40 dark:via-card dark:to-orange-950/20 shadow-[0_8px_30px_rgba(251,191,36,0.2)]`;
    }
    
    if (isPromotionActive) {
      return `${base} border-primary/40 bg-gradient-to-br from-primary/8 via-card to-emerald-50/50 dark:from-primary/15 dark:via-card dark:to-emerald-950/20 shadow-[0_8px_30px_rgba(34,197,94,0.12)]`;
    }
    
    return `${base} border-border/50 bg-card hover:border-primary/40 shadow-sm`;
  };

  return (
    <Link to={`/jobs/${job.id}`}>
      <Card className={getCardClasses()}>
        <div className="flex">
          {/* Image / Icon section */}
          <div className="relative flex-shrink-0 w-36 sm:w-44">
            <div className="absolute inset-0 bg-muted">
              {firstImage ? (
                <img 
                  src={firstImage} 
                  alt={job.title} 
                  className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-primary/10 via-primary/5 to-transparent">
                  <CategoryIcon name={job.category?.name || 'Inne'} className="h-12 w-12 text-primary/30" />
                </div>
              )}
            </div>
            
            {/* Premium overlay badges */}
            {job.is_highlighted && (
              <div className="absolute top-0 left-0 right-0 bg-gradient-to-r from-amber-400 to-orange-400 py-1 px-2 flex items-center justify-center gap-1">
                <Star className="h-3 w-3 text-white fill-white" />
                <span className="text-[10px] font-bold text-white tracking-wide">WYRÓŻNIONE</span>
              </div>
            )}
            
            {isPromotionActive && !job.is_highlighted && promotionTimeLeft && (
              <div className="absolute top-0 left-0 right-0 bg-gradient-to-r from-primary to-emerald-500 py-1 px-2 flex items-center justify-center gap-1">
                <Zap className="h-3 w-3 text-white" />
                <span className="text-[10px] font-semibold text-white">{promotionTimeLeft}</span>
              </div>
            )}
          </div>

          {/* Content section */}
          <div className="flex-1 min-w-0 p-4 sm:p-5 flex flex-col justify-between">
            {/* Top: Title + Category */}
            <div className="space-y-2">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <h3 className={`font-semibold text-base sm:text-lg leading-snug line-clamp-2 transition-colors ${
                    job.is_highlighted 
                      ? 'text-amber-800 dark:text-amber-300' 
                      : 'group-hover:text-primary'
                  }`}>
                    {job.title}
                  </h3>
                </div>
                
                {/* Arrow indicator */}
                <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center transition-all duration-300 group-hover:scale-110 ${
                  job.is_highlighted 
                    ? 'bg-amber-100 dark:bg-amber-900/50 text-amber-600 dark:text-amber-400' 
                    : 'bg-primary/10 text-primary group-hover:bg-primary group-hover:text-white'
                }`}>
                  <ChevronRight className="h-4 w-4" />
                </div>
              </div>

              {/* Badges */}
              <div className="flex items-center gap-1.5 flex-wrap">
                {job.category && (
                  <Badge variant="secondary" className="text-xs px-2.5 py-0.5 font-medium rounded-full">
                    {job.category.name}
                  </Badge>
                )}
                {job.urgent && (
                  <Badge className="bg-red-500 hover:bg-red-500 text-white text-xs px-2.5 py-0.5 font-semibold rounded-full">
                    ⚡ PILNE
                  </Badge>
                )}
                {job.is_foreign && (
                  <Badge className="bg-blue-500 hover:bg-blue-500 text-white text-xs px-2.5 py-0.5 font-semibold rounded-full flex items-center gap-1">
                    <Globe className="h-3 w-3" />
                    ZAGRANICA
                  </Badge>
                )}
                {job.allows_group && (
                  <Badge className="bg-violet-500 hover:bg-violet-500 text-white text-xs px-2.5 py-0.5 font-semibold rounded-full flex items-center gap-1">
                    <Users className="h-3 w-3" />
                    {job.min_workers}-{job.max_workers}
                  </Badge>
                )}
              </div>
            </div>

            {/* Bottom: Meta info + Budget */}
            <div className="flex items-end justify-between gap-4 mt-3 pt-3 border-t border-border/40">
              {/* Location & Time */}
              <div className="flex items-center gap-3 sm:gap-4 text-sm text-muted-foreground">
                <div className="flex items-center gap-1.5">
                  {job.is_foreign ? (
                    <Globe className="h-4 w-4 text-blue-500" />
                  ) : (
                    <MapPin className="h-4 w-4 text-primary/60" />
                  )}
                  <span className="truncate max-w-[100px] sm:max-w-[140px]">
                    {job.miasto}
                  </span>
                </div>
                
                {job.start_time && (
                  <div className="flex items-center gap-1.5">
                    <Calendar className="h-4 w-4 text-primary/60" />
                    <span>{format(new Date(job.start_time), 'dd MMM', { locale: pl })}</span>
                  </div>
                )}
                
                {job.duration_hours && (
                  <div className="hidden sm:flex items-center gap-1.5">
                    <Clock className="h-4 w-4 text-primary/60" />
                    <span>{job.duration_hours}h</span>
                  </div>
                )}
              </div>

              {/* Budget */}
              {job.budget && (
                <div className={`flex items-center gap-1.5 font-bold text-lg ${
                  job.is_highlighted 
                    ? 'text-amber-600 dark:text-amber-400' 
                    : 'text-primary'
                }`}>
                  <Banknote className="h-5 w-5" />
                  <span>{job.budget} zł{job.budget_type === 'hourly' ? '/h' : ''}</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </Card>
    </Link>
  );
};
