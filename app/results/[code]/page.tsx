"use client";

import React from "react";
import { useParams, useRouter } from "next/navigation";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Trophy } from "lucide-react";

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
      <div className="flex h-screen items-center justify-center">
        <div className="text-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-gray-300 border-t-blue-600"></div>
          <p className="mt-2 text-gray-600">Loading results...</p>
        </div>
      </div>
    );
  }

  const fieldLabels = {
    jongens: "Boys Names",
    meisjes: "Girls Names",
    dieren: "Animals",
    vruchten: "Fruits",
    landen: "Countries",
  };

  return (
    <main className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto px-4">
        {/* Header */}
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Game Results</h1>
            <p className="text-gray-600">
              Playground: <span className="font-medium">{code}</span>
            </p>
            <p className="text-sm text-gray-500">
              {results.roundsPlayed.length} of {results.playground.rounds}{" "}
              rounds completed
              {results.playground.status === "finished"
                ? " (Game Finished)"
                : " (Game In Progress)"}
            </p>
          </div>
          <Button onClick={handleBackToPlayground} variant="outline">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Playground
          </Button>
        </div>

        {/* Final Leaderboard */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Trophy className="h-5 w-5 text-yellow-500" />
              Final Leaderboard
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {leaderboard?.map((player, index) => (
                <div
                  key={player.username}
                  className="flex items-center justify-between rounded-lg bg-gray-50 p-3"
                >
                  <div className="flex items-center gap-3">
                    <Badge
                      variant={index === 0 ? "default" : "secondary"}
                      className={
                        index === 0
                          ? "bg-yellow-500 text-white"
                          : index === 1
                            ? "bg-gray-400 text-white"
                            : index === 2
                              ? "bg-amber-600 text-white"
                              : ""
                      }
                    >
                      #{index + 1}
                    </Badge>
                    <span className="font-medium">{player.username}</span>
                  </div>
                  <span className="text-lg font-bold text-blue-600">
                    {player.score} pts
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Round by Round Results */}
        <div className="space-y-6">
          {results.roundsPlayed.length > 0 ? (
            results.roundsPlayed.map((round) => {
              const players = results.resultsByRound[round] || [];
              return (
                <Card key={round}>
                  <CardHeader>
                    <CardTitle>Round {round}</CardTitle>
                    <CardDescription>
                      All player answers for round {round}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="overflow-x-auto">
                      <table className="w-full border-collapse">
                        <thead>
                          <tr className="border-b">
                            <th className="p-3 text-left font-medium">
                              Player
                            </th>
                            {results.fieldNames.map((field) => (
                              <th
                                key={field}
                                className="p-3 text-left font-medium"
                              >
                                {fieldLabels[field as keyof typeof fieldLabels]}
                              </th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          {players.map((player) => (
                            <tr key={player.username} className="border-b">
                              <td className="p-3 font-medium">
                                {player.username}
                              </td>
                              {results.fieldNames.map((field) => (
                                <td key={field} className="p-3">
                                  <span className="rounded bg-gray-100 px-2 py-1 text-sm">
                                    {player.answers[field] || "-"}
                                  </span>
                                </td>
                              ))}
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </CardContent>
                </Card>
              );
            })
          ) : (
            <Card>
              <CardContent className="py-8 text-center">
                <p className="text-gray-500">
                  No rounds have been completed yet.
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </main>
  );
}
