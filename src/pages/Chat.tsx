import { useState, useEffect, useRef } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { Layout } from '@/components/layout/Layout';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Card } from '@/components/ui/card';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { ArrowLeft, Loader2, CheckCircle2, Clock, Shirt, Phone, Check, X, HelpCircle } from 'lucide-react';
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

interface JobResponse {
  worker_id: string;
}

// Predefiniowane szybkie wiadomości
const QUICK_QUESTIONS = [
  { id: 'today', label: 'Czy dziś?', icon: Clock },
  { id: 'hours', label: 'Ile godzin?', icon: HelpCircle },
  { id: 'clothes', label: 'Czy strój roboczy?', icon: Shirt },
  { id: 'phone', label: 'Poproszę o numer telefonu', icon: Phone },
];

const QUICK_RESPONSES = [
  { id: 'yes', label: 'Tak', icon: Check, variant: 'default' as const },
  { id: 'no', label: 'Nie', icon: X, variant: 'outline' as const },
  { id: 'call', label: 'Zadzwoń pod:', icon: Phone, variant: 'secondary' as const },
];

// Mapowanie ID wiadomości na pełny tekst
const MESSAGE_MAP: Record<string, string> = {
  'today': '❓ Czy dziś możesz wykonać zlecenie?',
  'hours': '❓ Ile godzin zajmie praca?',
  'clothes': '❓ Czy potrzebuję stroju roboczego?',
  'phone': '📞 Poproszę o numer telefonu, aby ustalić szczegóły.',
  'yes': '✅ Tak',
  'no': '❌ Nie',
  'call': '📱 Zadzwoń pod numer:',
};

export default function Chat() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { profile, isAuthenticated } = useAuth();
  const { toast } = useToast();

  const [job, setJob] = useState<JobInfo | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [hasApplied, setHasApplied] = useState(false);
  const [phoneInput, setPhoneInput] = useState('');
  const [showPhoneInput, setShowPhoneInput] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }
    
    if (id && profile) {
      fetchJob();
      fetchMessages();
      checkIfApplied();
      const unsubscribe = subscribeToMessages();
      return unsubscribe;
    }
  }, [id, isAuthenticated, profile]);

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

  const checkIfApplied = async () => {
    if (!profile) return;
    
    const { data } = await supabase
      .from('job_responses')
      .select('worker_id')
      .eq('job_id', id)
      .eq('worker_id', profile.id)
      .maybeSingle();

    setHasApplied(!!data);
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

  const sendQuickMessage = async (messageText: string) => {
    if (!profile || !id) return;

    setSending(true);
    const { error } = await supabase.from('chat_messages').insert({
      job_id: id,
      sender_id: profile.id,
      message: messageText,
    });
    setSending(false);

    if (error) {
      toast({
        title: 'Błąd',
        description: error.message,
        variant: 'destructive',
      });
    }
  };

  const handleQuickQuestion = (questionId: string) => {
    const message = MESSAGE_MAP[questionId];
    if (message) {
      sendQuickMessage(message);
    }
  };

  const handleQuickResponse = (responseId: string) => {
    if (responseId === 'call') {
      setShowPhoneInput(true);
    } else {
      const message = MESSAGE_MAP[responseId];
      if (message) {
        sendQuickMessage(message);
      }
    }
  };

  const handleSendPhone = () => {
    if (phoneInput.trim()) {
      sendQuickMessage(`📱 Zadzwoń pod numer: ${phoneInput.trim()}`);
      setPhoneInput('');
      setShowPhoneInput(false);
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

  // isParticipant: owner, selected worker, OR has applied
  const isParticipant = profile && job && 
    (profile.id === job.user_id || profile.id === job.selected_worker_id || hasApplied);

  // Determine other participant for display
  const getOtherParticipant = () => {
    if (!profile || !job) return null;
    if (profile.id === job.user_id) {
      // User is client, show worker (if selected) or generic name
      return job.worker || { name: 'Wykonawca', avatar_url: null };
    }
    // User is worker, show client
    return job.client;
  };
  
  const otherParticipant = getOtherParticipant();

  // Sprawdź ostatnią wiadomość, czy to pytanie
  const lastMessage = messages[messages.length - 1];
  const isLastMessageQuestion = lastMessage?.message?.startsWith('❓');
  const isLastMessageFromOther = lastMessage?.sender_id !== profile?.id;
  const showResponseButtons = isLastMessageQuestion && isLastMessageFromOther;

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
          <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
            <ArrowLeft className="h-5 w-5" />
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
            <div className="text-center py-8">
              <p className="text-muted-foreground mb-2">Szybka komunikacja</p>
              <p className="text-sm text-muted-foreground">
                Wybierz jedno z szybkich pytań poniżej, aby rozpocząć rozmowę
              </p>
            </div>
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

        {/* Quick Messages Input */}
        {job.status !== 'done' && job.status !== 'archived' ? (
          <div className="pt-4 border-t space-y-3">
            {/* Phone input overlay */}
            {showPhoneInput ? (
              <div className="flex gap-2">
                <input
                  type="tel"
                  placeholder="Wpisz numer telefonu..."
                  value={phoneInput}
                  onChange={(e) => setPhoneInput(e.target.value)}
                  className="flex-1 px-3 py-2 text-sm rounded-md border border-input bg-background"
                  autoFocus
                />
                <Button onClick={handleSendPhone} disabled={!phoneInput.trim() || sending}>
                  Wyślij
                </Button>
                <Button variant="ghost" onClick={() => setShowPhoneInput(false)}>
                  Anuluj
                </Button>
              </div>
            ) : (
              <>
                {/* Show response buttons if last message was a question from other person */}
                {showResponseButtons && (
                  <div className="space-y-2">
                    <p className="text-xs text-muted-foreground text-center">Szybka odpowiedź:</p>
                    <div className="flex flex-wrap gap-2 justify-center">
                      {QUICK_RESPONSES.map((response) => (
                        <Button
                          key={response.id}
                          variant={response.variant}
                          size="sm"
                          onClick={() => handleQuickResponse(response.id)}
                          disabled={sending}
                          className="gap-2"
                        >
                          <response.icon className="h-4 w-4" />
                          {response.label}
                        </Button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Always show quick questions */}
                <div className="space-y-2">
                  <p className="text-xs text-muted-foreground text-center">Szybkie pytania:</p>
                  <div className="flex flex-wrap gap-2 justify-center">
                    {QUICK_QUESTIONS.map((question) => (
                      <Button
                        key={question.id}
                        variant="outline"
                        size="sm"
                        onClick={() => handleQuickQuestion(question.id)}
                        disabled={sending}
                        className="gap-2"
                      >
                        <question.icon className="h-4 w-4" />
                        {question.label}
                      </Button>
                    ))}
                  </div>
                </div>
              </>
            )}
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
