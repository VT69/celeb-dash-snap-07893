import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface MultiplayerLobbyProps {
  userId: string;
  username: string;
  onGameStart: (roomId: string, isHost: boolean) => void;
  onBack: () => void;
}

const MultiplayerLobby = ({ userId, username, onGameStart, onBack }: MultiplayerLobbyProps) => {
  const [roomCode, setRoomCode] = useState("");
  const [isCreating, setIsCreating] = useState(false);
  const [isJoining, setIsJoining] = useState(false);

  const generateRoomCode = () => {
    return Math.random().toString(36).substring(2, 8).toUpperCase();
  };

  const createRoom = async () => {
    setIsCreating(true);
    try {
      const newRoomCode = generateRoomCode();
      
      const { data: room, error: roomError } = await supabase
        .from("game_rooms")
        .insert({
          room_code: newRoomCode,
          host_id: userId,
          status: 'waiting'
        })
        .select()
        .single();

      if (roomError) throw roomError;

      const { error: playerError } = await supabase
        .from("room_players")
        .insert({
          room_id: room.id,
          user_id: userId,
          username: username,
          ready: true
        });

      if (playerError) throw playerError;

      toast.success(`Room created! Code: ${newRoomCode}`);
      onGameStart(room.id, true);
    } catch (error) {
      console.error("Error creating room:", error);
      toast.error("Failed to create room");
    } finally {
      setIsCreating(false);
    }
  };

  const joinRoom = async () => {
    if (!roomCode.trim()) {
      toast.error("Please enter a room code");
      return;
    }

    setIsJoining(true);
    try {
      const { data: room, error: roomError } = await supabase
        .from("game_rooms")
        .select("*")
        .eq("room_code", roomCode.toUpperCase())
        .eq("status", "waiting")
        .single();

      if (roomError || !room) {
        toast.error("Room not found or already started");
        setIsJoining(false);
        return;
      }

      const { data: existingPlayers } = await supabase
        .from("room_players")
        .select("*")
        .eq("room_id", room.id);

      if (existingPlayers && existingPlayers.length >= 2) {
        toast.error("Room is full");
        setIsJoining(false);
        return;
      }

      // Check if this user is already in the room
      const alreadyInRoom = existingPlayers?.some(p => p.user_id === userId);
      if (alreadyInRoom) {
        toast.error("You're already in this room!");
        setIsJoining(false);
        return;
      }

      const { error: playerError } = await supabase
        .from("room_players")
        .insert({
          room_id: room.id,
          user_id: userId,
          username: username,
          ready: true
        });

      if (playerError) throw playerError;

      toast.success("Joined room successfully!");
      onGameStart(room.id, false);
    } catch (error) {
      console.error("Error joining room:", error);
      toast.error("Failed to join room");
    } finally {
      setIsJoining(false);
    }
  };

  return (
    <div className="w-full max-w-2xl space-y-8">
      <Button
        onClick={onBack}
        variant="outline"
        className="comic-button"
      >
        ← Back to Modes
      </Button>

      <Card className="comic-border bg-card p-8 space-y-6">
        <h2 className="text-4xl font-black text-center text-foreground">
          Multiplayer Lobby 👥
        </h2>

        <div className="space-y-4">
          <div className="text-center space-y-4">
            <p className="text-xl font-bold text-foreground/80">
              Create a new room or join existing one
            </p>
            
            <Button
              onClick={createRoom}
              disabled={isCreating}
              size="lg"
              className="w-full comic-button bg-success text-success-foreground font-black text-xl"
            >
              {isCreating ? "Creating..." : "Create Room 🎮"}
            </Button>
          </div>

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t border-foreground/20" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-card px-2 text-foreground/60 font-bold">OR</span>
            </div>
          </div>

          <div className="space-y-3">
            <Input
              placeholder="Enter Room Code"
              value={roomCode}
              onChange={(e) => setRoomCode(e.target.value.toUpperCase())}
              className="text-center text-2xl font-black comic-border"
              maxLength={6}
            />
            <Button
              onClick={joinRoom}
              disabled={isJoining || !roomCode.trim()}
              size="lg"
              className="w-full comic-button bg-primary text-foreground font-black text-xl"
            >
              {isJoining ? "Joining..." : "Join Room 🚪"}
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
};

export default MultiplayerLobby;
