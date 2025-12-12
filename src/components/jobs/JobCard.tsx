import { Link } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { MapPin, Clock, Calendar, Banknote, ArrowRight, Globe, Users, Star, Zap } from 'lucide-react';
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
  const cardClasses = [
    "group card-modern overflow-hidden h-full transition-all duration-300",
    job.is_highlighted 
      ? "ring-2 ring-amber-400 shadow-[0_0_20px_rgba(251,191,36,0.3)] bg-gradient-to-br from-amber-50/50 to-card dark:from-amber-900/10 dark:to-card" 
      : "bg-card hover:bg-card",
    isPromotionActive && !job.is_highlighted
      ? "bg-gradient-to-br from-primary/20 via-primary/10 to-card ring-2 ring-primary/40 shadow-[0_0_15px_rgba(34,197,94,0.2)]"
      : "",
  ].filter(Boolean).join(" ");

  return (
    <Link to={`/jobs/${job.id}`}>
      <Card className={cardClasses}>
        <div className="relative aspect-[4/3] bg-muted overflow-hidden">
          {firstImage ? (
            <img 
              src={firstImage} 
              alt={job.title} 
              className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-primary/5 to-primary/10">
              <CategoryIcon name={job.category?.name || 'Inne'} className="h-16 w-16 text-primary/30" />
            </div>
          )}
          {/* Overlay gradient */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
          
          {/* Highlighted badge - top corner */}
          {job.is_highlighted && (
            <div className="absolute top-0 right-0">
              <div className="bg-gradient-to-r from-amber-400 to-amber-500 text-white text-xs font-bold px-3 py-1.5 rounded-bl-lg shadow-lg flex items-center gap-1">
                <Star className="h-3 w-3 fill-current" />
                WYRÓŻNIONE
              </div>
            </div>
          )}
          
          {/* Promotion timer badge */}
          {isPromotionActive && promotionTimeLeft && (
            <div className="absolute top-0 left-0">
              <div className="bg-gradient-to-r from-primary to-primary/80 text-white text-xs font-medium px-3 py-1.5 rounded-br-lg shadow-lg flex items-center gap-1">
                <Zap className="h-3 w-3" />
                Promowane: {promotionTimeLeft}
              </div>
            </div>
          )}
          
          {/* Badges container */}
          <div className={`absolute ${job.is_highlighted ? 'top-10' : 'top-3'} left-3 right-3 flex justify-between items-start gap-2`}>
            <div className="flex gap-2 flex-wrap">
              {job.urgent && (
                <Badge className="bg-destructive text-white text-xs font-bold px-3 py-1 rounded-full shadow-lg">
                  ⚡ PILNE
                </Badge>
              )}
              {job.is_foreign && (
                <Badge className="bg-blue-500 text-white text-xs font-bold px-3 py-1 rounded-full shadow-lg flex items-center gap-1">
                  <Globe className="h-3 w-3" />
                  ZAGRANICA
                </Badge>
              )}
              {job.allows_group && (
                <Badge className="bg-purple-500 text-white text-xs font-bold px-3 py-1 rounded-full shadow-lg flex items-center gap-1">
                  <Users className="h-3 w-3" />
                  GRUPA {job.min_workers}-{job.max_workers}
                </Badge>
              )}
            </div>
            {job.category && !job.is_highlighted && (
              <Badge variant="secondary" className="bg-white/90 backdrop-blur-sm text-foreground text-xs font-medium shadow-sm">
                {job.category.name}
              </Badge>
            )}
          </div>

          {/* View button on hover */}
          <div className="absolute bottom-3 right-3 opacity-0 group-hover:opacity-100 transition-all duration-300 transform translate-y-2 group-hover:translate-y-0">
            <div className={`h-10 w-10 rounded-full shadow-lg flex items-center justify-center ${job.is_highlighted ? 'bg-amber-400' : 'bg-white'}`}>
              <ArrowRight className={`h-5 w-5 ${job.is_highlighted ? 'text-white' : 'text-primary'}`} />
            </div>
          </div>
        </div>
        
        <CardContent className="p-5 space-y-4">
          <div>
            <h3 className={`font-display font-bold text-lg line-clamp-2 transition-colors duration-300 ${
              job.is_highlighted 
                ? 'text-amber-700 dark:text-amber-400 group-hover:text-amber-600' 
                : 'group-hover:text-primary'
            }`}>
              {job.title}
            </h3>
            {job.category && job.is_highlighted && (
              <span className="text-xs text-muted-foreground">{job.category.name}</span>
            )}
          </div>

          <div className="space-y-2 text-sm">
            <div className="flex items-center gap-2 text-muted-foreground">
              {job.is_foreign ? (
                <Globe className="h-4 w-4 flex-shrink-0 text-blue-500" />
              ) : (
                <MapPin className="h-4 w-4 flex-shrink-0 text-primary/60" />
              )}
              <span className="truncate">
                {job.miasto}, {job.is_foreign ? job.country || job.wojewodztwo : job.wojewodztwo}
              </span>
            </div>
            
            <div className="flex items-center gap-4">
              {job.start_time && (
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Calendar className="h-4 w-4 flex-shrink-0 text-primary/60" />
                  <span>{format(new Date(job.start_time), 'dd MMM', { locale: pl })}</span>
                </div>
              )}
              
              {job.duration_hours && (
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Clock className="h-4 w-4 flex-shrink-0 text-primary/60" />
                  <span>{job.duration_hours}h</span>
                </div>
              )}
            </div>
          </div>

          {job.budget && (
            <div className={`pt-3 border-t ${job.is_highlighted ? 'border-amber-200 dark:border-amber-800/30' : 'border-border/50'}`}>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Budżet</span>
                <div className={`flex items-center gap-1.5 font-display font-bold text-lg ${
                  job.is_highlighted ? 'text-amber-600 dark:text-amber-400' : 'text-primary'
                }`}>
                  <Banknote className="h-5 w-5" />
                  <span>{job.budget} zł{job.budget_type === 'hourly' ? '/h' : ''}</span>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </Link>
  );
};