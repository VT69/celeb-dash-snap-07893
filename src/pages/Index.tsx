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
    <div className="min-h-screen flex items-center justify-center p-2 sm:p-4 bg-gradient-to-br from-primary/20 via-background to-warning/20 relative overflow-hidden">
      
      <div className="relative z-10 text-center space-y-4 sm:space-y-6 max-w-2xl mx-auto">
        <div className="flex justify-center">
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-black text-foreground animate-fade-in comic-border bg-primary px-4 sm:px-6 py-2 sm:py-3 transform hover:rotate-1 transition-transform">
            🍑 GuesstheAss
          </h1>
        </div>
        
        <p className="text-lg sm:text-xl md:text-2xl text-foreground font-bold px-2 sm:px-4 animate-none motion-reduce:animate-none">
          Think you know your celebrities ASSwellASS you think?
        </p>
        
        <p className="text-sm sm:text-base text-foreground/80 max-w-xl mx-auto px-2 sm:px-4">
          Can you identify the celebrity behind? 7 cheeky seconds, 4 scandalous options! 🍑
        </p>
        
        <div className="flex justify-center pt-2 sm:pt-4">
          <Button
            onClick={() => navigate("/auth")}
            size="lg"
            className="text-base sm:text-lg md:text-xl px-6 sm:px-10 md:px-12 py-4 sm:py-5 md:py-6 bg-primary text-foreground font-black comic-button"
          >
            START PLAYING! 🚀
          </Button>
        </div>
        
        <div className="grid grid-cols-3 gap-2 sm:gap-4 pt-4 sm:pt-8 max-w-lg mx-auto px-2">
          <div className="bg-card comic-border p-2 sm:p-4 rounded-lg">
            <div className="text-2xl sm:text-3xl mb-1 sm:mb-2">⏱️</div>
            <h3 className="text-xs sm:text-sm font-bold">7 Seconds</h3>
          </div>
          <div className="bg-card comic-border p-2 sm:p-4 rounded-lg">
            <div className="text-2xl sm:text-3xl mb-1 sm:mb-2">🎯</div>
            <h3 className="text-xs sm:text-sm font-bold">4 Options</h3>
          </div>
          <div className="bg-card comic-border p-2 sm:p-4 rounded-lg">
            <div className="text-2xl sm:text-3xl mb-1 sm:mb-2">🏆</div>
            <h3 className="text-xs sm:text-sm font-bold">Track Score</h3>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Index;
