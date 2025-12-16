import { Link } from 'react-router-dom';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
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
  applicant_limit?: number | null;
  response_count?: number;
}

interface JobCardProps {
  job: Job;
}

export const JobCard = ({ job }: JobCardProps) => {
  const firstImage = job.job_images?.[0]?.image_url;
  
  // Check if job has background styling (Podświetlenie - no badge, just background)
  const hasBackgroundStyling = job.is_promoted && !job.promotion_expires_at;
  
  // Check if promotion with badge is active (Promowanie 24h - has badge and boost)
  const isPromotionWithBadge = job.is_promoted && 
    job.promotion_expires_at && new Date(job.promotion_expires_at) > new Date();
  
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
    const base = "group overflow-hidden hover:shadow-lg transition-all duration-300 cursor-pointer h-full";
    
    if (job.is_highlighted) {
      return `${base} ring-2 ring-amber-400 shadow-[0_0_20px_rgba(251,191,36,0.3)] bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-950/30 dark:to-orange-950/30`;
    }
    
    // Promowanie 24h - with badge
    if (isPromotionWithBadge) {
      return `${base} ring-2 ring-primary/50 bg-gradient-to-br from-primary/5 to-emerald-50/50 dark:from-primary/10 dark:to-emerald-950/30`;
    }
    
    // Podświetlenie - subtle but visible background styling
    if (hasBackgroundStyling) {
      return `${base} bg-gradient-to-br from-emerald-100/80 via-primary/10 to-teal-50/60 dark:from-emerald-900/40 dark:via-primary/20 dark:to-teal-950/40`;
    }
    
    return base;
  };

  return (
    <Link to={`/jobs/${job.id}`}>
      <Card className={getCardClasses()}>
        {/* Image section - smaller height */}
        <div className="relative h-36 bg-muted overflow-hidden">
          {firstImage ? (
            <img 
              src={firstImage} 
              alt={job.title} 
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-primary/10 to-primary/5">
              <CategoryIcon name={job.category?.name || 'Inne'} className="h-14 w-14 text-primary/40" />
            </div>
          )}
          
          {/* Premium badges on image */}
          {job.is_highlighted && (
            <div className="absolute top-2 left-2">
              <Badge className="bg-gradient-to-r from-amber-400 to-orange-400 text-white font-bold shadow-lg">
                <Star className="h-3 w-3 mr-1 fill-white" />
                WYRÓŻNIONE
              </Badge>
            </div>
          )}
          
          {isPromotionWithBadge && !job.is_highlighted && (
            <div className="absolute top-2 left-2">
              <Badge className="bg-gradient-to-r from-primary to-emerald-500 text-white font-semibold shadow-lg">
                <Zap className="h-3 w-3 mr-1" />
                Promowane{promotionTimeLeft && `: ${promotionTimeLeft}`}
              </Badge>
            </div>
          )}
          
          {/* Urgent badge */}
          {job.urgent && (
            <div className="absolute top-2 right-2">
              <Badge className="bg-red-500 hover:bg-red-500 text-white font-bold">
                ⚡ PILNE
              </Badge>
            </div>
          )}
          
          {/* Foreign job badge */}
          {job.is_foreign && (
            <div className="absolute bottom-2 left-2">
              <Badge className="bg-blue-500 hover:bg-blue-500 text-white font-bold flex items-center gap-1">
                <Globe className="h-3 w-3" />
                ZAGRANICA
              </Badge>
            </div>
          )}
          
          {/* Group job badge */}
          {job.allows_group && (
            <div className="absolute bottom-2 right-2">
              <Badge className="bg-violet-500 hover:bg-violet-500 text-white font-bold flex items-center gap-1">
                <Users className="h-3 w-3" />
                GRUPA {job.min_workers}-{job.max_workers}
              </Badge>
            </div>
          )}
        </div>

        <CardHeader className="pb-2 pt-3 px-3">
          <div className="flex items-start justify-between gap-2">
            <h3 className={`font-semibold text-base leading-tight line-clamp-2 group-hover:text-primary transition-colors ${
              job.is_highlighted ? 'text-amber-700 dark:text-amber-400' : ''
            }`}>
              {job.title}
            </h3>
          </div>
          
          {job.category && (
            <Badge variant="secondary" className="w-fit text-xs mt-1">
              {job.category.name}
            </Badge>
          )}
        </CardHeader>

        <CardContent className="pt-0 pb-3 px-3 space-y-2">
          {/* Location */}
          <div className="flex items-center text-sm text-muted-foreground">
            {job.is_foreign ? (
              <Globe className="h-4 w-4 mr-1.5 text-blue-500" />
            ) : (
              <MapPin className="h-4 w-4 mr-1.5" />
            )}
            <span className="truncate">
              {job.is_foreign ? `${job.miasto}, ${job.country}` : `${job.miasto}, ${job.wojewodztwo}`}
            </span>
          </div>

          {/* Time info */}
          <div className="flex items-center gap-3 text-sm text-muted-foreground">
            {job.start_time && (
              <div className="flex items-center">
                <Calendar className="h-4 w-4 mr-1.5" />
                <span>{format(new Date(job.start_time), 'dd MMM', { locale: pl })}</span>
              </div>
            )}
            {job.duration_hours && (
              <div className="flex items-center">
                <Clock className="h-4 w-4 mr-1.5" />
                <span>{job.duration_hours}h</span>
              </div>
            )}
          </div>

          {/* Budget */}
          {job.budget && (
            <div className={`flex items-center font-bold text-lg ${
              job.is_highlighted ? 'text-amber-600 dark:text-amber-400' : 'text-primary'
            }`}>
              <Banknote className="h-5 w-5 mr-1.5" />
              <span>{job.budget} zł{job.budget_type === 'hourly' ? '/h' : ''}</span>
            </div>
          )}

          {/* Applicant count */}
          {(job.response_count !== undefined || job.applicant_limit) && (
            <div className="flex items-center text-sm text-muted-foreground">
              <Users className="h-4 w-4 mr-1.5" />
              <span>
                {job.response_count ?? 0}
                {job.applicant_limit ? `/${job.applicant_limit}` : ''} aplikacji
              </span>
            </div>
          )}
        </CardContent>
      </Card>
    </Link>
  );
};
