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
      
      <div className="relative z-10 text-center space-y-6 max-w-2xl mx-auto">
        <div className="flex justify-center">
          <h1 className="text-4xl md:text-5xl font-black text-foreground animate-fade-in comic-border bg-primary px-6 py-3 transform hover:rotate-1 transition-transform">
            🍑 GuesstheAss
          </h1>
        </div>
        
        <p className="text-xl md:text-2xl text-foreground font-bold px-4 animate-none motion-reduce:animate-none">
          Think you know your celebrities?
        </p>
        
        <p className="text-base text-foreground/80 max-w-xl mx-auto px-4">
          Test your knowledge! 7 seconds to identify each celebrity from 4 options.
        </p>
        
        <div className="flex justify-center pt-4">
          <Button
            onClick={() => navigate("/auth")}
            size="lg"
            className="text-xl px-12 py-6 bg-primary text-foreground font-black comic-button"
          >
            START PLAYING! 🚀
          </Button>
        </div>
        
        <div className="grid grid-cols-3 gap-4 pt-8 max-w-lg mx-auto">
          <div className="bg-card comic-border p-4 rounded-lg">
            <div className="text-3xl mb-2">⏱️</div>
            <h3 className="text-sm font-bold">7 Seconds</h3>
          </div>
          <div className="bg-card comic-border p-4 rounded-lg">
            <div className="text-3xl mb-2">🎯</div>
            <h3 className="text-sm font-bold">4 Options</h3>
          </div>
          <div className="bg-card comic-border p-4 rounded-lg">
            <div className="text-3xl mb-2">🏆</div>
            <h3 className="text-sm font-bold">Track Score</h3>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Index;
