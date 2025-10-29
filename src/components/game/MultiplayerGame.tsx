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
  const [myQuestions, setMyQuestions] = useState<Celebrity[]>([]);
  const [currentQuestion, setCurrentQuestion] = useState<{
    celebrity: Celebrity;
    options: string[];
  } | null>(null);
  const [questionIndex, setQuestionIndex] = useState(0);
  const [gameStarted, setGameStarted] = useState(false);
  const [waitingForPlayers, setWaitingForPlayers] = useState(true);
  const [myTotalScore, setMyTotalScore] = useState(0);
  const [opponentFinished, setOpponentFinished] = useState(false);

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
      if (data.length === 2 && !gameStarted) {
        setWaitingForPlayers(false);
        setTimeout(() => startGame(), 1000);
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
          console.log('Player update:', payload);
          loadPlayers();
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'player_questions',
          filter: `room_id=eq.${roomId}`
        },
        async (payload: any) => {
          // Check if opponent finished
          if (payload.new.user_id !== userId) {
            const { data } = await sb
              .from("player_questions")
              .select("*")
              .eq("room_id", roomId)
              .eq("user_id", payload.new.user_id);
            
            if (data && data.length >= 10) {
              setOpponentFinished(true);
            }
          }
        }
      )
      .subscribe();
  };

  const generateMyQuestions = () => {
    if (celebrities.length < 10) {
      toast.error("Not enough celebrities to start game");
      return [];
    }
    
    // Shuffle and select 10 unique celebrities for this player
    const shuffled = [...celebrities].sort(() => Math.random() - 0.5);
    return shuffled.slice(0, 10);
  };

  const startGame = async () => {
    console.log('Starting game');
    
    if (celebrities.length < 10) {
      toast.error("Not enough celebrities to start game");
      return;
    }
    
    // Generate unique questions for this player
    const questions = generateMyQuestions();
    setMyQuestions(questions);
    
    // Update room status
    if (isHost) {
      await sb
        .from("game_rooms")
        .update({ status: 'playing' })
        .eq("id", roomId);
    }
    
    setGameStarted(true);
    generateQuestion(0, questions);
  };

  const generateQuestion = (index: number, questions: Celebrity[]) => {
    console.log('Generating question for index:', index);
    
    if (index >= 10) {
      checkGameEnd();
      return;
    }

    if (celebrities.length < 4) {
      console.error('Not enough celebrities');
      return;
    }

    const correctCelebrity = questions[index];
    
    // Get 3 random wrong options
    const wrongOptions = celebrities
      .filter(c => c.id !== correctCelebrity.id)
      .sort(() => Math.random() - 0.5)
      .slice(0, 3)
      .map(c => c.name);
    
    const allOptions = [correctCelebrity.name, ...wrongOptions].sort(() => Math.random() - 0.5);

    console.log('Setting question:', correctCelebrity.name);
    
    setCurrentQuestion({
      celebrity: correctCelebrity,
      options: allOptions,
    });
    setQuestionIndex(index);
  };

  const calculatePoints = (timeElapsed: number, isCorrect: boolean): number => {
    if (!isCorrect) return 0;
    
    // Maximum 1000 points for instant answer, minimum 100 points if answered within time limit
    // 7 seconds = 7000ms
    const maxTime = 7000;
    const basePoints = 100;
    const bonusPoints = 900;
    
    const timeRatio = Math.max(0, (maxTime - timeElapsed) / maxTime);
    const points = Math.round(basePoints + (bonusPoints * timeRatio));
    
    return points;
  };

  const handleAnswer = async (selectedAnswer: string, timeElapsed: number) => {
    if (!currentQuestion) return;

    const isCorrect = selectedAnswer === currentQuestion.celebrity.name;
    const points = calculatePoints(timeElapsed, isCorrect);
    
    // Save question result
    await sb
      .from("player_questions")
      .insert({
        room_id: roomId,
        user_id: userId,
        question_index: questionIndex,
        celebrity_id: currentQuestion.celebrity.id,
        answer_time_ms: timeElapsed,
        is_correct: isCorrect,
        points_earned: points
      });

    // Update total score
    const newTotalScore = myTotalScore + points;
    setMyTotalScore(newTotalScore);
    
    await sb
      .from("room_players")
      .update({ score: newTotalScore })
      .eq("room_id", roomId)
      .eq("user_id", userId);

    // Move to next question
    const nextIndex = questionIndex + 1;
    if (nextIndex >= 10) {
      await checkGameEnd();
    } else {
      setTimeout(() => {
        generateQuestion(nextIndex, myQuestions);
      }, 1500);
    }
  };

  const checkGameEnd = async () => {
    // Check if both players finished
    const { data } = await sb
      .from("player_questions")
      .select("user_id")
      .eq("room_id", roomId);
    
    if (!data) return;
    
    // Count questions per player
    const questionCounts = data.reduce((acc: any, q: any) => {
      acc[q.user_id] = (acc[q.user_id] || 0) + 1;
      return acc;
    }, {});
    
    // Check if both players have 10 questions
    const playerIds = Object.keys(questionCounts);
    const bothFinished = playerIds.length === 2 && 
                        questionCounts[playerIds[0]] >= 10 && 
                        questionCounts[playerIds[1]] >= 10;
    
    if (bothFinished) {
      await endGame();
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

  if (questionIndex >= 10) {
    return (
      <div className="w-full max-w-2xl space-y-6">
        <Card className="comic-border bg-card p-8 text-center space-y-6">
          <h2 className="text-4xl font-black text-foreground">
            {opponentFinished ? 'Game Complete! 🎉' : 'Waiting for opponent to finish... ⏳'}
          </h2>
          <div className="text-6xl animate-bounce">
            {opponentFinished ? '🏁' : '⏰'}
          </div>
          <p className="text-xl font-bold text-foreground/70">
            Your Score: {myTotalScore}
          </p>
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
