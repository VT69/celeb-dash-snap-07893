import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
const sb = supabase as any;
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { toast } from "sonner";
import GameQuestion from "./GameQuestion";

interface Celebrity {
  id: string;
  name: string;
  image_url: string;
}

interface Player {
  id: string;
  user_id: string;
  username: string;
  score: number;
}

interface MultiplayerGameProps {
  roomId: string;
  userId: string;
  isHost: boolean;
  celebrities: Celebrity[];
  onGameEnd: (myScore: number, opponentScore: number) => void;
  onLeave: () => void;
}

const MultiplayerGame = ({ roomId, userId, isHost, celebrities, onGameEnd, onLeave }: MultiplayerGameProps) => {
  const [players, setPlayers] = useState<Player[]>([]);
  const [roomCode, setRoomCode] = useState<string>("");
  const [currentQuestion, setCurrentQuestion] = useState<{
    celebrity: Celebrity;
    options: string[];
  } | null>(null);
  const [questionIndex, setQuestionIndex] = useState(0);
  const [gameStarted, setGameStarted] = useState(false);
  const [waitingForPlayers, setWaitingForPlayers] = useState(true);

  useEffect(() => {
    loadRoomCode();
    loadPlayers();
    subscribeToRoom();
    
    return () => {
      supabase.channel(`room-${roomId}`).unsubscribe();
    };
  }, [roomId]);

  const loadRoomCode = async () => {
    const { data } = await sb
      .from("game_rooms")
      .select("room_code")
      .eq("id", roomId)
      .single();
    
    if (data) {
      setRoomCode(data.room_code);
    }
  };

  const loadPlayers = async () => {
    const { data } = await sb
      .from("room_players")
      .select("*")
      .eq("room_id", roomId);
    
    if (data) {
      setPlayers(data);
      if (data.length === 2) {
        setWaitingForPlayers(false);
        if (isHost) {
          startGame();
        }
      }
    }
  };

  const subscribeToRoom = () => {
    const channel = supabase
      .channel(`room-${roomId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'room_players',
          filter: `room_id=eq.${roomId}`
        },
        (payload) => {
          console.log('Room update:', payload);
          loadPlayers();
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'game_rooms',
          filter: `id=eq.${roomId}`
        },
        async (payload: any) => {
          if (payload.new.status === 'playing' && !gameStarted) {
            setGameStarted(true);
            await generateQuestion(payload.new.current_question_index);
          }
          if (payload.new.current_celebrity_id && payload.new.current_celebrity_id !== currentQuestion?.celebrity.id) {
            await generateQuestion(payload.new.current_question_index);
          }
        }
      )
      .subscribe();
  };

  const startGame = async () => {
    if (!isHost) return;
    
    console.log('Host starting game with celebrities:', celebrities.length);
    
    if (celebrities.length < 4) {
      toast.error("Not enough celebrities to start game");
      return;
    }
    
    const celebrity = celebrities[0];
    await sb
      .from("game_rooms")
      .update({
        status: 'playing',
        current_question_index: 0,
        current_celebrity_id: celebrity.id
      })
      .eq("id", roomId);
  };

  const generateQuestion = async (index: number) => {
    console.log('Generating question for index:', index);
    
    if (index >= 10) {
      await endGame();
      return;
    }

    if (celebrities.length < 4) {
      console.error('Not enough celebrities');
      return;
    }

    const availableCelebrities = celebrities.filter(c => 
      !currentQuestion || c.id !== currentQuestion.celebrity.id
    );
    
    const shuffled = [...availableCelebrities].sort(() => Math.random() - 0.5);
    const correctCelebrity = shuffled[0];
    const wrongOptions = shuffled.slice(1, 4).map((c) => c.name);
    const allOptions = [correctCelebrity.name, ...wrongOptions].sort(() => Math.random() - 0.5);

    console.log('Setting question:', correctCelebrity.name);
    
    setCurrentQuestion({
      celebrity: correctCelebrity,
      options: allOptions,
    });
    setQuestionIndex(index);
  };

  const handleAnswer = async (selectedAnswer: string) => {
    if (!currentQuestion) return;

    const isCorrect = selectedAnswer === currentQuestion.celebrity.name;
    
    if (isCorrect) {
      const { data: player } = await sb
        .from("room_players")
        .select("score")
        .eq("room_id", roomId)
        .eq("user_id", userId)
        .single();

      await sb
        .from("room_players")
        .update({ score: (player?.score || 0) + 1 })
        .eq("room_id", roomId)
        .eq("user_id", userId);
    }

    if (isHost) {
      const nextIndex = questionIndex + 1;
      if (nextIndex >= 10) {
        await endGame();
      } else {
        setTimeout(async () => {
          const nextCelebrity = celebrities[nextIndex % celebrities.length];
          await sb
            .from("game_rooms")
            .update({
              current_question_index: nextIndex,
              current_celebrity_id: nextCelebrity.id
            })
            .eq("id", roomId);
        }, 1500);
      }
    }
  };

  const endGame = async () => {
    await sb
      .from("game_rooms")
      .update({ status: 'finished' })
      .eq("id", roomId);

    const { data } = await sb
      .from("room_players")
      .select("*")
      .eq("room_id", roomId);

    if (data) {
      const myPlayer = data.find(p => p.user_id === userId);
      const opponent = data.find(p => p.user_id !== userId);
      onGameEnd(myPlayer?.score || 0, opponent?.score || 0);
    }
  };

  const copyRoomCode = () => {
    navigator.clipboard.writeText(roomCode);
    toast.success("Room code copied to clipboard!");
  };

  if (waitingForPlayers) {
    return (
      <div className="w-full max-w-2xl space-y-6">
        <Card className="comic-border bg-card p-8 text-center space-y-6">
          <h2 className="text-4xl font-black text-foreground">
            Waiting for Player 2... ⏳
          </h2>
          <div className="text-6xl animate-bounce">👤</div>
          
          <div className="space-y-3">
            <p className="text-xl font-bold text-foreground/70">
              Share this room code:
            </p>
            <div className="bg-primary/20 border-4 border-primary rounded-lg p-6">
              <div className="text-6xl font-black text-foreground tracking-wider">
                {roomCode}
              </div>
            </div>
            <Button 
              onClick={copyRoomCode}
              className="comic-button bg-success text-success-foreground font-black"
            >
              📋 Copy Room Code
            </Button>
          </div>

          {players.length > 0 && (
            <div className="space-y-2 pt-4">
              <p className="text-lg font-bold text-foreground/70">Players in lobby:</p>
              {players.map(player => (
                <div key={player.user_id} className="text-xl font-black text-foreground">
                  ✓ {player.username}
                </div>
              ))}
            </div>
          )}
          
          <Button onClick={onLeave} variant="outline" className="comic-button mt-4">
            Leave Room
          </Button>
        </Card>
      </div>
    );
  }

  return (
    <div className="w-full max-w-4xl space-y-6">
      <div className="flex justify-between items-center">
        {players.map(player => (
          <Card key={player.id} className={`comic-border p-4 ${player.user_id === userId ? 'bg-success/20' : 'bg-card'}`}>
            <div className="text-center">
              <div className="text-sm font-bold text-foreground/70">
                {player.username} {player.user_id === userId && '(You)'}
              </div>
              <div className="text-4xl font-black text-foreground">{player.score}</div>
            </div>
          </Card>
        ))}
      </div>

      <div className="text-center">
        <div className="text-2xl font-black text-foreground">
          Question {questionIndex + 1} / 10
        </div>
      </div>

      {currentQuestion ? (
        <GameQuestion
          celebrity={currentQuestion.celebrity}
          options={currentQuestion.options}
          onAnswer={handleAnswer}
          timeLimit={7}
        />
      ) : (
        <Card className="comic-border bg-card p-8 text-center">
          <div className="text-2xl font-bold text-foreground/70">
            Loading question...
          </div>
        </Card>
      )}
    </div>
  );
};

export default MultiplayerGame;
