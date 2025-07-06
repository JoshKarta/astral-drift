"use client";
import { api } from "@/convex/_generated/api";
import { useQuery } from "convex/react";
import { useParams } from "next/navigation";

export function useGameLetter() {
  const params = useParams();
  const playgroundData = useQuery(api.playground.playground, {
    code: params.id as string,
  });
  const currentLetter = playgroundData?.currentLetter || "";
  const isPlaying = playgroundData?.status === "playing";
  return {
    letter: currentLetter,
    isPlaying,
  };
}
