import { useState, useEffect, useRef } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { Layout } from '@/components/layout/Layout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Card } from '@/components/ui/card';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { ArrowLeft, Send, Loader2, CheckCircle2 } from 'lucide-react';
import { format } from 'date-fns';
import { pl } from 'date-fns/locale';

interface Message {
  id: string;
  message: string | null;
  image_url: string | null;
  created_at: string;
  sender_id: string;
  sender?: {
    name: string | null;
    avatar_url: string | null;
  };
}

interface JobInfo {
  id: string;
  title: string;
  status: string;
  user_id: string;
  selected_worker_id: string | null;
  client?: { name: string | null; avatar_url: string | null };
  worker?: { name: string | null; avatar_url: string | null };
}

export default function Chat() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { profile, isAuthenticated } = useAuth();
  const { toast } = useToast();

  const [job, setJob] = useState<JobInfo | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }
    
    if (id) {
      fetchJob();
      fetchMessages();
      subscribeToMessages();
    }
  }, [id, isAuthenticated]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const fetchJob = async () => {
    const { data } = await supabase
      .from('jobs')
      .select(`
        id,
        title,
        status,
        user_id,
        selected_worker_id,
        client:profiles!jobs_user_id_fkey(name, avatar_url),
        worker:profiles!jobs_selected_worker_id_fkey(name, avatar_url)
      `)
      .eq('id', id)
      .maybeSingle();

    if (data) {
      setJob(data as any);
    }
  };

  const fetchMessages = async () => {
    const { data } = await supabase
      .from('chat_messages')
      .select(`
        id,
        message,
        image_url,
        created_at,
        sender_id,
        sender:profiles!chat_messages_sender_id_fkey(name, avatar_url)
      `)
      .eq('job_id', id)
      .order('created_at', { ascending: true });

    if (data) {
      setMessages(data as any);
    }
    setLoading(false);
  };

  const subscribeToMessages = () => {
    const channel = supabase
      .channel(`chat-${id}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'chat_messages',
          filter: `job_id=eq.${id}`,
        },
        async (payload) => {
          const { data } = await supabase
            .from('chat_messages')
            .select(`
              id,
              message,
              image_url,
              created_at,
              sender_id,
              sender:profiles!chat_messages_sender_id_fkey(name, avatar_url)
            `)
            .eq('id', payload.new.id)
            .single();

          if (data) {
            setMessages((prev) => [...prev, data as any]);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  };

  const handleSend = async () => {
    if (!newMessage.trim() || !profile || !id) return;

    setSending(true);
    const { error } = await supabase.from('chat_messages').insert({
      job_id: id,
      sender_id: profile.id,
      message: newMessage.trim(),
    });
    setSending(false);

    if (error) {
      toast({
        title: 'Błąd',
        description: error.message,
        variant: 'destructive',
      });
    } else {
      setNewMessage('');
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleMarkDone = async () => {
    if (!job) return;

    const { error } = await supabase
      .from('jobs')
      .update({ status: 'done' })
      .eq('id', job.id);

    if (error) {
      toast({ title: 'Błąd', description: error.message, variant: 'destructive' });
    } else {
      toast({ title: 'Zlecenie oznaczone jako zakończone!' });
      fetchJob();
    }
  };

  const isParticipant = profile && job && 
    (profile.id === job.user_id || profile.id === job.selected_worker_id);

  const otherParticipant = profile?.id === job?.user_id ? job?.worker : job?.client;

  if (loading) {
    return (
      <Layout>
        <div className="container py-16 flex justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </Layout>
    );
  }

  if (!job || !isParticipant) {
    return (
      <Layout>
        <div className="container py-16 text-center">
          <p className="text-muted-foreground">Brak dostępu do tego czatu</p>
          <Button asChild className="mt-4">
            <Link to="/dashboard">Wróć do panelu</Link>
          </Button>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="container max-w-3xl py-4 h-[calc(100vh-8rem)] flex flex-col">
        {/* Header */}
        <div className="flex items-center gap-4 pb-4 border-b">
          <Button variant="ghost" size="icon" asChild>
            <Link to={`/jobs/${job.id}`}>
              <ArrowLeft className="h-5 w-5" />
            </Link>
          </Button>
          <Avatar className="h-10 w-10">
            <AvatarImage src={otherParticipant?.avatar_url || ''} />
            <AvatarFallback>
              {otherParticipant?.name?.charAt(0)?.toUpperCase() || 'U'}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <p className="font-medium truncate">{otherParticipant?.name || 'Użytkownik'}</p>
            <p className="text-sm text-muted-foreground truncate">{job.title}</p>
          </div>
          {job.status === 'in_progress' && profile?.id === job.user_id && (
            <Button size="sm" variant="outline" onClick={handleMarkDone} className="gap-2">
              <CheckCircle2 className="h-4 w-4" />
              Zakończ
            </Button>
          )}
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto py-4 space-y-4">
          {messages.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">
              Rozpocznij rozmowę
            </p>
          ) : (
            messages.map((msg) => {
              const isOwn = msg.sender_id === profile?.id;
              return (
                <div
                  key={msg.id}
                  className={`flex gap-3 ${isOwn ? 'flex-row-reverse' : ''}`}
                >
                  <Avatar className="h-8 w-8 flex-shrink-0">
                    <AvatarImage src={msg.sender?.avatar_url || ''} />
                    <AvatarFallback className="text-xs">
                      {msg.sender?.name?.charAt(0)?.toUpperCase() || 'U'}
                    </AvatarFallback>
                  </Avatar>
                  <div className={`max-w-[70%] ${isOwn ? 'text-right' : ''}`}>
                    <Card className={`p-3 inline-block ${isOwn ? 'bg-primary text-primary-foreground' : ''}`}>
                      {msg.message && <p className="text-sm whitespace-pre-wrap">{msg.message}</p>}
                      {msg.image_url && (
                        <img src={msg.image_url} alt="" className="rounded mt-2 max-w-full" />
                      )}
                    </Card>
                    <p className="text-xs text-muted-foreground mt-1">
                      {format(new Date(msg.created_at), 'HH:mm', { locale: pl })}
                    </p>
                  </div>
                </div>
              );
            })
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input */}
        {job.status !== 'done' && job.status !== 'archived' ? (
          <div className="flex gap-2 pt-4 border-t">
            <Input
              placeholder="Napisz wiadomość..."
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              onKeyPress={handleKeyPress}
              disabled={sending}
            />
            <Button onClick={handleSend} disabled={sending || !newMessage.trim()}>
              {sending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Send className="h-4 w-4" />
              )}
            </Button>
          </div>
        ) : (
          <div className="text-center py-4 border-t">
            <p className="text-muted-foreground">To zlecenie zostało zakończone</p>
          </div>
        )}
      </div>
    </Layout>
  );
}
