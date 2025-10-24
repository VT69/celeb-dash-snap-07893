-- Create profiles table for user data
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  username TEXT UNIQUE NOT NULL,
  total_score INTEGER DEFAULT 0,
  games_played INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Profiles policies
CREATE POLICY "Users can view all profiles"
  ON public.profiles FOR SELECT
  USING (true);

CREATE POLICY "Users can update own profile"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile"
  ON public.profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

-- Create celebrities table
CREATE TABLE public.celebrities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  image_url TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS for celebrities (public read)
ALTER TABLE public.celebrities ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view celebrities"
  ON public.celebrities FOR SELECT
  USING (true);

-- Create game sessions table
CREATE TABLE public.game_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  score INTEGER DEFAULT 0,
  questions_answered INTEGER DEFAULT 0,
  completed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.game_sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own sessions"
  ON public.game_sessions FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own sessions"
  ON public.game_sessions FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Function to handle new user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, username)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'username', SPLIT_PART(NEW.email, '@', 1))
  );
  RETURN NEW;
END;
$$;

-- Trigger for auto-creating profile
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- Insert some sample celebrities
INSERT INTO public.celebrities (name, image_url) VALUES
  ('Taylor Swift', 'https://images.unsplash.com/photo-1516280440614-37939bbacd81?w=400'),
  ('Dwayne Johnson', 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=400'),
  ('Beyoncé', 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=400'),
  ('Tom Cruise', 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=400'),
  ('Ariana Grande', 'https://images.unsplash.com/photo-1529626455594-4ff0802cfb7e?w=400'),
  ('Chris Hemsworth', 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400'),
  ('Rihanna', 'https://images.unsplash.com/photo-1508214751196-bcfd4ca60f91?w=400'),
  ('Leonardo DiCaprio', 'https://images.unsplash.com/photo-1519345182560-3f2917c472ef?w=400');