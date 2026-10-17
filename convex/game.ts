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
      roundLetters: { "1": letter },
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

    // Normalize all answers to lowercase and trimmed strings
    const normalizedFields: Record<string, string> = {};
    for (const [key, val] of Object.entries(fields)) {
      normalizedFields[key] = (val ?? "").trim().toLowerCase();
    }

    // Add the new answer to the player's answers array
    await ctx.db.patch(player._id, {
      answers: [
        ...existingAnswers,
        {
          round: playground.currentRound,
          fields: normalizedFields,
        },
      ],
    });

    return { success: true, round: playground.currentRound };
  },
});

const CATEGORY_MAP: Record<
  string,
  "man" | "woman" | "animal" | "fruit" | "country"
> = {
  jongens: "man",
  meisjes: "woman",
  dieren: "animal",
  vruchten: "fruit",
  landen: "country",
  land: "country",
};

// Validates an answer against the indexed data table
async function isAnswerValid(
  ctx: any,
  category: string,
  answer: string,
  letter: string,
): Promise<boolean> {
  const normalized = answer.trim().toLowerCase();
  if (!normalized) return false;

  // 1. Fail fast: Must start with the round's letter
  if (normalized.charAt(0) !== letter.toLowerCase()) {
    return false;
  }

  const field = CATEGORY_MAP[category];
  if (!field) return false;

  const indexName = `by_${field}` as const;

  // 2. Fast point lookup on index for exact lowercase match
  const matchLower = await ctx.db
    .query("data")
    .withIndex(indexName, (q: any) => q.eq(field, normalized))
    .first();

  if (matchLower) {
    return true;
  }

  // 3. Fallback: Check capitalized / Title Case in case data table has mixed casing
  const titleCase =
    normalized.charAt(0).toUpperCase() + normalized.slice(1);
  if (titleCase !== normalized) {
    const matchTitle = await ctx.db
      .query("data")
      .withIndex(indexName, (q: any) => q.eq(field, titleCase))
      .first();
    if (matchTitle) {
      return true;
    }
  }

  return false;
}

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
      roundLetters: {
        ...(playground.roundLetters ?? {}),
        [String(nextRound)]: newLetter,
      },
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

    // Validate all unique candidate answers concurrently
    const uniqueAnswers = Object.keys(answerCounts);
    const validationEntries = await Promise.all(
      uniqueAnswers.map(async (ans) => {
        const valid = await isAnswerValid(ctx, fieldName, ans, letter);
        return [ans, valid] as const;
      }),
    );
    const validityMap = new Map<string, boolean>(validationEntries);

    // Calculate points for each answer
    for (const [answer, playerIds] of Object.entries(answerCounts)) {
      const isValid = validityMap.get(answer) ?? false;

      // If invalid or not matching convex data table, players get 0 points
      if (isValid) {
        const basePoints = 10;
        const duplicateCount = playerIds.length;
        const pointsPerPlayer = duplicateCount > 1 ? 5 : basePoints;

        // Award points to all players with this answer
        for (const playerId of playerIds) {
          scoreUpdates[playerId] += pointsPerPlayer;
        }
      }
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

    const fieldNames = ["jongens", "meisjes", "dieren", "vruchten", "landen"];

    // First, find all rounds that have actual player answers
    const roundsWithData = new Set<number>();
    for (const player of players) {
      for (const answer of player.answers) {
        roundsWithData.add(answer.round);
      }
    }

    const sortedRounds = Array.from(roundsWithData)
      .filter((r) => r <= playground.rounds)
      .sort((a, b) => a - b);

    const roundLetters: Record<number, string> = {};
    const resultsByRound: Record<
      number,
      Array<{
        username: string;
        answers: Record<string, string>;
        categoryDetails: Record<
          string,
          {
            answer: string;
            points: number;
            isValid: boolean;
            isDuplicate: boolean;
            duplicateWith: string[];
          }
        >;
        roundScore: number;
        score: number;
      }>
    > = {};

    for (const round of sortedRounds) {
      // 1. Determine letter for this round
      let letter = playground.roundLetters?.[String(round)];
      if (!letter) {
        if (round === playground.currentRound && playground.currentLetter) {
          letter = playground.currentLetter;
        } else {
          // Infer letter from first characters of submitted answers in this round
          const letterCounts: Record<string, number> = {};
          for (const player of players) {
            const ans = player.answers.find((a) => a.round === round);
            if (ans) {
              for (const val of Object.values(ans.fields)) {
                const trimmed = (val ?? "").trim();
                if (trimmed.length > 0) {
                  const ch = trimmed[0].toUpperCase();
                  letterCounts[ch] = (letterCounts[ch] ?? 0) + 1;
                }
              }
            }
          }
          const top = Object.entries(letterCounts).sort((a, b) => b[1] - a[1])[0];
          letter = top ? top[0] : (playground.currentLetter || "A");
        }
      }
      roundLetters[round] = letter;

      // 2. Group answers by category for this round
      const categoryAnswerCounts: Record<
        string,
        Record<string, Array<{ playerId: string; username: string }>>
      > = {};

      for (const fieldName of fieldNames) {
        categoryAnswerCounts[fieldName] = {};
        for (const player of players) {
          const roundAnswer = player.answers.find((a) => a.round === round);
          const raw = (roundAnswer?.fields?.[fieldName] ?? "").trim().toLowerCase();
          if (raw) {
            if (!categoryAnswerCounts[fieldName][raw]) {
              categoryAnswerCounts[fieldName][raw] = [];
            }
            categoryAnswerCounts[fieldName][raw].push({
              playerId: player._id,
              username: player.username,
            });
          }
        }
      }

      // 3. Validate all unique answers per category concurrently
      const categoryValidityMap: Record<string, Map<string, boolean>> = {};
      await Promise.all(
        fieldNames.map(async (fieldName) => {
          const uniqueAnswers = Object.keys(categoryAnswerCounts[fieldName]);
          const entries = await Promise.all(
            uniqueAnswers.map(async (ans) => {
              const valid = await isAnswerValid(ctx, fieldName, ans, letter!);
              return [ans, valid] as const;
            }),
          );
          categoryValidityMap[fieldName] = new Map<string, boolean>(entries);
        }),
      );

      resultsByRound[round] = [];

      // 4. Construct player results with category points and duplicate detection
      for (const player of players) {
        const roundAnswer = player.answers.find((a) => a.round === round);
        const playerAnswers: Record<string, string> = {};
        const categoryDetails: Record<
          string,
          {
            answer: string;
            points: number;
            isValid: boolean;
            isDuplicate: boolean;
            duplicateWith: string[];
          }
        > = {};

        let roundScore = 0;

        for (const fieldName of fieldNames) {
          const raw = roundAnswer?.fields?.[fieldName] ?? "";
          playerAnswers[fieldName] = raw;

          const normalized = raw.trim().toLowerCase();
          if (!normalized) {
            categoryDetails[fieldName] = {
              answer: "",
              points: 0,
              isValid: false,
              isDuplicate: false,
              duplicateWith: [],
            };
          } else {
            const matches = categoryAnswerCounts[fieldName][normalized] || [];
            const isDuplicate = matches.length > 1;
            const duplicateWith = isDuplicate
              ? matches
                  .filter((m) => m.username !== player.username)
                  .map((m) => m.username)
              : [];
            const isValid =
              categoryValidityMap[fieldName]?.get(normalized) ?? false;
            const points = isValid ? (isDuplicate ? 5 : 10) : 0;

            roundScore += points;

            categoryDetails[fieldName] = {
              answer: raw,
              points,
              isValid,
              isDuplicate,
              duplicateWith,
            };
          }
        }

        resultsByRound[round].push({
          username: player.username,
          answers: playerAnswers,
          categoryDetails,
          roundScore,
          score: player.score,
        });
      }
    }

    return {
      playground: {
        code: playground.code,
        rounds: playground.rounds,
        status: playground.status,
        currentRound: playground.currentRound,
      },
      roundLetters,
      resultsByRound,
      roundsPlayed: sortedRounds,
      fieldNames,
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

    // First set status to waiting briefly to ensure clean state transition
    await ctx.db.patch(playground._id, {
      status: "waiting",
      currentRound: 1,
      currentLetter: newLetter,
      roundLetters: { "1": newLetter },
    });

    // Then immediately set to playing to trigger proper state updates
    await ctx.db.patch(playground._id, {
      status: "playing",
    });

    return {
      success: true,
      newLetter: newLetter,
      timerDuration: playground.timer,
      currentRound: 1,
    };
  },
});
