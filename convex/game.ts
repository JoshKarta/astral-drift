import { mutation } from "./_generated/server";
import { v } from "convex/values";

function getRandomLetter() {
  const alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
  return alphabet[Math.floor(Math.random() * alphabet.length)];
}

export const startGame = mutation({
  args: { playgroundId: v.id("playgrounds") },
  handler: async (ctx, { playgroundId }) => {
    const letter = getRandomLetter();
    await ctx.db.patch(playgroundId, {
      status: "playing",
      currentRound: 1,
      currentLetter: letter,
    });
    return letter;
  },
});

export const submitAnswers = mutation({
  args: {
    username: v.string(),
    playgroundId: v.id("playgrounds"),
    round: v.number(),
    fields: v.object({
      jongens: v.string(),
      meisjes: v.string(),
      dieren: v.string(),
      vruchten: v.string(),
      landen: v.string(),
    }),
  },
  handler: async (ctx, { username, playgroundId, round, fields }) => {
    const player = await ctx.db
      .query("players")
      .filter((q) =>
        q.and(
          q.eq(q.field("username"), username),
          q.eq(q.field("playgroundId"), playgroundId),
        ),
      )
      .first();

    if (!player) throw new Error("Player not found.");

    const newAnswers = [...player.answers, { round, fields }];
    await ctx.db.patch(player._id, { answers: newAnswers });
  },
});
