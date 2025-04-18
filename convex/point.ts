import { mutation } from "./_generated/server";
import { v } from "convex/values";

export const calculatePoints = mutation({
  args: { playgroundId: v.id("playgrounds"), round: v.number() },
  handler: async (ctx, { playgroundId, round }) => {
    const players = await ctx.db
      .query("players")
      .filter((q) => q.eq(q.field("playgroundId"), playgroundId))
      .collect();

    const fields = ["jongens", "meisjes", "dieren", "vruchten", "landen"];

    // Gather answers per field
    const fieldAnswers: Record<string, Record<string, string[]>> = {};
    for (const field of fields) {
      fieldAnswers[field] = {};
    }

    players.forEach((player) => {
      const roundData = player.answers.find((ans) => ans.round === round);
      if (!roundData) return;

      for (const field of fields) {
        const answer = roundData.fields[field]?.toLowerCase().trim();
        if (!answer) continue;

        if (!fieldAnswers[field][answer]) {
          fieldAnswers[field][answer] = [];
        }
        fieldAnswers[field][answer].push(player.userId);
      }
    });

    // Calculate scores
    for (const player of players) {
      let score = player.score;

      const roundData = player.answers.find((ans) => ans.round === round);
      if (!roundData) continue;

      for (const field of fields) {
        const answer = roundData.fields[field]?.toLowerCase().trim();
        if (!answer) continue;

        const userIds = fieldAnswers[field][answer];
        if (userIds.length === 1) score += 10;
        else if (userIds.length > 1) score += 5;
      }

      await ctx.db.patch(player._id, { score });
    }

    // Advance round
    const playground = await ctx.db.get(playgroundId);
    if (playground.currentRound < playground.rounds) {
      await ctx.db.patch(playgroundId, {
        currentRound: playground.currentRound + 1,
        currentLetter: getRandomLetter(),
      });
    } else {
      await ctx.db.patch(playgroundId, { status: "finished" });
    }
  },
});

function getRandomLetter() {
  const alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
  return alphabet[Math.floor(Math.random() * alphabet.length)];
}
