"use client";

import React from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Button } from "@/components/ui/button";
import {
  ArrowLeft,
  Trophy,
  Users,
  Sparkles,
  AlertCircle,
  CheckCircle2,
  CopyCheck,
  ChevronRight,
} from "lucide-react";

export default function ResultsPage() {
  const params = useParams();
  const router = useRouter();
  const code = params.code as string;

  const results = useQuery(api.game.getPlaygroundResults, { code });
  const leaderboard = useQuery(api.game.getPlaygroundLeaderboard, { code });

  const handleBackToPlayground = () => {
    router.push(`/playground/${code}?showModal=true`);
  };

  if (!results) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background text-foreground">
        <div className="text-center space-y-3">
          <div className="mx-auto h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
          <p className="text-sm font-medium text-muted-foreground">
            Loading game results...
          </p>
        </div>
      </div>
    );
  }

  const fieldLabels: Record<string, string> = {
    jongens: "Boy's Name",
    meisjes: "Girl's Name",
    dieren: "Animal",
    vruchten: "Fruit",
    landen: "Country",
  };

  const isGameFinished = results.playground.status === "finished";
  const winner = leaderboard && leaderboard.length > 0 ? leaderboard[0] : null;

  return (
    <div className="min-h-screen bg-background text-foreground antialiased selection:bg-primary/20 pb-16">
      {/* Top Header Bar */}
      <header className="sticky top-0 z-40 w-full border-b border-border/40 bg-background/80 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
          <div className="flex items-center gap-3">
            <Button
              onClick={handleBackToPlayground}
              variant="ghost"
              size="sm"
              className="gap-1.5 rounded-xl font-medium cursor-pointer hover:bg-muted"
            >
              <ArrowLeft className="h-4 w-4" />
              <span>Back to Game</span>
            </Button>

            <span className="text-border">/</span>

            <div className="inline-flex items-center gap-2">
              <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Room
              </span>
              <span className="font-mono font-bold uppercase tracking-wide text-foreground">
                {code}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span
              className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold ${
                isGameFinished
                  ? "bg-amber-500/15 text-amber-600 dark:text-amber-400"
                  : "bg-primary/10 text-primary"
              }`}
            >
              <span
                className={`h-1.5 w-1.5 rounded-full ${
                  isGameFinished ? "bg-amber-500" : "bg-primary animate-pulse"
                }`}
              />
              {isGameFinished ? "Game Finished" : "In Progress"}
            </span>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6 space-y-10">
        {/* Page Title & Hero */}
        <div className="space-y-2">
          <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-foreground">
            Game Results & Breakdown
          </h1>
          <p className="text-sm sm:text-base text-muted-foreground">
            {results.roundsPlayed.length} of {results.playground.rounds} rounds
            completed · Points evaluated with duplicate detection
          </p>
        </div>

        {/* Scoring Legend Pill */}
        <div className="flex flex-wrap items-center gap-3 rounded-2xl border border-border/50 bg-card p-4 text-xs font-medium text-muted-foreground">
          <span className="font-semibold text-foreground">Rule Scoring:</span>
          <div className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-500/10 px-2 py-0.5 text-emerald-600 dark:text-emerald-400 font-semibold">
            <CheckCircle2 className="h-3.5 w-3.5" />
            <span>+10 pts (Unique valid)</span>
          </div>
          <div className="inline-flex items-center gap-1.5 rounded-lg bg-amber-500/15 px-2 py-0.5 text-amber-700 dark:text-amber-400 font-semibold border border-amber-500/30">
            <CopyCheck className="h-3.5 w-3.5" />
            <span>+5 pts (Duplicate answer)</span>
          </div>
          <div className="inline-flex items-center gap-1.5 rounded-lg bg-muted px-2 py-0.5 text-muted-foreground">
            <AlertCircle className="h-3.5 w-3.5" />
            <span>0 pts (Invalid or blank)</span>
          </div>
        </div>

        {/* Final Standings Leaderboard */}
        <div className="overflow-hidden rounded-3xl border border-border/60 bg-card p-6 sm:p-8 space-y-6">
          <div className="flex items-center justify-between border-b border-border/40 pb-4">
            <div className="flex items-center gap-2.5">
              <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-amber-500/15 text-amber-500">
                <Trophy className="h-5 w-5" />
              </div>
              <div>
                <h2 className="text-xl font-bold tracking-tight text-foreground">
                  Final Leaderboard
                </h2>
                <p className="text-xs text-muted-foreground">
                  Rankings across all rounds
                </p>
              </div>
            </div>

            {winner && isGameFinished && (
              <div className="hidden sm:flex items-center gap-2 rounded-xl bg-amber-500/10 px-3 py-1.5 text-xs font-semibold text-amber-600 dark:text-amber-400 border border-amber-500/20">
                <Sparkles className="h-3.5 w-3.5" />
                <span>Winner: {winner.username}</span>
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {leaderboard?.map((player, index) => {
              const isFirst = index === 0;
              const isSecond = index === 1;
              const isThird = index === 2;

              return (
                <div
                  key={player.username}
                  className={`flex items-center justify-between rounded-2xl p-4 transition-all ${
                    isFirst
                      ? "bg-amber-500/10 border-2 border-amber-500/30 shadow-xs"
                      : "bg-muted/40 border border-border/50"
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <span
                      className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-xl text-xs font-black ${
                        isFirst
                          ? "bg-amber-500 text-black font-extrabold"
                          : isSecond
                            ? "bg-neutral-300 text-neutral-800 dark:bg-neutral-700 dark:text-neutral-200"
                            : isThird
                              ? "bg-amber-700/30 text-amber-700 dark:text-amber-400"
                              : "bg-muted text-muted-foreground font-mono"
                      }`}
                    >
                      #{index + 1}
                    </span>
                    <span className="font-semibold text-sm truncate text-foreground">
                      {player.username}
                    </span>
                  </div>
                  <div className="text-right ml-3 shrink-0">
                    <span className="font-mono text-base font-bold tabular-nums text-foreground">
                      {player.score}
                    </span>
                    <span className="ml-1 text-xs text-muted-foreground font-sans">
                      pts
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Round by Round Detailed Breakdown */}
        <div className="space-y-8">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold tracking-tight text-foreground">
              Round Breakdown
            </h2>
            <span className="text-xs font-medium text-muted-foreground">
              Showing answers & per-category score
            </span>
          </div>

          {results.roundsPlayed.length > 0 ? (
            results.roundsPlayed.map((round) => {
              const players = results.resultsByRound[round] || [];
              const roundLetter = results.roundLetters?.[round] || "—";

              return (
                <div
                  key={round}
                  className="rounded-3xl border border-border/60 bg-card overflow-hidden transition-all"
                >
                  {/* Round Header Bar */}
                  <div className="flex flex-wrap items-center justify-between gap-4 border-b border-border/40 bg-muted/20 px-6 py-4">
                    <div className="flex items-center gap-3">
                      <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10 text-primary font-mono text-lg font-black uppercase">
                        {roundLetter}
                      </span>
                      <div>
                        <h3 className="text-base sm:text-lg font-bold text-foreground">
                          Round {round}
                        </h3>
                        <p className="text-xs text-muted-foreground">
                          Revealed Letter:{" "}
                          <strong className="text-foreground uppercase font-bold">
                            &quot;{roundLetter}&quot;
                          </strong>
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
                      <Users className="h-3.5 w-3.5" />
                      <span>{players.length} players evaluated</span>
                    </div>
                  </div>

                  {/* Desktop Table View */}
                  <div className="hidden md:block overflow-x-auto p-6">
                    <table className="w-full border-collapse text-left text-sm">
                      <thead>
                        <tr className="border-b border-border/40 text-xs font-semibold text-muted-foreground">
                          <th className="pb-3 pr-4 font-bold text-foreground uppercase tracking-wider">
                            Player
                          </th>
                          <th className="pb-3 px-3 text-center uppercase tracking-wider">
                            Round Pts
                          </th>
                          {results.fieldNames.map((field) => (
                            <th
                              key={field}
                              className="pb-3 px-3 uppercase tracking-wider"
                            >
                              {fieldLabels[field] || field}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border/30">
                        {players.map((player) => (
                          <tr
                            key={player.username}
                            className="transition-colors hover:bg-muted/30"
                          >
                            {/* Player Name */}
                            <td className="py-4 pr-4 font-bold text-foreground whitespace-nowrap">
                              {player.username}
                            </td>

                            {/* Round Score Total */}
                            <td className="py-4 px-3 text-center whitespace-nowrap">
                              <span className="inline-block rounded-lg bg-primary/10 px-2.5 py-1 font-mono text-sm font-bold text-primary">
                                +{player.roundScore ?? 0}
                              </span>
                            </td>

                            {/* Category Columns */}
                            {results.fieldNames.map((field) => {
                              const detail = player.categoryDetails?.[field];
                              const answer =
                                detail?.answer || player.answers[field] || "";
                              const points = detail?.points ?? 0;
                              const isDuplicate = detail?.isDuplicate ?? false;
                              const duplicateWith = detail?.duplicateWith ?? [];
                              const isValid = detail?.isValid ?? false;

                              return (
                                <td key={field} className="py-4 px-3 align-top">
                                  {answer ? (
                                    <div
                                      className={`rounded-xl p-2.5 border transition-all ${
                                        isDuplicate
                                          ? "bg-amber-500/10 border-amber-500/30 text-amber-900 dark:text-amber-200"
                                          : isValid
                                            ? "bg-muted/40 border-border/50 text-foreground"
                                            : "bg-destructive/5 border-destructive/20 text-muted-foreground"
                                      }`}
                                    >
                                      {/* Word */}
                                      <p className="font-semibold capitalize text-sm">
                                        {answer}
                                      </p>

                                      {/* Points & Duplicate Badge */}
                                      <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
                                        {isDuplicate ? (
                                          <span className="inline-flex items-center gap-1 rounded-md bg-amber-500/20 px-1.5 py-0.5 text-[11px] font-bold text-amber-700 dark:text-amber-400">
                                            <CopyCheck className="h-3 w-3" />
                                            <span>+5 Dupe</span>
                                          </span>
                                        ) : isValid ? (
                                          <span className="inline-flex items-center gap-1 rounded-md bg-emerald-500/15 px-1.5 py-0.5 text-[11px] font-bold text-emerald-600 dark:text-emerald-400">
                                            <CheckCircle2 className="h-3 w-3" />
                                            <span>+10</span>
                                          </span>
                                        ) : (
                                          <span className="inline-flex items-center gap-1 rounded-md bg-muted px-1.5 py-0.5 text-[11px] font-medium text-muted-foreground">
                                            0 pts (invalid)
                                          </span>
                                        )}

                                        {isDuplicate && duplicateWith.length > 0 && (
                                          <span
                                            className="text-[10px] text-amber-700 dark:text-amber-400/80 truncate max-w-[120px]"
                                            title={`Duplicated with: ${duplicateWith.join(", ")}`}
                                          >
                                            with {duplicateWith.join(", ")}
                                          </span>
                                        )}
                                      </div>
                                    </div>
                                  ) : (
                                    <div className="rounded-xl border border-dashed border-border/40 p-2.5 text-center text-xs text-muted-foreground">
                                      <span>—</span>
                                    </div>
                                  )}
                                </td>
                              );
                            })}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {/* Mobile Stacked Card View */}
                  <div className="block md:hidden p-4 space-y-4">
                    {players.map((player) => (
                      <div
                        key={player.username}
                        className="rounded-2xl border border-border/50 bg-muted/20 p-4 space-y-3"
                      >
                        {/* Player Header */}
                        <div className="flex items-center justify-between border-b border-border/30 pb-2">
                          <span className="font-bold text-base text-foreground">
                            {player.username}
                          </span>
                          <span className="rounded-lg bg-primary/10 px-2 py-0.5 font-mono text-xs font-bold text-primary">
                            Round: +{player.roundScore ?? 0} pts
                          </span>
                        </div>

                        {/* Category Items */}
                        <div className="space-y-2">
                          {results.fieldNames.map((field) => {
                            const detail = player.categoryDetails?.[field];
                            const answer =
                              detail?.answer || player.answers[field] || "";
                            const points = detail?.points ?? 0;
                            const isDuplicate = detail?.isDuplicate ?? false;
                            const duplicateWith = detail?.duplicateWith ?? [];
                            const isValid = detail?.isValid ?? false;

                            return (
                              <div
                                key={field}
                                className={`flex items-center justify-between rounded-xl px-3 py-2 text-xs border ${
                                  isDuplicate
                                    ? "bg-amber-500/10 border-amber-500/30"
                                    : "bg-card border-border/40"
                                }`}
                              >
                                <div>
                                  <span className="text-[11px] text-muted-foreground font-medium block">
                                    {fieldLabels[field] || field}
                                  </span>
                                  <span
                                    className={`font-semibold capitalize text-sm ${
                                      answer
                                        ? "text-foreground"
                                        : "text-muted-foreground/60 italic"
                                    }`}
                                  >
                                    {answer || "No answer"}
                                  </span>
                                  {isDuplicate && duplicateWith.length > 0 && (
                                    <span className="text-[10px] text-amber-700 dark:text-amber-400 block mt-0.5">
                                      Dupe with {duplicateWith.join(", ")}
                                    </span>
                                  )}
                                </div>

                                <div className="shrink-0 ml-2">
                                  {isDuplicate ? (
                                    <span className="inline-flex items-center gap-1 rounded-md bg-amber-500/20 px-2 py-0.5 font-bold text-amber-700 dark:text-amber-400">
                                      <CopyCheck className="h-3 w-3" />
                                      <span>+5 Dupe</span>
                                    </span>
                                  ) : isValid ? (
                                    <span className="inline-flex items-center gap-1 rounded-md bg-emerald-500/15 px-2 py-0.5 font-bold text-emerald-600 dark:text-emerald-400">
                                      <CheckCircle2 className="h-3 w-3" />
                                      <span>+10</span>
                                    </span>
                                  ) : (
                                    <span className="rounded-md bg-muted px-2 py-0.5 font-medium text-muted-foreground">
                                      0 pts
                                    </span>
                                  )}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })
          ) : (
            <div className="rounded-3xl border border-border/50 bg-card p-12 text-center space-y-4">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-muted text-muted-foreground">
                <AlertCircle className="h-7 w-7" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-foreground">
                  No rounds completed yet
                </h3>
                <p className="mt-1 text-sm text-muted-foreground">
                  Complete round 1 in the playground to view the score breakdown
                </p>
              </div>
              <Button onClick={handleBackToPlayground} className="rounded-xl">
                Go to Playground
              </Button>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

