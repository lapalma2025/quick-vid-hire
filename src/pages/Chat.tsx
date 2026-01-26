import { useState, useEffect, useRef } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { Layout } from '@/components/layout/Layout';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Card } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { ArrowLeft, Loader2, CheckCircle2, Clock, Phone, Check, X, HelpCircle, MapPin, CreditCard, Calendar, Wrench, Users, Shield, Send } from 'lucide-react';
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

// Pytania dla WYKONAWCÓW (workers) - mogą wysyłać tylko te predefiniowane
const WORKER_QUESTIONS = [
  { 
    id: 'availability', 
    label: 'Termin realizacji', 
    icon: Calendar,
    fullText: '📅 Czy mogę poznać preferowany termin realizacji zlecenia? Chciałbym dopasować swój harmonogram.'
  },
  { 
    id: 'address', 
    label: 'Dokładny adres', 
    icon: MapPin,
    fullText: '📍 Czy mogę prosić o dokładny adres realizacji zlecenia? Potrzebuję go do zaplanowania dojazdu.'
  },
  { 
    id: 'tools', 
    label: 'Narzędzia i materiały', 
    icon: Wrench,
    fullText: '🔧 Czy powinienem przynieść własne narzędzia i materiały, czy będą one dostępne na miejscu?'
  },
  { 
    id: 'payment', 
    label: 'Forma płatności', 
    icon: CreditCard,
    fullText: '💳 Jaka forma płatności będzie preferowana? Gotówka, przelew czy inna metoda?'
  },
  { 
    id: 'phone', 
    label: 'Kontakt telefoniczny', 
    icon: Phone,
    fullText: '📞 Czy mogę prosić o numer telefonu, aby ustalić szczegóły telefonicznie?'
  },
  { 
    id: 'scope', 
    label: 'Zakres prac', 
    icon: HelpCircle,
    fullText: '📋 Czy mogę poznać dokładny zakres prac? Chciałbym się odpowiednio przygotować do zlecenia.'
  },
];

// Pytania dla ZLECENIODAWCÓW (clients) - mogą wysyłać te predefiniowane
const CLIENT_QUESTIONS = [
  { 
    id: 'experience', 
    label: 'Doświadczenie', 
    icon: Shield,
    fullText: '🏆 Jakie masz doświadczenie w tego typu pracach? Czy możesz pokazać przykłady realizacji?'
  },
  { 
    id: 'timeline', 
    label: 'Czas realizacji', 
    icon: Clock,
    fullText: '⏱️ Ile czasu zajmie realizacja tego zlecenia? Kiedy możesz zacząć?'
  },
  { 
    id: 'team', 
    label: 'Praca zespołowa', 
    icon: Users,
    fullText: '👥 Czy będziesz pracować samodzielnie, czy z pomocnikami? Ile osób będzie zaangażowanych?'
  },
  { 
    id: 'guarantee', 
    label: 'Gwarancja', 
    icon: Shield,
    fullText: '✅ Czy udzielasz gwarancji na wykonaną pracę? Na jakich warunkach?'
  },
  { 
    id: 'phone_request', 
    label: 'Prośba o telefon', 
    icon: Phone,
    fullText: '📞 Czy możesz podać swój numer telefonu, żebyśmy mogli ustalić szczegóły?'
  },
  { 
    id: 'price_details', 
    label: 'Szczegóły ceny', 
    icon: CreditCard,
    fullText: '💰 Czy możesz rozpisać szczegółowo co zawiera Twoja wycena? Co jest wliczone w cenę?'
  },
];

// Szybkie odpowiedzi dla ZLECENIODAWCÓW (mogą odpowiadać swobodnie + te przyciski)
const CLIENT_QUICK_RESPONSES = [
  { id: 'yes', label: 'Tak', icon: Check, variant: 'default' as const },
  { id: 'no', label: 'Nie', icon: X, variant: 'outline' as const },
  { id: 'call', label: 'Zadzwoń pod:', icon: Phone, variant: 'secondary' as const },
  { id: 'confirm', label: 'Potwierdzam zlecenie', icon: Check, variant: 'default' as const },
  { id: 'later', label: 'Odezwę się później', icon: Clock, variant: 'outline' as const },
];

// Mapowanie ID odpowiedzi na pełny tekst
const RESPONSE_MESSAGE_MAP: Record<string, string> = {
  'yes': '✅ Tak',
  'no': '❌ Nie',
  'call': '📱 Zadzwoń pod numer:',
  'confirm': '✅ Potwierdzam zlecenie! Możemy przystąpić do realizacji.',
  'later': '⏳ Odezwę się później z więcej informacjami.',
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
  const [freeTextInput, setFreeTextInput] = useState('');

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

  const sendMessage = async (messageText: string) => {
    if (!profile || !id || !messageText.trim()) return;

    setSending(true);
    const { error } = await supabase.from('chat_messages').insert({
      job_id: id,
      sender_id: profile.id,
      message: messageText.trim(),
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

  const handleQuickQuestion = (question: typeof WORKER_QUESTIONS[0] | typeof CLIENT_QUESTIONS[0]) => {
    sendMessage(question.fullText);
  };

  const handleQuickResponse = (responseId: string) => {
    if (responseId === 'call') {
      setShowPhoneInput(true);
    } else {
      const message = RESPONSE_MESSAGE_MAP[responseId];
      if (message) {
        sendMessage(message);
      }
    }
  };

  const handleSendPhone = () => {
    if (phoneInput.trim()) {
      sendMessage(`📱 Zadzwoń pod numer: ${phoneInput.trim()}`);
      setPhoneInput('');
      setShowPhoneInput(false);
    }
  };

  const handleSendFreeText = () => {
    if (freeTextInput.trim()) {
      sendMessage(freeTextInput);
      setFreeTextInput('');
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

  // Determine if current user is the job owner (client)
  const isJobOwner = profile?.id === job?.user_id;

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

  // Sprawdź ostatnią wiadomość, czy to pytanie od drugiej strony
  const lastMessage = messages[messages.length - 1];
  const isLastMessageQuestion = lastMessage?.message?.includes('?') || lastMessage?.message?.startsWith('📅') || lastMessage?.message?.startsWith('📍') || lastMessage?.message?.startsWith('🔧') || lastMessage?.message?.startsWith('💳') || lastMessage?.message?.startsWith('📞') || lastMessage?.message?.startsWith('📋') || lastMessage?.message?.startsWith('🏆') || lastMessage?.message?.startsWith('⏱️') || lastMessage?.message?.startsWith('👥') || lastMessage?.message?.startsWith('✅') || lastMessage?.message?.startsWith('💰');
  const isLastMessageFromOther = lastMessage?.sender_id !== profile?.id;
  
  // Pokazuj szybkie odpowiedzi jeśli ostatnia wiadomość jest pytaniem od drugiej osoby
  const showQuickResponses = isLastMessageQuestion && isLastMessageFromOther && isJobOwner;

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

  // Wybierz odpowiednie pytania w zależności od roli
  const questions = isJobOwner ? CLIENT_QUESTIONS : WORKER_QUESTIONS;

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
                {isJobOwner 
                  ? 'Wybierz jedno z pytań poniżej lub napisz własną wiadomość.'
                  : 'Wybierz jedno z pytań poniżej, aby rozpocząć rozmowę.'}
              </p>
              <p className="text-xs text-muted-foreground mt-2">
                💡 Szczegóły możecie ustalić telefonicznie po wymianie kontaktu
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
                {/* Free text input for job owners (clients) */}
                {isJobOwner && (
                  <div className="flex gap-2">
                    <Textarea
                      placeholder="Napisz wiadomość..."
                      value={freeTextInput}
                      onChange={(e) => setFreeTextInput(e.target.value)}
                      className="min-h-[60px] resize-none"
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && !e.shiftKey) {
                          e.preventDefault();
                          handleSendFreeText();
                        }
                      }}
                    />
                    <Button 
                      onClick={handleSendFreeText} 
                      disabled={!freeTextInput.trim() || sending}
                      className="self-end"
                    >
                      <Send className="h-4 w-4" />
                    </Button>
                  </div>
                )}

                {/* Show quick response buttons for clients when worker asks a question */}
                {showQuickResponses && (
                  <div className="space-y-2">
                    <p className="text-xs text-muted-foreground text-center">Szybka odpowiedź:</p>
                    <div className="flex flex-wrap gap-2 justify-center">
                      {CLIENT_QUICK_RESPONSES.map((response) => (
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

                {/* Quick questions - different for workers and clients */}
                <div className="space-y-2">
                  <p className="text-xs text-muted-foreground text-center">
                    {isJobOwner ? 'Zapytaj wykonawcę:' : 'Zapytaj zleceniodawcę:'}
                  </p>
                  <div className="flex flex-wrap gap-2 justify-center">
                    {questions.map((question) => (
                      <Button
                        key={question.id}
                        variant="outline"
                        size="sm"
                        onClick={() => handleQuickQuestion(question)}
                        disabled={sending}
                        className="gap-2"
                      >
                        <question.icon className="h-4 w-4" />
                        {question.label}
                      </Button>
                    ))}
                  </div>
                </div>

                {!isJobOwner && (
                  <p className="text-xs text-muted-foreground text-center mt-2">
                    💡 Możesz wysyłać tylko predefiniowane wiadomości. Szczegóły ustalcie telefonicznie.
                  </p>
                )}
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
