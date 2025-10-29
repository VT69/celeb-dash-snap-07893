-- Create table to track individual player questions and answers
CREATE TABLE IF NOT EXISTS public.player_questions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  room_id UUID NOT NULL,
  user_id UUID NOT NULL,
  question_index INTEGER NOT NULL,
  celebrity_id UUID NOT NULL,
  answer_time_ms INTEGER,
  is_correct BOOLEAN,
  points_earned INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.player_questions ENABLE ROW LEVEL SECURITY;

-- Players can view their own questions
CREATE POLICY "Players can view own questions"
ON public.player_questions
FOR SELECT
USING (auth.uid() = user_id);

-- Players can insert their own questions
CREATE POLICY "Players can insert own questions"
ON public.player_questions
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Players can update their own questions
CREATE POLICY "Players can update own questions"
ON public.player_questions
FOR UPDATE
USING (auth.uid() = user_id);

-- Add index for faster queries
CREATE INDEX IF NOT EXISTS idx_player_questions_room_user 
ON public.player_questions(room_id, user_id);

-- Enable realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.player_questions;