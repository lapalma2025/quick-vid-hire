import { Link } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { MapPin, Clock, Calendar, Banknote } from 'lucide-react';
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
      <Card className="card-hover overflow-hidden h-full">
        <div className="relative aspect-video bg-muted">
          {firstImage ? (
            <img 
              src={firstImage} 
              alt={job.title} 
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-gradient-card">
              <CategoryIcon name={job.category?.name || 'Inne'} className="h-12 w-12 text-muted-foreground/50" />
            </div>
          )}
          {job.urgent && (
            <Badge className="absolute top-2 right-2 badge-urgent">
              PILNE
            </Badge>
          )}
        </div>
        <CardContent className="p-4 space-y-3">
          <div className="flex items-start justify-between gap-2">
            <h3 className="font-semibold line-clamp-2 text-base">{job.title}</h3>
          </div>
          
          {job.category && (
            <Badge variant="secondary" className="text-xs">
              {job.category.name}
            </Badge>
          )}

          <div className="space-y-1.5 text-sm text-muted-foreground">
            <div className="flex items-center gap-1.5">
              <MapPin className="h-3.5 w-3.5 flex-shrink-0" />
              <span className="truncate">{job.miasto}, {job.wojewodztwo}</span>
            </div>
            
            {job.start_time && (
              <div className="flex items-center gap-1.5">
                <Calendar className="h-3.5 w-3.5 flex-shrink-0" />
                <span>{format(new Date(job.start_time), 'dd MMM, HH:mm', { locale: pl })}</span>
              </div>
            )}
            
            {job.duration_hours && (
              <div className="flex items-center gap-1.5">
                <Clock className="h-3.5 w-3.5 flex-shrink-0" />
                <span>{job.duration_hours}h</span>
              </div>
            )}
          </div>

          {job.budget && (
            <div className="flex items-center gap-1.5 font-semibold text-primary">
              <Banknote className="h-4 w-4" />
              <span>{job.budget} zł{job.budget_type === 'hourly' ? '/h' : ''}</span>
            </div>
          )}
        </CardContent>
      </Card>
    </Link>
  );
};