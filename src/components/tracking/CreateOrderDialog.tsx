import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Loader2, MapPin, Navigation, CheckCircle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';

interface CreateOrderDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  workerId: string;
  workerName?: string;
  onOrderCreated: (orderId: string) => void;
}

type OrderStep = 'location' | 'creating' | 'waiting' | 'error';

// Get location from IP-based API
async function getLocationFromIP(): Promise<{ lat: number; lng: number } | null> {
  try {
    const response = await fetch('https://ipapi.co/json/');
    const data = await response.json();
    if (data.latitude && data.longitude) {
      return { lat: data.latitude, lng: data.longitude };
    }
    return null;
  } catch (error) {
    console.error('IP location error:', error);
    return null;
  }
}

// Fallback to browser geolocation
function getBrowserLocation(): Promise<{ lat: number; lng: number } | null> {
  return new Promise((resolve) => {
    if (!navigator.geolocation) {
      resolve(null);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        resolve({
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        });
      },
      () => {
        resolve(null);
      },
      { timeout: 10000, maximumAge: 60000 }
    );
  });
}

export default function CreateOrderDialog({
  open,
  onOpenChange,
  workerId,
  workerName,
  onOrderCreated,
}: CreateOrderDialogProps) {
  const { profile } = useAuth();
  const [step, setStep] = useState<OrderStep>('location');
  const [error, setError] = useState<string | null>(null);

  const handleCreateOrder = async () => {
    if (!profile) {
      toast.error('Musisz być zalogowany');
      return;
    }

    setStep('location');
    setError(null);

    try {
      // Step 1: Get client location
      let location = await getLocationFromIP();
      
      if (!location) {
        location = await getBrowserLocation();
      }

      if (!location) {
        setError('Nie udało się określić lokalizacji. Sprawdź uprawnienia.');
        setStep('error');
        return;
      }

      setStep('creating');

      // Step 2: Create order
      const { data: order, error: orderError } = await supabase
        .from('orders')
        .insert({
          client_id: profile.id,
          provider_id: workerId,
          status: 'requested',
          client_lat: location.lat,
          client_lng: location.lng,
        })
        .select()
        .single();

      if (orderError) {
        throw orderError;
      }

      setStep('waiting');
      toast.success('Zamówienie utworzone! Oczekiwanie na akceptację.');
      onOrderCreated(order.id);
    } catch (err: any) {
      console.error('Error creating order:', err);
      setError(err.message || 'Wystąpił błąd podczas tworzenia zamówienia');
      setStep('error');
    }
  };

  const handleClose = () => {
    setStep('location');
    setError(null);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Navigation className="h-5 w-5 text-primary" />
            Zamów wykonawcę
          </DialogTitle>
          <DialogDescription>
            {workerName && `Zamawiasz usługę od: ${workerName}`}
          </DialogDescription>
        </DialogHeader>

        <div className="py-6">
          {step === 'location' && (
            <div className="text-center space-y-4">
              <div className="h-16 w-16 mx-auto rounded-2xl bg-primary/10 flex items-center justify-center">
                <MapPin className="h-8 w-8 text-primary" />
              </div>
              <div>
                <h3 className="font-semibold mb-1">Pobieranie lokalizacji</h3>
                <p className="text-sm text-muted-foreground">
                  Określimy Twoją lokalizację, aby wykonawca mógł do Ciebie dotrzeć.
                </p>
              </div>
              <Button onClick={handleCreateOrder} className="w-full">
                <MapPin className="h-4 w-4 mr-2" />
                Zamów teraz
              </Button>
            </div>
          )}

          {step === 'creating' && (
            <div className="text-center space-y-4">
              <div className="h-16 w-16 mx-auto rounded-2xl bg-primary/10 flex items-center justify-center">
                <Loader2 className="h-8 w-8 text-primary animate-spin" />
              </div>
              <div>
                <h3 className="font-semibold mb-1">Tworzenie zamówienia</h3>
                <p className="text-sm text-muted-foreground">
                  Proszę czekać...
                </p>
              </div>
            </div>
          )}

          {step === 'waiting' && (
            <div className="text-center space-y-4">
              <div className="h-16 w-16 mx-auto rounded-2xl bg-accent/10 flex items-center justify-center">
                <CheckCircle className="h-8 w-8 text-accent" />
              </div>
              <div>
                <h3 className="font-semibold mb-1">Oczekiwanie na akceptację</h3>
                <p className="text-sm text-muted-foreground">
                  Wykonawca otrzymał powiadomienie o Twoim zamówieniu.
                  Wkrótce otrzymasz informację o akceptacji.
                </p>
              </div>
              <Button variant="outline" onClick={handleClose} className="w-full">
                Zamknij
              </Button>
            </div>
          )}

          {step === 'error' && (
            <div className="text-center space-y-4">
              <div className="h-16 w-16 mx-auto rounded-2xl bg-destructive/10 flex items-center justify-center">
                <MapPin className="h-8 w-8 text-destructive" />
              </div>
              <div>
                <h3 className="font-semibold mb-1 text-destructive">Błąd</h3>
                <p className="text-sm text-muted-foreground">{error}</p>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" onClick={handleClose} className="flex-1">
                  Anuluj
                </Button>
                <Button onClick={handleCreateOrder} className="flex-1">
                  Spróbuj ponownie
                </Button>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
