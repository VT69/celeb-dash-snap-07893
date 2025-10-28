import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
const sb = supabase as any;
import { Trophy, RefreshCw } from "lucide-react";

interface GameOverProps {
  finalScore: number;
  totalQuestions: number;
  onReplay: () => void;
}

interface LeaderboardEntry {
  username: string;
  score: number;
  completed_at: string;
}

const GameOver = ({ finalScore, totalQuestions, onReplay }: GameOverProps) => {
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);

  useEffect(() => {
    loadLeaderboard();
  }, []);

  const loadLeaderboard = async () => {
    const { data, error } = await sb
      .from("game_sessions")
      .select(`
        score,
        completed_at,
        profiles (username)
      `)
      .order("score", { ascending: false })
      .order("completed_at", { ascending: true })
      .limit(10);

    if (!error && data) {
      const leaderboardData = data.map((entry: any) => ({
        username: entry.profiles?.username || "Anonymous",
        score: entry.score,
        completed_at: entry.completed_at,
      }));
      setLeaderboard(leaderboardData);
    }
  };

  const percentage = Math.round((finalScore / totalQuestions) * 100);
  
  const getWittyMessage = (score: number) => {
    if (score === 10) return "Perfect! You know your celebs like the back of your hand! 🌟";
    if (score >= 8) return "You know your stars well! Hollywood would be proud! 🎬";
    if (score >= 6) return "Not bad! You've got some celeb knowledge! ⭐";
    if (score >= 4) return "Getting there! Time to binge some celebrity news! 📰";
    return "Keep practicing! Even paparazzi miss sometimes! 📸";
  };
  
  const getRankEmoji = (index: number) => {
    if (index === 0) return "🥇";
    if (index === 1) return "🥈";
    if (index === 2) return "🥉";
    return `${index + 1}.`;
  };

  return (
    <div className="w-full max-w-4xl space-y-4 sm:space-y-6 animate-fade-in px-2">
      <Card className="p-4 sm:p-8 md:p-10 bg-primary comic-border">
        <div className="text-center space-y-3 sm:space-y-6">
          <Trophy className="w-16 h-16 sm:w-20 sm:h-20 md:w-24 md:h-24 mx-auto text-foreground animate-bounce" />
          <h2 className="text-3xl sm:text-4xl md:text-6xl font-black text-foreground animate-wiggle">
            GAME OVER! 🎮
          </h2>
          <div className="space-y-2 sm:space-y-3">
            <p className="text-4xl sm:text-5xl md:text-7xl font-black text-foreground animate-pop">
              {finalScore}/{totalQuestions}
            </p>
            <p className="text-xl sm:text-2xl md:text-3xl font-bold text-foreground/80">
              {percentage}% Accuracy 🎯
            </p>
            <p className="text-base sm:text-xl md:text-2xl font-bold text-foreground/90 mt-2 sm:mt-4 animate-fade-in px-2">
              {getWittyMessage(finalScore)}
            </p>
          </div>
          <Button
            onClick={onReplay}
            size="lg"
            className="text-base sm:text-xl md:text-2xl px-6 sm:px-10 md:px-12 py-4 sm:py-6 md:py-8 bg-secondary text-secondary-foreground font-black comic-button animate-glow mt-2 sm:mt-4"
          >
            <RefreshCw className="mr-2 h-4 w-4 sm:h-5 sm:w-5 md:h-6 md:w-6" />
            PLAY AGAIN! 🔄
          </Button>
        </div>
      </Card>

      <Card className="p-4 sm:p-6 md:p-8 bg-card comic-border">
        <h3 className="text-2xl sm:text-3xl md:text-4xl font-black text-center mb-4 sm:mb-6 md:mb-8 text-foreground">
          🏆 TOP PLAYERS 🏆
        </h3>
        <div className="space-y-2 sm:space-y-3">
          {leaderboard.length === 0 ? (
            <p className="text-center text-foreground/70 font-bold text-base sm:text-lg md:text-xl">No scores yet! Be the first! 🚀</p>
          ) : (
            leaderboard.map((entry, index) => (
              <div
                key={index}
                className={`flex items-center justify-between p-3 sm:p-4 md:p-5 rounded-lg transition-all comic-border ${
                  index < 3
                    ? "bg-primary transform hover:scale-105"
                    : "bg-card transform hover:scale-105"
                }`}
              >
                <div className="flex items-center gap-2 sm:gap-3 md:gap-4 min-w-0 flex-1">
                  <span className="text-xl sm:text-2xl md:text-3xl font-black w-8 sm:w-10 md:w-12 flex-shrink-0">
                    {getRankEmoji(index)}
                  </span>
                  <span className="text-sm sm:text-lg md:text-xl font-black text-foreground truncate">{entry.username}</span>
                </div>
                <span className="text-xl sm:text-2xl md:text-3xl font-black text-foreground flex-shrink-0">
                  {entry.score}/10
                </span>
              </div>
            ))
          )}
        </div>
      </Card>
    </div>
  );
};

export default GameOver;
