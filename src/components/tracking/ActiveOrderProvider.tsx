import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';
import { Navigation, MapPin, Clock, CheckCircle, Loader2, User } from 'lucide-react';
import OrderTrackingMap from './OrderTrackingMap';

interface ActiveOrder {
  id: string;
  client_id: string;
  status: 'accepted' | 'en_route' | 'arrived' | 'done';
  client_lat: number;
  client_lng: number;
  provider_lat: number | null;
  provider_lng: number | null;
  eta_seconds: number | null;
  created_at: string;
  client: {
    id: string;
    name: string | null;
    avatar_url: string | null;
    miasto: string | null;
  };
}

interface ActiveOrderProviderProps {
  orderId: string;
  onComplete?: () => void;
}

export default function ActiveOrderProvider({ orderId, onComplete }: ActiveOrderProviderProps) {
  const { profile } = useAuth();
  const [order, setOrder] = useState<ActiveOrder | null>(null);
  const [loading, setLoading] = useState(true);
  const [currentPosition, setCurrentPosition] = useState<{ lat: number; lng: number } | null>(null);
  const [watchId, setWatchId] = useState<number | null>(null);
  const [updating, setUpdating] = useState(false);

  // Fetch order details
  const fetchOrder = async () => {
    const { data, error } = await supabase
      .from('orders')
      .select(`
        id,
        client_id,
        status,
        client_lat,
        client_lng,
        provider_lat,
        provider_lng,
        eta_seconds,
        created_at,
        client:profiles!orders_client_id_fkey(id, name, avatar_url, miasto)
      `)
      .eq('id', orderId)
      .single();

    if (error) {
      console.error('Error fetching order:', error);
    } else {
      setOrder(data as any);
    }
    setLoading(false);
  };

  // Start watching position
  const startTracking = useCallback(() => {
    if (!navigator.geolocation) {
      toast.error('Geolokalizacja nie jest wspierana');
      return;
    }

    const id = navigator.geolocation.watchPosition(
      async (position) => {
        const newPos = {
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        };
        setCurrentPosition(newPos);

        // Update provider location in database
        if (profile) {
          await supabase.from('provider_live_location').upsert({
            provider_id: profile.id,
            lat: newPos.lat,
            lng: newPos.lng,
            updated_at: new Date().toISOString(),
          });

          // Also update order
          await supabase
            .from('orders')
            .update({
              provider_lat: newPos.lat,
              provider_lng: newPos.lng,
            })
            .eq('id', orderId);
        }
      },
      (error) => {
        console.error('Geolocation error:', error);
        toast.error('Błąd pobierania lokalizacji');
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 5000,
      }
    );

    setWatchId(id);
  }, [profile, orderId]);

  // Stop tracking
  const stopTracking = useCallback(async () => {
    if (watchId !== null) {
      navigator.geolocation.clearWatch(watchId);
      setWatchId(null);
    }

    // Remove live location
    if (profile) {
      await supabase
        .from('provider_live_location')
        .delete()
        .eq('provider_id', profile.id);
    }
  }, [watchId, profile]);

  // Update order status
  const updateStatus = async (newStatus: 'en_route' | 'arrived' | 'done') => {
    setUpdating(true);

    try {
      const { error } = await supabase
        .from('orders')
        .update({ status: newStatus })
        .eq('id', orderId);

      if (error) throw error;

      if (newStatus === 'en_route') {
        toast.success('Status: W drodze');
        startTracking();
      } else if (newStatus === 'arrived') {
        toast.success('Status: Na miejscu');
      } else if (newStatus === 'done') {
        toast.success('Zamówienie zakończone!');
        await stopTracking();
        onComplete?.();
      }

      fetchOrder();
    } catch (err: any) {
      console.error('Error updating status:', err);
      toast.error('Błąd aktualizacji statusu');
    }

    setUpdating(false);
  };

  useEffect(() => {
    fetchOrder();

    // Subscribe to order updates
    const channel = supabase
      .channel(`order-${orderId}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'orders',
          filter: `id=eq.${orderId}`,
        },
        () => {
          fetchOrder();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
      stopTracking();
    };
  }, [orderId]);

  // Start tracking if already en_route
  useEffect(() => {
    if (order?.status === 'en_route' && watchId === null) {
      startTracking();
    }
  }, [order?.status, watchId, startTracking]);

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6 flex justify-center">
          <Loader2 className="h-6 w-6 animate-spin text-primary" />
        </CardContent>
      </Card>
    );
  }

  if (!order) {
    return null;
  }

  return (
    <div className="space-y-4">
      <Card className="border-primary/30">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center justify-between">
            <span className="flex items-center gap-2">
              <Navigation className="h-5 w-5 text-primary" />
              Aktywne zamówienie
            </span>
            <Badge
              className={
                order.status === 'en_route'
                  ? 'bg-primary'
                  : order.status === 'arrived'
                  ? 'bg-accent'
                  : 'bg-muted'
              }
            >
              {order.status === 'accepted' && 'Zaakceptowano'}
              {order.status === 'en_route' && 'W drodze'}
              {order.status === 'arrived' && 'Na miejscu'}
              {order.status === 'done' && 'Zakończono'}
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Client info */}
          <div className="flex items-center gap-3 p-3 rounded-xl bg-muted/50">
            <Avatar className="h-12 w-12 border-2 border-primary/20">
              <AvatarImage src={order.client?.avatar_url || ''} />
              <AvatarFallback className="bg-primary text-white">
                {order.client?.name?.charAt(0)?.toUpperCase() || 'K'}
              </AvatarFallback>
            </Avatar>
            <div>
              <p className="font-semibold flex items-center gap-1">
                <User className="h-4 w-4" />
                {order.client?.name || 'Klient'}
              </p>
              {order.client?.miasto && (
                <p className="text-sm text-muted-foreground flex items-center gap-1">
                  <MapPin className="h-3 w-3" />
                  {order.client.miasto}
                </p>
              )}
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex flex-wrap gap-2">
            {order.status === 'accepted' && (
              <Button
                className="flex-1 bg-primary hover:bg-primary/90"
                onClick={() => updateStatus('en_route')}
                disabled={updating}
              >
                {updating ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                ) : (
                  <Navigation className="h-4 w-4 mr-2" />
                )}
                Jadę
              </Button>
            )}

            {order.status === 'en_route' && (
              <Button
                className="flex-1 bg-accent hover:bg-accent/90"
                onClick={() => updateStatus('arrived')}
                disabled={updating}
              >
                {updating ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                ) : (
                  <MapPin className="h-4 w-4 mr-2" />
                )}
                Na miejscu
              </Button>
            )}

            {order.status === 'arrived' && (
              <Button
                className="flex-1"
                variant="outline"
                onClick={() => updateStatus('done')}
                disabled={updating}
              >
                {updating ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                ) : (
                  <CheckCircle className="h-4 w-4 mr-2" />
                )}
                Zakończ
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Map */}
      {order.client_lat && order.client_lng && (currentPosition || order.provider_lat) && (
        <OrderTrackingMap
          clientLat={order.client_lat}
          clientLng={order.client_lng}
          providerLat={currentPosition?.lat || order.provider_lat!}
          providerLng={currentPosition?.lng || order.provider_lng!}
          providerName={profile?.name || 'Ty'}
          etaSeconds={order.eta_seconds}
          status={order.status}
        />
      )}
    </div>
  );
}
