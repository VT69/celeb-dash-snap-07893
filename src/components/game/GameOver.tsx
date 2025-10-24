import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
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
    const { data, error } = await supabase
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
  const getRankEmoji = (index: number) => {
    if (index === 0) return "🥇";
    if (index === 1) return "🥈";
    if (index === 2) return "🥉";
    return `${index + 1}.`;
  };

  return (
    <div className="w-full max-w-4xl space-y-6 animate-fade-in">
      <Card className="p-10 bg-primary comic-border">
        <div className="text-center space-y-6">
          <Trophy className="w-24 h-24 mx-auto text-foreground animate-bounce" />
          <h2 className="text-6xl font-black text-foreground animate-wiggle">
            GAME OVER! 🎮
          </h2>
          <div className="space-y-3">
            <p className="text-7xl font-black text-foreground animate-pop">
              {finalScore}/{totalQuestions}
            </p>
            <p className="text-3xl font-bold text-foreground/80">
              {percentage}% Accuracy 🎯
            </p>
          </div>
          <Button
            onClick={onReplay}
            size="lg"
            className="text-2xl px-12 py-8 bg-secondary text-secondary-foreground font-black comic-button animate-glow mt-4"
          >
            <RefreshCw className="mr-2 h-6 w-6" />
            PLAY AGAIN! 🔄
          </Button>
        </div>
      </Card>

      <Card className="p-8 bg-card comic-border">
        <h3 className="text-4xl font-black text-center mb-8 text-foreground">
          🏆 TOP PLAYERS 🏆
        </h3>
        <div className="space-y-3">
          {leaderboard.length === 0 ? (
            <p className="text-center text-foreground/70 font-bold text-xl">No scores yet! Be the first! 🚀</p>
          ) : (
            leaderboard.map((entry, index) => (
              <div
                key={index}
                className={`flex items-center justify-between p-5 rounded-lg transition-all comic-border ${
                  index < 3
                    ? "bg-primary transform hover:scale-105"
                    : "bg-card transform hover:scale-105"
                }`}
              >
                <div className="flex items-center gap-4">
                  <span className="text-3xl font-black w-12">
                    {getRankEmoji(index)}
                  </span>
                  <span className="text-xl font-black text-foreground">{entry.username}</span>
                </div>
                <span className="text-3xl font-black text-foreground">
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
