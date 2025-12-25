-- Create order_status enum type
CREATE TYPE public.order_status AS ENUM ('requested', 'accepted', 'en_route', 'arrived', 'done', 'cancelled');

-- Create orders table for live tracking
CREATE TABLE public.orders (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  client_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  provider_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  status public.order_status NOT NULL DEFAULT 'requested',
  client_lat DOUBLE PRECISION,
  client_lng DOUBLE PRECISION,
  provider_lat DOUBLE PRECISION,
  provider_lng DOUBLE PRECISION,
  eta_seconds INTEGER,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create provider_live_location table for realtime tracking
CREATE TABLE public.provider_live_location (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  provider_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE UNIQUE,
  lat DOUBLE PRECISION NOT NULL,
  lng DOUBLE PRECISION NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.provider_live_location ENABLE ROW LEVEL SECURITY;

-- Orders policies
CREATE POLICY "Clients can view their orders"
  ON public.orders
  FOR SELECT
  USING (client_id IN (SELECT id FROM profiles WHERE user_id = auth.uid()));

CREATE POLICY "Providers can view their orders"
  ON public.orders
  FOR SELECT
  USING (provider_id IN (SELECT id FROM profiles WHERE user_id = auth.uid()));

CREATE POLICY "Clients can create orders"
  ON public.orders
  FOR INSERT
  WITH CHECK (client_id IN (SELECT id FROM profiles WHERE user_id = auth.uid()));

CREATE POLICY "Providers can update their orders"
  ON public.orders
  FOR UPDATE
  USING (provider_id IN (SELECT id FROM profiles WHERE user_id = auth.uid()));

CREATE POLICY "Clients can update their orders"
  ON public.orders
  FOR UPDATE
  USING (client_id IN (SELECT id FROM profiles WHERE user_id = auth.uid()));

-- Provider live location policies
CREATE POLICY "Anyone can view provider locations for active orders"
  ON public.provider_live_location
  FOR SELECT
  USING (true);

CREATE POLICY "Providers can insert their location"
  ON public.provider_live_location
  FOR INSERT
  WITH CHECK (provider_id IN (SELECT id FROM profiles WHERE user_id = auth.uid()));

CREATE POLICY "Providers can update their location"
  ON public.provider_live_location
  FOR UPDATE
  USING (provider_id IN (SELECT id FROM profiles WHERE user_id = auth.uid()));

CREATE POLICY "Providers can delete their location"
  ON public.provider_live_location
  FOR DELETE
  USING (provider_id IN (SELECT id FROM profiles WHERE user_id = auth.uid()));

-- Create trigger for updated_at
CREATE TRIGGER update_orders_updated_at
  BEFORE UPDATE ON public.orders
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_provider_live_location_updated_at
  BEFORE UPDATE ON public.provider_live_location
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Enable realtime for both tables
ALTER PUBLICATION supabase_realtime ADD TABLE public.orders;
ALTER PUBLICATION supabase_realtime ADD TABLE public.provider_live_location;