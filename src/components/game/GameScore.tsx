import { Card } from "@/components/ui/card";

interface GameScoreProps {
  score: number;
  totalQuestions: number;
}

const GameScore = ({ score, totalQuestions }: GameScoreProps) => {
  return (
    <div className="flex justify-center w-full px-2">
      <Card className="px-3 sm:px-6 py-2 sm:py-3 bg-primary comic-border animate-pop">
        <div className="flex items-center gap-2 sm:gap-4">
          <div className="text-center min-w-[60px] sm:min-w-[80px]">
            <div className="text-2xl sm:text-3xl font-black text-foreground animate-bounce">{score}</div>
            <div className="text-xs font-bold text-foreground/80">Score 🎯</div>
          </div>
          <div className="h-10 sm:h-12 w-1 bg-foreground" />
          <div className="text-center min-w-[60px] sm:min-w-[80px]">
            <div className="text-2xl sm:text-3xl font-black text-foreground">{totalQuestions}/10</div>
            <div className="text-xs font-bold text-foreground/80">Progress 📊</div>
          </div>
        </div>
      </Card>
    </div>
  );
};

export default GameScore;
