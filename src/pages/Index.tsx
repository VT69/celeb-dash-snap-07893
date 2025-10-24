import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";

const Index = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        navigate("/game");
      }
      setLoading(false);
    });
  }, [navigate]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-2xl animate-pulse">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-primary/20 via-background to-warning/20 relative overflow-hidden">
      
      <div className="relative z-10 text-center space-y-8 max-w-3xl">
        <h1 className="text-7xl md:text-9xl font-black text-foreground animate-fade-in comic-border bg-primary px-8 py-4 inline-block transform hover:rotate-2 transition-transform">
          🍑 GuesstheAss
        </h1>
        
        <p className="text-3xl md:text-4xl text-foreground font-bold animate-wiggle">
          Think you know your celebrities?
        </p>
        
        <p className="text-xl text-foreground/80 max-w-2xl mx-auto animate-fade-in font-semibold">
          Test your knowledge with our WILD guessing game! You have 7 seconds to identify each celebrity from 4 options. Can you get a perfect score? 🎯
        </p>
        
        <div className="flex flex-col sm:flex-row gap-4 justify-center items-center pt-8 animate-fade-in">
          <Button
            onClick={() => navigate("/auth")}
            size="lg"
            className="text-3xl px-16 py-10 bg-primary text-foreground font-black comic-button animate-pop hover:animate-none"
          >
            START PLAYING! 🚀
          </Button>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-12 animate-fade-in">
          <div className="bg-card comic-border p-6 rounded-lg transform hover:scale-105 hover:rotate-2 transition-all">
            <div className="text-6xl mb-3 animate-bounce">⏱️</div>
            <h3 className="text-2xl font-black mb-2">7 Second Challenge</h3>
            <p className="text-foreground/70 font-bold">Quick thinking required!</p>
          </div>
          <div className="bg-card comic-border p-6 rounded-lg transform hover:scale-105 hover:-rotate-2 transition-all">
            <div className="text-6xl mb-3 animate-pulse">🎯</div>
            <h3 className="text-2xl font-black mb-2">4 Options</h3>
            <p className="text-foreground/70 font-bold">Choose wisely!</p>
          </div>
          <div className="bg-card comic-border p-6 rounded-lg transform hover:scale-105 hover:rotate-2 transition-all">
            <div className="text-6xl mb-3 animate-wiggle">🏆</div>
            <h3 className="text-2xl font-black mb-2">Track Your Score</h3>
            <p className="text-foreground/70 font-bold">Compete with friends!</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Index;
