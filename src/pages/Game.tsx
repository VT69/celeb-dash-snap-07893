import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import GameQuestion from "@/components/game/GameQuestion";
import GameScore from "@/components/game/GameScore";
import GameOver from "@/components/game/GameOver";
import GameModeSelector from "@/components/game/GameModeSelector";
import MultiplayerLobby from "@/components/game/MultiplayerLobby";
import MultiplayerGame from "@/components/game/MultiplayerGame";
import { User } from "@supabase/supabase-js";
const sb = supabase as any;
interface Celebrity {
  id: string;
  name: string;
  image_url: string;
}

const Game = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState<User | null>(null);
  const [celebrities, setCelebrities] = useState<Celebrity[]>([]);
  const [currentQuestion, setCurrentQuestion] = useState<{
    celebrity: Celebrity;
    options: string[];
  } | null>(null);
  const [score, setScore] = useState(0);
  const [questionsAnswered, setQuestionsAnswered] = useState(0);
  const [gameMode, setGameMode] = useState<'classic' | 'rapid' | 'multiplayer' | null>(null);
  const [gameStarted, setGameStarted] = useState(false);
  const [gameOver, setGameOver] = useState(false);
  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [multiplayerRoomId, setMultiplayerRoomId] = useState<string | null>(null);
  const [isMultiplayerHost, setIsMultiplayerHost] = useState(false);
  const [showMultiplayerLobby, setShowMultiplayerLobby] = useState(false);
  const [username, setUsername] = useState<string>("");

  useEffect(() => {
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (!session) {
        navigate("/auth");
      } else {
        setUser(session.user);
        
        const { data: profile } = await sb
          .from("profiles")
          .select("username")
          .eq("id", session.user.id)
          .single();
        
        if (profile) {
          setUsername(profile.username);
        }
      }
      setLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (!session) {
        navigate("/auth");
      } else {
        setUser(session.user);
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  useEffect(() => {
    loadCelebrities();
  }, []);

  const loadCelebrities = async () => {
    const { data, error } = await sb.from("celebrities").select("*");
    if (error) {
      toast.error("Failed to load celebrities");
      return;
    }
    setCelebrities(data || []);
  };

  const generateQuestion = () => {
    if (celebrities.length < 4) {
      toast.error("Not enough celebrities in database");
      return;
    }

    // Filter out the current celebrity to avoid showing the same one twice
    const availableCelebrities = currentQuestion 
      ? celebrities.filter(c => c.id !== currentQuestion.celebrity.id)
      : celebrities;

    const shuffled = [...availableCelebrities].sort(() => Math.random() - 0.5);
    const correctCelebrity = shuffled[0];
    const wrongOptions = shuffled.slice(1, 4).map((c) => c.name);
    const allOptions = [correctCelebrity.name, ...wrongOptions].sort(() => Math.random() - 0.5);

    setCurrentQuestion({
      celebrity: correctCelebrity,
      options: allOptions,
    });
  };

  const handleModeSelect = (mode: 'classic' | 'rapid' | 'multiplayer') => {
    setGameMode(mode);
    if (mode === 'multiplayer') {
      setShowMultiplayerLobby(true);
    } else {
      startGame(mode);
    }
  };

  const startGame = (mode: 'classic' | 'rapid' = 'classic') => {
    setGameMode(mode);
    setGameStarted(true);
    setGameOver(false);
    setScore(0);
    setQuestionsAnswered(0);
    setIsSaving(false);
    generateQuestion();
  };

  const handleMultiplayerStart = (roomId: string, isHost: boolean) => {
    setMultiplayerRoomId(roomId);
    setIsMultiplayerHost(isHost);
    setShowMultiplayerLobby(false);
    setGameStarted(true);
  };

  const handleMultiplayerEnd = async (myScore: number, opponentScore: number) => {
    if (!user) return;

    await sb.from("game_sessions").insert({
      user_id: user.id,
      score: myScore,
      questions_answered: 10,
    });

    const { data: profile } = await sb
      .from("profiles")
      .select("total_score, games_played")
      .eq("id", user.id)
      .single();

    await sb
      .from("profiles")
      .update({
        total_score: (profile?.total_score || 0) + myScore,
        games_played: (profile?.games_played || 0) + 1,
      })
      .eq("id", user.id);

    setScore(myScore);
    setGameOver(true);
    
    if (myScore > opponentScore) {
      toast.success(`You Won! ${myScore} - ${opponentScore} 🏆`);
    } else if (myScore < opponentScore) {
      toast.error(`You Lost! ${myScore} - ${opponentScore} 😢`);
    } else {
      toast("It's a Tie! " + myScore + " - " + opponentScore);
    }
  };

  const resetToModeSelection = () => {
    setGameMode(null);
    setGameStarted(false);
    setGameOver(false);
    setMultiplayerRoomId(null);
    setShowMultiplayerLobby(false);
    setScore(0);
    setQuestionsAnswered(0);
  };

  const handleAnswer = async (selectedAnswer: string, timeElapsed?: number) => {
    if (!currentQuestion || !user || isSaving) return;

    const isCorrect = selectedAnswer === currentQuestion.celebrity.name;
    if (isCorrect) {
      setScore((prev) => prev + 1);
    }

    const newQuestionsAnswered = questionsAnswered + 1;
    setQuestionsAnswered(newQuestionsAnswered);

    if (newQuestionsAnswered >= 10 && !isSaving) {
      setIsSaving(true);
      const finalScore = isCorrect ? score + 1 : score;
      setScore(finalScore);
      await saveGameSession(finalScore);
      setGameOver(true);
      setIsSaving(false);
    } else {
      setTimeout(() => generateQuestion(), 1500);
    }
  };

  const saveGameSession = async (finalScore: number) => {
    if (!user) return;

    const { error } = await sb.from("game_sessions").insert({
      user_id: user.id,
      score: finalScore,
      questions_answered: 10,
    });

    if (error) {
      console.error("Failed to save game session:", error);
    }

    const { data: profile } = await sb
      .from("profiles")
      .select("total_score, games_played")
      .eq("id", user.id)
      .single();

    const { error: updateError } = await sb
      .from("profiles")
      .update({
        total_score: (profile?.total_score || 0) + finalScore,
        games_played: (profile?.games_played || 0) + 1,
      })
      .eq("id", user.id);

    if (updateError) {
      console.error("Failed to update profile:", updateError);
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate("/");
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-2xl animate-pulse">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/20 via-background to-warning/20 relative overflow-hidden">
      <div className="relative z-10 container max-w-4xl mx-auto p-2 sm:p-4 min-h-screen flex flex-col">
        <div className="flex justify-between items-center mb-3 sm:mb-4 w-full gap-2">
          <h1 
            onClick={() => navigate("/")}
            className="text-xl sm:text-2xl md:text-4xl font-black text-foreground comic-border bg-primary px-2 sm:px-4 py-1 sm:py-2 transform hover:rotate-1 transition-transform cursor-pointer hover:scale-105"
          >
            🍑 GuesstheAss
          </h1>
          <Button onClick={handleLogout} className="comic-button bg-secondary text-secondary-foreground font-bold px-3 sm:px-6 py-1.5 sm:py-2 text-xs sm:text-sm">
            Logout
          </Button>
        </div>

        {!gameMode ? (
          <div className="flex-1 flex items-center justify-center">
            <GameModeSelector onSelectMode={handleModeSelect} />
          </div>
        ) : showMultiplayerLobby ? (
          <div className="flex-1 flex items-center justify-center">
            <MultiplayerLobby
              userId={user?.id || ""}
              username={username}
              onGameStart={handleMultiplayerStart}
              onBack={resetToModeSelection}
            />
          </div>
        ) : gameOver ? (
          <div className="flex-1 flex items-center justify-center">
            <GameOver
              finalScore={score}
              totalQuestions={10}
              onReplay={resetToModeSelection}
            />
          </div>
        ) : multiplayerRoomId ? (
          <div className="flex-1 flex flex-col items-center justify-center space-y-6">
            <MultiplayerGame
              roomId={multiplayerRoomId}
              userId={user?.id || ""}
              isHost={isMultiplayerHost}
              celebrities={celebrities}
              onGameEnd={handleMultiplayerEnd}
              onLeave={resetToModeSelection}
            />
          </div>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center space-y-6">
            <GameScore score={score} totalQuestions={questionsAnswered} />
            {currentQuestion && (
              <GameQuestion
                celebrity={currentQuestion.celebrity}
                options={currentQuestion.options}
                onAnswer={handleAnswer}
                timeLimit={gameMode === 'rapid' ? 7 : 10}
              />
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default Game;
