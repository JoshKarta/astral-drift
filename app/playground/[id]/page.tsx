"use client";

import React, { useState, useEffect } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { useMutation, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Doc } from "@/convex/_generated/dataModel";
import { useUsername } from "@/hooks/useUsername";
import { useGameLetter } from "@/hooks/useGameLetter";
import toast from "react-hot-toast";

import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
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

import AnswersForm from "@/components/forms/AnswersForm";
import AnswersFormForDummy from "@/components/forms/AnswerFormForDummy";
import GameEndModal from "@/components/modals/GameEndModal";
import AnimatedTimer from "@/components/ui/animated-timer";

import {
  Play,
  RotateCcw,
  Settings,
  LogOut,
  Copy,
  Check,
  Trophy,
  Users,
  ChevronDown,
  ArrowLeft,
  Sparkles,
} from "lucide-react";

export default function Page() {
  const params = useParams();
  const router = useRouter();
  const { username } = useUsername();
  const playgroundCode = params.id as string;

  const playgroundData = useQuery(api.playground.playground, {
    code: playgroundCode,
  });

  const [gameEndModalOpen, setGameEndModalOpen] = useState(false);
  const [previousStatus, setPreviousStatus] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  // Check for showModal query parameter
  useEffect(() => {
    if (typeof window !== "undefined") {
      const urlParams = new URLSearchParams(window.location.search);
      if (
        urlParams.get("showModal") === "true" &&
        playgroundData?.status === "finished"
      ) {
        setGameEndModalOpen(true);
        window.history.replaceState({}, "", window.location.pathname);
      }
    }
  }, [playgroundData?.status]);

  const leavePlayground = useMutation(api.playground.leavePlayground);

  const handleLeavePlayground = async () => {
    if (!username || !playgroundData) return;

    try {
      await toast.promise(
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
      router.push("/");
    } catch (error) {
      console.error("Error leaving playground:", error);
      router.push("/");
    }
  };

  // Get current player's score
  const playerScore = useQuery(
    api.game.getPlayerScore,
    username && playgroundCode
      ? {
          code: playgroundCode,
          username: username as string,
        }
      : "skip",
  );

  // Check if game ended or restarted - only show modal when last round is finished
  useEffect(() => {
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

  const handleCopyCode = () => {
    if (!navigator?.clipboard) {
      toast.error("Clipboard not supported");
      return;
    }
    navigator.clipboard
      .writeText(playgroundCode)
      .then(() => {
        setCopied(true);
        toast.success("Room code copied!");
        setTimeout(() => setCopied(false), 2000);
      })
      .catch(() => {
        toast.error("Failed to copy code");
      });
  };

  return (
    <div className="min-h-screen bg-background text-foreground antialiased selection:bg-primary/20">
      {/* Top Bar Navigation */}
      <header className="sticky top-0 z-40 w-full border-b border-border/40 bg-background/80 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
          <div className="flex items-center gap-3">
            <Link
              href="/"
              className="flex items-center gap-1.5 text-sm font-semibold tracking-tight transition-opacity hover:opacity-80"
              title="Return home"
            >
              <ArrowLeft className="h-4 w-4 text-muted-foreground" />
              <span>Thinkfast</span>
            </Link>

            <span className="text-border">/</span>

            {/* Room Code Badge */}
            <button
              onClick={handleCopyCode}
              className="group inline-flex items-center gap-1.5 rounded-lg bg-muted/60 px-2.5 py-1 text-xs font-mono font-medium text-foreground transition-all hover:bg-muted active:scale-95 cursor-pointer"
              title="Click to copy room code"
            >
              <span className="text-muted-foreground font-sans text-[11px]">Room</span>
              <span className="font-semibold tracking-wide uppercase">{playgroundCode}</span>
              {copied ? (
                <Check className="h-3 w-3 text-emerald-500" />
              ) : (
                <Copy className="h-3 w-3 text-muted-foreground transition-colors group-hover:text-foreground" />
              )}
            </button>
          </div>

          <div className="flex items-center gap-3">
            {/* Player Info & Score */}
            <div className="flex items-center gap-2 rounded-xl bg-card border border-border/50 px-3 py-1.5">
              <span className="text-xs font-medium text-muted-foreground hidden sm:inline">
                Player:
              </span>
              <span className="text-sm font-semibold truncate max-w-[120px]">
                {username || "Guest"}
              </span>
              <span className="text-border mx-0.5">·</span>
              <span className="flex items-center gap-1 text-xs font-semibold text-amber-500">
                <Trophy className="h-3.5 w-3.5" />
                <span className="font-mono tabular-nums text-sm font-bold">
                  {playerScore?.score ?? 0}
                </span>
                <span className="text-[10px] text-muted-foreground font-sans">pts</span>
              </span>
            </div>

            {/* Settings Popover */}
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-9 w-9 rounded-xl hover:bg-muted cursor-pointer"
                  title="Settings"
                >
                  <Settings className="h-4 w-4 text-muted-foreground transition-transform hover:rotate-45" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-48 rounded-2xl p-2 border border-border shadow-md" align="end">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleLeavePlayground}
                  className="w-full justify-start gap-2.5 rounded-xl text-destructive hover:bg-destructive/10 hover:text-destructive cursor-pointer"
                >
                  <LogOut className="h-4 w-4" />
                  Leave Playground
                </Button>
              </PopoverContent>
            </Popover>
          </div>
        </div>
      </header>

      {/* Main Game Screen */}
      <main className="mx-auto max-w-6xl px-4 py-6 sm:px-6 md:py-10">
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-12 lg:gap-8 lg:items-start">
          {/* Main Play Area (Col 1 to 8 on desktop) */}
          <div className="space-y-6 lg:col-span-8">
            {/* Centerpiece Hero Letter & Controls */}
            {playgroundData && (
              <LetterHero playgroundData={playgroundData} playgroundCode={playgroundCode} />
            )}

            {/* Answer Categories Form Card */}
            {playgroundData && (
              <GameCard playgroundData={playgroundData} />
            )}

            {/* Mobile Collapsible Leaderboard */}
            {playgroundData && (
              <div className="block lg:hidden">
                <MobileLeaderboard playgroundCode={playgroundData.code} currentUsername={username} />
              </div>
            )}
          </div>

          {/* Desktop Leaderboard Sidebar (Col 9 to 12 on desktop) */}
          {playgroundData && (
            <aside className="hidden lg:block lg:col-span-4 lg:sticky lg:top-24">
              <DesktopLeaderboard playgroundCode={playgroundData.code} currentUsername={username} />
            </aside>
          )}
        </div>
      </main>

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
    </div>
  );
}

/**
 * Centerpiece Letter Hero Display
 * Reveals the current letter in giant scale, with round and timer status
 */
function LetterHero({
  playgroundData,
  playgroundCode,
}: {
  playgroundData: Doc<"playgrounds">;
  playgroundCode: string;
}) {
  const { letter, isPlaying } = useGameLetter();
  const game = useMutation(api.game.startGame);
  const [timeLeft, setTimeLeft] = useState<number | null>(null);

  const startGame = async () => {
    try {
      await toast.promise(game({ playgroundId: playgroundData._id }), {
        loading: "Starting game...",
        success: "The round has started!",
        error: "Failed to start game",
      });
    } catch (error) {
      console.error("Error starting game:", error);
    }
  };

  // Countdown timer logic
  useEffect(() => {
    if (!playgroundData?.timer || !isPlaying) return;

    const startTimer = setTimeout(() => {
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
    }, 100);

    return () => clearTimeout(startTimer);
  }, [playgroundData?.timer, playgroundData?.currentRound, isPlaying]);

  const isWaiting = playgroundData.status === "waiting";
  const isFinished = playgroundData.status === "finished";

  return (
    <div className="relative overflow-hidden rounded-3xl border border-border/60 bg-card p-6 text-center sm:p-10 transition-all">
      {/* Subtle background glow when active */}
      {isPlaying && (
        <div className="pointer-events-none absolute inset-0 -z-10 bg-radial from-primary/5 via-transparent to-transparent opacity-70" />
      )}

      {/* Header Info Line */}
      <div className="flex items-center justify-between text-xs sm:text-sm text-muted-foreground font-medium pb-2 border-b border-border/30">
        <div className="flex items-center gap-2">
          <span className="font-semibold text-foreground">
            Round {playgroundData.currentRound} of {playgroundData.rounds}
          </span>
          {playgroundData.forDummies && (
            <span className="rounded-md bg-muted px-2 py-0.5 text-[11px] font-medium text-muted-foreground">
              Dummy mode
            </span>
          )}
        </div>

        {/* Start / Restart Action Trigger */}
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button
              size="sm"
              variant={isWaiting ? "default" : "outline"}
              className="h-8 gap-1.5 rounded-lg font-medium cursor-pointer"
            >
              {isWaiting ? (
                <>
                  <Play className="h-3.5 w-3.5 fill-current" />
                  <span>Start Round</span>
                </>
              ) : isFinished ? (
                <>
                  <RotateCcw className="h-3.5 w-3.5" />
                  <span>Restart</span>
                </>
              ) : (
                <>
                  <RotateCcw className="h-3.5 w-3.5" />
                  <span>Next Round</span>
                </>
              )}
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent className="rounded-2xl border border-border">
            <AlertDialogHeader>
              <AlertDialogTitle className="text-center text-lg">
                {isWaiting
                  ? "Start the game?"
                  : isFinished
                    ? "Restart the game?"
                    : "End or restart the current round?"}
              </AlertDialogTitle>
            </AlertDialogHeader>
            <AlertDialogFooter className="sm:justify-center gap-2">
              <AlertDialogCancel className="rounded-xl">Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={startGame} className="rounded-xl">
                Continue
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>

      {/* Dominant Letter Anchor */}
      <div className="py-6 sm:py-10">
        {isPlaying ? (
          <div className="flex flex-col items-center justify-center">
            <span
              key={`${playgroundData.currentRound}-${letter}`}
              className="animate-letter-pop font-black tracking-tighter leading-none select-none text-primary"
              style={{ fontSize: "clamp(6rem, 18vw, 13rem)" }}
            >
              {letter || "—"}
            </span>
            <p className="mt-2 text-sm sm:text-base font-medium text-muted-foreground">
              All answers must begin with{" "}
              <strong className="text-foreground uppercase">&quot;{letter}&quot;</strong>
            </p>
          </div>
        ) : isWaiting ? (
          <div className="py-4 space-y-3">
            <div className="mx-auto flex h-24 w-24 sm:h-28 sm:w-28 items-center justify-center rounded-3xl bg-muted/50 text-muted-foreground">
              <span className="text-5xl font-black">?</span>
            </div>
            <div>
              <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground">
                Ready to play Thinkfast
              </h2>
              <p className="mt-1 text-sm text-muted-foreground">
                Waiting for host to start Round 1. Timer is set to {playgroundData.timer}s.
              </p>
            </div>
          </div>
        ) : (
          <div className="py-4 space-y-3">
            <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-3xl bg-amber-500/10 text-amber-500">
              <Trophy className="h-10 w-10" />
            </div>
            <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground">
              Game Finished!
            </h2>
            <p className="text-sm text-muted-foreground">
              All {playgroundData.rounds} rounds are complete. Check the leaderboard for rankings!
            </p>
          </div>
        )}
      </div>

      {/* Countdown Timer Bar */}
      {isPlaying && (
        <div className="flex items-center justify-center gap-2 pt-2 border-t border-border/30">
          <span className="text-sm font-medium text-muted-foreground">Time Remaining:</span>
          <span className="text-base sm:text-lg font-bold font-mono">
            <AnimatedTimer seconds={timeLeft} />
          </span>
        </div>
      )}
    </div>
  );
}

/**
 * Game Inputs Section
 */
function GameCard({ playgroundData }: { playgroundData: Doc<"playgrounds"> }) {
  const searchParams = useSearchParams();
  const isDummyMode =
    searchParams.get("mode") === "dummy" || playgroundData?.forDummies;

  return (
    <div className="rounded-3xl border border-border/60 bg-card p-6 sm:p-8">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h2 className="text-lg sm:text-xl font-bold tracking-tight text-foreground">
            Categories
          </h2>
          <p className="text-xs sm:text-sm text-muted-foreground">
            Quickly fill in each word before time runs out
          </p>
        </div>
        <Sparkles className="h-5 w-5 text-muted-foreground/60" />
      </div>

      {isDummyMode ? (
        <AnswersFormForDummy playgroundData={playgroundData} />
      ) : (
        <AnswersForm playgroundData={playgroundData} />
      )}
    </div>
  );
}

/**
 * Desktop Leaderboard Sidebar
 */
function DesktopLeaderboard({
  playgroundCode,
  currentUsername,
}: {
  playgroundCode: string;
  currentUsername: string | null;
}) {
  const leaderboard = useQuery(api.game.getPlaygroundLeaderboard, {
    code: playgroundCode,
  });

  return (
    <div className="rounded-3xl border border-border/60 bg-card p-6 space-y-4">
      <div className="flex items-center justify-between border-b border-border/40 pb-3">
        <div className="flex items-center gap-2">
          <Trophy className="h-4 w-4 text-amber-500" />
          <h2 className="text-base font-bold tracking-tight text-foreground">
            Leaderboard
          </h2>
        </div>
        <span className="flex items-center gap-1 text-xs text-muted-foreground">
          <Users className="h-3.5 w-3.5" />
          {leaderboard?.length || 0}
        </span>
      </div>

      <div className="space-y-1.5 max-h-[60vh] overflow-y-auto pr-1">
        {leaderboard && leaderboard.length > 0 ? (
          leaderboard.map((player, index) => {
            const isSelf = player.username === currentUsername;
            return (
              <div
                key={player.username}
                className={`flex items-center justify-between rounded-xl px-3 py-2.5 transition-colors ${
                  isSelf
                    ? "bg-primary/10 border border-primary/20 text-foreground"
                    : "hover:bg-muted/50 text-foreground"
                }`}
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <span
                    className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-lg text-xs font-bold ${
                      index === 0
                        ? "bg-amber-500/20 text-amber-600 dark:text-amber-400"
                        : index === 1
                          ? "bg-neutral-300/40 text-neutral-700 dark:text-neutral-300"
                          : index === 2
                            ? "bg-amber-700/20 text-amber-700 dark:text-amber-500"
                            : "text-muted-foreground font-mono"
                    }`}
                  >
                    {index + 1}
                  </span>
                  <span className="text-sm font-medium truncate">
                    {player.username}
                    {isSelf && (
                      <span className="ml-1.5 text-[11px] font-normal text-muted-foreground">
                        (You)
                      </span>
                    )}
                  </span>
                </div>
                <span className="font-mono tabular-nums text-sm font-bold text-amber-500 ml-2">
                  {player.score}
                </span>
              </div>
            );
          })
        ) : (
          <div className="py-8 text-center text-sm text-muted-foreground">
            No players recorded yet
          </div>
        )}
      </div>
    </div>
  );
}

/**
 * Mobile Collapsible Leaderboard
 */
function MobileLeaderboard({
  playgroundCode,
  currentUsername,
}: {
  playgroundCode: string;
  currentUsername: string | null;
}) {
  const leaderboard = useQuery(api.game.getPlaygroundLeaderboard, {
    code: playgroundCode,
  });

  return (
    <details className="group rounded-2xl border border-border/60 bg-card p-4 transition-all [&_summary::-webkit-details-marker]:hidden">
      <summary className="flex cursor-pointer items-center justify-between select-none">
        <div className="flex items-center gap-2 font-semibold text-sm text-foreground">
          <Trophy className="h-4 w-4 text-amber-500" />
          <span>Leaderboard</span>
          <span className="rounded-md bg-muted px-2 py-0.5 text-xs font-normal text-muted-foreground">
            {leaderboard?.length || 0} players
          </span>
        </div>
        <ChevronDown className="h-4 w-4 text-muted-foreground transition-transform duration-200 group-open:rotate-180" />
      </summary>

      <div className="mt-4 space-y-1.5 border-t border-border/40 pt-3">
        {leaderboard && leaderboard.length > 0 ? (
          leaderboard.map((player, index) => {
            const isSelf = player.username === currentUsername;
            return (
              <div
                key={player.username}
                className={`flex items-center justify-between rounded-xl px-3 py-2 text-sm ${
                  isSelf
                    ? "bg-primary/10 font-semibold text-foreground"
                    : "text-foreground"
                }`}
              >
                <div className="flex items-center gap-2 min-w-0">
                  <span className="w-5 text-xs font-mono text-muted-foreground">
                    #{index + 1}
                  </span>
                  <span className="truncate">
                    {player.username}
                    {isSelf && " (You)"}
                  </span>
                </div>
                <span className="font-mono font-bold text-amber-500">
                  {player.score} pts
                </span>
              </div>
            );
          })
        ) : (
          <p className="text-center text-xs text-muted-foreground py-2">
            No players yet
          </p>
        )}
      </div>
    </details>
  );
}

