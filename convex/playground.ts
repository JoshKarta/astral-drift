import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

function generateCode(length = 6) {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  return Array.from(
    { length },
    () => chars[Math.floor(Math.random() * chars.length)]
  ).join("");
}

export const createPlayground = mutation({
  args: {
    hostId: v.string(),
    rounds: v.number(),
    timer: v.number(), // in seconds
  },
  handler: async (ctx, args) => {
    const code = generateCode();

    const playgroundId = await ctx.db.insert("playgrounds", {
      code,
      hostId: args.hostId,
      playerIds: [args.hostId],
      status: "waiting",
      rounds: args.rounds,
      timer: args.timer,
      currentRound: 0,
      currentLetter: "",
    });

    await ctx.db.insert("players", {
      username: args.hostId,
      playgroundId,
      score: 0,
      answers: [],
    });

    return { playgroundId, code };
  },
});

export const joinPlayground = mutation({
  args: {
    username: v.string(),
    code: v.string(),
  },
  handler: async (ctx, { username, code }) => {
    const playground = await ctx.db
      .query("playgrounds")
      .filter((q) => q.eq(q.field("code"), code))
      .first();

    if (!playground) throw new Error("Playground not found.");
    if (playground.playerIds.includes(username))
      return { playgroundId: playground._id };

    if (playground.playerIds.length >= 5)
      throw new Error("Playground is full.");

    await ctx.db.patch(playground._id, {
      playerIds: [...playground.playerIds, username],
    });

    await ctx.db.insert("players", {
      username,
      playgroundId: playground._id,
      score: 0,
      answers: [],
    });

    return { playgroundId: playground._id, code };
  },
});
