import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

interface GameQuestionProps {
  celebrity: {
    id: string;
    name: string;
    image_url: string;
  };
  options: string[];
  onAnswer: (answer: string) => void;
  timeLimit?: number;
}

const GameQuestion = ({ celebrity, options, onAnswer, timeLimit = 15 }: GameQuestionProps) => {
  const [timeLeft, setTimeLeft] = useState(timeLimit);
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);

  useEffect(() => {
    setTimeLeft(timeLimit);
    setSelectedAnswer(null);
  }, [celebrity.id, timeLimit]);

  useEffect(() => {
    if (timeLeft === 0 && !selectedAnswer) {
      onAnswer("");
      return;
    }

    if (selectedAnswer) return;

    const timer = setInterval(() => {
      setTimeLeft((prev) => prev - 1);
    }, 1000);

    return () => clearInterval(timer);
  }, [timeLeft, selectedAnswer, onAnswer]);

  const handleAnswer = (answer: string) => {
    if (selectedAnswer) return;
    setSelectedAnswer(answer);
    onAnswer(answer);
  };

  const getTimerColor = () => {
    if (timeLeft > 4) return "text-success";
    if (timeLeft > 2) return "text-warning";
    return "text-destructive";
  };

  return (
    <div className="w-full max-w-2xl space-y-6 animate-fade-in">
      <div className="flex justify-center">
        <div className="text-center comic-border bg-card p-6 rounded-lg">
          <div className={`text-8xl font-black ${getTimerColor()} transition-all ${timeLeft <= 3 ? 'animate-shake' : 'animate-pulse'}`}>
            {timeLeft}
          </div>
          <p className="text-foreground/70 mt-2 font-bold text-lg">seconds remaining ⏰</p>
        </div>
      </div>

      <Card className="overflow-hidden comic-border bg-card rounded-lg transform hover:scale-105 transition-transform">
        <div className="aspect-square w-full bg-muted">
          <img
            src={celebrity.image_url}
            alt="Celebrity"
            className="w-full h-full object-cover"
          />
        </div>
      </Card>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {options.map((option, index) => (
          <Button
            key={index}
            onClick={() => handleAnswer(option)}
            disabled={!!selectedAnswer}
            size="lg"
            className={`text-xl font-black py-8 transition-all comic-button ${
              selectedAnswer === option
                ? option === celebrity.name
                  ? "bg-success text-success-foreground animate-pop"
                  : "bg-destructive text-destructive-foreground animate-shake"
                : "bg-primary text-foreground hover:bg-warning"
            }`}
          >
            {option}
          </Button>
        ))}
      </div>
    </div>
  );
};

export default GameQuestion;
