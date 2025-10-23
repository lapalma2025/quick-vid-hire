-- TypyEnum dla ról
CREATE TYPE public.app_role AS ENUM ('candidate', 'company', 'admin');
CREATE TYPE public.room_status AS ENUM ('draft', 'open', 'live', 'closed');

-- Tabela profili użytkowników (rozszerzenie auth.users)
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  role public.app_role NOT NULL,
  email TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- Tabela profili kandydatów
CREATE TABLE public.candidate_profiles (
  user_id UUID PRIMARY KEY REFERENCES public.profiles(id) ON DELETE CASCADE,
  full_name TEXT,
  headline TEXT,
  about TEXT,
  profession TEXT,
  location TEXT,
  linkedin_url TEXT,
  photo_url TEXT,
  cv_url TEXT,
  skills TEXT[],
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- Tabela profili firm
CREATE TABLE public.company_profiles (
  user_id UUID PRIMARY KEY REFERENCES public.profiles(id) ON DELETE CASCADE,
  company_name TEXT NOT NULL,
  website TEXT,
  linkedin_url TEXT,
  about TEXT,
  logo_url TEXT,
  size_range TEXT,
  industry TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- Tabela pokoi rozmów (eventy 1:1)
CREATE TABLE public.interview_rooms (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_by UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  title TEXT,
  description TEXT,
  scheduled_at TIMESTAMP WITH TIME ZONE,
  status public.room_status DEFAULT 'draft' NOT NULL,
  invite_token TEXT UNIQUE NOT NULL,
  candidate_id UUID REFERENCES public.profiles(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- Tabela notatek z rozmowy
CREATE TABLE public.interview_notes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  room_id UUID NOT NULL REFERENCES public.interview_rooms(id) ON DELETE CASCADE,
  author_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  candidate_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  rating INTEGER CHECK (rating BETWEEN 1 AND 5),
  tags TEXT[],
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- Indeksy dla wydajności
CREATE INDEX idx_profiles_role ON public.profiles(role);
CREATE INDEX idx_interview_rooms_created_by ON public.interview_rooms(created_by);
CREATE INDEX idx_interview_rooms_candidate_id ON public.interview_rooms(candidate_id);
CREATE INDEX idx_interview_rooms_invite_token ON public.interview_rooms(invite_token);
CREATE INDEX idx_interview_notes_room_id ON public.interview_notes(room_id);

-- Funkcja do automatycznego tworzenia profilu po rejestracji
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, email, role)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'role', 'candidate')::app_role
  );
  RETURN NEW;
END;
$$;

-- Trigger do tworzenia profilu
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- Funkcja do aktualizacji updated_at
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

-- Triggery dla updated_at
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_candidate_profiles_updated_at
  BEFORE UPDATE ON public.candidate_profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_company_profiles_updated_at
  BEFORE UPDATE ON public.company_profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_interview_rooms_updated_at
  BEFORE UPDATE ON public.interview_rooms
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Enable Row Level Security
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.candidate_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.company_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.interview_rooms ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.interview_notes ENABLE ROW LEVEL SECURITY;

-- RLS Policies dla profiles
CREATE POLICY "Users can view own profile"
  ON public.profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id);

-- RLS Policies dla candidate_profiles
CREATE POLICY "Candidates can view own profile"
  ON public.candidate_profiles FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Candidates can update own profile"
  ON public.candidate_profiles FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Candidates can insert own profile"
  ON public.candidate_profiles FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- RLS Policies dla company_profiles
CREATE POLICY "Companies can view own profile"
  ON public.company_profiles FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Companies can update own profile"
  ON public.company_profiles FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Companies can insert own profile"
  ON public.company_profiles FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- RLS Policies dla interview_rooms
CREATE POLICY "Company owners can view their rooms"
  ON public.interview_rooms FOR SELECT
  USING (auth.uid() = created_by);

CREATE POLICY "Candidates can view rooms they're invited to"
  ON public.interview_rooms FOR SELECT
  USING (auth.uid() = candidate_id);

CREATE POLICY "Companies can create rooms"
  ON public.interview_rooms FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'company'
    )
  );

CREATE POLICY "Company owners can update their rooms"
  ON public.interview_rooms FOR UPDATE
  USING (auth.uid() = created_by);

-- RLS Policies dla interview_notes
CREATE POLICY "Companies can view notes"
  ON public.interview_notes FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'company'
    )
  );

CREATE POLICY "Companies can create notes"
  ON public.interview_notes FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'company'
    )
  );

CREATE POLICY "Companies can update notes"
  ON public.interview_notes FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'company'
    )
  );