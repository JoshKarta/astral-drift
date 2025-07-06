"use client";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Trophy, Home, RotateCcw } from "lucide-react";
import { useRouter } from "next/navigation";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Doc } from "@/convex/_generated/dataModel";
import toast from "react-hot-toast";

interface GameEndModalProps {
  isOpen: boolean;
  onClose: () => void;
  finalRound: number;
  totalRounds: number;
  playgroundCode: string;
}

function LeaderboardInModal({ playgroundCode }: { playgroundCode: string }) {
  const leaderboard = useQuery(
    api.game.getPlaygroundLeaderboard,
    playgroundCode ? { code: playgroundCode } : "skip",
  );

  return (
    <div className="rounded-lg bg-gray-50 p-4 text-center">
      <p className="mb-2 text-sm text-gray-600">Leaderboard</p>
      {leaderboard && leaderboard.length > 0 ? (
        leaderboard.map((player, index) => (
          <div
            key={player.username}
            className="flex items-center justify-between py-1"
          >
            <span className="text-xs text-gray-500">#{index + 1}</span>
            <span className="ml-2 flex-1 text-left text-sm">
              {player.username}
            </span>
            <span className="font-semibold text-indigo-400">
              {player.score}
            </span>
          </div>
        ))
      ) : (
        <div className="text-sm text-gray-500">No players yet</div>
      )}
    </div>
  );
}

export default function GameEndModal({
  isOpen,
  onClose,
  finalRound,
  totalRounds,
  playgroundCode,
}: GameEndModalProps) {
  const router = useRouter();
  const resetAndRestart = useMutation(api.game.resetGameAndRestart);

  const handleGoHome = () => {
    router.push("/");
    onClose();
  };

  const handlePlayAgain = async () => {
    try {
      await toast.promise(resetAndRestart({ code: playgroundCode }), {
        loading: "Restarting game...",
        success: "Game restarted! Get ready for round 1!",
        error: "Failed to restart game",
      });
      onClose();
    } catch (error) {
      console.error("Error restarting game:", error);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader className="text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-yellow-100">
            <Trophy className="h-8 w-8 text-yellow-600" />
          </div>
          <DialogTitle className="text-center text-2xl font-bold">
            Game Completed!
          </DialogTitle>
          <DialogDescription className="text-center text-lg">
            You've completed all {totalRounds} rounds!
          </DialogDescription>
        </DialogHeader>

        <div className="mt-6 space-y-4">
          {/* Leaderboard display instead of rounds */}
          <LeaderboardInModal playgroundCode={playgroundCode} />

          <div className="flex flex-col gap-2">
            <Button onClick={handlePlayAgain} className="w-full">
              <RotateCcw className="mr-2 h-4 w-4" />
              Play Again
            </Button>
            <Button variant="outline" onClick={handleGoHome} className="w-full">
              <Home className="mr-2 h-4 w-4" />
              Go to Home
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
