import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';
import { Navigation, Clock, CheckCircle, Loader2, User, X } from 'lucide-react';
import OrderTrackingMap from './OrderTrackingMap';

interface ActiveOrder {
  id: string;
  provider_id: string;
  status: 'requested' | 'accepted' | 'en_route' | 'arrived' | 'done' | 'cancelled';
  client_lat: number;
  client_lng: number;
  provider_lat: number | null;
  provider_lng: number | null;
  eta_seconds: number | null;
  created_at: string;
  provider: {
    id: string;
    name: string | null;
    avatar_url: string | null;
  };
}

export default function OrderTrackingClient() {
  const { profile } = useAuth();
  const [orders, setOrders] = useState<ActiveOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [providerLocations, setProviderLocations] = useState<Record<string, { lat: number; lng: number }>>({});

  const fetchOrders = async () => {
    if (!profile) return;

    const { data, error } = await supabase
      .from('orders')
      .select(`
        id,
        provider_id,
        status,
        client_lat,
        client_lng,
        provider_lat,
        provider_lng,
        eta_seconds,
        created_at,
        provider:profiles!orders_provider_id_fkey(id, name, avatar_url)
      `)
      .eq('client_id', profile.id)
      .in('status', ['requested', 'accepted', 'en_route', 'arrived'])
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching orders:', error);
    } else {
      setOrders((data || []) as any);
    }
    setLoading(false);
  };

  // Subscribe to provider live location updates
  const subscribeToLocations = () => {
    if (orders.length === 0) return;

    const providerIds = orders.map((o) => o.provider_id);

    const channel = supabase
      .channel('provider-locations')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'provider_live_location',
        },
        (payload) => {
          const data = payload.new as any;
          if (data && providerIds.includes(data.provider_id)) {
            setProviderLocations((prev) => ({
              ...prev,
              [data.provider_id]: { lat: data.lat, lng: data.lng },
            }));
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  };

  useEffect(() => {
    fetchOrders();

    // Subscribe to order updates
    const channel = supabase
      .channel('client-orders')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'orders',
          filter: `client_id=eq.${profile?.id}`,
        },
        (payload) => {
          fetchOrders();
          
          // Show toast for status changes
          const newData = payload.new as any;
          if (payload.eventType === 'UPDATE') {
            if (newData.status === 'accepted') {
              toast.success('Wykonawca zaakceptował zamówienie!');
            } else if (newData.status === 'en_route') {
              toast.info('Wykonawca jest w drodze!');
            } else if (newData.status === 'arrived') {
              toast.success('Wykonawca dotarł na miejsce!');
            } else if (newData.status === 'done') {
              toast.success('Zamówienie zakończone!');
            } else if (newData.status === 'cancelled') {
              toast.error('Zamówienie zostało anulowane');
            }
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [profile?.id]);

  useEffect(() => {
    const cleanup = subscribeToLocations();
    return cleanup;
  }, [orders]);

  const cancelOrder = async (orderId: string) => {
    try {
      const { error } = await supabase
        .from('orders')
        .update({ status: 'cancelled' })
        .eq('id', orderId);

      if (error) throw error;
      toast.info('Zamówienie anulowane');
      fetchOrders();
    } catch (err: any) {
      console.error('Error canceling order:', err);
      toast.error('Błąd anulowania zamówienia');
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6 flex justify-center">
          <Loader2 className="h-6 w-6 animate-spin text-primary" />
        </CardContent>
      </Card>
    );
  }

  if (orders.length === 0) {
    return null;
  }

  return (
    <div className="space-y-6">
      {orders.map((order) => {
        const liveLocation = providerLocations[order.provider_id];
        const providerLat = liveLocation?.lat || order.provider_lat;
        const providerLng = liveLocation?.lng || order.provider_lng;

        const statusInfo = {
          requested: { label: 'Oczekuje na akceptację', color: 'bg-muted', icon: Clock },
          accepted: { label: 'Zaakceptowano', color: 'bg-blue-500', icon: CheckCircle },
          en_route: { label: 'W drodze', color: 'bg-primary', icon: Navigation },
          arrived: { label: 'Na miejscu', color: 'bg-accent', icon: CheckCircle },
          done: { label: 'Zakończono', color: 'bg-muted', icon: CheckCircle },
          cancelled: { label: 'Anulowano', color: 'bg-destructive', icon: X },
        }[order.status];

        const StatusIcon = statusInfo.icon;

        return (
          <Card key={order.id} className="border-primary/20">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center justify-between">
                <span className="flex items-center gap-2">
                  <StatusIcon className="h-5 w-5 text-primary" />
                  Twoje zamówienie
                </span>
                <Badge className={statusInfo.color}>{statusInfo.label}</Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Provider info */}
              <div className="flex items-center justify-between gap-3 p-3 rounded-xl bg-muted/50">
                <div className="flex items-center gap-3">
                  <Avatar className="h-12 w-12 border-2 border-primary/20">
                    <AvatarImage src={order.provider?.avatar_url || ''} />
                    <AvatarFallback className="bg-primary text-white">
                      {order.provider?.name?.charAt(0)?.toUpperCase() || 'W'}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="font-semibold flex items-center gap-1">
                      <User className="h-4 w-4" />
                      {order.provider?.name || 'Wykonawca'}
                    </p>
                  </div>
                </div>

                {order.status === 'requested' && (
                  <Button
                    size="sm"
                    variant="outline"
                    className="text-destructive border-destructive hover:bg-destructive hover:text-white"
                    onClick={() => cancelOrder(order.id)}
                  >
                    <X className="h-4 w-4 mr-1" />
                    Anuluj
                  </Button>
                )}
              </div>

              {/* Map for active tracking */}
              {order.status !== 'requested' &&
                order.client_lat &&
                order.client_lng &&
                providerLat &&
                providerLng && (
                  <OrderTrackingMap
                    clientLat={order.client_lat}
                    clientLng={order.client_lng}
                    providerLat={providerLat}
                    providerLng={providerLng}
                    providerName={order.provider?.name || undefined}
                    etaSeconds={order.eta_seconds}
                    status={order.status as any}
                  />
                )}

              {/* Waiting screen */}
              {order.status === 'requested' && (
                <div className="text-center py-8">
                  <div className="h-16 w-16 mx-auto rounded-2xl bg-muted flex items-center justify-center mb-4">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                  </div>
                  <h3 className="font-semibold mb-1">Oczekiwanie na akceptację</h3>
                  <p className="text-sm text-muted-foreground">
                    Wykonawca otrzymał powiadomienie o Twoim zamówieniu
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
