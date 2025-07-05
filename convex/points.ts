import { mutation } from "./_generated/server";
import { v } from "convex/values";
import { playground } from "./playground";

// export const calculatePoints = mutation({
//   args: { playgroundId: v.id("playgrounds"), round: v.number() },
//   handler: async (ctx, { playgroundId, round }) => {
//     const players = await ctx.db
//       .query("players")
//       .filter((q) => q.eq(q.field("playgroundId"), playgroundId))
//       .collect();

//     const fields = ["jongens", "meisjes", "dieren", "vruchten", "landen"];

//     // Gather answers per field
//     const fieldAnswers: Record<string, Record<string, string[]>> = {};
//     for (const field of fields) {
//       fieldAnswers[field] = {};
//     }

//     players.forEach((player) => {
//       const roundData = player.answers.find((ans) => ans.round === round);
//       if (!roundData) return;

//       for (const field of fields) {
//         const answer = roundData.fields[field]?.toLowerCase().trim();
//         if (!answer) continue;

//         if (!fieldAnswers[field][answer]) {
//           fieldAnswers[field][answer] = [];
//         }
//         fieldAnswers[field][answer].push(player.username);
//       }
//     });

//     // Calculate scores
//     for (const player of players) {
//       let score = player.score;

//       const roundData = player.answers.find((ans) => ans.round === round);
//       if (!roundData) continue;

//       for (const field of fields) {
//         const answer = roundData.fields[field]?.toLowerCase().trim();
//         if (!answer) continue;

//         const usernames = fieldAnswers[field][answer];
//         if (usernames.length === 1) score += 10;
//         else if (usernames.length > 1) score += 5;
//       }

//       await ctx.db.patch(player._id, { score });
//     }

//     // Advance round
//     const playground = await ctx.db.get(playgroundId);
//     if (playground) {
//       if (playground.currentRound < playground.rounds) {
//         await ctx.db.patch(playgroundId, {
//           currentRound: playground.currentRound + 1,
//           currentLetter: getRandomLetter(),
//         });
//       } else {
//         await ctx.db.patch(playgroundId, { status: "finished" });
//       }
//     }
//   },
// });

export const calculatePoints = mutation({
  args: { code: v.string() },
  handler: async (ctx, { code }) => {
    const playground = await ctx.db
      .query("playgrounds")
      .filter((q) => q.eq(q.field("code"), code))
      .unique();

    const round = playground?.currentRound;
    const letter = playground?.currentLetter.toLowerCase();

    const players = await ctx.db
      .query("players")
      .filter((q) => q.eq(q.field("playgroundId"), playground?._id))
      .collect();

    const categories = ["jongens", "meisjes", "dieren", "vruchten", "landen"];

    const scoreMap: Record<string, number> = {};
    const fieldAnswers: Record<string, Record<string, string[]>> = {};

    for (const player of players) {
      const roundAnswer = player.answers.find((a) => a.round === round);
      if (!roundAnswer) continue;

      scoreMap[player.username] = 0;

      for (const field of categories) {
        const val = (roundAnswer.fields[field] ?? "").trim().toLowerCase();

        if (!fieldAnswers[field]) fieldAnswers[field] = {};
        if (!fieldAnswers[field][val]) fieldAnswers[field][val] = [];

        fieldAnswers[field][val].push(player.username);
      }
    }

    // Assign points
    for (const field of categories) {
      for (const [answer, users] of Object.entries(fieldAnswers[field])) {
        const isValid = answer[0] === letter;
        const score = !answer || !isValid ? 0 : users.length === 1 ? 10 : 5;

        for (const user of users) {
          scoreMap[user] += score;
        }
      }
    }

    // Update scores
    for (const player of players) {
      const earned = scoreMap[player.username] ?? 0;
      await ctx.db.patch(player._id, {
        score: player.score + earned,
      });
    }

    return { success: true };
  },
});

function getRandomLetter() {
  const alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
  return alphabet[Math.floor(Math.random() * alphabet.length)];
}
