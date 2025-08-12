import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  users: defineTable({
    clerkId: v.string(), // Clerk User ID
    name: v.string(),
  }),
  playgrounds: defineTable({
    code: v.string(), // unique join code
    hostId: v.string(),
    playerIds: v.array(v.string()),
    status: v.string(), // waiting, playing, finished
    rounds: v.number(),
    timer: v.number(), // in seconds
    currentRound: v.number(),
    currentLetter: v.string(),
    forDummies: v.optional(v.boolean()), // whether this playground is for dummies
  }),
  players: defineTable({
    username: v.string(),
    playgroundId: v.string(),
    score: v.number(),
    answers: v.array(
      v.object({
        round: v.number(),
        fields: v.record(v.string(), v.string()),
      }),
    ), // array of { round: number, fields: Record<string, string> }
  }).index("by_playground", ["playgroundId", "username"]),
});
