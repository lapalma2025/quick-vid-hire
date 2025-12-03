import { Link } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { MapPin, Clock, Calendar, Banknote, ArrowRight } from 'lucide-react';
import { format } from 'date-fns';
import { pl } from 'date-fns/locale';
import { CategoryIcon } from './CategoryIcon';

interface Job {
  id: string;
  title: string;
  description: string | null;
  wojewodztwo: string;
  miasto: string;
  start_time: string | null;
  duration_hours: number | null;
  budget: number | null;
  budget_type: string | null;
  urgent: boolean;
  status: string;
  created_at: string;
  category?: { name: string; icon: string } | null;
  job_images?: { image_url: string }[];
}

interface JobCardProps {
  job: Job;
}

export const JobCard = ({ job }: JobCardProps) => {
  const firstImage = job.job_images?.[0]?.image_url;

  return (
    <Link to={`/jobs/${job.id}`}>
      <Card className="group card-modern overflow-hidden h-full bg-card hover:bg-card">
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
          
          {/* Badges container */}
          <div className="absolute top-3 left-3 right-3 flex justify-between items-start">
            {job.urgent && (
              <Badge className="bg-destructive text-white text-xs font-bold px-3 py-1 rounded-full shadow-lg">
                PILNE
              </Badge>
            )}
            {job.category && (
              <Badge variant="secondary" className="bg-white/90 backdrop-blur-sm text-foreground text-xs font-medium ml-auto shadow-sm">
                {job.category.name}
              </Badge>
            )}
          </div>

          {/* View button on hover */}
          <div className="absolute bottom-3 right-3 opacity-0 group-hover:opacity-100 transition-all duration-300 transform translate-y-2 group-hover:translate-y-0">
            <div className="h-10 w-10 rounded-full bg-white shadow-lg flex items-center justify-center">
              <ArrowRight className="h-5 w-5 text-primary" />
            </div>
          </div>
        </div>
        
        <CardContent className="p-5 space-y-4">
          <div>
            <h3 className="font-display font-bold text-lg line-clamp-2 group-hover:text-primary transition-colors duration-300">
              {job.title}
            </h3>
          </div>

          <div className="space-y-2 text-sm">
            <div className="flex items-center gap-2 text-muted-foreground">
              <MapPin className="h-4 w-4 flex-shrink-0 text-primary/60" />
              <span className="truncate">{job.miasto}, {job.wojewodztwo}</span>
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
            <div className="pt-3 border-t border-border/50">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Budżet</span>
                <div className="flex items-center gap-1.5 font-display font-bold text-lg text-primary">
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