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
    <div className="bg-background text-foreground selection:bg-primary/20 min-h-screen antialiased">
      {/* Top Bar Navigation */}
      <header className="border-border/40 bg-background/80 sticky top-0 z-40 w-full border-b backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
          <div className="flex items-center gap-3">
            <Link
              href="/"
              className="flex items-center gap-1.5 text-sm font-semibold tracking-tight transition-opacity hover:opacity-80"
              title="Return home"
            >
              <ArrowLeft className="text-muted-foreground h-4 w-4" />
              <span>Thinkfast</span>
            </Link>

            <span className="text-border">/</span>

            {/* Room Code Badge */}
            <button
              onClick={handleCopyCode}
              className="group bg-muted/60 text-foreground hover:bg-muted inline-flex cursor-pointer items-center gap-1.5 rounded-lg px-2.5 py-1 font-mono text-xs font-medium transition-all active:scale-95"
              title="Click to copy room code"
            >
              <span className="text-muted-foreground font-sans text-[11px]">
                Room
              </span>
              <span className="font-semibold tracking-wide uppercase">
                {playgroundCode}
              </span>
              {copied ? (
                <Check className="h-3 w-3 text-emerald-500" />
              ) : (
                <Copy className="text-muted-foreground group-hover:text-foreground h-3 w-3 transition-colors" />
              )}
            </button>
          </div>

          <div className="flex items-center gap-3">
            {/* Player Info & Score */}
            <div className="bg-card border-border/50 flex items-center gap-2 rounded-xl border px-3 py-1.5">
              <span className="text-muted-foreground hidden text-xs font-medium sm:inline">
                Player:
              </span>
              <span className="max-w-30 truncate text-sm font-semibold">
                {username || "Guest"}
              </span>
              <span className="text-border mx-0.5">·</span>
              <span className="flex items-center gap-1 text-xs font-semibold text-amber-500">
                <Trophy className="h-3.5 w-3.5" />
                <span className="font-mono text-sm font-bold tabular-nums">
                  {playerScore?.score ?? 0}
                </span>
                <span className="text-muted-foreground font-sans text-[10px]">
                  pts
                </span>
              </span>
            </div>

            {/* Settings Popover */}
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="hover:bg-muted h-9 w-9 cursor-pointer rounded-xl"
                  title="Settings"
                >
                  <Settings className="text-muted-foreground h-4 w-4 transition-transform hover:rotate-45" />
                </Button>
              </PopoverTrigger>
              <PopoverContent
                className="border-border w-48 rounded-2xl border p-2 shadow-md"
                align="end"
              >
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleLeavePlayground}
                  className="text-destructive hover:bg-destructive/10 hover:text-destructive w-full cursor-pointer justify-start gap-2.5 rounded-xl"
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
      <main className="mx-auto max-w-6xl px-4 py-6 sm:px-6">
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-12 lg:items-start lg:gap-8">
          {/* Main Play Area (Col 1 to 8 on desktop) */}
          <div className="space-y-6 lg:col-span-8">
            {/* Centerpiece Hero Letter & Controls */}
            {playgroundData && (
              <LetterHero
                playgroundData={playgroundData}
                playgroundCode={playgroundCode}
              />
            )}

            {/* Answer Categories Form Card */}
            {playgroundData && <GameCard playgroundData={playgroundData} />}

            {/* Mobile Collapsible Leaderboard */}
            {playgroundData && (
              <div className="block lg:hidden">
                <MobileLeaderboard
                  playgroundCode={playgroundData.code}
                  currentUsername={username}
                />
              </div>
            )}
          </div>

          {/* Desktop Leaderboard Sidebar (Col 9 to 12 on desktop) */}
          {playgroundData && (
            <aside className="hidden lg:sticky lg:top-24 lg:col-span-4 lg:block">
              <DesktopLeaderboard
                playgroundCode={playgroundData.code}
                currentUsername={username}
              />
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
  const startGameMutation = useMutation(api.game.startGame);
  const resetGameAndRestart = useMutation(api.game.resetGameAndRestart);
  const [timeLeft, setTimeLeft] = useState<number | null>(null);

  const startGame = async () => {
    try {
      if (playgroundData.status === "finished") {
        await toast.promise(resetGameAndRestart({ code: playgroundCode }), {
          loading: "Restarting game...",
          success: "Game restarted! Get ready for round 1!",
          error: "Failed to restart game",
        });
      } else {
        await toast.promise(
          startGameMutation({ playgroundId: playgroundData._id }),
          {
            loading: "Starting game...",
            success: "The round has started!",
            error: "Failed to start game",
          },
        );
      }
    } catch (error) {
      console.error("Error starting game:", error);
    }
  };

  // Countdown timer logic with server timestamp & localStorage synchronization
  useEffect(() => {
    if (!playgroundData?.timer || !isPlaying) {
      setTimeLeft(null);
      return;
    }

    const storageKey = `thinkfast_timer_${playgroundCode}_r${playgroundData.currentRound}`;

    const calculateRemaining = () => {
      const now = Date.now();
      const serverEndsAt = playgroundData.roundEndsAt;

      if (serverEndsAt && typeof serverEndsAt === "number") {
        const remaining = Math.max(0, Math.ceil((serverEndsAt - now) / 1000));
        if (typeof window !== "undefined") {
          localStorage.setItem(storageKey, String(serverEndsAt));
        }
        return remaining;
      }

      if (typeof window !== "undefined") {
        const saved = localStorage.getItem(storageKey);
        if (saved) {
          const target = Number(saved);
          if (!isNaN(target)) {
            return Math.max(0, Math.ceil((target - now) / 1000));
          }
        }
        const newEndsAt = now + playgroundData.timer * 1000;
        localStorage.setItem(storageKey, String(newEndsAt));
      }

      return playgroundData.timer;
    };

    const initial = calculateRemaining();
    setTimeLeft(initial);

    const interval = setInterval(() => {
      const remaining = calculateRemaining();
      setTimeLeft(remaining);

      if (remaining <= 0) {
        clearInterval(interval);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [
    playgroundData?.timer,
    playgroundData?.currentRound,
    playgroundData?.roundEndsAt,
    playgroundCode,
    isPlaying,
  ]);

  const isWaiting = playgroundData.status === "waiting";
  const isFinished = playgroundData.status === "finished";

  return (
    <div className="border-border/60 bg-card relative overflow-hidden rounded-3xl border p-6 text-center transition-all sm:p-10">
      {/* Subtle background glow when active */}
      {isPlaying && (
        <div className="from-primary/5 pointer-events-none absolute inset-0 -z-10 bg-radial via-transparent to-transparent opacity-70" />
      )}

      {/* Header Info Line */}
      <div className="text-muted-foreground border-border/30 flex items-center justify-between border-b pb-2 text-xs font-medium sm:text-sm">
        <div className="flex items-center gap-2">
          <span className="text-foreground font-semibold">
            Round {playgroundData.currentRound} of {playgroundData.rounds}
          </span>
          {playgroundData.forDummies && (
            <span className="bg-muted text-muted-foreground rounded-md px-2 py-0.5 text-[11px] font-medium">
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
              className="h-8 cursor-pointer gap-1.5 rounded-lg font-medium"
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
          <AlertDialogContent className="border-border rounded-2xl border">
            <AlertDialogHeader>
              <AlertDialogTitle className="text-center text-lg">
                {isWaiting
                  ? "Start the game?"
                  : isFinished
                    ? "Restart the game?"
                    : "End or restart the current round?"}
              </AlertDialogTitle>
            </AlertDialogHeader>
            <AlertDialogFooter className="gap-2 sm:justify-center">
              <AlertDialogCancel className="rounded-xl">
                Cancel
              </AlertDialogCancel>
              <AlertDialogAction onClick={startGame} className="rounded-xl">
                Continue
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>

      {/* Dominant Letter Anchor */}
      <div className="py-4 sm:py-6">
        {isPlaying ? (
          <div className="flex flex-col items-center justify-center">
            <span
              key={`${playgroundData.currentRound}-${letter}`}
              className="animate-letter-pop text-primary leading-none font-black tracking-tighter select-none"
              style={{ fontSize: "clamp(4rem, 10vw, 9rem)" }}
            >
              {letter || "—"}
            </span>
            <p className="text-muted-foreground mt-2 text-sm font-medium sm:text-base">
              All answers must begin with{" "}
              <strong className="text-foreground uppercase">
                &quot;{letter}&quot;
              </strong>
            </p>
          </div>
        ) : isWaiting ? (
          <div className="space-y-3 py-4">
            <div className="bg-muted/50 text-muted-foreground mx-auto flex h-24 w-24 items-center justify-center rounded-3xl sm:h-28 sm:w-28">
              <span className="text-5xl font-black">?</span>
            </div>
            <div>
              <h2 className="text-foreground text-xl font-bold tracking-tight sm:text-2xl">
                Ready to play Thinkfast
              </h2>
              <p className="text-muted-foreground mt-1 text-sm">
                Waiting for host to start Round 1. Timer is set to{" "}
                {playgroundData.timer}s.
              </p>
            </div>
          </div>
        ) : (
          <div className="space-y-3 py-4">
            <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-3xl bg-amber-500/10 text-amber-500">
              <Trophy className="h-10 w-10" />
            </div>
            <h2 className="text-foreground text-xl font-bold tracking-tight sm:text-2xl">
              Game Finished!
            </h2>
            <p className="text-muted-foreground text-sm">
              All {playgroundData.rounds} rounds are complete. Check the
              leaderboard for rankings!
            </p>
          </div>
        )}
      </div>

      {/* Countdown Timer Bar */}
      {isPlaying && (
        <div className="border-border/30 flex items-center justify-center gap-2 border-t pt-2">
          <span className="text-muted-foreground text-sm font-medium">
            Time Remaining:
          </span>
          <span className="font-mono text-base font-bold sm:text-lg">
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
    <div className="border-border/60 bg-card rounded-3xl border p-6 sm:p-8">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h2 className="text-foreground text-lg font-bold tracking-tight sm:text-xl">
            Categories
          </h2>
          <p className="text-muted-foreground text-xs sm:text-sm">
            Quickly fill in each word before time runs out
          </p>
        </div>
        <Sparkles className="text-muted-foreground/60 h-5 w-5" />
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
    <div className="border-border/60 bg-card space-y-4 rounded-3xl border p-6">
      <div className="border-border/40 flex items-center justify-between border-b pb-3">
        <div className="flex items-center gap-2">
          <Trophy className="h-4 w-4 text-amber-500" />
          <h2 className="text-foreground text-base font-bold tracking-tight">
            Leaderboard
          </h2>
        </div>
        <span className="text-muted-foreground flex items-center gap-1 text-xs">
          <Users className="h-3.5 w-3.5" />
          {leaderboard?.length || 0}
        </span>
      </div>

      <div className="max-h-[60vh] space-y-1.5 overflow-y-auto pr-1">
        {leaderboard && leaderboard.length > 0 ? (
          leaderboard.map((player, index) => {
            const isSelf = player.username === currentUsername;
            return (
              <div
                key={player.username}
                className={`flex items-center justify-between rounded-xl px-3 py-2.5 transition-colors ${
                  isSelf
                    ? "bg-primary/10 border-primary/20 text-foreground border"
                    : "hover:bg-muted/50 text-foreground"
                }`}
              >
                <div className="flex min-w-0 items-center gap-2.5">
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
                  <span className="truncate text-sm font-medium">
                    {player.username}
                    {isSelf && (
                      <span className="text-muted-foreground ml-1.5 text-[11px] font-normal">
                        (You)
                      </span>
                    )}
                  </span>
                </div>
                <span className="ml-2 font-mono text-sm font-bold text-amber-500 tabular-nums">
                  {player.score}
                </span>
              </div>
            );
          })
        ) : (
          <div className="text-muted-foreground py-8 text-center text-sm">
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
    <details className="group border-border/60 bg-card rounded-2xl border p-4 transition-all [&_summary::-webkit-details-marker]:hidden">
      <summary className="flex cursor-pointer items-center justify-between select-none">
        <div className="text-foreground flex items-center gap-2 text-sm font-semibold">
          <Trophy className="h-4 w-4 text-amber-500" />
          <span>Leaderboard</span>
          <span className="bg-muted text-muted-foreground rounded-md px-2 py-0.5 text-xs font-normal">
            {leaderboard?.length || 0} players
          </span>
        </div>
        <ChevronDown className="text-muted-foreground h-4 w-4 transition-transform duration-200 group-open:rotate-180" />
      </summary>

      <div className="border-border/40 mt-4 space-y-1.5 border-t pt-3">
        {leaderboard && leaderboard.length > 0 ? (
          leaderboard.map((player, index) => {
            const isSelf = player.username === currentUsername;
            return (
              <div
                key={player.username}
                className={`flex items-center justify-between rounded-xl px-3 py-2 text-sm ${
                  isSelf
                    ? "bg-primary/10 text-foreground font-semibold"
                    : "text-foreground"
                }`}
              >
                <div className="flex min-w-0 items-center gap-2">
                  <span className="text-muted-foreground w-5 font-mono text-xs">
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
          <p className="text-muted-foreground py-2 text-center text-xs">
            No players yet
          </p>
        )}
      </div>
    </details>
  );
}
