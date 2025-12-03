
-- Drop existing tables that are no longer needed
DROP TABLE IF EXISTS public.interview_notes CASCADE;
DROP TABLE IF EXISTS public.interview_rooms CASCADE;
DROP TABLE IF EXISTS public.candidate_profiles CASCADE;
DROP TABLE IF EXISTS public.company_profiles CASCADE;

-- Drop existing enum types
DROP TYPE IF EXISTS public.room_status CASCADE;
DROP TYPE IF EXISTS public.app_role CASCADE;

-- Create new enum types
CREATE TYPE public.user_role AS ENUM ('client', 'worker', 'admin');
CREATE TYPE public.job_status AS ENUM ('pending_payment', 'active', 'in_progress', 'done', 'archived');

-- Update profiles table
DROP TABLE IF EXISTS public.profiles CASCADE;
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  role user_role NOT NULL DEFAULT 'client',
  name TEXT,
  phone TEXT,
  wojewodztwo TEXT,
  miasto TEXT,
  bio TEXT,
  avatar_url TEXT,
  rating_avg DECIMAL(2,1) DEFAULT 0,
  rating_count INTEGER DEFAULT 0,
  hourly_rate DECIMAL(10,2),
  is_available BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Categories table
CREATE TABLE public.categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  icon TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Worker categories (many-to-many)
CREATE TABLE public.worker_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  worker_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  category_id UUID REFERENCES public.categories(id) ON DELETE CASCADE NOT NULL,
  UNIQUE(worker_id, category_id)
);

-- Jobs table
CREATE TABLE public.jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  category_id UUID REFERENCES public.categories(id),
  wojewodztwo TEXT NOT NULL,
  miasto TEXT NOT NULL,
  start_time TIMESTAMP WITH TIME ZONE,
  duration_hours INTEGER,
  budget DECIMAL(10,2),
  budget_type TEXT DEFAULT 'fixed', -- 'fixed' or 'hourly'
  urgent BOOLEAN DEFAULT false,
  status job_status DEFAULT 'pending_payment',
  paid BOOLEAN DEFAULT false,
  stripe_session_id TEXT,
  selected_worker_id UUID REFERENCES public.profiles(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Job images
CREATE TABLE public.job_images (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id UUID REFERENCES public.jobs(id) ON DELETE CASCADE NOT NULL,
  image_url TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Job responses (applications from workers)
CREATE TABLE public.job_responses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id UUID REFERENCES public.jobs(id) ON DELETE CASCADE NOT NULL,
  worker_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  message TEXT,
  offer_price DECIMAL(10,2),
  proposed_time TIMESTAMP WITH TIME ZONE,
  status TEXT DEFAULT 'pending', -- 'pending', 'accepted', 'rejected'
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(job_id, worker_id)
);

-- Chat messages
CREATE TABLE public.chat_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id UUID REFERENCES public.jobs(id) ON DELETE CASCADE NOT NULL,
  sender_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  message TEXT,
  image_url TEXT,
  read BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Reviews
CREATE TABLE public.reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id UUID REFERENCES public.jobs(id) ON DELETE CASCADE NOT NULL,
  reviewer_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  reviewed_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  rating INTEGER CHECK (rating >= 1 AND rating <= 5) NOT NULL,
  comment TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(job_id, reviewer_id)
);

-- Insert default categories
INSERT INTO public.categories (name, icon) VALUES
  ('Prace fizyczne', 'hammer'),
  ('Sprzątanie', 'sparkles'),
  ('Przeprowadzki', 'truck'),
  ('Eventy', 'party-popper'),
  ('Gastronomia', 'utensils'),
  ('Ogród', 'flower'),
  ('Transport', 'car'),
  ('Montaż i naprawy', 'wrench'),
  ('Opieka', 'heart'),
  ('Dostawy', 'package'),
  ('IT i komputery', 'laptop'),
  ('Inne', 'more-horizontal');

-- Enable RLS on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.worker_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.job_images ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.job_responses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;

-- Profiles policies
CREATE POLICY "Profiles are viewable by everyone" ON public.profiles FOR SELECT USING (true);
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own profile" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Categories policies (public read)
CREATE POLICY "Categories are viewable by everyone" ON public.categories FOR SELECT USING (true);
CREATE POLICY "Only admins can modify categories" ON public.categories FOR ALL USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE user_id = auth.uid() AND role = 'admin')
);

-- Worker categories policies
CREATE POLICY "Worker categories viewable by everyone" ON public.worker_categories FOR SELECT USING (true);
CREATE POLICY "Workers can manage own categories" ON public.worker_categories FOR ALL USING (
  worker_id IN (SELECT id FROM public.profiles WHERE user_id = auth.uid())
);

-- Jobs policies
CREATE POLICY "Active jobs are viewable by everyone" ON public.jobs FOR SELECT USING (
  status IN ('active', 'in_progress', 'done') OR 
  user_id IN (SELECT id FROM public.profiles WHERE user_id = auth.uid()) OR
  selected_worker_id IN (SELECT id FROM public.profiles WHERE user_id = auth.uid())
);
CREATE POLICY "Users can create jobs" ON public.jobs FOR INSERT WITH CHECK (
  user_id IN (SELECT id FROM public.profiles WHERE user_id = auth.uid())
);
CREATE POLICY "Owners can update own jobs" ON public.jobs FOR UPDATE USING (
  user_id IN (SELECT id FROM public.profiles WHERE user_id = auth.uid())
);
CREATE POLICY "Owners can delete own jobs" ON public.jobs FOR DELETE USING (
  user_id IN (SELECT id FROM public.profiles WHERE user_id = auth.uid())
);

-- Job images policies
CREATE POLICY "Job images viewable by everyone" ON public.job_images FOR SELECT USING (true);
CREATE POLICY "Job owners can manage images" ON public.job_images FOR ALL USING (
  job_id IN (SELECT id FROM public.jobs WHERE user_id IN (SELECT id FROM public.profiles WHERE user_id = auth.uid()))
);

-- Job responses policies
CREATE POLICY "Responses viewable by job owner and responder" ON public.job_responses FOR SELECT USING (
  job_id IN (SELECT id FROM public.jobs WHERE user_id IN (SELECT id FROM public.profiles WHERE user_id = auth.uid())) OR
  worker_id IN (SELECT id FROM public.profiles WHERE user_id = auth.uid())
);
CREATE POLICY "Workers can create responses" ON public.job_responses FOR INSERT WITH CHECK (
  worker_id IN (SELECT id FROM public.profiles WHERE user_id = auth.uid() AND role = 'worker')
);
CREATE POLICY "Workers can update own responses" ON public.job_responses FOR UPDATE USING (
  worker_id IN (SELECT id FROM public.profiles WHERE user_id = auth.uid())
);

-- Chat messages policies
CREATE POLICY "Chat participants can view messages" ON public.chat_messages FOR SELECT USING (
  job_id IN (
    SELECT id FROM public.jobs WHERE 
      user_id IN (SELECT id FROM public.profiles WHERE user_id = auth.uid()) OR
      selected_worker_id IN (SELECT id FROM public.profiles WHERE user_id = auth.uid())
  ) OR
  sender_id IN (SELECT id FROM public.profiles WHERE user_id = auth.uid())
);
CREATE POLICY "Participants can send messages" ON public.chat_messages FOR INSERT WITH CHECK (
  sender_id IN (SELECT id FROM public.profiles WHERE user_id = auth.uid())
);

-- Reviews policies
CREATE POLICY "Reviews are viewable by everyone" ON public.reviews FOR SELECT USING (true);
CREATE POLICY "Job participants can create reviews" ON public.reviews FOR INSERT WITH CHECK (
  reviewer_id IN (SELECT id FROM public.profiles WHERE user_id = auth.uid()) AND
  job_id IN (
    SELECT id FROM public.jobs WHERE 
      user_id IN (SELECT id FROM public.profiles WHERE user_id = auth.uid()) OR
      selected_worker_id IN (SELECT id FROM public.profiles WHERE user_id = auth.uid())
  )
);

-- Enable realtime for chat
ALTER PUBLICATION supabase_realtime ADD TABLE public.chat_messages;
ALTER PUBLICATION supabase_realtime ADD TABLE public.job_responses;
ALTER PUBLICATION supabase_realtime ADD TABLE public.jobs;

-- Create function to update rating average
CREATE OR REPLACE FUNCTION public.update_user_rating()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE public.profiles
  SET 
    rating_avg = (SELECT COALESCE(AVG(rating), 0) FROM public.reviews WHERE reviewed_id = NEW.reviewed_id),
    rating_count = (SELECT COUNT(*) FROM public.reviews WHERE reviewed_id = NEW.reviewed_id)
  WHERE id = NEW.reviewed_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for rating updates
CREATE TRIGGER on_review_created
  AFTER INSERT ON public.reviews
  FOR EACH ROW
  EXECUTE FUNCTION public.update_user_rating();

-- Create function to handle new user
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (user_id, role, name)
  VALUES (
    NEW.id,
    COALESCE((NEW.raw_user_meta_data->>'role')::user_role, 'client'),
    COALESCE(NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1))
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Update trigger
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
