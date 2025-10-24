-- Create game rooms table for multiplayer games
CREATE TABLE public.game_rooms (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  room_code text NOT NULL UNIQUE,
  host_id uuid NOT NULL,
  status text NOT NULL DEFAULT 'waiting', -- waiting, playing, finished
  current_question_index integer DEFAULT 0,
  current_celebrity_id uuid,
  created_at timestamp with time zone DEFAULT now()
);

-- Create room players table to track players in each room
CREATE TABLE public.room_players (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  room_id uuid NOT NULL REFERENCES public.game_rooms(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  username text NOT NULL,
  score integer DEFAULT 0,
  ready boolean DEFAULT false,
  joined_at timestamp with time zone DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.game_rooms ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.room_players ENABLE ROW LEVEL SECURITY;

-- RLS policies for game_rooms
CREATE POLICY "Anyone can view game rooms"
  ON public.game_rooms
  FOR SELECT
  USING (true);

CREATE POLICY "Hosts can create game rooms"
  ON public.game_rooms
  FOR INSERT
  WITH CHECK (auth.uid() = host_id);

CREATE POLICY "Hosts can update their game rooms"
  ON public.game_rooms
  FOR UPDATE
  USING (auth.uid() = host_id);

-- RLS policies for room_players
CREATE POLICY "Anyone can view room players"
  ON public.room_players
  FOR SELECT
  USING (true);

CREATE POLICY "Users can join rooms"
  ON public.room_players
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own player data"
  ON public.room_players
  FOR UPDATE
  USING (auth.uid() = user_id);

-- Enable realtime for multiplayer tables
ALTER PUBLICATION supabase_realtime ADD TABLE public.game_rooms;
ALTER PUBLICATION supabase_realtime ADD TABLE public.room_players;