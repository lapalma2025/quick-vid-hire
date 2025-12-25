import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';
import { Bell, Check, X, MapPin, Clock, Loader2 } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { pl } from 'date-fns/locale';

interface IncomingOrder {
  id: string;
  client_id: string;
  status: string;
  created_at: string;
  client_lat: number | null;
  client_lng: number | null;
  client: {
    id: string;
    name: string | null;
    avatar_url: string | null;
    miasto: string | null;
  };
}

interface IncomingOrdersPanelProps {
  onOrderAccepted?: (orderId: string) => void;
}

export default function IncomingOrdersPanel({ onOrderAccepted }: IncomingOrdersPanelProps) {
  const { profile } = useAuth();
  const [orders, setOrders] = useState<IncomingOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState<string | null>(null);

  const fetchOrders = async () => {
    if (!profile) return;

    const { data, error } = await supabase
      .from('orders')
      .select(`
        id,
        client_id,
        status,
        created_at,
        client_lat,
        client_lng,
        client:profiles!orders_client_id_fkey(id, name, avatar_url, miasto)
      `)
      .eq('provider_id', profile.id)
      .eq('status', 'requested')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching orders:', error);
    } else {
      setOrders((data || []) as any);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchOrders();

    // Subscribe to realtime updates
    const channel = supabase
      .channel('incoming-orders')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'orders',
          filter: `provider_id=eq.${profile?.id}`,
        },
        () => {
          fetchOrders();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [profile?.id]);

  const handleAccept = async (orderId: string) => {
    setProcessingId(orderId);

    try {
      const { error } = await supabase
        .from('orders')
        .update({ status: 'accepted' })
        .eq('id', orderId);

      if (error) throw error;

      toast.success('Zamówienie zaakceptowane! Rozpocznij trasę.');
      setOrders((prev) => prev.filter((o) => o.id !== orderId));
      onOrderAccepted?.(orderId);
    } catch (err: any) {
      console.error('Error accepting order:', err);
      toast.error('Błąd podczas akceptacji zamówienia');
    }

    setProcessingId(null);
  };

  const handleReject = async (orderId: string) => {
    setProcessingId(orderId);

    try {
      const { error } = await supabase
        .from('orders')
        .update({ status: 'cancelled' })
        .eq('id', orderId);

      if (error) throw error;

      toast.info('Zamówienie odrzucone');
      setOrders((prev) => prev.filter((o) => o.id !== orderId));
    } catch (err: any) {
      console.error('Error rejecting order:', err);
      toast.error('Błąd podczas odrzucania zamówienia');
    }

    setProcessingId(null);
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
    <Card className="border-primary/30 bg-primary/5">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-lg">
          <Bell className="h-5 w-5 text-primary animate-pulse" />
          Nowe zamówienia
          <Badge className="bg-primary">{orders.length}</Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {orders.map((order) => (
          <div
            key={order.id}
            className="p-4 rounded-xl bg-background border border-border shadow-sm"
          >
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-center gap-3">
                <Avatar className="h-12 w-12 border-2 border-primary/20">
                  <AvatarImage src={order.client?.avatar_url || ''} />
                  <AvatarFallback className="bg-primary text-white">
                    {order.client?.name?.charAt(0)?.toUpperCase() || 'K'}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <p className="font-semibold">{order.client?.name || 'Klient'}</p>
                  {order.client?.miasto && (
                    <p className="text-sm text-muted-foreground flex items-center gap-1">
                      <MapPin className="h-3 w-3" />
                      {order.client.miasto}
                    </p>
                  )}
                  <p className="text-xs text-muted-foreground flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    {formatDistanceToNow(new Date(order.created_at), {
                      addSuffix: true,
                      locale: pl,
                    })}
                  </p>
                </div>
              </div>

              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  className="border-destructive text-destructive hover:bg-destructive hover:text-white"
                  onClick={() => handleReject(order.id)}
                  disabled={processingId === order.id}
                >
                  {processingId === order.id ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <X className="h-4 w-4" />
                  )}
                </Button>
                <Button
                  size="sm"
                  className="bg-primary hover:bg-primary/90"
                  onClick={() => handleAccept(order.id)}
                  disabled={processingId === order.id}
                >
                  {processingId === order.id ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <>
                      <Check className="h-4 w-4 mr-1" />
                      Akceptuj
                    </>
                  )}
                </Button>
              </div>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
