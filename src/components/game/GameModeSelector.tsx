import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

interface GameModeSelectorProps {
  onSelectMode: (mode: 'classic' | 'rapid' | 'multiplayer') => void;
}

const GameModeSelector = ({ onSelectMode }: GameModeSelectorProps) => {
  return (
    <div className="w-full max-w-4xl space-y-8 mx-auto px-4">
      <h2 className="text-5xl md:text-6xl font-black text-center animate-bounce text-foreground">
        Choose Your Mode! 🎮
      </h2>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="comic-border bg-card p-6 hover:scale-105 transition-transform">
          <div className="text-center space-y-4">
            <div className="text-6xl">⏱️</div>
            <h3 className="text-2xl font-black text-foreground">Classic Mode</h3>
            <p className="text-foreground/70 font-bold">
              10 seconds per question
              <br />
              10 rounds of fun!
            </p>
            <Button
              onClick={() => onSelectMode('classic')}
              className="w-full comic-button bg-primary text-foreground font-black text-lg"
              size="lg"
            >
              Play Classic
            </Button>
          </div>
        </Card>

        <Card className="comic-border bg-warning/20 p-6 hover:scale-105 transition-transform">
          <div className="text-center space-y-4">
            <div className="text-6xl">⚡</div>
            <h3 className="text-2xl font-black text-foreground">Rapid Round</h3>
            <p className="text-foreground/70 font-bold">
              Only 7 seconds!
              <br />
              Think FAST! 🔥
            </p>
            <Button
              onClick={() => onSelectMode('rapid')}
              className="w-full comic-button bg-warning text-warning-foreground font-black text-lg"
              size="lg"
            >
              Rapid Fire!
            </Button>
          </div>
        </Card>

        <Card className="comic-border bg-success/20 p-6 hover:scale-105 transition-transform">
          <div className="text-center space-y-4">
            <div className="text-6xl">👥</div>
            <h3 className="text-2xl font-black text-foreground">Multiplayer</h3>
            <p className="text-foreground/70 font-bold">
              Battle a friend!
              <br />
              First correct wins! 🏆
            </p>
            <Button
              onClick={() => onSelectMode('multiplayer')}
              className="w-full comic-button bg-success text-success-foreground font-black text-lg"
              size="lg"
            >
              Multiplayer
            </Button>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default GameModeSelector;
