"use client";
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useUsername } from "@/hooks/useUsername";
import { useParams } from "next/navigation";
import React from "react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { AlignRight, Play, Settings } from "lucide-react";
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

export default function Page() {
  const params = useParams();
  const { username } = useUsername();
  const playgroundData = useQuery(api.playground.playground, {
    code: params.id as string,
  });
  const [gameEndModalOpen, setGameEndModalOpen] = React.useState(false);

  const id = params?.id as string;

  // Check if game ended
  React.useEffect(() => {
    if (playgroundData?.status === "finished") {
      setGameEndModalOpen(true);
    }
  }, [playgroundData?.status]);

  return (
    <main className="">
      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-4 gap-4">
          {/* Leaderboard - Moved to top */}
          <LeaderboardCard
            playgroundData={playgroundData as Doc<"playgrounds">}
          />
          {/* User Card */}
          <Card className="col-span-4 rounded-md py-2 md:col-start-1 md:col-end-4">
            <CardContent className="flex w-full items-center justify-between px-4">
              <p className="font-semibold">{username}</p>
              <p className="text-xs text-neutral-300">
                {playgroundData?.status}
              </p>
              <div className="flex items-center gap-4">
                <p>
                  score <span className="font-bold text-indigo-500">0</span>
                </p>
                <Popover>
                  <PopoverTrigger className="group cursor-pointer">
                    <Settings className="group-hover:spin-in h-5 w-5 text-black transition-all" />
                  </PopoverTrigger>
                  <PopoverContent>
                    Place content for the popover here.
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
  return (
    <Card className="hidden rounded-md md:col-start-4 md:col-end-5 md:row-span-3 md:row-start-1 md:inline-block">
      <CardHeader>
        <CardTitle>Leaderboard</CardTitle>
      </CardHeader>
      <CardContent className="mt-1">
        <div className="flex flex-col gap-1">
          {playgroundData &&
            playgroundData.playerIds.map((item) => (
              <div className="flex items-center justify-between" key={item}>
                <span className="text-sm">{item}</span>
                <span className="text-indigo-400">p</span>
              </div>
            ))}
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
          Time left: {timeLeft}sec
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
          <Button size={"icon"} variant={"ghost"}>
            <Play className="h-5 w-5 text-green-500" />
          </Button>
        </AlertDialogTrigger>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="text-center">
              Do you want to{" "}
              {playgroundData?.status === "waiting" ? "start" : "end"} the game?
            </AlertDialogTitle>
          </AlertDialogHeader>
          <AlertDialogFooter className="sm:justify-center">
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={startGame}>Continue</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <div className="aligen-center flex gap-4">
        <p className="text-sm text-neutral-300 md:text-lg">
          Playground Code:
          <span>{playgroundId}</span>
        </p>
        {/* Mobile leaderboard */}
        <Popover>
          <PopoverTrigger className="group cursor-pointer md:hidden">
            <AlignRight className="group-hover:spin-in h-5 w-5 text-neutral-400 transition-all" />
          </PopoverTrigger>
          <PopoverContent>
            <h3 className="font-medium">Leaderboard</h3>
            {playgroundData &&
              playgroundData.playerIds.map((item) => (
                <div className="flex items-center justify-between" key={item}>
                  <span className="text-sm">{item}</span>
                  <span className="text-indigo-400">p</span>
                </div>
              ))}
          </PopoverContent>
        </Popover>
      </div>
    </div>
  );
}

function GameUI({ playgroundData }: { playgroundData: Doc<"playgrounds"> }) {
  const { letter } = useGameLetter();
  return (
    <Card className="col-span-4 rounded-lg md:col-start-1 md:col-end-4">
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
