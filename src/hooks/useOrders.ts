import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

export interface Order {
  id: string;
  client_id: string;
  provider_id: string;
  status: 'requested' | 'accepted' | 'en_route' | 'arrived' | 'done' | 'cancelled';
  client_lat: number | null;
  client_lng: number | null;
  provider_lat: number | null;
  provider_lng: number | null;
  eta_seconds: number | null;
  created_at: string;
  updated_at: string;
}

export function useOrders() {
  const { profile } = useAuth();
  const [clientOrders, setClientOrders] = useState<Order[]>([]);
  const [providerOrders, setProviderOrders] = useState<Order[]>([]);
  const [activeProviderOrder, setActiveProviderOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchOrders = useCallback(async () => {
    if (!profile) return;

    // Fetch orders as client
    const { data: clientData } = await supabase
      .from('orders')
      .select('*')
      .eq('client_id', profile.id)
      .in('status', ['requested', 'accepted', 'en_route', 'arrived'])
      .order('created_at', { ascending: false });

    if (clientData) {
      setClientOrders(clientData as Order[]);
    }

    // Fetch orders as provider
    const { data: providerData } = await supabase
      .from('orders')
      .select('*')
      .eq('provider_id', profile.id)
      .in('status', ['requested', 'accepted', 'en_route', 'arrived'])
      .order('created_at', { ascending: false });

    if (providerData) {
      setProviderOrders(providerData as Order[]);
      
      // Find active order (en_route or accepted)
      const active = providerData.find(
        (o) => o.status === 'en_route' || o.status === 'accepted' || o.status === 'arrived'
      );
      setActiveProviderOrder(active as Order || null);
    }

    setLoading(false);
  }, [profile?.id]);

  useEffect(() => {
    fetchOrders();

    if (!profile) return;

    // Subscribe to realtime updates
    const channel = supabase
      .channel('orders-updates')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'orders',
        },
        (payload) => {
          const data = payload.new as Order;
          if (data.client_id === profile.id || data.provider_id === profile.id) {
            fetchOrders();
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [profile?.id, fetchOrders]);

  const hasActiveClientOrder = clientOrders.some(
    (o) => o.status !== 'done' && o.status !== 'cancelled'
  );

  const hasActiveProviderOrder = providerOrders.some(
    (o) => o.status !== 'done' && o.status !== 'cancelled' && o.status !== 'requested'
  );

  const pendingProviderOrders = providerOrders.filter((o) => o.status === 'requested');

  return {
    clientOrders,
    providerOrders,
    activeProviderOrder,
    hasActiveClientOrder,
    hasActiveProviderOrder,
    pendingProviderOrders,
    loading,
    refetch: fetchOrders,
  };
}
