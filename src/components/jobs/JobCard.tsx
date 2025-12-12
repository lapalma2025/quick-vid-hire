import { Link } from 'react-router-dom';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { MapPin, Clock, Calendar, Banknote, Globe, Users, Star, Zap } from 'lucide-react';
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
    const base = "group relative overflow-hidden rounded-xl border transition-all duration-300 hover:shadow-lg hover:-translate-y-0.5";
    
    if (job.is_highlighted) {
      return `${base} border-amber-300 dark:border-amber-600 bg-gradient-to-br from-amber-50 via-white to-amber-50/50 dark:from-amber-950/30 dark:via-card dark:to-amber-950/20 shadow-[0_4px_20px_rgba(251,191,36,0.15)]`;
    }
    
    if (isPromotionActive) {
      return `${base} border-primary/30 bg-gradient-to-br from-primary/5 via-card to-primary/5 shadow-[0_4px_20px_rgba(34,197,94,0.1)]`;
    }
    
    return `${base} border-border/60 bg-card hover:border-primary/30`;
  };

  return (
    <Link to={`/jobs/${job.id}`}>
      <Card className={getCardClasses()}>
        <div className="flex gap-4 p-4">
          {/* Image / Icon - compact square */}
          <div className="relative flex-shrink-0 w-20 h-20 rounded-lg overflow-hidden bg-muted">
            {firstImage ? (
              <img 
                src={firstImage} 
                alt={job.title} 
                className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-primary/10 to-primary/5">
                <CategoryIcon name={job.category?.name || 'Inne'} className="h-8 w-8 text-primary/40" />
              </div>
            )}
            
            {/* Highlighted star overlay */}
            {job.is_highlighted && (
              <div className="absolute -top-1 -right-1 bg-amber-400 p-1 rounded-bl-lg">
                <Star className="h-3 w-3 text-white fill-white" />
              </div>
            )}
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0 flex flex-col justify-between">
            {/* Top row: Title + Badges */}
            <div className="space-y-1.5">
              <div className="flex items-start justify-between gap-2">
                <h3 className={`font-semibold text-[15px] leading-tight line-clamp-1 transition-colors ${
                  job.is_highlighted 
                    ? 'text-amber-700 dark:text-amber-400' 
                    : 'group-hover:text-primary'
                }`}>
                  {job.title}
                </h3>
                
                {/* Budget - prominent on the right */}
                {job.budget && (
                  <div className={`flex-shrink-0 font-bold text-sm ${
                    job.is_highlighted ? 'text-amber-600 dark:text-amber-400' : 'text-primary'
                  }`}>
                    {job.budget} zł{job.budget_type === 'hourly' ? '/h' : ''}
                  </div>
                )}
              </div>

              {/* Badges row */}
              <div className="flex items-center gap-1.5 flex-wrap">
                {job.category && (
                  <Badge variant="secondary" className="text-[10px] px-2 py-0 h-5 font-medium">
                    {job.category.name}
                  </Badge>
                )}
                {job.urgent && (
                  <Badge className="bg-destructive/90 text-white text-[10px] px-2 py-0 h-5 font-semibold">
                    ⚡ PILNE
                  </Badge>
                )}
                {job.is_foreign && (
                  <Badge className="bg-blue-500/90 text-white text-[10px] px-2 py-0 h-5 font-semibold flex items-center gap-0.5">
                    <Globe className="h-2.5 w-2.5" />
                    ZAGRANICA
                  </Badge>
                )}
                {job.allows_group && (
                  <Badge className="bg-purple-500/90 text-white text-[10px] px-2 py-0 h-5 font-semibold flex items-center gap-0.5">
                    <Users className="h-2.5 w-2.5" />
                    {job.min_workers}-{job.max_workers}
                  </Badge>
                )}
                {isPromotionActive && promotionTimeLeft && (
                  <Badge className="bg-primary/90 text-white text-[10px] px-2 py-0 h-5 font-medium flex items-center gap-0.5">
                    <Zap className="h-2.5 w-2.5" />
                    {promotionTimeLeft}
                  </Badge>
                )}
              </div>
            </div>

            {/* Bottom row: Meta info */}
            <div className="flex items-center gap-3 text-xs text-muted-foreground mt-2">
              <div className="flex items-center gap-1">
                {job.is_foreign ? (
                  <Globe className="h-3 w-3 text-blue-500" />
                ) : (
                  <MapPin className="h-3 w-3" />
                )}
                <span className="truncate max-w-[120px]">
                  {job.miasto}
                </span>
              </div>
              
              {job.start_time && (
                <div className="flex items-center gap-1">
                  <Calendar className="h-3 w-3" />
                  <span>{format(new Date(job.start_time), 'dd.MM', { locale: pl })}</span>
                </div>
              )}
              
              {job.duration_hours && (
                <div className="flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  <span>{job.duration_hours}h</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Subtle hover indicator */}
        <div className={`absolute bottom-0 left-0 right-0 h-0.5 transform scale-x-0 group-hover:scale-x-100 transition-transform duration-300 origin-left ${
          job.is_highlighted ? 'bg-amber-400' : 'bg-primary'
        }`} />
      </Card>
    </Link>
  );
};
