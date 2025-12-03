import { Layout } from '@/components/layout/Layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Mail, Phone, MessageSquare, Clock } from 'lucide-react';
import { useState } from 'react';
import { useToast } from '@/hooks/use-toast';

const Help = () => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const { toast } = useToast();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    toast({
      title: 'Wiadomość wysłana',
      description: 'Odpowiemy najszybciej jak to możliwe.'
    });
    setName('');
    setEmail('');
    setMessage('');
  };

  const contactInfo = [
    {
      icon: Mail,
      title: 'Email',
      value: 'pomoc@zlecenieteraz.pl',
      description: 'Odpowiadamy w ciągu 24h'
    },
    {
      icon: Phone,
      title: 'Telefon',
      value: '+48 123 456 789',
      description: 'Pon-Pt 9:00-17:00'
    },
    {
      icon: MessageSquare,
      title: 'Czat',
      value: 'Dostępny w aplikacji',
      description: 'Dla zalogowanych użytkowników'
    },
    {
      icon: Clock,
      title: 'Czas odpowiedzi',
      value: 'Do 24 godzin',
      description: 'W dni robocze'
    }
  ];

  return (
    <Layout>
      <div className="container py-12">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-4xl font-bold text-center mb-4">Pomoc</h1>
          <p className="text-muted-foreground text-center mb-12 text-lg">
            Masz pytanie lub problem? Jesteśmy tu, aby pomóc.
          </p>

          <div className="grid md:grid-cols-2 gap-6 mb-12">
            {contactInfo.map((info, index) => (
              <Card key={index}>
                <CardContent className="p-4 flex items-center gap-4">
                  <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                    <info.icon className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <p className="font-semibold">{info.title}</p>
                    <p className="text-sm">{info.value}</p>
                    <p className="text-xs text-muted-foreground">{info.description}</p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Formularz kontaktowy</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Imię</Label>
                    <Input
                      id="name"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="Twoje imię"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="twoj@email.pl"
                      required
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="message">Wiadomość</Label>
                  <Textarea
                    id="message"
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    placeholder="Opisz swój problem lub pytanie..."
                    rows={5}
                    required
                  />
                </div>
                <Button type="submit" className="w-full">
                  Wyślij wiadomość
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    </Layout>
  );
};

export default Help;
