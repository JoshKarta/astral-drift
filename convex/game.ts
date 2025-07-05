import { mutation, query } from "./_generated/server";
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

// export const submitAnswers = mutation({
//   args: {
//     username: v.string(),
//     playgroundId: v.id("playgrounds"),
//     round: v.number(),
//     fields: v.object({
//       jongens: v.string(),
//       meisjes: v.string(),
//       dieren: v.string(),
//       vruchten: v.string(),
//       landen: v.string(),
//     }),
//   },
//   handler: async (ctx, { username, playgroundId, round, fields }) => {
//     const player = await ctx.db
//       .query("players")
//       .filter((q) =>
//         q.and(
//           q.eq(q.field("username"), username),
//           q.eq(q.field("playgroundId"), playgroundId),
//         ),
//       )
//       .first();

//     if (!player) throw new Error("Player not found.");

//     const newAnswers = [...player.answers, { round, fields }];
//     await ctx.db.patch(player._id, { answers: newAnswers });

//     return { success: true };
//   },
// });

// convex/game.ts
export const submitAnswers = mutation({
  args: {
    code: v.string(),
    username: v.string(),
    fields: v.record(v.string(), v.string()), // Match schema: Record<string, string>
  },
  handler: async (ctx, { code, fields, username }) => {
    // Find the playground by code
    const playground = await ctx.db
      .query("playgrounds")
      .filter((q) => q.eq(q.field("code"), code))
      .first();
    if (!playground) {
      throw new Error("Playground not found");
    }

    // Find the player using the index for better performance
    const player = await ctx.db
      .query("players")
      .withIndex("by_playground", (q) =>
        q.eq("playgroundId", playground._id).eq("username", username),
      )
      .unique();
    if (!player) {
      throw new Error("Player not found");
    }

    const existingAnswers = player.answers ?? [];

    // Check if player already submitted for this round
    const alreadySubmitted = existingAnswers.find(
      (a) => a.round === playground.currentRound,
    );
    if (alreadySubmitted) {
      throw new Error("Answers already submitted for this round");
    }

    // Add the new answer to the player's answers array
    await ctx.db.patch(player._id, {
      answers: [
        ...existingAnswers,
        {
          round: playground.currentRound,
          fields: fields, // Now correctly matches schema as Record<string, string>
        },
      ],
    });

    return { success: true, round: playground.currentRound };
  },
});
