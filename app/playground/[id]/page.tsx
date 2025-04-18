"use client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useUsername } from "@/hooks/useUsername";
import { redirect, useParams, useRouter } from "next/navigation";
import React from "react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Settings } from "lucide-react";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Doc } from "@/convex/_generated/dataModel";

export default function page() {
  const params = useParams();
  const { username } = useUsername();
  const playgroundData = useQuery(api.playground.playground, {
    code: params.id as string,
  });

  console.log(username);

  console.log(playgroundData);

  if (!username === null) {
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
                <div className="flex items-center gap-4">
                  <p>
                    score <span className="font-bold text-indigo-500">0</span>
                  </p>
                  <Popover>
                    <PopoverTrigger className="group cursor-pointer">
                      <Settings className="group-hover:spin-in h-5 w-5 text-neutral-400 transition-all" />
                    </PopoverTrigger>
                    <PopoverContent>
                      Place content for the popover here.
                    </PopoverContent>
                  </Popover>
                </div>
              </CardContent>
            </Card>

            {/* Playground Card */}
            <div className="col-span-4 flex w-full items-center justify-between md:col-span-3">
              <h3 className="font-medium text-neutral-500">Time left: 30sec</h3>
              <p className="text-neutral-300">
                Playground Code:
                <span>{params.id}</span>
              </p>
            </div>

            {/* Fields */}
            <Card className="col-span-4 rounded-lg md:col-start-1 md:col-end-4">
              <CardHeader></CardHeader>
              <CardContent></CardContent>
            </Card>
          </div>
        </div>
      </main>
    );
  } else {
    const router = useRouter();
    router.push("/");
  }
}

function LeaderboardCard({
  playgroundData,
}: {
  playgroundData: Doc<"playgrounds">;
}) {
  console.log(playgroundData);
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
