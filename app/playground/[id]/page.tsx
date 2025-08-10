"use client";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useUsername } from "@/hooks/useUsername";
import { useParams, useRouter } from "next/navigation";
import React from "react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  AlignRight,
  Play,
  Settings,
  LogOut,
  ClipboardList,
} from "lucide-react";
import { useMutation, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Doc } from "@/convex/_generated/dataModel";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import toast from "react-hot-toast";
import AnswersForm from "@/components/forms/AnswersForm";
import { useGameLetter } from "@/hooks/useGameLetter";
import GameEndModal from "@/components/modals/GameEndModal";
import AnimatedTimer from "@/components/ui/animated-timer";

export default function Page() {
  const params = useParams();
  const router = useRouter();
  const { username } = useUsername();
  const playgroundData = useQuery(api.playground.playground, {
    code: params.id as string,
  });
  const [gameEndModalOpen, setGameEndModalOpen] = React.useState(false);
  const [previousStatus, setPreviousStatus] = React.useState<string | null>(
    null,
  );

  // Check for showModal query parameter
  React.useEffect(() => {
    if (typeof window !== "undefined") {
      const urlParams = new URLSearchParams(window.location.search);
      if (
        urlParams.get("showModal") === "true" &&
        playgroundData?.status === "finished"
      ) {
        setGameEndModalOpen(true);
        // Clean up the URL
        window.history.replaceState({}, "", window.location.pathname);
      }
    }
  }, [playgroundData?.status]);

  const leavePlayground = useMutation(api.playground.leavePlayground);

  const handleLeavePlayground = async () => {
    if (!username || !playgroundData) return;

    try {
      console.log(
        `Attempting to leave playground: ${playgroundData.code} as ${username}`,
      );
      const result = await toast.promise(
        leavePlayground({
          username: username as string,
          code: playgroundData.code,
        }),
        {
          loading: "Leaving playground...",
          success: "Left playground successfully",
          error: "Failed to leave playground",
        },
      );
      console.log("Leave playground result:", result);
      router.push("/");
    } catch (error) {
      console.error("Error leaving playground:", error);
      // Still redirect even if the mutation fails
      router.push("/");
    }
  };

  // Get current player's score
  const playerScore = useQuery(
    api.game.getPlayerScore,
    username && params.id
      ? {
          code: params.id as string,
          username: username as string,
        }
      : "skip",
  );

  const id = params?.id as string;

  // Check if game ended or restarted - only show modal when last round is finished
  React.useEffect(() => {
    if (playgroundData?.status) {
      if (
        playgroundData.status === "finished" &&
        playgroundData.currentRound === playgroundData.rounds &&
        previousStatus === "playing"
      ) {
        setGameEndModalOpen(true);
      } else if (
        playgroundData.status === "playing" &&
        previousStatus === "finished"
      ) {
        // Close modal when game restarts
        setGameEndModalOpen(false);
      }
      setPreviousStatus(playgroundData.status);
    }
  }, [
    playgroundData?.status,
    playgroundData?.currentRound,
    playgroundData?.rounds,
    previousStatus,
  ]);

  return (
    <main className="">
      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-4 gap-4">
          {/* Leaderboard - Moved to top */}
          <LeaderboardCard
            playgroundData={playgroundData as Doc<"playgrounds">}
          />
          {/* User Card */}
          <Card className="col-span-4 py-2 md:col-start-1 md:col-end-4">
            <CardContent className="flex w-full items-center justify-between px-4">
              <p className="font-semibold">{username}</p>
              <p className="text-xs text-neutral-300">
                {playgroundData?.status}
              </p>
              <div className="flex items-center gap-4">
                <p>
                  score{" "}
                  <span className="font-bold text-yellow-500">
                    {playerScore?.score || 0}
                  </span>
                </p>
                <Popover>
                  <PopoverTrigger className="group cursor-pointer">
                    <Settings className="group-hover:spin-in h-5 w-5 text-black transition-all" />
                  </PopoverTrigger>
                  <PopoverContent className="w-48">
                    <div className="flex flex-col gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={handleLeavePlayground}
                        className="justify-start gap-2 text-red-600 hover:bg-red-50 hover:text-red-700"
                      >
                        <LogOut className="h-4 w-4" />
                        Leave Playground
                      </Button>
                    </div>
                  </PopoverContent>
                </Popover>
              </div>
            </CardContent>
          </Card>

          {/* Playground Card */}
          <PlaygroundDetails
            id={id}
            playgroundData={playgroundData as Doc<"playgrounds">}
          />

          {/* Fields */}
          <GameUI playgroundData={playgroundData as Doc<"playgrounds">} />
        </div>
      </div>

      {/* Game End Modal */}
      {playgroundData && (
        <GameEndModal
          isOpen={gameEndModalOpen}
          onClose={() => setGameEndModalOpen(false)}
          finalRound={playgroundData.currentRound}
          totalRounds={playgroundData.rounds}
          playgroundCode={playgroundData.code}
        />
      )}
    </main>
  );
}

function LeaderboardCard({
  playgroundData,
}: {
  playgroundData: Doc<"playgrounds">;
}) {
  const leaderboard = useQuery(
    api.game.getPlaygroundLeaderboard,
    playgroundData ? { code: playgroundData.code } : "skip",
  );

  return (
    <Card className="hidden md:col-start-4 md:col-end-5 md:row-span-3 md:row-start-1 md:inline-block">
      <CardHeader>
        <CardTitle>Leaderboard</CardTitle>
      </CardHeader>
      <CardContent className="mt-1">
        <div className="flex flex-col gap-1">
          {leaderboard && leaderboard.length > 0 ? (
            leaderboard.map((player, index) => (
              <div
                className="flex items-center justify-between"
                key={player.username}
              >
                <div className="flex items-center gap-2">
                  <span className="text-xs text-gray-500">#{index + 1}</span>
                  <span className="text-sm">{player.username}</span>
                </div>
                <span className="font-semibold text-yellow-500">
                  {player.score}
                </span>
              </div>
            ))
          ) : (
            <div className="text-sm text-gray-500">No players yet</div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

function PlaygroundDetails({
  id,
  playgroundData,
}: {
  id: string;
  playgroundData: Doc<"playgrounds">;
}) {
  const playgroundId = id;
  const game = useMutation(api.game.startGame);
  const [timeLeft, setTimeLeft] = React.useState<number | null>(null);
  const { isPlaying } = useGameLetter();

  // Get leaderboard for mobile popover
  const leaderboard = useQuery(
    api.game.getPlaygroundLeaderboard,
    playgroundData ? { code: playgroundData.code } : "skip",
  );

  const startGame = async () => {
    try {
      await toast.promise(game({ playgroundId: playgroundData._id }), {
        loading: "Starting game..",
        success: "The game has started",
        error: "Failed to start game",
      });
    } catch (error) {
      console.error("Error starting game:", error);
    }
  };

  // Countdown - reset timer when round changes
  React.useEffect(() => {
    if (!playgroundData?.timer || !isPlaying) return;

    setTimeLeft(playgroundData.timer);
    const interval = setInterval(() => {
      setTimeLeft((prev) => {
        if (!prev || prev <= 1) {
          clearInterval(interval);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [playgroundData?.timer, playgroundData?.currentRound, isPlaying]);

  return (
    <div className="col-span-4 flex w-full items-center justify-between md:col-span-3">
      <div className="flex flex-col gap-1">
        <h3 className="text-sm font-medium text-neutral-500 md:text-lg">
          Time: <AnimatedTimer seconds={timeLeft} />
        </h3>
        {playgroundData && isPlaying && (
          <p className="text-xs text-neutral-400">
            Round {playgroundData.currentRound} of {playgroundData.rounds}
          </p>
        )}
      </div>
      {/* Alert to start the game */}
      <AlertDialog>
        <AlertDialogTrigger asChild>
          <Button
            size={"icon"}
            variant={"ghost"}
            className="hover:bg-primary/10"
          >
            <Play className="h-5 w-5 text-green-500" />
          </Button>
        </AlertDialogTrigger>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="text-center">
              Do you want to{" "}
              {playgroundData?.status === "waiting"
                ? "start"
                : playgroundData?.status === "finished"
                  ? "restart"
                  : "end"}{" "}
              the game?
            </AlertDialogTitle>
          </AlertDialogHeader>
          <AlertDialogFooter className="sm:justify-center">
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={startGame}>Continue</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <div className="aligen-center flex gap-4">
        <p className="text-sm text-neutral-400">
          Playground:
          <span
            className="inline-flex cursor-pointer items-center"
            onClick={() => handleCopyValue(playgroundId)}
          >
            {playgroundId}
            <ClipboardList className="ml-1 inline h-4 w-4" />
          </span>
        </p>
        {/* Mobile leaderboard */}
        <Popover>
          <PopoverTrigger className="group cursor-pointer md:hidden">
            <AlignRight className="group-hover:spin-in h-5 w-5 text-neutral-400 transition-all" />
          </PopoverTrigger>
          <PopoverContent>
            <h3 className="mb-2 font-medium">Leaderboard</h3>
            <div className="flex flex-col gap-1">
              {leaderboard && leaderboard.length > 0 ? (
                leaderboard.map((player, index) => (
                  <div
                    className="flex items-center justify-between"
                    key={player.username}
                  >
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-gray-500">
                        #{index + 1}
                      </span>
                      <span className="text-sm">{player.username}</span>
                    </div>
                    <span className="font-semibold text-yellow-500">
                      {player.score}
                    </span>
                  </div>
                ))
              ) : (
                <div className="text-sm text-gray-500">No players yet</div>
              )}
            </div>
          </PopoverContent>
        </Popover>
      </div>
    </div>
  );
}

function GameUI({ playgroundData }: { playgroundData: Doc<"playgrounds"> }) {
  const { letter } = useGameLetter();
  return (
    <Card className="-lg col-span-4 md:col-start-1 md:col-end-4">
      <CardHeader className="text-center">
        <CardTitle>The letter which all names need to start is:</CardTitle>
        <CardDescription className="text-lg text-indigo-700">
          {letter}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <AnswersForm playgroundData={playgroundData} />
      </CardContent>
    </Card>
  );
}

// Copies a value to clipboard and shows a toast for success or failure
function handleCopyValue(value: string) {
  if (!navigator?.clipboard) {
    toast.error("Clipboard not supported");
    return;
  }
  navigator.clipboard
    .writeText(value)
    .then(() => {
      toast.success("Copied to clipboard!");
    })
    .catch(() => {
      toast.error("Failed to copy");
    });
}
