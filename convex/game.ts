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

export const advanceRound = mutation({
  args: { code: v.string() },
  handler: async (ctx, { code }) => {
    const playground = await ctx.db
      .query("playgrounds")
      .filter((q) => q.eq(q.field("code"), code))
      .first();

    if (!playground) {
      throw new Error("Playground not found");
    }

    // Calculate scores for the current round before advancing
    await calculateScoresInternal(
      ctx,
      playground._id,
      playground.currentRound,
      playground.currentLetter,
    );

    const nextRound = playground.currentRound + 1;

    // Check if this was the last round
    if (nextRound > playground.rounds) {
      // Game is finished
      await ctx.db.patch(playground._id, {
        status: "finished",
      });
      return { gameEnded: true, finalRound: playground.currentRound };
    }

    // Generate new letter for next round
    const newLetter = getRandomLetter();

    // Advance to next round
    await ctx.db.patch(playground._id, {
      currentRound: nextRound,
      currentLetter: newLetter,
    });

    return {
      gameEnded: false,
      newRound: nextRound,
      newLetter: newLetter,
      timerDuration: playground.timer,
    };
  },
});

export const hasPlayerSubmitted = query({
  args: {
    code: v.string(),
    username: v.string(),
  },
  handler: async (ctx, { code, username }) => {
    const playground = await ctx.db
      .query("playgrounds")
      .filter((q) => q.eq(q.field("code"), code))
      .first();

    if (!playground) {
      return false;
    }

    const player = await ctx.db
      .query("players")
      .withIndex("by_playground", (q) =>
        q.eq("playgroundId", playground._id).eq("username", username),
      )
      .unique();

    if (!player) {
      return false;
    }

    const existingAnswers = player.answers ?? [];
    const hasSubmitted = existingAnswers.some(
      (a) => a.round === playground.currentRound,
    );

    return hasSubmitted;
  },
});

// Internal function for calculating scores
async function calculateScoresInternal(
  ctx: any,
  playgroundId: string,
  round: number,
  letter: string,
) {
  // Get all players in this playground
  const players = await ctx.db
    .query("players")
    .filter((q: any) => q.eq(q.field("playgroundId"), playgroundId))
    .collect();

  // Get all answers for this round
  const roundAnswers: Array<{
    playerId: string;
    username: string;
    answers: Record<string, string>;
  }> = [];

  for (const player of players) {
    const playerAnswer = player.answers.find((a: any) => a.round === round);
    if (playerAnswer) {
      roundAnswers.push({
        playerId: player._id,
        username: player.username,
        answers: playerAnswer.fields,
      });
    }
  }

  // Calculate scores for each field
  const fieldNames = ["jongens", "meisjes", "dieren", "vruchten", "landen"];
  const scoreUpdates: Record<string, number> = {};

  // Initialize score updates
  for (const player of players) {
    scoreUpdates[player._id] = 0;
  }

  // Process each field
  for (const fieldName of fieldNames) {
    // Collect all answers for this field
    const fieldAnswers: Array<{
      playerId: string;
      answer: string;
    }> = [];

    for (const playerAnswer of roundAnswers) {
      const answer = playerAnswer.answers[fieldName]?.trim().toLowerCase();
      if (answer) {
        fieldAnswers.push({
          playerId: playerAnswer.playerId,
          answer: answer,
        });
      }
    }

    // Count occurrences of each answer
    const answerCounts: Record<string, string[]> = {};
    for (const fieldAnswer of fieldAnswers) {
      if (!answerCounts[fieldAnswer.answer]) {
        answerCounts[fieldAnswer.answer] = [];
      }
      answerCounts[fieldAnswer.answer].push(fieldAnswer.playerId);
    }

    // Calculate points for each answer
    for (const [answer, playerIds] of Object.entries(answerCounts)) {
      // Check if answer starts with the correct letter
      const startsWithLetter =
        answer.charAt(0).toLowerCase() === letter.toLowerCase();

      if (startsWithLetter) {
        const basePoints = 10;
        const duplicateCount = playerIds.length;
        const pointsPerPlayer = duplicateCount > 1 ? 5 : basePoints;

        // Award points to all players with this answer
        for (const playerId of playerIds) {
          scoreUpdates[playerId] += pointsPerPlayer;
        }
      }
      // If doesn't start with letter, players get 0 points (no change needed)
    }
  }

  // Update player scores in database
  for (const [playerId, additionalScore] of Object.entries(scoreUpdates)) {
    const player = players.find((p: any) => p._id === playerId);
    if (player && additionalScore > 0) {
      await ctx.db.patch(playerId as any, {
        score: player.score + additionalScore,
      });
    }
  }

  return { scoreUpdates, totalPlayers: players.length };
}

export const calculateRoundScores = mutation({
  args: {
    playgroundId: v.id("playgrounds"),
    round: v.number(),
    letter: v.string(),
  },
  handler: async (ctx, { playgroundId, round, letter }) => {
    return await calculateScoresInternal(ctx, playgroundId, round, letter);
  },
});

export const getPlayerScore = query({
  args: {
    code: v.string(),
    username: v.string(),
  },
  handler: async (ctx, { code, username }) => {
    const playground = await ctx.db
      .query("playgrounds")
      .filter((q) => q.eq(q.field("code"), code))
      .first();

    if (!playground) {
      return null;
    }

    const player = await ctx.db
      .query("players")
      .withIndex("by_playground", (q) =>
        q.eq("playgroundId", playground._id).eq("username", username),
      )
      .unique();

    if (!player) {
      return null;
    }

    return {
      username: player.username,
      score: player.score,
      currentRound: playground.currentRound,
      totalRounds: playground.rounds,
    };
  },
});

export const getPlaygroundLeaderboard = query({
  args: {
    code: v.string(),
  },
  handler: async (ctx, { code }) => {
    const playground = await ctx.db
      .query("playgrounds")
      .filter((q) => q.eq(q.field("code"), code))
      .first();

    if (!playground) {
      return [];
    }

    const players = await ctx.db
      .query("players")
      .filter((q) => q.eq(q.field("playgroundId"), playground._id))
      .collect();

    // Sort players by score (highest first)
    const sortedPlayers = players
      .map((player) => ({
        username: player.username,
        score: player.score,
      }))
      .sort((a, b) => b.score - a.score);

    return sortedPlayers;
  },
});

export const getPlaygroundResults = query({
  args: {
    code: v.string(),
  },
  handler: async (ctx, { code }) => {
    const playground = await ctx.db
      .query("playgrounds")
      .filter((q) => q.eq(q.field("code"), code))
      .first();

    if (!playground) {
      return null;
    }

    const players = await ctx.db
      .query("players")
      .filter((q) => q.eq(q.field("playgroundId"), playground._id))
      .collect();

    // Organize results by round
    const resultsByRound: Record<
      number,
      Array<{
        username: string;
        answers: Record<string, string>;
        score: number;
      }>
    > = {};

    for (let round = 1; round <= playground.rounds; round++) {
      resultsByRound[round] = [];

      for (const player of players) {
        const roundAnswer = player.answers.find((a) => a.round === round);
        if (roundAnswer) {
          resultsByRound[round].push({
            username: player.username,
            answers: roundAnswer.fields,
            score: player.score,
          });
        }
      }
    }

    return {
      playground: {
        code: playground.code,
        rounds: playground.rounds,
        status: playground.status,
      },
      resultsByRound,
      fieldNames: ["jongens", "meisjes", "dieren", "vruchten", "landen"],
    };
  },
});

export const resetGameAndRestart = mutation({
  args: {
    code: v.string(),
  },
  handler: async (ctx, { code }) => {
    const playground = await ctx.db
      .query("playgrounds")
      .filter((q) => q.eq(q.field("code"), code))
      .first();

    if (!playground) {
      throw new Error("Playground not found");
    }

    // Reset all player scores and clear their answers
    const players = await ctx.db
      .query("players")
      .filter((q) => q.eq(q.field("playgroundId"), playground._id))
      .collect();

    for (const player of players) {
      await ctx.db.patch(player._id, {
        score: 0,
        answers: [],
      });
    }

    // Generate new letter for the first round
    const newLetter = getRandomLetter();

    // Reset playground to playing state with round 1
    await ctx.db.patch(playground._id, {
      status: "playing",
      currentRound: 1,
      currentLetter: newLetter,
    });

    return {
      success: true,
      newLetter: newLetter,
      timerDuration: playground.timer,
    };
  },
});
